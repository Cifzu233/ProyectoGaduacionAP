import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

function agruparPorMes(registros) {
  const conteo = {};

  registros.forEach(reg => {
    const fecha = new Date(reg.fecha);
    const mes = fecha.toLocaleString('default', { month: 'short', year: 'numeric' });
    conteo[mes] = (conteo[mes] || 0) + 1;
  });

  // Convertimos el objeto a arreglo para Recharts
  return Object.keys(conteo).map(mes => ({
    mes,
    actividades: conteo[mes]
  }));
}

function GraficaActividades({ registros }) {
  const datos = agruparPorMes(registros);

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>📊 Actividades registradas por mes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={datos} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="actividades" fill="#40916c" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default GraficaActividades;
