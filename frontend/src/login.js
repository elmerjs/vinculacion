const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    console.log('📤 Enviando login...');
    
    const response = await fetch('http://localhost/temporales/api-login.php', {
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