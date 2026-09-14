// src/components/AlertaPlagas.jsx
import React from "react";
import "../styles/alertas.css";

const VENTANA_CAMARA_MS = 24 * 60 * 60 * 1000;

// Reglas basadas en el DHT22 (temperatura y humedad) del nodo ESP32-CAM.
function AlertaPlagas({ temperatura, humedad, deteccionesCamara = [] }) {
  const alertas = [];

  if (temperatura > 28 && humedad > 70) {
    alertas.push({ tipo: "clima", texto: "⚠️ Condiciones propicias para *Mosca de la fruta*" });
  }

  if (temperatura > 22 && humedad > 60) {
    alertas.push({ tipo: "clima", texto: "⚠️ Posible aparición de *Pulgones*" });
  }

  if (temperatura > 30 && humedad < 50) {
    alertas.push({ tipo: "clima", texto: "⚠️ Riesgo de *Ácaros* debido a clima seco y cálido" });
  }

  // 📹 Detecciones de camara recientes que requieren accion
  const ahora = Date.now();
  for (const d of deteccionesCamara) {
    if (!d?.requiere_accion) continue;
    const t = d.created_at ? new Date(d.created_at).getTime() : NaN;
    if (Number.isFinite(t) && ahora - t > VENTANA_CAMARA_MS) continue;
    const conf = d.confianza != null ? ` ${Math.round(d.confianza)}%` : "";
    alertas.push({
      tipo: "camara",
      texto: `📹 Cámara detectó *${d.plaga || "posible plaga"}* (severidad ${d.severidad}${conf})${
        d.resumen ? ` — ${d.resumen}` : ""
      }`,
    });
  }

  return (
    <div className="alerta-container">
      <h3>🔔 Alertas Inteligentes</h3>
      {alertas.length === 0 ? (
        <p>✅ No hay condiciones alarmantes por ahora.</p>
      ) : (
        <ul>
          {alertas.map((a, i) => (
            <li key={i} className={a.tipo === "camara" ? "alerta-camara" : undefined}>
              {a.texto}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AlertaPlagas;
