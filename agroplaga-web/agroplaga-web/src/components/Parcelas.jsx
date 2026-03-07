import React, { useEffect, useState } from 'react';


function Parcelas() {
  const [nombre, setNombre] = useState('');
  const [variedad, setVariedad] = useState('');
  const [fechaSiembra, setFechaSiembra] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [parcelas, setParcelas] = useState([]);

  useEffect(() => {
    const guardadas = localStorage.getItem('parcelas');
    if (guardadas) {
      setParcelas(JSON.parse(guardadas));
    }
  }, []);

  const guardarParcela = (e) => {
    e.preventDefault();
    if (!nombre || !variedad || !fechaSiembra) {
      alert('Por favor llena todos los campos obligatorios.');
      return;
    }

    const nueva = {
      id: Date.now(),
      nombre,
      variedad,
      fechaSiembra,
      observaciones
    };

    const actualizadas = [...parcelas, nueva];
    setParcelas(actualizadas);
    localStorage.setItem('parcelas', JSON.stringify(actualizadas));
    setNombre('');
    setVariedad('');
    setFechaSiembra('');
    setObservaciones('');
  };

  const eliminarParcela = (id) => {
    const nuevas = parcelas.filter(p => p.id !== id);
    setParcelas(nuevas);
    localStorage.setItem('parcelas', JSON.stringify(nuevas));
  };

  return (
    <div className="container">
      <h2>🌾 Registro de Parcelas de Cultivo</h2>

      <form onSubmit={guardarParcela} className="card">
        <label>📍 Nombre del lote:</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required />

        <label>🌱 Variedad del durazno:</label>
        <input type="text" value={variedad} onChange={e => setVariedad(e.target.value)} required />

        <label>📅 Fecha de siembra:</label>
        <input type="date" value={fechaSiembra} onChange={e => setFechaSiembra(e.target.value)} required />

        <label>📝 Observaciones:</label>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} />

        <button type="submit">💾 Guardar Parcela</button>
      </form>

      <h3>📋 Parcelas Registradas</h3>

      {parcelas.length === 0 ? (
        <p>No hay parcelas registradas.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Variedad</th>
              <th>Fecha de Siembra</th>
              <th>Observaciones</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {parcelas.map(p => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.variedad}</td>
                <td>{p.fechaSiembra}</td>
                <td>{p.observaciones}</td>
                <td>
                  <button onClick={() => eliminarParcela(p.id)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Parcelas;
