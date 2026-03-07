// src/lib/api.js
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function http(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;

    // Intentar leer JSON del error sin romper si no es JSON
    try {
      const j = await res.json();
      if (j && typeof j === 'object' && j.error) {
        msg = j.error;
      }
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // La respuesta no era JSON: dejamos msg por defecto
    }

    throw new Error(msg);
  }

  // Respuesta OK en JSON
  return res.json();
}

export const api = {
  lastByPlot:   (plotId)                => http(`/api/plots/${plotId}/last`),
  history:      (plotId, key, hours=24) => http(`/api/plots/${plotId}/history?key=${key}&hours=${hours}`),
  alerts:       (status='open')         => http(`/api/alerts?status=${status}`),
  closeAlert:   (id)                    => http(`/api/alerts/${id}/close`, { method: 'PATCH' }),
};
