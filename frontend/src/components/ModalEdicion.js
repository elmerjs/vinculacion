import React, { useState, useEffect } from 'react';
import './ModalEdicion.css';
import { FaEdit, FaSave, FaArrowLeft } from 'react-icons/fa';

const ModalEdicion = ({ isOpen, onClose, solicitud, onUpdate }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (solicitud) {
      setFormData({ ...solicitud });
    }
  }, [solicitud]);

  if (!isOpen || !solicitud) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };
  
  const handleHorasChange = (e) => {
    const { name, value } = e.target;
    const newHours = parseFloat(value);
    
    if (isNaN(newHours) || newHours < 0) {
      return;
    }

    const otherHours = name === 'horas' ? (parseFloat(formData.horas_r) || 0) : (parseFloat(formData.horas) || 0);
    const totalHours = newHours + otherHours;

    if (totalHours > 12) {
        alert("La sumatoria de horas no puede ser mayor a 12.");
        return;
    }
    
    setFormData(prevData => ({ ...prevData, [name]: newHours }));
  };
  
  const handleDedicacionChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };
    
    if (name === 'tipo_dedicacion' && value) {
        updatedData.tipo_dedicacion_r = '';
    } else if (name === 'tipo_dedicacion_r' && value) {
        updatedData.tipo_dedicacion = '';
    }
    setFormData(updatedData);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (solicitud.tipo_docente === 'Catedra') {
        const totalHoras = (parseFloat(formData.horas) || 0) + (parseFloat(formData.horas_r) || 0);
        if (totalHoras > 12 || totalHoras < 2) {
            alert("La sumatoria de horas debe estar entre 2 y 12.");
            return;
        }
    }
    await onUpdate(solicitud.id_solicitud, formData);
  };
  
  const showLinkField = (
    formData.anexa_hv_docente_nuevo === 'si' ||
    formData.actualiza_hv_antiguo === 'si'
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="card">
          <div className="header">
            <h1><FaEdit /> Actualizar Solicitud</h1>
            <button className="close-button" onClick={onClose}>&times;</button>
          </div>
          
          <div className="info-box">
            <p><i className="fas fa-info-circle"></i> Complete los campos necesarios para actualizar la información del profesor.</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="section-title">
              <i className="fas fa-id-card"></i>
              <span>Datos del Profesor</span>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Cédula</label>
                <input type="text" className="form-control" value={solicitud.cedula} readOnly />
              </div>
              
              <div className="form-group">
                <label>Nombre Completo</label>
                <input type="text" className="form-control" value={solicitud.nombre} readOnly />
              </div>
            </div>
            
            <div className="section-title">
              <i className="fas fa-clock"></i>
              <span>Dedicación y Horas</span>
            </div>
            
            {solicitud.tipo_docente === 'Ocasional' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Dedicación Popayán</label>
                  <select 
                    className="form-control" 
                    name="tipo_dedicacion" 
                    value={formData.tipo_dedicacion} 
                    onChange={handleDedicacionChange}
                  >
                    <option value="">Seleccione...</option>
                    <option value="TC">Tiempo Completo (TC)</option>
                    <option value="MT">Medio Tiempo (MT)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Dedicación Regionalización</label>
                  <select 
                    className="form-control" 
                    name="tipo_dedicacion_r" 
                    value={formData.tipo_dedicacion_r} 
                    onChange={handleDedicacionChange}
                  >
                    <option value="">Seleccione...</option>
                    <option value="TC">Tiempo Completo (TC)</option>
                    <option value="MT">Medio Tiempo (MT)</option>
                  </select>
                </div>
              </div>
            )}
            
            {solicitud.tipo_docente === 'Catedra' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Horas Popayán</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    name="horas"
                    value={formData.horas || ''}
                    onChange={handleHorasChange}
                    min="2"
                    max="12"
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Horas Regionalización</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    name="horas_r" 
                    value={formData.horas_r || ''}
                    onChange={handleHorasChange}
                    min="0"
                    max="12"
                    step="0.1"
                  />
                </div>
              </div>
            )}
            
            <div className="section-title">
              <i className="fas fa-file-alt"></i>
              <span>Documentación</span>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Anexa HV Nuevos</label>
                <select 
                  className="form-control" 
                  name="anexa_hv_docente_nuevo" 
                  value={formData.anexa_hv_docente_nuevo || 'no'} 
                  onChange={handleChange}
                >
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Actualiza HV Antiguos</label>
                <select 
                  className="form-control" 
                  name="actualiza_hv_antiguo" 
                  value={formData.actualiza_hv_antiguo || 'no'} 
                  onChange={handleChange}
                >
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
              </div>
            </div>
            
            {showLinkField && (
                <div className="link-container">
                    <div className="form-group">
                        <label>Link Drive/Nube</label>
                        <input 
                            type="url" 
                            className="form-control" 
                            name="anexos" 
                            value={formData.anexos || ''}
                            onChange={handleChange}
                            placeholder="https://drive.google.com/..."
                        />
                    </div>
                </div>
            )}
            
            <div className="btn-group">
              <button type="submit" className="btn btn-primary">
                <FaSave /> Actualizar Registro
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                <FaArrowLeft /> Regresar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalEdicion;