import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login'; // Nuevo componente
import ModalEdicion from './components/ModalEdicion';

import { FaEdit, FaTrashAlt, FaRegSquare, FaDownload, FaFileAlt } from 'react-icons/fa'; // Asegúrate de tener estas importaciones

function App() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesOcasionales, setSolicitudesOcasionales] = useState([]);
  const [solicitudesCatedra, setSolicitudesCatedra] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departamentoId, setDepartamentoId] = useState(null); // Ahora se setea según el usuario
  const [tabActiva, setTabActiva] = useState('ocasionales');
  const [estadoEnvio, setEstadoEnvio] = useState({
    total: 0,
    ocasional: 0,
    catedra: 0,
    fechaUltimoEnvio: null
  });
  const [puedeCargarOcasionales, setPuedeCargarOcasionales] = useState(false);
  const [puedeCargarCatedra, setPuedeCargarCatedra] = useState(false);

  const [solicitudAEditar, setSolicitudAEditar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // ESTADO DE AUTENTICACIÓN
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Verificar si hay sesión al cargar
  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
      setDepartamentoId(userData.fk_depto_user); // Setear departamento según usuario
    }
    setLoading(false);
  }, []);
//funicon para verificar si hay datos
const verificarPuedeCargarAnterior = async () => {
    if (!departamentoId || !periodoSeleccionado) return;

    try {
      setLoading(true);
      // ➡️ Ahora se hacen dos llamadas a la API, filtrando por tipo
      const urlOcasionales = `http://192.168.42.175:5000/api/solicitudes/count/${departamentoId}?periodo=${periodoSeleccionado}&tipo=ocasional`;
      const urlCatedra = `http://192.168.42.175:5000/api/solicitudes/count/${departamentoId}?periodo=${periodoSeleccionado}&tipo=catedra`;

      const [responseOcasionales, responseCatedra] = await Promise.all([
        fetch(urlOcasionales),
        fetch(urlCatedra)
      ]);

      const dataOcasionales = await responseOcasionales.json();
      const dataCatedra = await responseCatedra.json();
      
      // ➡️ Se actualizan los estados de los botones de forma independiente
      setPuedeCargarOcasionales(dataOcasionales.total_solicitudes === 0);
      setPuedeCargarCatedra(dataCatedra.total_solicitudes === 0);

    } catch (error) {
      console.error('Error al verificar solicitudes existentes:', error);
      setPuedeCargarOcasionales(false);
      setPuedeCargarCatedra(false);
    } finally {
      setLoading(false);
    }
  };



// Función para abrir el modal de edición
const handleEditClick = (solicitud) => {
    setSolicitudAEditar(solicitud);
    setIsModalOpen(true);
};

// Función para cerrar el modal
const handleCloseModal = () => {
    setIsModalOpen(false);
    setSolicitudAEditar(null);
};

