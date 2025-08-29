import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.42.175:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // <-- Agrega 'OPTIONS'
  credentials: true
}));
app.use(express.json());

// Ruta de prueba básica
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando con XAMPP!' });
});

// Ruta de prueba de base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT COUNT(*) as total FROM solicitudes');
    res.json({ 
      success: true, 
      total_solicitudes: rows[0].total,
      message: '✅ Conexión a MySQL exitosa' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Error conectando a MySQL: ' + error.message 
    });
  }
});
// Agregar en server.js después de las rutas de prueba
app.get('/api/solicitudes/depto/:depto_id', async (req, res) => {
  try {
    const { depto_id } = req.params;
    const { periodo = '2025-1' } = req.query; // ← Recibir período por query parameter
    
    const [solicitudes] = await db.execute(
      `SELECT s.*, d.NOMBRE_DEPTO 
       FROM solicitudes s 
       JOIN deparmanentos d ON s.departamento_id = d.PK_DEPTO 
       WHERE s.departamento_id = ? AND s.anio_semestre = ?`, // ← FILTRO POR PERÍODO
      [depto_id, periodo]
    );
    
    res.json({ success: true, solicitudes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});




// a) Crear nueva solicitud
app.post('/api/solicitudes', async (req, res) => {
  // Lógica para insertar
});

// b) Actualizar solicitud
// b) Actualizar solicitud
app.put('/api/solicitudes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tipo_docente, 
      tipo_dedicacion, 
      tipo_dedicacion_r,
      horas,
      horas_r,
      anexa_hv_docente_nuevo,
      actualiza_hv_antiguo,
      anexos
    } = req.body;

    let sql;
    let params;

    if (tipo_docente === 'Ocasional') {
        sql = `UPDATE solicitudes SET 
                 tipo_dedicacion = ?,
                 tipo_dedicacion_r = ?,
                 anexa_hv_docente_nuevo = ?,
                 actualiza_hv_antiguo = ?,
                 anexos = ?
               WHERE id_solicitud = ?`;
        params = [
            tipo_dedicacion, 
            tipo_dedicacion_r,
            anexa_hv_docente_nuevo,
            actualiza_hv_antiguo,
            anexos,
            id
        ];
    } else if (tipo_docente === 'Catedra') {
        sql = `UPDATE solicitudes SET 
                 horas = ?,
                 horas_r = ?,
                 anexa_hv_docente_nuevo = ?,
                 actualiza_hv_antiguo = ?,
                 anexos = ?
               WHERE id_solicitud = ?`;
        params = [
            horas,
            horas_r,
            anexa_hv_docente_nuevo,
            actualiza_hv_antiguo,
            anexos,
            id
        ];
    } else {
        return res.status(400).json({ success: false, message: 'Tipo de docente no válido' });
    }

    const [result] = await db.execute(sql, params);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: '✅ Solicitud actualizada correctamente' });
    } else {
      res.status(404).json({ success: false, message: '❌ Solicitud no encontrada' });
    }
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});
// c) Eliminar solicitud
// Eliminar solicitud por id
app.delete('/api/solicitudes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Ejecuta el delete
    const [result] = await db.execute(
      `DELETE FROM solicitudes WHERE id_solicitud = ?`,
      [id]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Solicitud eliminada correctamente' });
    } else {
      res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// Agregar en server.js
// Ruta para cargar solicitudes desde un período anterior, ahora por tipo de docente
app.post('/api/solicitudes/cargar-desde-anterior', async (req, res) => {
  try {
    const { departamento_id, periodo_actual, periodo_anterior, tipo } = req.body;
    
    // 1. Obtener solicitudes del período anterior, filtrando por tipo de docente
    const [solicitudesAnteriores] = await db.execute(
      `SELECT * FROM solicitudes 
       WHERE departamento_id = ? AND anio_semestre = ? AND tipo_docente = ?`,
      [departamento_id, periodo_anterior, tipo] // ➡️ Se añade el filtro 'tipo'
    );
    
    // 2. Insertar copias para el nuevo período
    for (const solicitud of solicitudesAnteriores) {
      await db.execute(
        `INSERT INTO solicitudes 
         (anio_semestre, facultad_id, departamento_id, tipo_docente, cedula, nombre, 
          tipo_dedicacion, horas, sede, visado, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'BORRADOR')`,
        [periodo_actual, solicitud.facultad_id, solicitud.departamento_id, 
         solicitud.tipo_docente, solicitud.cedula, solicitud.nombre,
         solicitud.tipo_dedicacion, solicitud.horas, solicitud.sede]
      );
    }
    
    res.json({ 
      success: true, 
      message: `✅ ${solicitudesAnteriores.length} solicitudes de ${tipo} cargadas desde ${periodo_anterior}` 
    });
    
  } catch (error) {
    console.error('Error al cargar desde período anterior:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});



// Obtener estado de envío por departamento y período
app.get('/api/departamento/estado-envio/:depto_id', async (req, res) => {
  try {
    const { depto_id } = req.params;
    const { periodo } = req.query;

    const [rows] = await db.execute(
      `SELECT 
      dp.dp_estado_catedra AS catedra, 
      dp.dp_estado_ocasional AS ocasional, 
      dp.dp_estado_total AS total,
      dp.dp_fecha_envio AS fechaUltimoEnvio,
      COUNT(s.id_solicitud) AS totalSolicitudes
   FROM depto_periodo dp
   LEFT JOIN solicitudes s 
     ON s.anio_semestre = dp.periodo 
    AND s.departamento_id = dp.fk_depto_dp
   WHERE dp.fk_depto_dp = ? AND dp.periodo = ?
   GROUP BY dp.dp_estado_catedra, dp.dp_estado_ocasional, dp.dp_estado_total, dp.dp_fecha_envio`,
  [depto_id, periodo]
    );

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json({
        total: 0,
        ocasional: 0,
        catedra: 0,
        fechaUltimoEnvio: null
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


//

// ... (Tus importaciones y middlewares) ...

// Nueva ruta para actualizar el estado de los períodos de forma individual
app.put('/api/periodos/update-estado', async (req, res) => {
  const { depto_id, periodo, tipo, estado } = req.body;
  
  if (!depto_id || !periodo || !tipo) {
    return res.status(400).json({ success: false, error: 'Faltan parámetros en la solicitud.' });
  }

  // Determinar la columna a actualizar
  let columna;
  if (tipo === 'ocasional') {
    columna = 'dp_estado_ocasional';
  } else if (tipo === 'catedra') {
    columna = 'dp_estado_catedra';
  } else {
    return res.status(400).json({ success: false, error: 'Tipo de docente inválido.' });
  }

  try {
    const estadoValor = estado === 'ce' ? 'ce' : null;

    const [result] = await db.execute(
      `UPDATE depto_periodo SET ${columna} = ? WHERE fk_depto_dp = ? AND periodo = ?`,
      [estadoValor, depto_id, periodo]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: `Estado de ${tipo} actualizado.` });
    } else {
      res.status(404).json({ success: false, error: 'No se encontró un registro para actualizar.' });
    }
  } catch (error) {
    console.error('Error al actualizar el estado:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});

const manejarCambioEstadoGeneral = async (nuevo_estado) => {
    // Si el nuevo estado es 1 (enviado), se requiere que los otros dos estén cerrados.
    if (nuevo_estado === 1 && (estadoEnvio?.ocasional !== 'ce' || estadoEnvio?.catedra !== 'ce')) {
      alert("Debes cerrar los períodos de Docentes Ocasionales y Cátedra antes de enviar el estado general.");
      return;
    }

    try {
        const response = await fetch('http://192.168.42.175:5000/api/departamento/actualizar-estado-total', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                departamento_id: departamentoId,
                periodo: periodoSeleccionado,
                nuevo_estado: nuevo_estado // Este valor será 1 o null
            })
        });
        const data = await response.json();
        
        if (data.success) {
            cargarEstadoEnvio(); // Recargar el estado para que se actualice la UI
            alert(data.message);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error al actualizar el estado total:', error);
        alert('Error: ' + error.message);
    }
};
// Agrega esta ruta en tu archivo server.js
// Agrega esta ruta en tu archivo server.js
app.put('/api/departamento/actualizar-estado-total', async (req, res) => {
    const { departamento_id, periodo, nuevo_estado } = req.body;

    if (!departamento_id || !periodo || nuevo_estado === undefined) {
        return res.status(400).json({ success: false, message: 'Faltan parámetros en la solicitud.' });
    }

    try {
        // CORRECCIÓN: La base de datos ahora guardará 1 o null, no 'ce'.
        const estadoDB = (nuevo_estado === 1) ? 1 : null;
        
        const query = `
            UPDATE depto_periodo
            SET dp_estado_total = ?
            WHERE fk_depto_dp = ? AND periodo = ?
        `;

        const [result] = await db.execute(query, [estadoDB, departamento_id, periodo]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'No se encontró el registro para actualizar.' });
        }

        const mensaje = (nuevo_estado === 1) ? 'Período enviado a Facultad correctamente.' : 'Período reabierto correctamente.';
        res.json({ success: true, message: mensaje });

    } catch (error) {
        console.error('Error al actualizar el estado total:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

//verificar si hay datos
// Obtener cantidad de solicitudes para un departamento y periodo
// Obtener cantidad de solicitudes para un departamento, periodo y tipo de docente
app.get('/api/solicitudes/count/:depto_id', async (req, res) => {
  try {
    const { depto_id } = req.params;
    const { periodo, tipo } = req.query; // ➡️ AHORA TAMBIÉN RECIBE EL PARÁMETRO 'TIPO'

    let query = `SELECT COUNT(*) AS total_solicitudes FROM solicitudes WHERE departamento_id = ? AND anio_semestre = ?`;
    let params = [depto_id, periodo];

    if (tipo) {
      query += ` AND tipo_docente = ?`;
      params.push(tipo);
    }

    const [rows] = await db.execute(query, params);

    res.json({
      success: true,
      total_solicitudes: rows[0].total_solicitudes,
      message: '✅ Conteo de solicitudes exitoso'
    });
  } catch (error) {
    console.error('Error al verificar solicitudes existentes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});



app.listen(PORT, () => {
  console.log('Servidor corriendo en http://localhost:' + PORT);
});