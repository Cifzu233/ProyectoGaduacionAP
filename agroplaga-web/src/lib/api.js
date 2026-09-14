// src/lib/api.js
// Cliente HTTP unico del frontend: resuelve la URL del backend, adjunta el token
// de sesion (JWT) y, si el backend responde 401, cierra la sesion local y avisa
// al AuthProvider mediante el evento "agroplaga:unauthorized".
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TOKEN_KEY = 'agroplaga.token';
export const UNAUTHORIZED_EVENT = 'agroplaga:unauthorized';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // almacenamiento no disponible (modo privado, etc.)
  }
}

export function clearToken() {
  setToken('');
}

export function apiUrl(path = '') {
  if (!path) return API_BASE;
  // URLs ya absolutas (http, https, data:, blob:) se devuelven tal cual.
  if (/^(https?:)?\/\/|^(data|blob):/i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Anade el token como ?token= para recursos cargados por <img> (stream, snapshot). */
export function withToken(url) {
  const token = getToken();
  if (!token) return url;
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
}

async function http(path, opts = {}) {
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    ...opts,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

    // Sesion invalida o expirada (no en el propio login): cerrar sesion local.
    if (res.status === 401 && !path.startsWith('/api/auth/login')) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { message: msg } }));
      }
    }

    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ------------------------------ helpers genericos ----------------------------- */

export const get = (path) => http(path);
export const post = (path, body) =>
  http(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
export const put = (path, body) =>
  http(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) });
export const del = (path) => http(path, { method: 'DELETE' });
/** Envia un FormData (imagenes); el navegador fija el Content-Type multipart. */
export const upload = (path, formData, method = 'POST') => http(path, { method, body: formData });

function cleanParams(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v == null || v === '') continue;
    out[k] = typeof v === 'boolean' ? (v ? '1' : '0') : String(v);
  }
  return out;
}

/* ================================== Sesion ================================== */

export const authApi = {
  login: (email, password) => post('/api/auth/login', { email, password }),
  me: () => get('/api/auth/me'),
  cambiarPassword: (actual, nueva) => put('/api/auth/password', { actual, nueva }),
};

export const usuariosApi = {
  list: () => get('/api/usuarios'),
  create: (data) => post('/api/usuarios', data),
  update: (id, data) => put(`/api/usuarios/${id}`, data),
  resetPassword: (id, nueva) => put(`/api/usuarios/${id}/password`, { nueva }),
  remove: (id) => del(`/api/usuarios/${id}`),
};

/* =============================== Sensores/alertas ============================= */

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
  // stream y snapshot los carga un <img>, que no envia cabeceras: token en la URL.
  streamUrl: (id, key = 0) => withToken(apiUrl(`/api/camaras/${id}/stream?k=${key}`)),
  snapshotUrl: (id, fresh = false) =>
    withToken(apiUrl(`/api/camaras/${id}/snapshot?${fresh ? 'fresh=1&' : ''}t=${Date.now()}`)),
  frameUrl: (id) => apiUrl(`/api/camaras/${id}/frame`),
};

export const deteccionesApi = {
  list: (filtros = {}) =>
    http(`/api/detecciones?${new URLSearchParams(cleanParams(filtros)).toString()}`),
  get: (id) => http(`/api/detecciones/${id}`),
  remove: (id) => http(`/api/detecciones/${id}`, { method: 'DELETE' }),
};
