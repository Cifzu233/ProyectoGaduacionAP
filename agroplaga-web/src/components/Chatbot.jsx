// src/components/Chatbot.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/chat.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Chatbot({ initialPlotId = 4 }) {
  const [plotId, setPlotId] = useState(initialPlotId);
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [msgs, setMsgs] = useState([
    {
      role: "assistant",
      text:
        "### Acciones Hoy\n" +
        "1. **Riego inmediato**: Ajusta humedad del suelo según umbrales.\n" +
        "2. **Sombra temporal** si hay radiación alta.\n" +
        "3. **Monitoreo de plagas**: revisa hojas y tallos.\n\n" +
        "### Observaciones en 24–48h\n" +
        "- Revisa síntomas visibles y evolución.\n" +
        "- Ajusta riego/ventilación si es necesario.\n" +
        "- Si empeora, deriva a un técnico.",
      ts: Date.now(),
    },
  ]);

  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  const canSend = useMemo(
    () => !!message.trim() || !!imageUrl.trim(),
    [message, imageUrl]
  );

  async function send() {
    if (!canSend || busy) return;
    setError("");
    setBusy(true);

    const userMsg = message.trim();
    const img = imageUrl.trim();
    if (userMsg) {
      setMsgs((m) => [...m, { role: "user", text: userMsg, ts: Date.now() }]);
    }
    if (img) {
      setMsgs((m) => [
        ...m,
        {
          role: "user",
          text: `(Imagen para diagnóstico) ${img}`,
          ts: Date.now(),
        },
      ]);
    }

    try {
      let answer = "";
      if (img) {
        const r = await fetch(`${API}/api/ai/vision-diagnose`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plotId: Number(plotId),
            imageUrl: img,
            note: userMsg || "Diagnóstico de imagen",
          }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Error de visión");
        answer = j.diagnosis || "(sin respuesta)";
      } else {
        const r = await fetch(`${API}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plotId: Number(plotId),
            message: userMsg,
          }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Error de chat");
        answer = j.answer || "(sin respuesta)";
      }

      setMsgs((m) => [...m, { role: "assistant", text: answer, ts: Date.now() }]);
      setMessage("");
      setImageUrl("");
    } catch (e) {
      setError(e?.message || "Fallo al contactar la API");
    } finally {
      setBusy(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="chat">
      <header className="chat__header">
        <div className="chat__title">
          <strong>Agroplaga AI — Chat</strong>
          <span className="chat__subtitle">
            Especializado en melocotón/durazno
          </span>
        </div>
        <div className="chat__plot">
          <label htmlFor="plotId">Parcela:</label>
          <input
            id="plotId"
            type="number"
            className="chat__inputMini"
            value={plotId}
            min={1}
            onChange={(e) => setPlotId(e.target.value)}
          />
        </div>
      </header>

      <section className="chat__history" aria-live="polite">
        {msgs.map((m, idx) => (
          <article key={idx} className={`chat__bubble chat__bubble--${m.role}`}>
            <div className="chat__meta">
              {m.role === "assistant" ? "Agroplaga AI" : "Tú"} ·{" "}
              {new Date(m.ts).toLocaleTimeString()}
            </div>
            <div className="chat__text">
              {m.text.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </article>
        ))}
        {busy && <div className="chat__typing">pensando…</div>}
        <div ref={endRef} />
      </section>

      <footer className="chat__composer">
        <textarea
          className="chat__input"
          placeholder="Escribe tu pregunta (manejo, plagas, podas, umbrales...)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKey}
          rows={2}
        />
        <button
          className="chat__btn"
          onClick={send}
          disabled={!canSend || busy}
        >
          {busy ? "Enviando…" : "Enviar"}
        </button>
      </footer>

      <div className="chat__vision">
        <input
          className="chat__input"
          placeholder="URL de imagen para diagnóstico (opcional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <button
          className="chat__btn chat__btn--ghost"
          onClick={send}
          disabled={!imageUrl.trim() || busy}
          title="Enviar imagen a diagnóstico"
        >
          📷
        </button>
      </div>

      {error && <div className="chat__error">Error: {error}</div>}
    </div>
  );
}
