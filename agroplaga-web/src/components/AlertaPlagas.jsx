// src/components/AlertaPlagas.jsx
// Tarjeta de alertas del panel: cruza las lecturas del DHT22 (temperatura y
// humedad) con las detecciones recientes de la camara. Las reglas climaticas
// son las mismas de siempre; solo cambia como se presentan.
import React from "react";
import Icono from "./Icono";
import "../styles/alertas.css";

const VENTANA_CAMARA_MS = 24 * 60 * 60 * 1000;

function AlertaPlagas({ temperatura, humedad, deteccionesCamara = [] }) {
  const alertas = [];

  if (temperatura > 28 && humedad > 70) {
    alertas.push({
      nivel: "aviso",
      titulo: "Condiciones propicias para mosca de la fruta",
      detalle: `${formato(temperatura)} °C con ${formato(humedad)} % de humedad`,
    });
  }

  if (temperatura > 22 && humedad > 60) {
    alertas.push({
      nivel: "aviso",
      titulo: "Posible aparición de pulgones",
      detalle: `${formato(temperatura)} °C con ${formato(humedad)} % de humedad`,
    });
  }

  if (temperatura > 30 && humedad < 50) {
    alertas.push({
      nivel: "aviso",
      titulo: "Riesgo de ácaros por clima seco y cálido",
      detalle: `${formato(temperatura)} °C con ${formato(humedad)} % de humedad`,
    });
  }

  // 📹 Detecciones de camara recientes que requieren accion
  const ahora = Date.now();
  for (const d of deteccionesCamara) {
    if (!d?.requiere_accion) continue;
    const t = d.created_at ? new Date(d.created_at).getTime() : NaN;
    if (Number.isFinite(t) && ahora - t > VENTANA_CAMARA_MS) continue;
    const conf = d.confianza != null ? ` · ${Math.round(d.confianza)} % de confianza` : "";
    alertas.push({
      nivel: d.severidad === "alta" ? "alerta" : "aviso",
      titulo: `La cámara detectó ${d.plaga || "una posible plaga"}`,
      detalle: `Severidad ${d.severidad}${conf}${d.resumen ? ` · ${d.resumen}` : ""}`,
    });
  }

  return (
    <article className="ap-tarjeta alertas">
      <div className="ap-tarjeta__cabecera">
        <span className="ap-tarjeta__etiqueta">Alertas activas</span>
        <span className="alertas__contador">
          {alertas.length > 0 && <span className="alertas__numero">{alertas.length}</span>}
          <Icono nombre="campana" size={20} className="alertas__icono" />
        </span>
      </div>

      {alertas.length === 0 ? (
        <div className="alertas__limpio">
          <Icono nombre="check" size={18} strokeWidth={2.4} />
          <span>Sin condiciones de riesgo por ahora.</span>
        </div>
      ) : (
        <ul className="alertas__lista">
          {alertas.map((a) => (
            <li key={`${a.nivel}-${a.titulo}`} className={`alertas__item alertas__item--${a.nivel}`}>
              <span className="alertas__punto" />
              <span className="alertas__texto">
                <span className="alertas__titulo">{a.titulo}</span>
                <span className="alertas__detalle">{a.detalle}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function formato(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export default AlertaPlagas;
