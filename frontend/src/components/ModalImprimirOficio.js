import React, { useState, useEffect } from 'react';
import './Modal.css'; // Asegúrate de tener los estilos para el modal

const ModalImprimirOficio = ({ isOpen, onClose, user, departamentoId, periodoSeleccionado, estadoEnvio, solicitudes }) => {
  const [numOficio, setNumOficio] = useState('');
  const [fechaOficio, setFechaOficio] = useState('');
  const [jefeDepto, setJefeDepto] = useState('');
  const [numActa, setNumActa] = useState('');
  const [fechaActa, setFechaActa] = useState('');
  const [folios, setFolios] = useState({
    folios1: 1,
    folios2: solicitudes.length, // Folios de los formatos FOR 45
    folios3: 0,
    total: 1 + solicitudes.length
  });

  const [trdDepto, setTrdDepto] = useState('');

  // Efecto para precargar los datos del formulario al abrir el modal
  useEffect(() => {
    if (isOpen) {
      // Precarga los datos del estado
      setNumOficio(estadoEnvio?.num_oficio_depto || '');
      setJefeDepto(user?.u_nombre_en_cargo || 'N/A');
      setNumActa(estadoEnvio?.dp_acta_periodo || '');
      setFechaActa(estadoEnvio?.dp_fecha_acta || '');

      // Precarga la fecha de oficio por defecto (fecha actual)
      const today = new Date().toISOString().split('T')[0];
      setFechaOficio(today);

      // Calcula los folios por defecto
      const foliosCalculados = {
        folios1: 1,
        folios2: solicitudes.length,
        folios3: 0,
      };
      const total = foliosCalculados.folios1 + foliosCalculados.folios2 + foliosCalculados.folios3;
      setFolios({ ...foliosCalculados, total: total });

      // TODO: Aquí debes llamar a tu API para obtener el TRD del departamento
      // Por ahora, asumimos que obtienes el valor 'TRD-DEPARTAMENTO'
      // O puedes crear un endpoint en tu backend que retorne este dato.
      // fetch(`http://192.168.42.175:5000/api/departamento/trd/${departamentoId}`)
      //   .then(res => res.json())
      //   .then(data => setTrdDepto(data.trd))
      //   .catch(err => console.error(err));
      setTrdDepto('TRD-DEPTO'); // Usamos un valor de ejemplo
    }
  }, [isOpen, estadoEnvio, solicitudes, user]);

  const updateFoliosTotal = (e) => {
    const { name, value } = e.target;
    const newFolios = { ...folios, [name]: parseInt(value) || 0 };
    const total = newFolios.folios1 + newFolios.folios2 + newFolios.folios3;
    setFolios({ ...newFolios, total });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar que los campos obligatorios no estén vacíos
    if (!numOficio || !fechaOficio || !jefeDepto || !numActa || !fechaActa) {
      alert("Por favor, completa todos los campos requeridos.");
      return;
    }

    // Construir la URL para el script PHP
    const url = `http://192.168.42.175/temporalesc/oficio_depto.php?` +
      `departamento_id=${departamentoId}&` +
      `anio_semestre=${periodoSeleccionado}&` +
      `num_oficio=${numOficio}&` +
      `elaboro=${jefeDepto}&` +
      `acta=${numActa}&` +
      `fecha_acta=${fechaActa}&` +
      `fecha_oficio=${fechaOficio}&` +
      `folios=${folios.total}&` +
      `nombre_fac=${encodeURIComponent(user?.nombre_facultad || 'N/A')}`;

    // Abrir una nueva pestaña para descargar el archivo
    window.open(url, '_blank');
    onClose(); // Cerrar el modal después de la acción
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Información Adicional para Oficio</h5>
          <button type="button" className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Número de Oficio</label>
              <input 
                type="text" 
                className="form-control" 
                value={numOficio}
                onChange={(e) => setNumOficio(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label>Fecha de Oficio</label>
              <input 
                type="date" 
                className="form-control" 
                value={fechaOficio}
                onChange={(e) => setFechaOficio(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label>Jefe de Departamento</label>
              <input 
                type="text" 
                className="form-control" 
                value={jefeDepto}
                onChange={(e) => setJefeDepto(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label>Número de Acta</label>
              <input 
                type="text" 
                className="form-control" 
                value={numActa}
                onChange={(e) => setNumActa(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label>Fecha del Acta</label>
              <input 
                type="date" 
                className="form-control" 
                value={fechaActa}
                onChange={(e) => setFechaActa(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label>Número de Folios</label>
              <div className="folios-inputs">
                <div className="folio-row">
                  <label>FOR-59. Acta de Selección</label>
                  <input type="number" name="folios1" value={folios.folios1} onChange={updateFoliosTotal} min="0" className="form-control" />
                </div>
                <div className="folio-row">
                  <label>FOR 45. Revisión Requisitos</label>
                  <input type="number" name="folios2" value={folios.folios2} onChange={updateFoliosTotal} min="0" className="form-control" />
                </div>
                <div className="folio-row">
                  <label>Otros: (hojas de vida y actualizaciones)</label>
                  <input type="number" name="folios3" value={folios.folios3} onChange={updateFoliosTotal} min="0" className="form-control" />
                </div>
              </div>
              <p className="total-folios">Total de Folios: <strong>{folios.total}</strong></p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
              <button type="submit" className="btn btn-primary">Generar Word</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalImprimirOficio;