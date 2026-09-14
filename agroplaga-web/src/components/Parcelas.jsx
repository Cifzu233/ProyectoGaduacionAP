import React, { useEffect, useState } from "react";
import { apiUrl, get, del, upload } from "../lib/api";
import { useAuth } from "../context/auth";
import "../styles/parcelas.css";

function Parcelas() {
  const { esAdmin } = useAuth();
  const [parcelas, setParcelas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [cultivo, setCultivo] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [fechaSiembra, setFechaSiembra] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [imagen, setImagen] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEdit, setIdEdit] = useState(null);

  // Cargar las parcelas desde el backend
  const cargarParcelas = async () => {
    try {
      setParcelas(await get("/api/parcelas"));
    } catch (error) {
      console.error("❌ Error al cargar parcelas:", error);
      setMensaje(`Error al cargar parcelas: ${error.message}`);
    }
  };

  useEffect(() => {
    cargarParcelas();
  }, []);

  // =================== GUARDAR o ACTUALIZAR ===================
  const guardarParcela = async (e) => {
    e.preventDefault();

    if (!nombre || !ubicacion || !cultivo) {
      setMensaje("❗ Los campos Nombre, Ubicación y Cultivo son obligatorios.");
      return;
    }

    const formData = new FormData();
    formData.append("nombre", nombre.trim());
    formData.append("ubicacion", ubicacion.trim());
    formData.append("cultivo", cultivo.trim());
    formData.append("superficie", superficie || "");
    formData.append("fecha_siembra", fechaSiembra || "");
    formData.append("observaciones", observaciones?.trim() || "");
    if (imagen) formData.append("imagen", imagen);

    try {
      await upload(
        editando ? `/api/parcelas/${idEdit}` : "/api/parcelas",
        formData,
        editando ? "PUT" : "POST"
      );

      setMensaje(editando ? "✅ Parcela actualizada." : "🌾 Parcela registrada.");
      setNombre("");
      setUbicacion("");
      setCultivo("");
      setSuperficie("");
      setFechaSiembra("");
      setObservaciones("");
      setImagen(null);
      setEditando(false);
      setIdEdit(null);

      await cargarParcelas();
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      setMensaje(error.message || "Error al guardar la parcela.");
    }
  };

  // =================== ELIMINAR ===================
  const eliminarParcela = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta parcela?")) return;
    try {
      await del(`/api/parcelas/${id}`);
      setMensaje("🗑️ Parcela eliminada.");
      await cargarParcelas();
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
      setMensaje(error.message || "Error al eliminar.");
    }
  };

  // =================== EDITAR ===================
  const editarParcela = (p) => {
    setEditando(true);
    setIdEdit(p.id);
    setNombre(p.nombre);
    setUbicacion(p.ubicacion);
    setCultivo(p.cultivo);
    setSuperficie(p.superficie || "");
    setFechaSiembra(p.fecha_siembra ? p.fecha_siembra.split("T")[0] : "");
    setObservaciones(p.observaciones || "");
    setImagen(null);
  };

  // =================== FORMULARIO ===================
  return (
    <div className="parcelas-container">
      <h2 className="parcelas-title">🌾 Registro de Parcelas de Cultivo</h2>

      {mensaje && <div className="parcelas-msg">{mensaje}</div>}

      {esAdmin && (
        <form onSubmit={guardarParcela} className="parcelas-form">
          <label>📍 Nombre del lote:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <label>📌 Ubicación:</label>
          <input
            type="text"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            required
          />

          <label>🌱 Cultivo:</label>
          <input
            type="text"
            value={cultivo}
            onChange={(e) => setCultivo(e.target.value)}
            required
          />

          <label>📏 Superficie (m²):</label>
          <input
            type="number"
            step="0.01"
            value={superficie}
            onChange={(e) => setSuperficie(e.target.value)}
          />

          <label>📅 Fecha de siembra:</label>
          <input
            type="date"
            value={fechaSiembra}
            onChange={(e) => setFechaSiembra(e.target.value)}
          />

          <label>📝 Observaciones:</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas sobre el cultivo, plagas, clima, etc."
          />

          <label>🖼️ Imagen (opcional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImagen(e.target.files[0])}
          />

          <button type="submit" className="parcelas-btn">
            {editando ? "💾 Actualizar Parcela" : "➕ Guardar Parcela"}
          </button>
        </form>
      )}

      <h3 className="parcelas-subtitle">📋 Parcelas Registradas</h3>

      {parcelas.length === 0 ? (
        <p className="parcelas-empty">No hay parcelas registradas.</p>
      ) : (
        <div className="parcelas-table-wrapper">
          <table className="parcelas-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Ubicación</th>
                <th>Cultivo</th>
                <th>Superficie</th>
                <th>Fecha Siembra</th>
                <th>Observaciones</th>
                <th>Imagen</th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {parcelas.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.ubicacion}</td>
                  <td>{p.cultivo}</td>
                  <td>{p.superficie}</td>
                  <td>{p.fecha_siembra ? p.fecha_siembra.split("T")[0] : "-"}</td>
                  <td>{p.observaciones || "-"}</td>
                  <td>
                    {p.imagen ? (
                      <img
                        src={apiUrl(p.imagen)}
                        alt="parcela"
                        className="parcelas-img"
                      />
                    ) : (
                      "Sin imagen"
                    )}
                  </td>
                  {esAdmin && (
                    <td>
                      <button
                        onClick={() => editarParcela(p)}
                        className="parcelas-edit"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => eliminarParcela(p.id)}
                        className="parcelas-delete"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Parcelas;
