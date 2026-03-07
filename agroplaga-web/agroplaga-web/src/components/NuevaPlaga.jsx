import React, { useState, useEffect } from 'react';

function NuevaPlaga() {
  const [nombre, setNombre] = useState('');
  const [clase, setClase] = useState('');
  const [sintomas, setSintomas] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [imagen, setImagen] = useState('');
  const [plagas, setPlagas] = useState([]);

  useEffect(() => {
    const guardadas = localStorage.getItem('plagas');
    if (guardadas) {
      setPlagas(JSON.parse(guardadas));
    }
  }, []);

  const guardarPlaga = (e) => {
    e.preventDefault();
    if (!nombre || !clase || !sintomas || !tratamiento) {
      alert('❗ Todos los campos son obligatorios');
      return;
    }

    const nueva = {
      id: Date.now(),
      nombre,
      clase,
      sintomas,
      tratamiento,
      imagen
    };

    const nuevasPlagas = [...plagas, nueva];
    setPlagas(nuevasPlagas);
    localStorage.setItem('plagas', JSON.stringify(nuevasPlagas));

    setNombre('');
    setClase('');
    setSintomas('');
    setTratamiento('');
    setImagen('');

    alert('✅ Nueva plaga registrada correctamente');
  };

  return (
    <div className="container" style={{ maxWidth: '700px', margin: 'auto', padding: '2rem' }}>
      <h2 style={{ color: '#1b4332' }}>➕ Registrar Nueva Plaga</h2>

      <form onSubmit={guardarPlaga} className="card" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>🪰 Nombre de la Plaga:</label><br />
          <input
            type="text"
            className="input"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Mosca de la fruta"
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>🧬 Clase:</label><br />
          <input
            type="text"
            className="input"
            value={clase}
            onChange={e => setClase(e.target.value)}
            placeholder="Ej. Díptero"
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>🤕 Síntomas:</label><br />
          <textarea
            className="input"
            value={sintomas}
            onChange={e => setSintomas(e.target.value)}
            rows="3"
            placeholder="Describe los síntomas visibles en la planta"
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>💊 Tratamiento recomendado:</label><br />
          <textarea
            className="input"
            value={tratamiento}
            onChange={e => setTratamiento(e.target.value)}
            rows="3"
            placeholder="Describe el tratamiento sugerido"
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>🖼️ URL de Imagen (opcional):</label><br />
          <input
            type="text"
            className="input"
            value={imagen}
            onChange={e => setImagen(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {imagen && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>📷 Vista previa:</strong><br />
            <img src={imagen} alt="Vista previa" style={{ maxWidth: '200px', borderRadius: '8px' }} />
          </div>
        )}

        <button type="submit" className="button">
          Guardar Plaga
        </button>
      </form>
    </div>
  );
}

export default NuevaPlaga;
