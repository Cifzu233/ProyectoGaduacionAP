// src/components/GraficaActividades.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "../styles/grafica.css";

function agruparPorMes(registros) {
  const conteo = {};

  registros.forEach((reg) => {
    const fecha = new Date(reg.fecha);
    const mes = fecha.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    conteo[mes] = (conteo[mes] || 0) + 1;
  });

  return Object.keys(conteo).map((mes) => ({
    mes,
    actividades: conteo[mes],
  }));
}

function GraficaActividades({ registros }) {
  const datos = agruparPorMes(registros);

  return (
    <div className="grafica-contenedor">
      <h3 className="grafica-titulo">📊 Actividades registradas por mes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={datos}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          className="grafica-bar"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
          <XAxis dataKey="mes" tick={{ fill: "#374151" }} />
          <YAxis tick={{ fill: "#374151" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
            }}
          />
          <Bar dataKey="actividades" fill="#52b788" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default GraficaActividades;
