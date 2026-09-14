import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import AlertaPlagas from "./AlertaPlagas";
import { FaThermometerHalf, FaTint } from "react-icons/fa";
import { API_BASE, apiUrl, deteccionesApi } from "../lib/api";
import "../styles/Dashboard.css";

const API = API_BASE;

// Sensores del nodo de campo: ESP32-CAM + DHT22 (temperatura y humedad).
const LABELS = {
  temp: { label: "Temperatura", unit: "°C", Icon: FaThermometerHalf },
  hum: { label: "Humedad", unit: "%", Icon: FaTint },
};
const SENSOR_KEYS = Object.keys(LABELS);

function Dashboard({ plotId: plotIdProp }) {
  const [plotId, setPlotId] = useState(plotIdProp ?? null);
  const [plots, setPlots] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [plotName, setPlotName] = useState("Parcela");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deteccionesCamara, setDeteccionesCamara] = useState([]);

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
        if (!LABELS[key]) continue; // otros sensores (p. ej. luz) no se muestran

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

    // 📹 Detecciones de camara (aisladas: si fallan no rompen el panel)
    try {
      const dets = await deteccionesApi.list({ plotId: id, limit: 5 });
      setDeteccionesCamara(Array.isArray(dets) ? dets : []);
    } catch {
      setDeteccionesCamara([]);
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
          {SENSOR_KEYS.map((k, i) => {
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

        {/* Ultima deteccion de camara */}
        <div className="deteccion-card">
          <div className="deteccion-header">
            <h3>📹 Última detección de cámara</h3>
            <Link to="/camara" className="deteccion-link">
              Ver cámara en vivo →
            </Link>
          </div>
          {deteccionesCamara.length === 0 ? (
            <p className="deteccion-vacio">Sin detecciones de cámara para esta parcela.</p>
          ) : (
            (() => {
              const d = deteccionesCamara[0];
              return (
                <div className="deteccion-body">
                  {d.imagen && (
                    <img
                      className="deteccion-thumb"
                      src={apiUrl(d.imagen)}
                      alt={d.plaga || "Sin plaga"}
                    />
                  )}
                  <div className="deteccion-info">
                    <div className="deteccion-plaga">
                      {d.plaga || "Sin plaga evidente"}
                      <span className={`deteccion-chip deteccion-chip--${d.severidad}`}>
                        {d.severidad}
                      </span>
                    </div>
                    {d.resumen && <p className="deteccion-resumen">{d.resumen}</p>}
                    <p className="deteccion-meta">
                      {d.camara_nombre ? `${d.camara_nombre} · ` : ""}
                      {d.confianza != null ? `${Math.round(d.confianza)}% · ` : ""}
                      {new Date(d.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {/* Componente de alertas */}
        <AlertaPlagas
          temperatura={temperatura}
          humedad={humedad}
          deteccionesCamara={deteccionesCamara}
        />
      </div>
    </div>
  );
}

export default Dashboard;
