// src/components/Dashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import AlertaPlagas from "./AlertaPlagas";
import { FaThermometerHalf, FaTint, FaSun } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Etiquetas por clave conocida (siempre mostramos estas 3 tarjetas)
const LABELS = {
  temp: { label: "Temperatura", unit: "°C", Icon: FaThermometerHalf },
  hum:  { label: "Humedad",     unit: "%",  Icon: FaTint },
  lux:  { label: "Luminosidad", unit: "lux", Icon: FaSun },
};

function Dashboard({ plotId: plotIdProp }) {
  const [plotId, setPlotId] = useState(plotIdProp ?? null);
  const [plots, setPlots] = useState([]); // para selector si no viene plotId
  const [metrics, setMetrics] = useState({});
  const [plotName, setPlotName] = useState("Parcela");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carga lista de parcelas si no se pasó plotId como prop
  useEffect(() => {
    if (plotIdProp != null) return; // no necesitamos listar
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

  async function loadData(id) {
    if (!id) return;
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/plots/${id}/last`);
      if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try {
          const j = await res.clone().json();
          if (j && typeof j === "object" && j.error) msg = j.error;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.debug("Respuesta de error no-JSON (se ignora):", err);
        }
        throw new Error(msg);
      }

      const data = await res.json();
      setPlotName(data.plot?.name || `Parcela ${id}`);

      // Mapear por key esperado por las tarjetas
      const map = {};
      for (const m of data.metrics || []) {
        map[m.key] = {
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

  // Cargar al montar y cuando cambie plotId/prop
  useEffect(() => {
    const id = plotIdProp ?? plotId;
    if (id != null) loadData(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotIdProp, plotId]);

  // (Opcional) auto-refresh cada 20s
  useEffect(() => {
    const id = plotIdProp ?? plotId;
    if (id == null) return;
    const h = setInterval(() => loadData(id), 20000);
    return () => clearInterval(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotIdProp, plotId]);

  const temperatura = metrics.temp?.v ?? 0;
  const humedad     = metrics.hum?.v  ?? 0;
  const luz         = metrics.lux?.v  ?? 0;

  const lastUpdate = useMemo(() => {
    const times = Object.values(metrics)
      .map(m => (m.t ? new Date(m.t).getTime() : NaN))
      .filter(v => Number.isFinite(v));
    if (!times.length) return null;
    return new Date(Math.max(...times));
  }, [metrics]);

  const currentPlotId = plotIdProp ?? plotId;

  return (
    <div className="container" style={{ padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>🌿 Panel de Monitoreo Ambiental — {plotName}</h2>

        {/* Selector de parcela solo si NO recibimos plotId por props */}
        {plotIdProp == null && (
          <select
            value={currentPlotId || ""}
            onChange={(e) => setPlotId(Number(e.target.value))}
            style={{ padding: ".4rem .6rem", borderRadius: 8, border: "1px solid #e5e7eb" }}
          >
            {plots.map(p => (
              <option key={p.id} value={p.id}>{p.name || `Parcela ${p.id}`}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ marginTop: ".5rem", color: "#6b7280" }}>
        {loading && <span>Cargando…</span>}
        {!loading && !error && lastUpdate && (
          <span>Última actualización: {lastUpdate.toLocaleString()}</span>
        )}
        {!loading && !error && !lastUpdate && <span>Sin lecturas aún.</span>}
        {error && <div style={{ color: "#dc2626", marginTop: ".25rem" }}>Error: {error}</div>}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {["temp", "hum", "lux"].map((k) => {
          const meta = LABELS[k];
          const val  = metrics[k]?.v;
          const Icon = meta.Icon;
          const unitFromBackend = metrics[k]?.unit;

          return (
            <div
              key={k}
              className="card"
              style={{
                flex: "1 1 220px",
                padding: "1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                boxShadow: "0 1px 2px rgba(0,0,0,.04)",
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".25rem" }}>
                <Icon />
                <strong>{meta.label}:</strong>
              </div>
              <div style={{ fontSize: "1.25rem" }}>
                {val != null ? `${val} ${unitFromBackend || meta.unit}` : "—"}
              </div>
              <div style={{ fontSize: ".8rem", color: "#6b7280", marginTop: ".25rem" }}>
                {metrics[k]?.t ? new Date(metrics[k].t).toLocaleString() : "Sin datos"}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: ".75rem", marginTop: "1rem" }}>
        <button
          onClick={() => currentPlotId && loadData(currentPlotId)}
          style={{
            padding: ".5rem .9rem",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            cursor: "pointer",
          }}
          disabled={!currentPlotId || loading}
        >
          🔄 Refrescar
        </button>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <AlertaPlagas temperatura={temperatura} humedad={humedad} luz={luz} />
      </div>
    </div>
  );
}

export default Dashboard;

