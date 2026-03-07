// src/components/AlertaPlagas.jsx
import React from "react";
import "../styles/alertas.css";

function AlertaPlagas({ temperatura, humedad, luz }) {
  const alertas = [];

  if (temperatura > 28 && humedad > 70 && luz > 2000) {
    alertas.push("⚠️ Condiciones propicias para *Mosca de la fruta*");
  }

  if (temperatura > 22 && humedad > 60) {
    alertas.push("⚠️ Posible aparición de *Pulgones*");
  }

  if (temperatura > 30 && humedad < 50) {
    alertas.push("⚠️ Riesgo de *Ácaros* debido a clima seco y cálido");
  }

  return (
    <div className="alerta-container">
      <h3>🔔 Alertas Inteligentes</h3>
      {alertas.length === 0 ? (
        <p>✅ No hay condiciones alarmantes por ahora.</p>
      ) : (
        <ul>
          {alertas.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AlertaPlagas;
