import React from 'react';

function AlertaPlagas({ temperatura, humedad, luz }) {
  const alertas = [];

  if (temperatura > 28 && humedad > 70 && luz > 2000) {
    alertas.push('⚠️ Condiciones propicias para *Mosca de la fruta*');
  }

  if (temperatura > 22 && humedad > 60) {
    alertas.push('⚠️ Posible aparición de *Pulgones*');
  }

  if (temperatura > 30 && humedad < 50) {
    alertas.push('⚠️ Riesgo de *Ácaros* debido a clima seco y cálido');
  }

  return (
    <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeeba' }}>
      <h3>🔔 Alertas Inteligentes</h3>
      {alertas.length === 0 ? (
        <p>✅ No hay condiciones alarmantes por ahora.</p>
      ) : (
        <ul>
          {alertas.map((a, i) => (
            <li key={i} style={{ marginBottom: '0.5rem' }}>{a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AlertaPlagas;
