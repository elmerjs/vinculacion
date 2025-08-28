echo import express from 'express'; > routes/solicitudes.js
echo import db from '../database.js'; >> routes/solicitudes.js
echo. >> routes/solicitudes.js
echo const router = express.Router(); >> routes/solicitudes.js
echo. >> routes/solicitudes.js
echo // Ruta de prueba para verificar conexión a BD >> routes/solicitudes.js
echo router.get('/test-db', async (req, res) => { >> routes/solicitudes.js
echo   try { >> routes/solicitudes.js
echo     const [rows] = await db.execute('SELECT COUNT(*) as total FROM solicitudes'); >> routes/solicitudes.js
echo     res.json({ >> routes/solicitudes.js
echo       success: true, >> routes/solicitudes.js
echo       message: \`✅ Conexión a BD exitosa. \${rows[0].total} solicitudes en BD\` >> routes/solicitudes.js
echo     }); >> routes/solicitudes.js
echo   } catch (error) { >> routes/solicitudes.js
echo     res.status(500).json({ >> routes/solicitudes.js
echo       success: false, >> routes/solicitudes.js
echo       error: 'Error conectando a la BD: ' + error.message >> routes/solicitudes.js
echo     }); >> routes/solicitudes.js
echo   } >> routes/solicitudes.js
echo }); >> routes/solicitudes.js
echo. >> routes/solicitudes.js
echo export default router; >> routes/solicitudes.js