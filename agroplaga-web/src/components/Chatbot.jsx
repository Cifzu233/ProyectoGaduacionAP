// src/components/Chatbot.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiImage, FiSend, FiX } from "react-icons/fi";
import { post } from "../lib/api";
import "../styles/chat.css";

const IMAGE_URL_PATTERN =
  /(https?:\/\/\S+\.(?:png|jpe?g|webp|gif)(?:\?\S*)?)/i;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function renderLine(line, index) {
  const normalized = line.replace(/\*\*(.*?)\*\*/g, "$1");
  if (normalized.startsWith("### ")) {
    return <h3 key={index}>{normalized.slice(4)}</h3>;
  }
  if (!normalized.trim()) {
    return <br key={index} />;
  }
  return <p key={index}>{normalized}</p>;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Chatbot({ initialPlotId = 4 }) {
  const [plotId, setPlotId] = useState(initialPlotId);
  const [message, setMessage] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [msgs, setMsgs] = useState([
    {
      role: "assistant",
      text:
        "### Acciones hoy\n" +
        "1. Riego inmediato: ajusta la humedad del suelo segun los umbrales.\n" +
        "2. Sombra temporal si hay radiacion alta.\n" +
        "3. Monitoreo de plagas: revisa hojas y tallos.\n\n" +
        "### Observaciones en 24-48h\n" +
        "- Revisa sintomas visibles y evolucion.\n" +
        "- Ajusta riego o ventilacion si es necesario.\n" +
        "- Si empeora, deriva a un tecnico.",
      ts: Date.now(),
    },
  ]);

  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  const pastedImageUrl = useMemo(() => {
    const match = message.match(IMAGE_URL_PATTERN);
    return match?.[1] || "";
  }, [message]);

  const canSend = useMemo(
    () => !!message.trim() || !!attachedImage || !!pastedImageUrl,
    [message, attachedImage, pastedImageUrl]
  );

  async function send() {
    if (!canSend || busy) return;
    setError("");
    setBusy(true);

    const snapshotMessage = message.trim();
    const snapshotAttachment = attachedImage;
    const snapshotImageUrl = snapshotAttachment?.previewUrl || pastedImageUrl;
    const cleanMessage = pastedImageUrl
      ? snapshotMessage.replace(pastedImageUrl, "").trim()
      : snapshotMessage;
    const promptText =
      cleanMessage || (snapshotImageUrl ? "Diagnostico de imagen" : "");

    setMessage("");
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setMsgs((current) => [
      ...current,
      {
        role: "user",
        text: promptText,
        imageUrl: snapshotImageUrl,
        ts: Date.now(),
      },
    ]);

    try {
      let answer = "";
      if (snapshotAttachment || pastedImageUrl) {
        const imagePayload = snapshotAttachment
          ? await readFileAsDataUrl(snapshotAttachment.file)
          : pastedImageUrl;
        // post() adjunta el token de sesion y lanza Error(mensaje) si el backend falla
        const data = await post("/api/ai/vision-diagnose", {
          plotId: Number(plotId),
          imageUrl: imagePayload,
          note: promptText,
        });
        answer = data.diagnosis || "(sin respuesta)";
      } else {
        const data = await post("/api/ai/chat", {
          plotId: Number(plotId),
          message: promptText,
        });
        answer = data.answer || "(sin respuesta)";
      }

      setMsgs((current) => [
        ...current,
        { role: "assistant", text: answer, ts: Date.now() },
      ]);
    } catch (err) {
      setError(err?.message || "Fallo al contactar la API");
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

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecciona una imagen valida.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("La imagen debe pesar menos de 5 MB.");
      return;
    }

    setError("");
    setAttachedImage((current) => {
      if (current?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return {
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      };
    });
  }

  function removeAttachment() {
    setAttachedImage((current) => {
      if (current?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="chat">
      <header className="chat__header">
        <div className="chat__title">
          <strong>Agroplaga AI</strong>
          <span className="chat__subtitle">
            Asistente agricola para melocoton y durazno
          </span>
        </div>
        <div className="chat__plot">
          <label htmlFor="plotId">Parcela</label>
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
        {msgs.map((msg, index) => (
          <article
            key={`${msg.ts}-${index}`}
            className={`chat__bubble chat__bubble--${msg.role}`}
          >
            <div className="chat__meta">
              {msg.role === "assistant" ? "Agroplaga AI" : "Tu"} -{" "}
              {new Date(msg.ts).toLocaleTimeString()}
            </div>
            {msg.text && (
              <div className="chat__text">
                {msg.text.split("\n").map((line, i) => renderLine(line, i))}
              </div>
            )}
            {msg.imageUrl && (
              <img
                className="chat__bubbleImage"
                src={msg.imageUrl}
                alt="Imagen enviada para diagnostico"
              />
            )}
          </article>
        ))}
        {busy && <div className="chat__typing">Agroplaga AI esta pensando...</div>}
        <div ref={endRef} />
      </section>

      <footer className="chat__composer">
        {(attachedImage || pastedImageUrl) && (
          <div className="chat__attachment">
            <img
              src={attachedImage?.previewUrl || pastedImageUrl}
              alt="Vista previa"
              className="chat__attachmentPreview"
            />
            <div className="chat__attachmentInfo">
              <strong>
                {attachedImage ? attachedImage.name : "Imagen desde enlace"}
              </strong>
              <span>
                {attachedImage ? "Lista para diagnostico" : pastedImageUrl}
              </span>
            </div>
            {attachedImage && (
              <button
                type="button"
                className="chat__iconBtn"
                onClick={removeAttachment}
                title="Quitar imagen"
                aria-label="Quitar imagen"
              >
                <FiX />
              </button>
            )}
          </div>
        )}

        <div className="chat__composerRow">
          <input
            ref={fileInputRef}
            className="chat__fileInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="chat__iconBtn"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            title="Adjuntar imagen"
            aria-label="Adjuntar imagen"
          >
            <FiImage />
          </button>
          <textarea
            className="chat__input"
            placeholder="Escribe tu consulta o pega un enlace de imagen..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
          />
          <button
            className="chat__btn"
            onClick={send}
            disabled={!canSend || busy}
            title="Enviar mensaje"
            aria-label="Enviar mensaje"
          >
            <FiSend />
            <span>{busy ? "Enviando..." : "Enviar"}</span>
          </button>
        </div>
      </footer>

      {error && <div className="chat__error">Error: {error}</div>}
    </div>
  );
}
