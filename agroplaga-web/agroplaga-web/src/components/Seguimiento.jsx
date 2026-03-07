import React, { useState, useEffect } from 'react';
import GraficaActividades from './GraficaActividades';

function Seguimiento() {
  const [actividad, setActividad] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fecha, setFecha] = useState('');
  const [imagen, setImagen] = useState('');
  const [parcelaSeleccionada, setParcelaSeleccionada] = useState('');
  const [filtroParcela, setFiltroParcela] = useState('');
  const [registros, setRegistros] = useState([]);
  const [parcelas, setParcelas] = useState([]);

  useEffect(() => {
    const datosGuardados = localStorage.getItem('seguimiento');
    if (datosGuardados) {
      setRegistros(JSON.parse(datosGuardados));
    }
    const parcelasGuardadas = localStorage.getItem('parcelas');
    if (parcelasGuardadas) {
      setParcelas(JSON.parse(parcelasGuardadas));
    }
  }, []);

  const convertirImagenABase64 = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onloadend = () => {
      setImagen(lector.result);
    };
    lector.readAsDataURL(archivo);
  };

  const guardarRegistro = (e) => {
    e.preventDefault();
    if (!actividad || !fecha || !parcelaSeleccionada) {
      alert('Por favor llena todos los campos requeridos.');
      return;
    }

    const nuevo = {
      id: Date.now(),
      actividad,
      observaciones,
      fecha,
      parcela: parcelaSeleccionada,
      imagen
    };

    const nuevosRegistros = [...registros, nuevo];
    setRegistros(nuevosRegistros);
    localStorage.setItem('seguimiento', JSON.stringify(nuevosRegistros));
    setActividad('');
    setObservaciones('');
    setFecha('');
    setImagen('');
    setParcelaSeleccionada('');
  };

  const eliminarRegistro = (id) => {
    if (!confirm("¿Eliminar este registro permanentemente?")) return;
    const nuevos = registros.filter(item => item.id !== id);
    setRegistros([...nuevos]);
    localStorage.setItem('seguimiento', JSON.stringify(nuevos));
    if (filtroParcela && !nuevos.some(r => r.parcela === filtroParcela)) {
      setFiltroParcela('');
    }
  };

  const eliminarTodo = () => {
    if (registros.length === 0) {
      alert("⚠️ No hay registros para borrar.");
      return;
    }

    if (confirm('¿Borrar todos los registros? Esta acción no se puede deshacer.')) {
      setRegistros([]);
      localStorage.removeItem('seguimiento');
      setFiltroParcela('');
      alert('🗑️ Registros eliminados.');
    }
  };

  const exportarCSV = () => {
    if (registros.length === 0) {
      alert('⚠️ No hay registros para exportar.');
      return;
    }

    const encabezado = 'Fecha,Actividad,Observaciones,Parcela\n';
    const filas = registros.map(r =>
      `${r.fecha},${r.actividad.replace(/,/g, ' ')},${r.observaciones.replace(/,/g, ' ')},${r.parcela}`
    ).join('\n');

    const csv = encabezado + filas;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'seguimiento.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const limpiarTodo = () => {
    if (confirm("🧨 Esto borrará todos los datos del sistema: plagas, seguimiento y parcelas. ¿Continuar?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const registrosFiltrados = filtroParcela
    ? registros.filter(r => r.parcela === filtroParcela)
    : registros;

  return (
    <div className="container">
      <h2>📘 Registro de Actividades</h2>

      <form onSubmit={guardarRegistro} style={{ marginBottom: '2rem' }}>
        <div>
          <label>📅 Fecha:</label><br />
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
        </div>

        <div>
          <label>📍 Parcela:</label><br />
          <select value={parcelaSeleccionada} onChange={e => setParcelaSeleccionada(e.target.value)} required>
            <option value="">Seleccionar parcela</option>
            {parcelas.map((parcela, index) => (
              <option key={index} value={parcela.nombre}>{parcela.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label>🧪 Actividad:</label><br />
          <input type="text" placeholder="Ej. Fumigación" value={actividad} onChange={e => setActividad(e.target.value)} required />
        </div>

        <div>
          <label>📝 Observaciones:</label><br />
          <textarea placeholder="Detalles..." value={observaciones} onChange={e => setObservaciones(e.target.value)} rows="3" />
        </div>

        <div>
          <label>📷 Fotografía (opcional):</label><br />
          <input type="file" accept="image/*" onChange={convertirImagenABase64} />
        </div>

        <button type="submit" className="button">Guardar Registro</button>
      </form>

      <h3>📋 Historial</h3>

      {parcelas.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label>🔍 Filtrar por parcela: </label>
          <select value={filtroParcela} onChange={e => setFiltroParcela(e.target.value)}>
            <option value="">Todas las parcelas</option>
            {parcelas.map((parcela, index) => (
              <option key={index} value={parcela.nombre}>{parcela.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {registrosFiltrados.length === 0 ? (
        <p>No hay registros disponibles.</p>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Parcela</th>
                <th>Actividad</th>
                <th>Observaciones</th>
                <th>Foto</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>{item.fecha}</td>
                  <td>{item.parcela}</td>
                  <td>{item.actividad}</td>
                  <td>{item.observaciones}</td>
                  <td>{item.imagen ? <img src={item.imagen} alt="Foto" style={{ maxWidth: '100px' }} /> : '—'}</td>
                  <td>
                    <button onClick={() => eliminarRegistro(item.id)} className="button">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={eliminarTodo} className="button">🗑️ Borrar Todo</button>
            <button onClick={exportarCSV} className="button">📥 Exportar CSV</button>
            <button onClick={limpiarTodo} className="button">🧨 Reset Total</button>
          </div>

          <GraficaActividades registros={registrosFiltrados} />
        </>
      )}
    </div>
  );
}

export default Seguimiento;
