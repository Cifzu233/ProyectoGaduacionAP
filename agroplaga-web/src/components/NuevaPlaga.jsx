import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/nuevaPlaga.css";

const API_URL = "http://localhost:4000/api/plagas";
const UPLOAD_URL = "http://localhost:4000/api/upload";

function NuevaPlaga() {
  const [nombre, setNombre] = useState("");
  const [clase, setClase] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [imagen, setImagen] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const navigate = useNavigate();

  // ======================= SUBIR IMAGEN AL BACKEND =======================
  const subirImagen = async (file) => {
    const form = new FormData();
    form.append("imagen", file);
    try {
      setSubiendo(true);
      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (data.ok && data.url) {
        setImagen(data.url);
      } else {
        alert("⚠️ No se pudo subir la imagen.");
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
      alert("❌ Error de conexión al subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  };

  // ======================= GUARDAR PLAGA EN BASE DE DATOS =======================
  const guardarPlaga = async (e) => {
    e.preventDefault();

    if (!nombre || !clase || !sintomas || !tratamiento) {
      alert("❗ Todos los campos son obligatorios");
      return;
    }

    try {
      const nuevaPlaga = {
        nombre,
        nombre_cientifico: clase, // el backend espera este nombre
        sintomas,
        tratamiento,
        imagen,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaPlaga),
      });

      const data = await res.json();

      if (data.ok) {
        alert("✅ Nueva plaga registrada en la base de datos");
        setNombre("");
        setClase("");
        setSintomas("");
        setTratamiento("");
        setImagen("");
        navigate("/plagas");
      } else {
        console.error("Error al guardar:", data);
        alert("❌ No se pudo guardar la plaga.");
      }
    } catch (error) {
      console.error("Error al conectar:", error);
      alert("⚠️ No se pudo conectar con el servidor.");
    }
  };

  // ======================= RENDERIZADO =======================
  return (
    <div className="plaga-container">
      <h2 className="plaga-titulo">➕ Registrar Nueva Plaga</h2>

      <form onSubmit={guardarPlaga} className="plaga-form">
        <div className="plaga-field">
          <label>🪰 Nombre de la Plaga:</label>
          <input
            type="text"
            className="plaga-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Mosca de la fruta"
            required
          />
        </div>

        <div className="plaga-field">
          <label>🧬 Nombre Científico / Clase:</label>
          <input
            type="text"
            className="plaga-input"
            value={clase}
            onChange={(e) => setClase(e.target.value)}
            placeholder="Ej. Díptero o Ceratitis capitata"
            required
          />
        </div>

        <div className="plaga-field">
          <label>🤕 Síntomas:</label>
          <textarea
            className="plaga-input"
            value={sintomas}
            onChange={(e) => setSintomas(e.target.value)}
            rows="3"
            placeholder="Describe los síntomas visibles en la planta"
            required
          />
        </div>

        <div className="plaga-field">
          <label>💊 Tratamiento recomendado:</label>
          <textarea
            className="plaga-input"
            value={tratamiento}
            onChange={(e) => setTratamiento(e.target.value)}
            rows="3"
            placeholder="Describe el tratamiento sugerido"
            required
          />
        </div>

        <div className="plaga-field">
          <label>📷 Imagen:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) subirImagen(file);
            }}
          />
          {subiendo && <p style={{ color: "gray" }}>Subiendo imagen...</p>}
        </div>

        {imagen && (
          <div className="plaga-preview">
            <strong>📷 Vista previa:</strong>
            <img src={imagen} alt="Vista previa" className="plaga-img" />
          </div>
        )}

        <button type="submit" className="plaga-button">
          Guardar Plaga
        </button>

        <button
          type="button"
          onClick={() => navigate("/plagas")}
          className="plaga-button"
          style={{
            background: "linear-gradient(135deg, #6c757d, #adb5bd)",
            marginTop: "1rem",
          }}
        >
          ⬅️ Volver al listado
        </button>
      </form>
    </div>
  );
}

export default NuevaPlaga;