// Función para manejar la actualización
const handleUpdate = async (id, updatedData) => {
    try {
        const response = await fetch(`http://192.168.42.175:5000/api/solicitudes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });
        const data = await response.json();
        if (data.success) {
            alert(data.message);
            cargarSolicitudes(); // Recargar la lista de solicitudes
            handleCloseModal();
        } else {
            alert(`Error al actualizar: ${data.message}`);
        }
    } catch (error) {
        console.error('Error al actualizar solicitud:', error);
        alert('Error de conexión con el servidor.');
    }
};

//funcion para manejar  cambio de estado
const manejarCambioEstado = async (tipo) => {
  const isCerrado = estadoEnvio[tipo] === 'ce';
  const nuevoEstado = isCerrado ? null : 'ce';

  if (window.confirm(`¿Estás seguro de que quieres ${isCerrado ? 'ABRIR' : 'CERRAR'} el período de ${tipo}?`)) {
    try {
      setLoading(true);
      const url = `http://192.168.42.175:5000/api/periodos/update-estado`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depto_id: departamentoId,
          periodo: periodoSeleccionado,
          tipo: tipo,
          estado: nuevoEstado,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del período.');
      }

      await response.json();
      console.log(`Estado del período de ${tipo} actualizado a ${nuevoEstado}`);
      
      // Recargar el estado general para reflejar el cambio en la interfaz
      // CAMBIO AQUÍ: Llamas a las funciones que sí tienes definidas.
      cargarEstadoEnvio();
      cargarSolicitudes(); // No necesitas pasarle los parámetros aquí.

    } catch (error) {
      console.error('Error al cambiar el estado:', error);
      alert('Hubo un error al intentar cambiar el estado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }
};

  // Función para generar períodos (MANTENIDA)
  const generarPeriodos = () => {
    const periodos = [];
    const fecha = new Date();
    const añoActual = fecha.getFullYear();
    const mesActual = fecha.getMonth() + 1;
    
    const semestreActual = mesActual <= 6 ? 1 : 2;
    periodos.push(`${añoActual}-${semestreActual}`);
    
    if (semestreActual === 1) {
      periodos.push(`${añoActual}-2`);
    } else {
      periodos.push(`${añoActual + 1}-1`);
    }
    
    if (semestreActual === 1) {
      periodos.push(`${añoActual - 1}-2`);
    } else {
      periodos.push(`${añoActual}-1`);
    }
    
    if (semestreActual === 1) {
      periodos.push(`${añoActual - 1}-1`);
    } else {
      periodos.push(`${añoActual - 1}-2`);
    }
    
    return periodos;
  };

  const periodos = generarPeriodos();
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(periodos[0]);

  // Cargar solicitudes SOLO si está autenticado y tiene departamento
useEffect(() => {
  if (isAuthenticated && departamentoId) {
    cargarSolicitudes();
    cargarEstadoEnvio(); // <-- aquí llamas la nueva función
    verificarPuedeCargarAnterior(); // <-- aquí

  }
}, [periodoSeleccionado, departamentoId, isAuthenticated]);


  // FUNCIONES EXISTENTES (MANTENIDAS)
  const cargarSolicitudes = async () => {
  try {
    setLoading(true);
    // 1. Cargar solicitudes
    const solicitudesResponse = await fetch(
      `http://192.168.42.175:5000/api/solicitudes/depto/${departamentoId}?periodo=${periodoSeleccionado}`
    );
    const solicitudesData = await solicitudesResponse.json();
    const ocasionales = solicitudesData.solicitudes.filter(sol => sol.tipo_docente === 'Ocasional');
    const catedra = solicitudesData.solicitudes.filter(sol => sol.tipo_docente === 'Catedra');

    setSolicitudes(solicitudesData.solicitudes);
    setSolicitudesOcasionales(ocasionales);
    setSolicitudesCatedra(catedra);

    // 2. Cargar estado de envío
    const estadoResponse = await fetch(
      `http://192.168.42.175:5000/api/depto-periodo-estado/${departamentoId}?periodo=${periodoSeleccionado}`
    );
    const estadoData = await estadoResponse.json();
    setEstadoEnvio(estadoData); // Actualizar el estado de envío

  } catch (error) {
    console.error('Error cargando datos:', error);
  } finally {
    setLoading(false);
  }
};

const cargarEstadoEnvio = async () => {
  try {
    const response = await fetch(
      `http://192.168.42.175:5000/api/departamento/estado-envio/${departamentoId}?periodo=${periodoSeleccionado}`
    );
    const data = await response.json();
    setEstadoEnvio(data);
  } catch (error) {
    console.error('Error cargando estado de envío:', error);
  }
};
const eliminarSolicitud = async (id) => {
  if (!window.confirm('¿Seguro que deseas eliminar esta solicitud?')) return;

  try {
    const response = await fetch(`http://192.168.42.175:5000/api/solicitudes/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();

    if (data.success) {
      alert(data.message);

      // Recarga la tabla
      cargarSolicitudes();

      // **Verifica si ya quedó vacío para habilitar el botón**
      verificarPuedeCargarAnterior();

    } else {
      alert(data.message || 'No se pudo eliminar la solicitud');
    }
  } catch (error) {
    console.error('Error eliminando solicitud:', error);
    alert('Error eliminando solicitud');
  }
};


const cargarDesdeAnterior = async (tipo) => {
  try {
    // ➡️ Lógica para calcular el período anterior
    const [año, semestre] = periodoSeleccionado.split('-');
    let periodoAnterior;
    
    if (semestre === '1') {
      periodoAnterior = `${parseInt(año) - 1}-2`;
    } else {
      periodoAnterior = `${año}-1`;
    }
    // ⬅️ Fin de la lógica

    const response = await fetch('http://192.168.42.175:5000/api/solicitudes/cargar-desde-anterior', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        departamento_id: departamentoId,
        periodo_actual: periodoSeleccionado,
        periodo_anterior: periodoAnterior,
        tipo: tipo
      })
    });
    
    const data = await response.json();
    alert(data.message);

    cargarSolicitudes();
    
    if (tipo === 'ocasional') {
        setPuedeCargarOcasionales(false);
    } else if (tipo === 'catedra') {
        setPuedeCargarCatedra(false);
    }

  } catch (error) {
    console.error('Error cargando desde período anterior:', error);
    alert('Error: ' + error.message);
  }
};

  const enviarAFacultad = async () => {
    try {
      const response = await fetch('http://192.168.42.175:5000/api/departamento/enviar-facultad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          departamento_id: departamentoId,
          periodo: periodoSeleccionado
        })
      });
      
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error('Error enviando a facultad:', error);
      alert('Error: ' + error.message);
    }
  };
//funcion para cambiar estado general
  const manejarCambioEstadoGeneral = async (nuevo_estado) => {
    // Si el nuevo estado es 'ce' (enviado), se requiere que los otros dos estén cerrados.
    if (nuevo_estado === 'ce' && (estadoEnvio?.ocasional !== 'ce' || estadoEnvio?.catedra !== 'ce')) {
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
                nuevo_estado: nuevo_estado
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
  // FUNCIONES DE LOGIN (NUEVAS)
  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setDepartamentoId(userData.fk_depto_user); // Setear departamento del usuario
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setDepartamentoId(null);
    sessionStorage.removeItem('user');
  };

  // RENDER PRINCIPAL
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="App">
        <header className="header-unicauca">
          <div className="container">
            <img 
              src={process.env.PUBLIC_URL + '/assets/logos/logo-unicauca-vertical.png'} 
              alt="Logo Universidad del Cauca" 
              className="logo-unicauca" 
            />
            <h1 className="header-title">Gestión de Docentes - Vinculación</h1>
          </div>
        </header>
        <div className="loading">Cargando solicitudes...</div>
      </div>
    );
  }

  // INTERFAZ ORIGINAL (CON HEADER MODIFICADO)
  return (
    <div className="App">
      {/* HEADER MODIFICADO CON INFO DE USUARIO */}
      <header className="header-unicauca">
        <div className="container">
          <img 
            src={process.env.PUBLIC_URL + '/assets/logos/logo-unicauca-vertical.png'} 
            alt="Logo Universidad del Cauca" 
            className="logo-unicauca" 
          />
          <div className="header-titles">
            <h1 className="header-title">Gestión de Docentes - Vinculación</h1>
            <h2 className="header-subtitle">Jefe de Departamento:  {user?.u_nombre_en_cargo || 'Artes Plásticas'}</h2>
          </div>
          <div className="user-info">
            <span>Usuario: {user?.Name}</span>
            <button onClick={handleLogout} className="btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* TODO EL RESTO DEL CÓDIGO ORIGINAL SE MANTIENE */}
      <main className="container main-container">
        {/* CONTROLES SUPERIORES */}
        <div className="controls-panel">
          <div className="periodo-selector">
            <label>Período Académico: </label>
            <select 
              value={periodoSeleccionado} 
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="select-periodo"
            >
              {periodos.map(periodo => (
                <option key={periodo} value={periodo}>
                  {periodo}
                </option>
              ))}
            </select>
          </div>

      
        </div>

        {/* CONTENIDO PRINCIPAL - MANTENIDO */}
        <div className="content-layout">
          <div className="left-column">
            <div className="tabs-container">
              <div className="tabs-header">
                <button
                  className={`tab ${tabActiva === 'ocasionales' ? 'active' : ''}`}
                  onClick={() => setTabActiva('ocasionales')}
                >
                  Docentes Ocasionales <span className="badge-count">{solicitudesOcasionales.length}</span>
                </button>
                <button
                  className={`tab ${tabActiva === 'catedra' ? 'active' : ''}`}
                  onClick={() => setTabActiva('catedra')}
                >
                  Docentes Cátedra <span className="badge-count">{solicitudesCatedra.length}</span>
                </button>
              </div>

              <div className="tab-content">
                {tabActiva === 'ocasionales' ? (
                  <div className="solicitudes-section">
                    {estadoEnvio.ocasional !== 'ce' && (
                                       
                      
                      
                     
                      <div className="controls-buttons">
                 <button 
  onClick={() => cargarDesdeAnterior('ocasional')} 
  className="btn-secondary"
  // ➡️ CAMBIO AQUÍ
  disabled={!puedeCargarOcasionales || solicitudesOcasionales.length > 0} 
>
  <span className="btn-icon">🔄</span> Cargar desde período anterior
</button>
             <div className="button-new-solicitud">
                          <button className="btn-new-solicitud"> {/* CAMBIO AQUI */}
                            <span className="btn-icon">+</span> Nueva Solicitud
                        </button>
                      </div>

                      
          </div>

                    )}
                    {solicitudesOcasionales.length === 0 ? (
                      <div className="empty-state">
                        <p>No hay docent  es ocasionales para el período {periodoSeleccionado}</p>
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="solicitudes-table">
                          <thead>
                            <tr>
                              <th rowSpan="2">#</th>
                              <th rowSpan="2">Nombre</th>
                              <th rowSpan="2">Cédula</th>
                              <th colSpan="2">Dedicación</th>
                              <th colSpan="2">Hoja de Vida</th>
                              {estadoEnvio.ocasional === 'ce' && (
                                <>
                                  <th rowSpan="2">Visado</th>
                                  <th rowSpan="2">FOR.45</th>
                                </>
                              )}
                              {estadoEnvio.ocasional !== 'ce' && (
                                <th rowSpan="2">Acciones</th>
                              )}
                            </tr>
                            <tr>
                              <th>POP</th>
                              <th>REG</th>
                              <th>Anexa (Nuevo)</th>
                              <th>Actualiza (Antiguo)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {solicitudesOcasionales.map((sol, index) => (
                              <tr key={sol.id_solicitud}>
                                <td>{index + 1}</td>
                                <td className="celda-compacta">{sol.nombre}</td>
                                <td className="celda-compacta">{sol.cedula}</td>
                                <td className="celda-compacta">{sol.tipo_dedicacion || '-'}</td>
                                <td className="celda-compacta">{sol.tipo_dedicacion_r || '-'}</td>
                                <td className="celda-compacta">{sol.anexa_hv_docente_nuevo === 'si' ? '✅' : '❌'}</td>
                                <td className="celda-compacta">{sol.actualiza_hv_antiguo === 'si' ? '✅' : '❌'}</td>
                                {estadoEnvio.ocasional === 'ce' && (
                                  <>
                                    <td className="celda-compacta"><FaRegSquare /></td>
                                    <td className="celda-compacta"><FaDownload /></td>
                                  </>
                                )}
                                {estadoEnvio.ocasional !== 'ce' && (
                                  <td>
                                    <div className="acciones-compactas">
                                      <button className="btn-edit btn-compact" title="Editar" onClick={() => handleEditClick(sol)}>
                                        <FaEdit />
                                      </button>
                                      <button
                                        className="btn-delete btn-compact"
                                        title="Eliminar"
                                        onClick={() => eliminarSolicitud(sol.id_solicitud)}
                                      >
                                        <FaTrashAlt />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="solicitudes-section">
                    {estadoEnvio.catedra !== 'ce' && (
                      
                      
                      
  <div className="controls-buttons">
          <button 
          onClick={() => cargarDesdeAnterior('catedra')} 
          className="btn-secondary"
          // ➡️ CAMBIO AQUÍ
          disabled={!puedeCargarCatedra || solicitudesCatedra.length > 0} 
        >
          <span className="btn-icon">🔄</span> Cargar desde período anterior
        </button>
               <div className="button-new-solicitud">
          <button className="btn-new-solicitud"> {/* CAMBIO AQUI */}
                          <span className="btn-icon"> + </span> Nueva Solicitud
                        </button>
                      </div>        
          </div>

                      
                      
                      
                     
                    )}
                    {solicitudesCatedra.length === 0 ? (
                      <div className="empty-state">
                        <p>No hay docentes cátedra para el período {periodoSeleccionado}</p>
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="solicitudes-table">
                          <thead>
                            <tr>
                              <th rowSpan="2">#</th>
                              <th rowSpan="2">Nombre</th>
                              <th rowSpan="2">Cédula</th>
                              <th colSpan="2">Horas</th>
                              <th colSpan="2">Hoja de Vida</th>
                              {estadoEnvio.catedra === 'ce' && (
                                <>
                                  <th rowSpan="2">Visado</th>
                                  <th rowSpan="2">FOR.45</th>
                                </>
                              )}
                              {estadoEnvio.catedra !== 'ce' && (
                                <th rowSpan="2">Acciones</th>
                              )}
                            </tr>
                            <tr>
                              <th>POP</th>
                              <th>REG</th>
                              <th>Anexa (Nuevo)</th>
                              <th>Actualiza (Antiguo)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {solicitudesCatedra.map((sol, index) => (
                              <tr key={sol.id_solicitud}>
                                <td>{index + 1}</td>
                                <td>{sol.nombre}</td>
                                <td>{sol.cedula}</td>
                                <td>{sol.horas || '-'}</td>
                                <td>{sol.horas_r || '-'}</td>
                                <td className="celda-compacta">{sol.anexa_hv_docente_nuevo === 'si' ? '✅' : '❌'}</td>
                                <td className="celda-compacta">{sol.actualiza_hv_antiguo === 'si' ? '✅' : '❌'}</td>
                                {estadoEnvio.catedra === 'ce' && (
                                  <>
                                    <td className="celda-compacta"><FaRegSquare /></td>
                                    <td className="celda-compacta"><FaDownload /></td>
                                  </>
                                )}
                                {estadoEnvio.catedra !== 'ce' && (
                                  <td>
                                    <div className="acciones-compactas">
                                      <button className="btn-edit btn-compact" title="Editar" onClick={() => handleEditClick(sol)}>
                                        <FaEdit />
                                      </button>
                                      <button
                                        className="btn-delete btn-compact"
                                        title="Eliminar"
                                        onClick={() => eliminarSolicitud(sol.id_solicitud)}
                                      >
                                        <FaTrashAlt />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="right-column">
            <div className="envio-panel">
              <h3>Envío a Facultad</h3>
              
           <div className="estado-envio">
    {/* Docentes Ocasionales */}
<div className="estado-item">
  <span className="estado-label">Docentes Ocasionales:</span>
  <div className="toggle-switch-container">
    <label className="switch">
      <input 
        type="checkbox" 
        checked={estadoEnvio?.ocasional === 'ce'} 
        onChange={() => manejarCambioEstado('ocasional')}
      />
      <span className="slider round">
        <span className="slider-text">
          {estadoEnvio?.ocasional === 'ce' ? 'Cerrado' : 'Abierto'}
        </span>
      </span>
    </label>
  </div>
</div>

<div className="estado-item">
  <span className="estado-label">Docentes Cátedra:</span>
  <div className="toggle-switch-container">
    <label className="switch">
      <input 
        type="checkbox" 
        checked={estadoEnvio?.catedra === 'ce'} 
        onChange={() => manejarCambioEstado('catedra')}
      />
      <span className="slider round">
        <span className="slider-text">
          {estadoEnvio?.catedra === 'ce' ? 'Cerrado' : 'Abierto'}
        </span>
      </span>
    </label>
  </div>
</div>
      {/* Estado General (Ahora un interruptor) */}
<div className="estado-item">
  <span className="estado-label">Estado General:</span>
  <div className="toggle-switch-container">
    <label className="switch">
      <input
        type="checkbox"
        checked={estadoEnvio?.total === 1} // Verifica si el valor es 1
        onChange={(e) => manejarCambioEstadoGeneral(e.target.checked ? 1 : null)} // Envía 1 o null
        disabled={estadoEnvio?.ocasional !== 'ce' || estadoEnvio?.catedra !== 'ce'}
      />
      <span className="slider round">
        <span className="slider-text">
          {estadoEnvio?.total === 1 ? 'Enviado ✅' : 'Pendiente'} 
        </span>
      </span>
    </label>
  </div>
</div>
    {estadoEnvio?.fechaUltimoEnvio && (
      <div className="ultimo-envio">
        <p>Último envío: {new Date(estadoEnvio.fechaUltimoEnvio).toLocaleDateString()}</p>
      </div>
    )}
  </div>
              
        
              
              <div className="info-adicional">
                <h4>Información importante:</h4>
                <ul>
                  <li>Verifique que todos los datos estén correctos antes de enviar</li>
                  <li>Después de enviar, no podrá realizar modificaciones</li>
                  <li>El envío será revisado por la Facultad</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
 <ModalEdicion
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      solicitud={solicitudAEditar}
      onUpdate={handleUpdate}
    />
      <footer className="footer-unicauca">
        <p>Universidad del Cauca - #PatrimonioDeTodos</p>

        
      </footer>
    </div>
  );
}

export default App;