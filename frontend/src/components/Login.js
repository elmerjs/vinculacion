import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // DEBUG CRUCIAL: ¿Qué valor tiene la password?
    console.log('🔍 DEBUG - Valores a enviar:', {
      email: email,
      password: password, 
      passwordLength: password.length,
      passwordType: typeof password
    });

    // Debug: mostrar la password con delimitadores para ver espacios
    console.log('🔍 Password con delimitadores:', `"${password}"`);

    try {
      console.log('📤 Enviando login...');
      
      const response = await fetch('http://192.168.42.175/temporalesc/api-login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
          password: password
        }),
        credentials: 'include'
      });

      console.log('📨 Status:', response.status, response.statusText);
      
      const text = await response.text();
      console.log('📝 Response text:', text);

      // Verificar si la respuesta está vacía
      if (!text.trim()) {
        throw new Error('El servidor devolvió una respuesta vacía');
      }

      let data;
      try {
        data = JSON.parse(text);
        console.log('✅ JSON parseado:', data);
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        throw new Error(`Error en formato de respuesta: ${text.substring(0, 100)}...`);
      }

      if (!response.ok) {
        console.error('❌ Error HTTP:', response.status, data);
        throw new Error(data.error || `Error del servidor: ${response.status}`);
      }

      if (data.success) {
        console.log('🎉 Login exitoso:', data.user);
        onLogin(data.user);
      } else {
        console.error('❌ Login fallido:', data.error);
        setError(data.error || 'Credenciales incorrectas');
      }

    } catch (error) {
      console.error('💥 Error completo:', error);
      setError(error.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <img 
          src={process.env.PUBLIC_URL + '/assets/logos/logo-unicauca-vertical.png'} 
          alt="Logo Universidad del Cauca" 
          className="login-logo" 
        />
        <h1>Sistema de Gestión de Docentes</h1>
        <p>Universidad del Cauca</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Email institucional:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              console.log('📧 Email cambiado:', e.target.value);
              setEmail(e.target.value);
            }}
            required
            placeholder="usuario@unicauca.edu.co"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              console.log('⌨️ Password cambiada:', e.target.value);
              setPassword(e.target.value);
            }}
            required
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn-login"
          disabled={loading}
        >
          {loading ? 'Verificando...' : 'Ingresar al Sistema'}
        </button>
      </form>

      {/* SECCIÓN DE DEBUG TEMPORAL */}
      <div style={{marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px'}}>
        <h4>🔧 Debug Info (temporal):</h4>
        <p>Email: {email}</p>
        <p>Password: "{password}"</p>
        <p>Longitud: {password.length} caracteres</p>
        <button 
          onClick={() => {
            setEmail('elmerjs@gmail.com');
            setPassword('740811');
            console.log('✅ Valores de prueba establecidos');
          }}
          style={{padding: '5px 10px', margin: '5px'}}
        >
          Auto-llenar prueba
        </button>
      </div>
    </div>
  );
};

export default Login;