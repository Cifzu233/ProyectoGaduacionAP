import React, { useState, useEffect } from 'react';
import plagasJson from '../data/plagas.json';

function Plagas() {
  const [plagas, setPlagas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    nombre_cientifico: '',
    sintomas: '',
    tratamiento: '',
    imagen: '',
  });

  useEffect(() => {
    const guardadas = localStorage.getItem('plagas');
    if (guardadas) {
      setPlagas(JSON.parse(guardadas));
    } else {
      setPlagas(plagasJson);
      localStorage.setItem('plagas', JSON.stringify(plagasJson));
    }
  }, []);

  const guardarPlagas = (nuevas) => {
    setPlagas(nuevas);
    localStorage.setItem('plagas', JSON.stringify(nuevas));
  };

  const eliminarPlaga = (id) => {
    const nuevas = plagas.filter(p => p.id !== id);
    guardarPlagas(nuevas);
  };

  const restaurarJSON = () => {
    guardarPlagas(plagasJson);
  };

  const empezarEdicion = (plaga) => {
    setEditandoId(plaga.id);
    setFormData({ ...plaga });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormData({
      nombre: '',
      nombre_cientifico: '',
      sintomas: '',
      tratamiento: '',
      imagen: '',
    });
  };

  const guardarCambios = () => {
    const nuevas = plagas.map(p =>
      p.id === editandoId ? { ...formData, id: editandoId } : p
    );
    guardarPlagas(nuevas);
    cancelarEdicion();
  };

  const filtradas = plagas.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container">
      <h2>🪰 Plagas Registradas</h2>

      <input
        type="text"
        placeholder="🔍 Buscar por nombre..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{ padding: '0.5rem', marginBottom: '1rem', width: '100%', borderRadius: '6px', border: '1px solid #ccc' }}
      />

      {filtradas.length === 0 ? (
        <p>No hay plagas registradas.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Nombre Científico</th>
              <th>Síntomas</th>
              <th>Tratamiento</th>
              <th>Imagen</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((plaga) =>
              editandoId === plaga.id ? (
                <tr key={plaga.id}>
                  <td><input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} /></td>
                  <td><input value={formData.nombre_cientifico} onChange={e => setFormData({ ...formData, nombre_cientifico: e.target.value })} /></td>
                  <td><textarea value={formData.sintomas} onChange={e => setFormData({ ...formData, sintomas: e.target.value })} /></td>
                  <td><textarea value={formData.tratamiento} onChange={e => setFormData({ ...formData, tratamiento: e.target.value })} /></td>
                  <td><input className="imagen" value={formData.imagen} onChange={e => setFormData({ ...formData, imagen: e.target.value })} /></td>
                  <td className="acciones">
                    <button onClick={guardarCambios}>💾 Guardar</button>
                    <button onClick={cancelarEdicion}>❌ Cancelar</button>
                  </td>
                </tr>
              ) : (
                <tr key={plaga.id}>
                  <td>{plaga.nombre}</td>
                  <td>{plaga.nombre_cientifico || '—'}</td>
                  <td>{plaga.sintomas}</td>
                  <td>{plaga.tratamiento}</td>
                  <td>{plaga.imagen ? <img src={plaga.imagen} alt="Plaga" style={{ width: '80px', borderRadius: '8px' }} /> : '—'}</td>
                  <td className="acciones">
                    <button onClick={() => empezarEdicion(plaga)}>✏️</button>
                    <button onClick={() => eliminarPlaga(plaga.id)}>🗑️</button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button onClick={restaurarJSON}>♻️ Restaurar desde JSON</button>
      </div>
    </div>
  );
}

export default Plagas;
