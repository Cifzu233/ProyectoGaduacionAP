import React, { useState, useEffect, useMemo } from "react";
import AlertaPlagas from "./AlertaPlagas";
import { FaThermometerHalf, FaTint, FaSun } from "react-icons/fa";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://192.168.0.106:4000";

const LABELS = {
  temp: { label: "Temperatura", unit: "°C", Icon: FaThermometerHalf },
  hum: { label: "Humedad", unit: "%", Icon: FaTint },
  lux: { label: "Luminosidad", unit: "lux", Icon: FaSun },
};

function Dashboard({ plotId: plotIdProp }) {
  const [plotId, setPlotId] = useState(plotIdProp ?? null);
  const [plots, setPlots] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [plotName, setPlotName] = useState("Parcela");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Cargar lista de parcelas si no viene por props
  useEffect(() => {
    if (plotIdProp != null) return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/plots`);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        setPlots(data || []);
        if (data?.length) setPlotId(data[0].id);
      } catch (e) {
        setError(e.message || "No se pudo cargar parcelas");
      }
    })();
  }, [plotIdProp]);

  // 🔹 Cargar métricas de la parcela seleccionada
  async function loadData(id) {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API}/api/plots/${id}/last`);
      if (!res.ok) throw new Error("Error obteniendo datos del servidor");
      const data = await res.json();

      setPlotName(data.plot?.name || `Parcela ${id}`);

      const map = {};
      for (const m of data.metrics || []) {
        let key = m.key;

        // 🧩 Mapeo para compatibilidad entre backend y frontend
        if (key === "temperature") key = "temp";
        if (key === "humidity") key = "hum";
        if (key === "light") key = "lux";

        map[key] = {
          v: m.last_value,
          t: m.last_time,
          unit: m.unit,
        };
      }
      setMetrics(map);
    } catch (e) {
      setError(e.message || "Error cargando datos");
      setMetrics({});
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Carga inicial de datos
  useEffect(() => {
    const id = plotIdProp ?? plotId;
    if (id != null) loadData(id);
  }, [plotIdProp, plotId]);

  // 🔹 Actualización automática cada 20 segundos
  useEffect(() => {
    const id = plotIdProp ?? plotId;
    if (!id) return;
    const interval = setInterval(() => loadData(id), 20000);
    return () => clearInterval(interval);
  }, [plotIdProp, plotId]);

  // 🔹 Variables de sensores
  const temperatura = metrics.temp?.v ?? 0;
  const humedad = metrics.hum?.v ?? 0;
  const luz = metrics.lux?.v ?? 0;

  // 🔹 Última actualización
  const lastUpdate = useMemo(() => {
    const times = Object.values(metrics)
      .map((m) => (m.t ? new Date(m.t).getTime() : NaN))
      .filter((v) => Number.isFinite(v));
    if (!times.length) return null;
    return new Date(Math.max(...times));
  }, [metrics]);

  const currentPlotId = plotIdProp ?? plotId;

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <h2 className="title">🌿 Panel de Monitoreo Ambiental — {plotName}</h2>

        {/* Selector de parcela (solo si no viene por props) */}
        {plotIdProp == null && (
          <select
            value={currentPlotId || ""}
            onChange={(e) => setPlotId(Number(e.target.value))}
            className="selector"
          >
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || `Parcela ${p.id}`}
              </option>
            ))}
          </select>
        )}

        {/* Estado de carga */}
        <p className="update-text">
          {loading && "Cargando..."}
          {!loading && error && <span className="error">❌ {error}</span>}
          {!loading && !error && lastUpdate && (
            <span>Última actualización: {lastUpdate.toLocaleString()}</span>
          )}
        </p>

        {/* Tarjetas de sensores */}
        <div className="sensor-grid">
          {["temp", "hum", "lux"].map((k, i) => {
            const meta = LABELS[k];
            const val = metrics[k]?.v;
            const Icon = meta.Icon;
            const unit = metrics[k]?.unit || meta.unit;
            const time = metrics[k]?.t
              ? new Date(metrics[k].t).toLocaleString()
              : "Sin datos";

            return (
              <div className={`sensor-card card-${i + 1}`} key={k}>
                <div className="sensor-header">
                  <Icon className="icon" />
                  <h3>{meta.label}</h3>
                </div>
                <div className="sensor-value">
                  {val != null ? `${val} ${unit}` : "—"}
                </div>
                <p className="sensor-time">{time}</p>
              </div>
            );
          })}
        </div>

        {/* Botón refrescar */}
        <button
          onClick={() => currentPlotId && loadData(currentPlotId)}
          className="btn-refresh"
          disabled={!currentPlotId || loading}
        >
          🔄 Refrescar
        </button>

        {/* Componente de alertas */}
        <AlertaPlagas temperatura={temperatura} humedad={humedad} luz={luz} />
      </div>
    </div>
  );
}

export default Dashboard;
