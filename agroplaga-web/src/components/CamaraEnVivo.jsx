// src/components/CamaraEnVivo.jsx
// Video en vivo desde ESP32-CAM (relay MJPEG del backend), captura,
// analisis con IA (manual y automatico), historial de detecciones y
// gestion de camaras.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl, get, camarasApi, deteccionesApi } from "../lib/api";
import { useAuth } from "../context/auth";
import "../styles/camara.css";

const STORAGE_KEY = "agroplaga.camaraId";
const AUTO_OPCIONES = [
  { value: 0, label: "Apagado" },
  { value: 60, label: "Cada 1 min" },
  { value: 120, label: "Cada 2 min" },
  { value: 300, label: "Cada 5 min" },
  { value: 600, label: "Cada 10 min" },
  { value: 1800, label: "Cada 30 min" },
];
const ORIGEN_ICONO = { manual: "🖱️", auto: "⏱️", chat: "💬" };
const ORIGEN_LABEL = { manual: "Manual", auto: "Automático", chat: "Chat" };

function readStoredCamara() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

function storeCamara(id) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    // ignorar
  }
}

function haceSegundos(iso) {
  if (!iso) return null;
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `hace ${s}s`;
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  return `hace ${Math.round(s / 3600)} h`;
}

function fechaCorta(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

/* ------------------------------ subcomponentes ------------------------------ */

function SeveridadChip({ severidad }) {
  return (
    <span className={`camara__chip camara__chip--${severidad || "ninguna"}`}>
      {severidad || "ninguna"}
    </span>
  );
}

function ResultadoCard({ deteccion, onCerrar }) {
  if (!deteccion) return null;
  const conf = deteccion.confianza != null ? Math.round(deteccion.confianza) : null;
  return (
    <div className="camara__resultado">
      <div className="camara__resultadoHead">
        <strong>🧠 Resultado del análisis</strong>
        {onCerrar && (
          <button type="button" className="camara__linkBtn" onClick={onCerrar}>
            Cerrar
          </button>
        )}
      </div>
      <div className="camara__resultadoPlaga">
        {deteccion.plaga ? deteccion.plaga : "Sin plaga evidente"}
        <SeveridadChip severidad={deteccion.severidad} />
        {deteccion.requiere_accion && (
          <span className="camara__chip camara__chip--accion">⚠️ Requiere acción</span>
        )}
      </div>
      {conf != null && (
        <div className="camara__confianza" title={`Confianza ${conf}%`}>
          <div className="camara__confianzaBar" style={{ width: `${conf}%` }} />
          <span>{conf}% de confianza</span>
        </div>
      )}
      {deteccion.resumen && <p className="camara__resumen">{deteccion.resumen}</p>}
      {deteccion.recomendaciones?.length > 0 && (
        <ul className="camara__recomendaciones">
          {deteccion.recomendaciones.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      <div className="camara__resultadoMeta">
        {ORIGEN_ICONO[deteccion.origen] || ""} {ORIGEN_LABEL[deteccion.origen] || deteccion.origen} ·{" "}
        {fechaCorta(deteccion.created_at)}
      </div>
    </div>
  );
}

function CamaraForm({ inicial, parcelas, plots, onGuardar, onEliminar, onCancelar, busy }) {
  const [form, setForm] = useState(() => ({
    nombre: inicial?.nombre || "",
    modo: inicial?.modo || "pull",
    base_url: inicial?.base_url || "",
    stream_url: inicial?.stream_url || "",
    parcela_id: inicial?.parcela_id ?? "",
    plot_id: inicial?.plot_id ?? "",
    activa: inicial ? !!inicial.activa : true,
    intervalo_analisis_seg: inicial?.intervalo_analisis_seg ?? 0,
  }));
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (form.modo === "pull" && !form.base_url.trim() && !form.stream_url.trim()) {
      return setError("Indica la URL base del ESP32-CAM (por ejemplo http://192.168.1.50).");
    }
    try {
      const payload = {
        nombre: form.nombre.trim(),
        modo: form.modo,
        base_url: form.base_url.trim() || null,
        stream_url: form.stream_url.trim() || null,
        parcela_id: form.parcela_id === "" ? null : Number(form.parcela_id),
        plot_id: form.plot_id === "" ? null : Number(form.plot_id),
        activa: form.activa,
        intervalo_analisis_seg: Number(form.intervalo_analisis_seg) || 0,
      };
      const saved = await onGuardar(payload);
      if (saved?.token) setToken(saved.token);
    } catch (err) {
      setError(err?.message || "No se pudo guardar la cámara");
    }
  }

  async function generarToken() {
    if (!inicial?.id) return;
    try {
      const r = await camarasApi.nuevoToken(inicial.id);
      setToken(r.token);
    } catch (err) {
      setError(err?.message || "No se pudo generar el token");
    }
  }

  return (
    <form className="camara__form" onSubmit={submit}>
      <h3>{inicial ? "✏️ Editar cámara" : "➕ Nueva cámara"}</h3>
      <label>
        Nombre
        <input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="ESP32-CAM Lote norte" />
      </label>

      <div className="camara__formRow">
        <label className="camara__radio">
          <input type="radio" name="modo" checked={form.modo === "pull"} onChange={() => set("modo", "pull")} />
          <span>
            <strong>Pull</strong> · el servidor se conecta a la cámara (firmware con /stream)
          </span>
        </label>
        <label className="camara__radio">
          <input type="radio" name="modo" checked={form.modo === "push"} onChange={() => set("modo", "push")} />
          <span>
            <strong>Push</strong> · la cámara envía fotos al servidor
          </span>
        </label>
      </div>

      {form.modo === "pull" && (
        <>
          <label>
            URL base del ESP32-CAM
            <input value={form.base_url} onChange={(e) => set("base_url", e.target.value)} placeholder="http://192.168.1.50" />
          </label>
          <label>
            URL de stream (opcional, si no es :81/stream)
            <input value={form.stream_url} onChange={(e) => set("stream_url", e.target.value)} placeholder="http://192.168.1.50:81/stream" />
          </label>
        </>
      )}

      {form.modo === "push" && inicial?.id && (
        <div className="camara__pushInfo">
          <div>
            La cámara debe enviar JPEG por <code>POST</code> a:
            <code className="camara__code">{camarasApi.frameUrl(inicial.id)}</code>
          </div>
          <div className="camara__pushToken">
            <button type="button" className="camara__btn camara__btn--ghost" onClick={generarToken}>
              🔑 Generar token
            </button>
            {token && (
              <span>
                Token (cópialo ahora, no se vuelve a mostrar): <code className="camara__code">{token}</code>
              </span>
            )}
            {!token && inicial?.token_configurado && <span>Token configurado.</span>}
          </div>
        </div>
      )}

      <div className="camara__formRow">
        <label>
          Parcela
          <select value={form.parcela_id} onChange={(e) => set("parcela_id", e.target.value)}>
            <option value="">— Ninguna —</option>
            {parcelas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Parcela de sensores (contexto IA)
          <select value={form.plot_id} onChange={(e) => set("plot_id", e.target.value)}>
            <option value="">— Ninguna —</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || `Parcela ${p.id}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="camara__formRow">
        <label>
          Análisis automático
          <select value={form.intervalo_analisis_seg} onChange={(e) => set("intervalo_analisis_seg", Number(e.target.value))}>
            {AUTO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="camara__check">
          <input type="checkbox" checked={form.activa} onChange={(e) => set("activa", e.target.checked)} />
          Cámara activa
        </label>
      </div>

      {error && <div className="camara__error">{error}</div>}

      <div className="camara__formActions">
        <button type="submit" className="camara__btn" disabled={busy}>
          💾 Guardar
        </button>
        <button type="button" className="camara__btn camara__btn--ghost" onClick={onCancelar} disabled={busy}>
          Cancelar
        </button>
        {inicial?.id && (
          <button type="button" className="camara__btn camara__btn--danger" onClick={onEliminar} disabled={busy}>
            🗑️ Eliminar
          </button>
        )}
      </div>
    </form>
  );
}

/* --------------------------------- pagina --------------------------------- */

export default function CamaraEnVivo() {
  const { esAdmin } = useAuth();
  const [camaras, setCamaras] = useState([]);
  const [camaraId, setCamaraId] = useState(() => readStoredCamara());
  const [estado, setEstado] = useState(null);
  const [streamKey, setStreamKey] = useState(0);
  const [streamActivo, setStreamActivo] = useState(true);
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [nota, setNota] = useState("");
  const [detecciones, setDetecciones] = useState([]);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [parcelas, setParcelas] = useState([]);
  const [plots, setPlots] = useState([]);
  const [busy, setBusy] = useState(false);
  const [cargando, setCargando] = useState(true);
  const imgRef = useRef(null);
  const reconnectTimer = useRef(null);

  const camara = useMemo(
    () => camaras.find((c) => Number(c.id) === Number(camaraId)) || null,
    [camaras, camaraId]
  );

  const cargarCamaras = useCallback(async () => {
    try {
      const lista = await camarasApi.list();
      setCamaras(lista);
      setCamaraId((actual) => {
        if (actual && lista.some((c) => Number(c.id) === Number(actual))) return actual;
        const primera = lista.find((c) => c.activa) || lista[0];
        return primera ? primera.id : null;
      });
      setError("");
    } catch (e) {
      setError(e?.message || "No se pudieron cargar las cámaras");
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarDetecciones = useCallback(async (id) => {
    if (!id) return setDetecciones([]);
    try {
      setDetecciones(await deteccionesApi.list({ camaraId: id, limit: 12 }));
    } catch {
      // silencioso: la lista es secundaria
    }
  }, []);

  // Carga inicial: camaras, parcelas y plots
  useEffect(() => {
    cargarCamaras();
    get("/api/parcelas")
      .then((d) => setParcelas(Array.isArray(d) ? d : []))
      .catch(() => {});
    get("/api/plots")
      .then((d) => setPlots(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [cargarCamaras]);

  // Cambio de camara seleccionada
  useEffect(() => {
    if (camaraId) storeCamara(camaraId);
    setResultado(null);
    setSnapshotUrl(null);
    setEstado(null);
    setStreamKey((k) => k + 1);
    cargarDetecciones(camaraId);
  }, [camaraId, cargarDetecciones]);

  // Estado cada 5 s (patron de Dashboard.jsx)
  useEffect(() => {
    if (!camaraId) return undefined;
    let vivo = true;
    const tick = async () => {
      try {
        const e = await camarasApi.estado(camaraId);
        if (vivo) setEstado(e);
      } catch {
        if (vivo) setEstado((prev) => (prev ? { ...prev, online: false } : prev));
      }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [camaraId]);

  // Detecciones cada 10 s
  useEffect(() => {
    if (!camaraId) return undefined;
    const t = setInterval(() => cargarDetecciones(camaraId), 10000);
    return () => clearInterval(t);
  }, [camaraId, cargarDetecciones]);

  // Cerrar el socket MJPEG al desmontar (StrictMode y navegacion).
  // Se lee imgRef en el cleanup a proposito: queremos el <img> que exista en
  // el momento de desmontar (cambia con cada streamKey), no el del montaje.
  useEffect(() => {
    const timerRef = reconnectTimer;
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const img = imgRef.current;
      if (img) img.src = "";
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function reconectar() {
    if (imgRef.current) imgRef.current.src = "";
    setStreamKey((k) => k + 1);
  }

  function onStreamError() {
    if (!streamActivo || reconnectTimer.current) return;
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      setStreamKey((k) => k + 1);
    }, 3000);
  }

  async function capturar() {
    if (!camaraId) return;
    setError("");
    setSnapshotUrl(camarasApi.snapshotUrl(camaraId, true));
  }

  async function analizar() {
    if (!camaraId || analizando) return;
    setError("");
    setAviso("");
    setAnalizando(true);
    try {
      const d = await camarasApi.analizar(camaraId, nota);
      setResultado(d);
      setSnapshotUrl(d.imagen ? apiUrl(d.imagen) : snapshotUrl);
      setNota("");
      cargarDetecciones(camaraId);
    } catch (e) {
      setError(e?.message || "No se pudo analizar la imagen");
    } finally {
      setAnalizando(false);
    }
  }

  async function cambiarAuto(intervalo) {
    if (!camaraId) return;
    setError("");
    try {
      await camarasApi.setAuto(camaraId, intervalo);
      setCamaras((lista) =>
        lista.map((c) => (Number(c.id) === Number(camaraId) ? { ...c, intervalo_analisis_seg: intervalo } : c))
      );
      setAviso(intervalo ? `Análisis automático cada ${intervalo}s activado.` : "Análisis automático apagado.");
    } catch (e) {
      setError(e?.message || "No se pudo cambiar el análisis automático");
    }
  }

  async function guardarCamara(payload) {
    setBusy(true);
    try {
      let saved;
      if (editando?.id) {
        saved = await camarasApi.update(editando.id, payload);
      } else {
        saved = await camarasApi.create(payload);
      }
      await cargarCamaras();
      if (saved?.id) setCamaraId(saved.id);
      if (!saved?.token) {
        setMostrarForm(false);
        setEditando(null);
      } else {
        setEditando(saved);
      }
      setAviso(editando?.id ? "Cámara actualizada." : "Cámara creada.");
      return saved;
    } finally {
      setBusy(false);
    }
  }

  async function eliminarCamara() {
    if (!editando?.id) return;
    if (!window.confirm(`¿Eliminar la cámara "${editando.nombre}" y todas sus detecciones?`)) return;
    setBusy(true);
    try {
      await camarasApi.remove(editando.id);
      setMostrarForm(false);
      setEditando(null);
      setCamaraId(null);
      await cargarCamaras();
      setAviso("Cámara eliminada.");
    } catch (e) {
      setError(e?.message || "No se pudo eliminar la cámara");
    } finally {
      setBusy(false);
    }
  }

  async function eliminarDeteccion(id) {
    if (!window.confirm("¿Eliminar esta detección?")) return;
    try {
      await deteccionesApi.remove(id);
      setDetecciones((lista) => lista.filter((d) => d.id !== id));
      if (resultado?.id === id) setResultado(null);
    } catch (e) {
      setError(e?.message || "No se pudo eliminar la detección");
    }
  }

  const online = !!estado?.online;
  const autoActual = camara?.intervalo_analisis_seg ?? 0;
  const proximo = estado?.analisis_automatico?.proximo_en_seg;

  return (
    <div className="camara">
      <header className="camara__header">
        <div className="camara__titulo">
          <h2>📹 Cámara en vivo</h2>
          <span className="camara__subtitulo">Video del ESP32-CAM y detección de plagas con IA</span>
        </div>
        <div className="camara__controles">
          <select
            className="camara__select"
            value={camaraId || ""}
            onChange={(e) => setCamaraId(Number(e.target.value) || null)}
            disabled={!camaras.length}
          >
            {!camaras.length && <option value="">Sin cámaras registradas</option>}
            {camaras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.activa ? "" : "(inactiva)"} · {c.modo}
              </option>
            ))}
          </select>
          {camara && (
            <span className={`camara__badge ${online ? "camara__badge--online" : "camara__badge--offline"}`}>
              {online ? "● Captura en vivo" : "○ Sin señal"}
              {online && estado?.fps ? ` · ${estado.fps} fps` : ""}
              {estado?.ultimo_frame_at ? ` · ${haceSegundos(estado.ultimo_frame_at)}` : ""}
            </span>
          )}
          {esAdmin && (
            <>
              <button
                type="button"
                className="camara__btn camara__btn--ghost"
                onClick={() => {
                  setEditando(camara);
                  setMostrarForm(true);
                }}
                disabled={!camara}
              >
                ⚙️ Configurar
              </button>
              <button
                type="button"
                className="camara__btn"
                onClick={() => {
                  setEditando(null);
                  setMostrarForm(true);
                }}
              >
                ➕ Nueva
              </button>
            </>
          )}
        </div>
      </header>

      {error && <div className="camara__error">Error: {error}</div>}
      {aviso && !error && <div className="camara__aviso">{aviso}</div>}

      {mostrarForm && esAdmin && (
        <CamaraForm
          key={editando?.id || "nueva"}
          inicial={editando}
          parcelas={parcelas}
          plots={plots}
          busy={busy}
          onGuardar={guardarCamara}
          onEliminar={eliminarCamara}
          onCancelar={() => {
            setMostrarForm(false);
            setEditando(null);
          }}
        />
      )}

      {!cargando && !camaras.length && !mostrarForm && (
        <div className="camara__vacio">
          <p>Todavía no hay cámaras registradas.</p>
          {esAdmin ? (
            <p>
              Pulsa <strong>➕ Nueva</strong> y apunta a tu ESP32-CAM (por ejemplo <code>http://192.168.1.50</code>).
            </p>
          ) : (
            <p>Pide a un administrador que registre una cámara.</p>
          )}
        </div>
      )}

      {camara && (
        <section className="camara__main">
          <div className="camara__video">
            <div className="camara__videoWrap">
              {streamActivo && camara.activa ? (
                <img
                  key={streamKey}
                  ref={imgRef}
                  className="camara__stream"
                  src={camarasApi.streamUrl(camara.id, streamKey)}
                  alt={`Video en vivo de ${camara.nombre}`}
                  onError={onStreamError}
                />
              ) : (
                <div className="camara__pausa">{camara.activa ? "⏸ Stream en pausa" : "Cámara inactiva"}</div>
              )}
              {!online && streamActivo && camara.activa && (
                <div className="camara__overlay">
                  <span>Esperando señal de la cámara…</span>
                  {estado?.upstream?.lastError && <small>{estado.upstream.lastError}</small>}
                  {camara.modo === "push" && <small>Modo push: la cámara debe enviar fotos al servidor.</small>}
                </div>
              )}
            </div>

            <div className="camara__toolbar">
              <button type="button" className="camara__btn camara__btn--ghost" onClick={() => setStreamActivo((v) => !v)}>
                {streamActivo ? "⏸ Pausar" : "▶️ Reanudar"}
              </button>
              <button type="button" className="camara__btn camara__btn--ghost" onClick={reconectar}>
                🔄 Reconectar
              </button>
              <button type="button" className="camara__btn camara__btn--ghost" onClick={capturar}>
                📸 Capturar
              </button>
              <input
                className="camara__nota"
                placeholder="Nota para la IA (opcional): hojas con manchas…"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                maxLength={500}
              />
              <button type="button" className="camara__btn camara__btn--primary" onClick={analizar} disabled={analizando}>
                {analizando ? "🧠 Analizando…" : "🧠 Analizar con IA"}
              </button>
            </div>

            <div className="camara__auto">
              <label>
                ⏱️ Análisis automático
                <select
                  value={autoActual}
                  onChange={(e) => cambiarAuto(Number(e.target.value))}
                  disabled={!esAdmin}
                  title={esAdmin ? "" : "Solo un administrador puede cambiarlo"}
                >
                  {AUTO_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              {autoActual > 0 && (
                <span className="camara__autoInfo">
                  {estado?.analisis_automatico?.en_curso
                    ? "Analizando ahora…"
                    : proximo != null
                    ? `Próximo análisis en ${proximo}s`
                    : "Programado"}
                  {estado?.analisis_automatico?.fallos ? ` · ${estado.analisis_automatico.fallos} fallos` : ""}
                </span>
              )}
              <span className="camara__autoInfo">
                Captura en vivo
                {camara.parcela_nombre ? ` · ${camara.parcela_nombre}` : ""}
              </span>
            </div>
          </div>

          <aside className="camara__panel">
            {snapshotUrl && (
              <div className="camara__snapshotBox">
                <strong>📸 Última captura</strong>
                <img className="camara__snapshot" src={snapshotUrl} alt="Captura" />
              </div>
            )}
            {resultado ? (
              <ResultadoCard deteccion={resultado} onCerrar={() => setResultado(null)} />
            ) : (
              <div className="camara__hint">
                Pulsa <strong>Analizar con IA</strong> para diagnosticar el frame actual. El resultado se guarda en el
                historial y en el <Link to="/">Dashboard</Link>.
              </div>
            )}
          </aside>
        </section>
      )}

      {camara && (
        <section className="camara__detecciones">
          <h3>🗂️ Detecciones recientes · {camara.nombre}</h3>
          {!detecciones.length ? (
            <p className="camara__vacioLista">Sin detecciones todavía.</p>
          ) : (
            <div className="camara__grid">
              {detecciones.map((d) => (
                <article
                  key={d.id}
                  className={`camara__card ${d.requiere_accion ? "camara__card--accion" : ""}`}
                  onClick={() => {
                    setResultado(d);
                    setSnapshotUrl(d.imagen ? apiUrl(d.imagen) : null);
                  }}
                >
                  {d.imagen && <img src={apiUrl(d.imagen)} alt={d.plaga || "Sin plaga"} loading="lazy" />}
                  <div className="camara__cardBody">
                    <div className="camara__cardTitle">
                      {d.plaga || "Sin plaga"}
                      <SeveridadChip severidad={d.severidad} />
                    </div>
                    <div className="camara__cardMeta">
                      {ORIGEN_ICONO[d.origen] || ""} {d.confianza != null ? `${Math.round(d.confianza)}%` : "—"} ·{" "}
                      {fechaCorta(d.created_at)}
                    </div>
                  </div>
                  {esAdmin && (
                    <button
                      type="button"
                      className="camara__cardDelete"
                      title="Eliminar detección"
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarDeteccion(d.id);
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
