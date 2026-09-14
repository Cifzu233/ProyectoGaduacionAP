import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import AlertaPlagas from "./AlertaPlagas";
import Icono from "./Icono";
import { get, apiUrl, deteccionesApi } from "../lib/api";
import "../styles/Dashboard.css";

// Sensores del nodo de campo: ESP32-CAM + DHT22 (temperatura y humedad).
// `eje` es la escala del anillo; el umbral real llega de la base de datos.
const LABELS = {
  temp: { label: "Temperatura", unit: "°C", icono: "temperatura", eje: [0, 50] },
  hum: { label: "Humedad", unit: "%", icono: "humedad", eje: [0, 100] },
};
const SENSOR_KEYS = Object.keys(LABELS);

const SEVERIDAD_CHIP = {
  alta: "ap-chip--alerta",
  media: "ap-chip--aviso",
  baja: "ap-chip--neutro",
  ninguna: "ap-chip--ok",
};

/* ------------------------------ subcomponentes ----------------------------- */

// Anillo de medicion: pista gris, banda del umbral en verde claro y el arco
// del valor. Verde si esta dentro del umbral, ambar si se sale.
function Anillo({ valor, unidad, eje, umbralMin, umbralMax }) {
  const R = 46;
  const C = 2 * Math.PI * R;
  const [ejeMin, ejeMax] = eje;
  const rango = ejeMax - ejeMin || 1;
  const frac = (v) => Math.max(0, Math.min(1, (v - ejeMin) / rango));

  const hayDato = Number.isFinite(valor);
  const f = hayDato ? frac(valor) : 0;
  const hayUmbral = Number.isFinite(umbralMin) && Number.isFinite(umbralMax);
  const f1 = hayUmbral ? frac(umbralMin) : 0;
  const f2 = hayUmbral ? frac(umbralMax) : 0;

  const dentro = !hayUmbral || (valor >= umbralMin && valor <= umbralMax);
  const color = !hayDato ? "#cdd8d1" : dentro ? "var(--ap-verde-600)" : "var(--ap-ambar)";

  return (
    <div className="anillo">
      <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
        <circle cx="56" cy="56" r={R} fill="none" stroke="#e8f1ea" strokeWidth="10" />
        {hayUmbral && f2 > f1 && (
          <circle
            cx="56"
            cy="56"
            r={R}
            fill="none"
            stroke="var(--ap-verde-100)"
            strokeWidth="10"
            strokeDasharray={`${C * (f2 - f1)} ${C}`}
            strokeDashoffset={-C * f1}
            transform="rotate(-90 56 56)"
          />
        )}
        {hayDato && (
          <circle
            className="anillo__arco"
            cx="56"
            cy="56"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${C * f} ${C}`}
            transform="rotate(-90 56 56)"
          />
        )}
      </svg>
      <div className="anillo__centro">
        <span className="anillo__valor">{hayDato ? formatoNumero(valor) : "—"}</span>
        {hayDato && <span className="anillo__unidad">{unidad}</span>}
      </div>
    </div>
  );
}

function Medidor({ clave, metrica, hora }) {
  const meta = LABELS[clave];
  const valor = metrica?.v;
  const unidad = metrica?.unit || meta.unit;
  const umbralMin = metrica?.min;
  const umbralMax = metrica?.max;
  const hayDato = Number.isFinite(valor);
  const hayUmbral = Number.isFinite(umbralMin) && Number.isFinite(umbralMax);
  const dentro = hayDato && (!hayUmbral || (valor >= umbralMin && valor <= umbralMax));

  let chip = { clase: "ap-chip--neutro", texto: "Sin datos" };
  if (hayDato && !hayUmbral) chip = { clase: "ap-chip--ok", texto: "Sin umbral definido" };
  else if (hayDato && dentro) chip = { clase: "ap-chip--ok", texto: "Dentro del umbral" };
  else if (hayDato) {
    chip = {
      clase: "ap-chip--aviso",
      texto: valor > umbralMax ? "Por encima del umbral" : "Por debajo del umbral",
    };
  }

  return (
    <article className="ap-tarjeta medidor">
      <div className="ap-tarjeta__cabecera">
        <span className="ap-tarjeta__etiqueta">{meta.label}</span>
        <Icono nombre={meta.icono} size={20} className="medidor__icono" />
      </div>
      <div className="medidor__cuerpo">
        <Anillo
          valor={hayDato ? valor : null}
          unidad={unidad}
          eje={meta.eje}
          umbralMin={umbralMin}
          umbralMax={umbralMax}
        />
        <div className="medidor__detalle">
          <span className={`ap-chip ${chip.clase}`}>{chip.texto}</span>
          <span className="medidor__linea">
            {hayUmbral
              ? `Umbral ${formatoNumero(umbralMin)} – ${formatoNumero(umbralMax)} ${unidad}`
              : "Configura el umbral en la parcela"}
          </span>
          <span className="medidor__linea medidor__linea--tenue">
            {hora ? `Lectura ${hora}` : "Sin lecturas registradas"}
          </span>
        </div>
      </div>
    </article>
  );
}

function FichaDeteccion({ deteccion }) {
  const d = deteccion;
  return (
    <div className="destacada">
      {d.imagen ? (
        <img className="destacada__foto" src={apiUrl(d.imagen)} alt={d.plaga || "Sin plaga"} />
      ) : (
        <div className="destacada__foto destacada__foto--vacia">
          <Icono nombre="camara" size={28} />
        </div>
      )}
      <div className="destacada__info">
        <div className="destacada__titulo">
          {d.plaga || "Sin plaga evidente"}
          <span className={`ap-chip ${SEVERIDAD_CHIP[d.severidad] || "ap-chip--neutro"}`}>
            {d.severidad}
          </span>
        </div>
        {d.resumen && <p className="destacada__resumen">{d.resumen}</p>}
        <p className="destacada__meta">
          {d.camara_nombre ? `${d.camara_nombre} · ` : ""}
          {d.confianza != null ? `${Math.round(d.confianza)} % de confianza · ` : ""}
          {fechaLarga(d.created_at)}
        </p>
      </div>
    </div>
  );
}

/* --------------------------------- panel ---------------------------------- */

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
        const data = await get("/api/plots");
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
      const data = await get(`/api/plots/${id}/last`);

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
          min: m.min_value,
          max: m.max_value,
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

  // El nodo se considera en linea si hay lectura en los ultimos 10 minutos.
  const enLinea = lastUpdate ? Date.now() - lastUpdate.getTime() < 10 * 60 * 1000 : false;
  const currentPlotId = plotIdProp ?? plotId;
  const destacada = deteccionesCamara[0] || null;

  return (
    <div className="panel ap-entra">
      {/* ------------------------------ cabecera ------------------------------ */}
      <header className="panel__cabecera">
        <div className="panel__identidad">
          <span className="panel__fecha">{fechaDeHoy()}</span>
          <h1 className="panel__titulo">{plotName}</h1>
        </div>

        <div className="panel__acciones">
          <span className="panel__estado" title={lastUpdate ? lastUpdate.toLocaleString() : ""}>
            <span className={`ap-punto ${enLinea ? "ap-punto--vivo" : "ap-punto--frio"}`} />
            {enLinea ? "Nodo ESP32 transmitiendo" : "Sin lecturas recientes"}
            {lastUpdate && <em className="panel__hace">· {haceRato(lastUpdate)}</em>}
          </span>

          {plotIdProp == null && (
            <select
              value={currentPlotId || ""}
              onChange={(e) => setPlotId(Number(e.target.value))}
              className="panel__selector"
              aria-label="Parcela"
            >
              {plots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || `Parcela ${p.id}`}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => currentPlotId && loadData(currentPlotId)}
            className="ap-btn ap-btn--suave"
            disabled={!currentPlotId || loading}
          >
            <Icono nombre="refrescar" size={16} />
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </header>

      {error && (
        <div className="panel__error">
          <Icono nombre="aviso" size={18} />
          {error}
        </div>
      )}

      {/* ------------------------------ medidores ----------------------------- */}
      <section className="panel__medidores">
        {SENSOR_KEYS.map((k) => (
          <Medidor
            key={k}
            clave={k}
            metrica={metrics[k]}
            hora={metrics[k]?.t ? fechaLarga(metrics[k].t) : null}
          />
        ))}

        <AlertaPlagas
          temperatura={temperatura}
          humedad={humedad}
          deteccionesCamara={deteccionesCamara}
        />
      </section>

      {/* ------------------------- camara y detecciones ----------------------- */}
      <section className="panel__inferior">
        <article className="ap-tarjeta">
          <div className="ap-tarjeta__cabecera">
            <h2 className="ap-tarjeta__titulo">
              <Icono nombre="camara" size={18} />
              Última detección de cámara
            </h2>
            <Link to="/camara" className="panel__enlace">
              Ver cámara en vivo
              <Icono nombre="flecha" size={16} />
            </Link>
          </div>

          {destacada ? (
            <FichaDeteccion deteccion={destacada} />
          ) : (
            <p className="panel__vacio">Sin detecciones de cámara para esta parcela.</p>
          )}
        </article>

        <article className="ap-tarjeta">
          <div className="ap-tarjeta__cabecera">
            <h2 className="ap-tarjeta__titulo">
              <Icono nombre="bitacora" size={18} />
              Historial reciente
            </h2>
          </div>

          {deteccionesCamara.length === 0 ? (
            <p className="panel__vacio">Todavía no hay análisis registrados.</p>
          ) : (
            <ol className="linea">
              {deteccionesCamara.map((d) => (
                <li key={d.id} className={`linea__item linea__item--${d.severidad}`}>
                  <span className="linea__punto" />
                  <div className="linea__texto">
                    <span className="linea__titulo">
                      {d.plaga || "Sin plaga"}
                      <span className={`ap-chip ${SEVERIDAD_CHIP[d.severidad] || "ap-chip--neutro"}`}>
                        {d.severidad}
                      </span>
                    </span>
                    {d.resumen && <span className="linea__resumen">{d.resumen}</span>}
                    <span className="linea__meta">
                      {fechaLarga(d.created_at)}
                      {d.origen ? ` · ${ORIGEN[d.origen] || d.origen}` : ""}
                      {d.confianza != null ? ` · ${Math.round(d.confianza)} %` : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </article>
      </section>
    </div>
  );
}

/* --------------------------------- utiles --------------------------------- */

const ORIGEN = { manual: "manual", auto: "automático", chat: "chat" };

function formatoNumero(v) {
  if (!Number.isFinite(v)) return "—";
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function fechaDeHoy() {
  const f = new Date().toLocaleDateString("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return f.charAt(0).toUpperCase() + f.slice(1);
}

function fechaLarga(valor) {
  if (!valor) return "";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? String(valor) : d.toLocaleString();
}

function haceRato(fecha) {
  const s = Math.max(0, Math.round((Date.now() - fecha.getTime()) / 1000));
  if (s < 60) return `hace ${s} s`;
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return `hace ${Math.round(s / 86400)} d`;
}

export default Dashboard;
