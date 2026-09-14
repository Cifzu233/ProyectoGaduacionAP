// src/lib/api.js
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function apiUrl(path = '') {
  if (!path) return API_BASE;
  // URLs ya absolutas (http, https, data:, blob:) se devuelven tal cual.
  if (/^(https?:)?\/\/|^(data|blob):/i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

async function http(path, opts = {}) {
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const res = await fetch(apiUrl(path), {
    ...opts,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(opts.headers || {}),
    },
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

  if (res.status === 204) return null;
  return res.json();
}

function cleanParams(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v == null || v === '') continue;
    out[k] = typeof v === 'boolean' ? (v ? '1' : '0') : String(v);
  }
  return out;
}

export const api = {
  lastByPlot:   (plotId)                => http(`/api/plots/${plotId}/last`),
  history:      (plotId, key, hours=24) => http(`/api/plots/${plotId}/history?key=${key}&hours=${hours}`),
  alerts:       (status='open')         => http(`/api/alerts?status=${status}`),
  closeAlert:   (id)                    => http(`/api/alerts/${id}/close`, { method: 'PATCH' }),
};

/* ============================ Camaras ESP32-CAM ============================ */

export const camarasApi = {
  list: () => http('/api/camaras'),
  get: (id) => http(`/api/camaras/${id}`),
  create: (data) => http('/api/camaras', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => http(`/api/camaras/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => http(`/api/camaras/${id}`, { method: 'DELETE' }),
  estado: (id) => http(`/api/camaras/${id}/estado`),
  analizar: (id, nota = '') =>
    http(`/api/camaras/${id}/analizar`, { method: 'POST', body: JSON.stringify({ nota }) }),
  setAuto: (id, intervalo_seg) =>
    http(`/api/camaras/${id}/analisis-automatico`, {
      method: 'PUT',
      body: JSON.stringify({ intervalo_seg }),
    }),
  nuevoToken: (id) => http(`/api/camaras/${id}/token`, { method: 'POST' }),
  streamUrl: (id, key = 0) => apiUrl(`/api/camaras/${id}/stream?k=${key}`),
  snapshotUrl: (id, fresh = false) =>
    apiUrl(`/api/camaras/${id}/snapshot?${fresh ? 'fresh=1&' : ''}t=${Date.now()}`),
  frameUrl: (id) => apiUrl(`/api/camaras/${id}/frame`),
};

export const deteccionesApi = {
  list: (filtros = {}) =>
    http(`/api/detecciones?${new URLSearchParams(cleanParams(filtros)).toString()}`),
  get: (id) => http(`/api/detecciones/${id}`),
  remove: (id) => http(`/api/detecciones/${id}`, { method: 'DELETE' }),
};
