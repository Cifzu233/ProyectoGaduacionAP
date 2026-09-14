import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 👈 para navegación
import "../styles/plagas.css";
import { apiUrl } from "../lib/api";

const API_URL = apiUrl("/api/plagas");
const UPLOAD_URL = apiUrl("/api/upload");

export default function Plagas() {
  const navigate = useNavigate();
  const [plagas, setPlagas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    nombre_cientifico: "",
    sintomas: "",
    tratamiento: "",
    imagen: "",
  });

  /* =============================== CARGAR PLAGAS =============================== */
  const fetchPlagas = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setPlagas(data);
    } catch (err) {
      console.error("Error al cargar plagas:", err);
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlagas();
  }, []);

  /* =============================== SUBIR IMAGEN =============================== */
  const subirImagen = async (file) => {
    const form = new FormData();
    form.append("imagen", file);
    try {
      const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
      const data = await res.json();
      return data.ok && data.url ? data.url : "";
    } catch (err) {
      console.error("Error al subir imagen:", err);
      return "";
    }
  };

  /* =============================== EDITAR PLAGA =============================== */
  const handleEdit = (plaga) => {
    setEditingId(plaga.id);
    setFormData({
      nombre: plaga.nombre,
      nombre_cientifico: plaga.nombre_cientifico,
      sintomas: plaga.sintomas,
      tratamiento: plaga.tratamiento,
      imagen: plaga.imagen || "",
    });
  };

  const handleSave = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.ok) {
        alert("✅ Plaga actualizada correctamente");
        setEditingId(null);
        fetchPlagas();
      } else {
        alert("❌ Error al actualizar plaga");
      }
    } catch (err) {
      console.error(err);
      alert("Error al conectar con el servidor");
    }
  };

  /* =============================== ELIMINAR PLAGA =============================== */
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta plaga?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        alert("🗑️ Plaga eliminada correctamente");
        fetchPlagas();
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* =============================== FORMULARIO DE EDICIÓN =============================== */
  const renderFormRow = (plaga) => {
    const isEditing = editingId === plaga.id;
    if (!isEditing) {
      return (
        <tr key={plaga.id}>
          <td>{plaga.id}</td>
          <td>{plaga.nombre}</td>
          <td><em>{plaga.nombre_cientifico}</em></td>
          <td>{plaga.sintomas}</td>
          <td>{plaga.tratamiento}</td>
          <td>
            {plaga.imagen ? (
              <img src={plaga.imagen} alt="img" className="plagas-img" />
            ) : (
              "—"
            )}
          </td>
          <td className="acciones">
            <button className="btn-editar" onClick={() => handleEdit(plaga)}>✏️ Editar</button>
            <button className="btn-eliminar" onClick={() => handleDelete(plaga.id)}>🗑️ Eliminar</button>
          </td>
        </tr>
      );
    }

    return (
      <tr key={plaga.id} style={{ background: "#f0fff0" }}>
        <td>{plaga.id}</td>
        <td><input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} /></td>
        <td><input value={formData.nombre_cientifico} onChange={(e) => setFormData({ ...formData, nombre_cientifico: e.target.value })} /></td>
        <td><textarea value={formData.sintomas} onChange={(e) => setFormData({ ...formData, sintomas: e.target.value })} /></td>
        <td><textarea value={formData.tratamiento} onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })} /></td>
        <td>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (file) {
                const url = await subirImagen(file);
                if (url) setFormData({ ...formData, imagen: url });
              }
            }}
          />
          {formData.imagen && <img src={formData.imagen} alt="preview" className="plagas-img" />}
        </td>
        <td className="acciones">
          <button className="btn-guardar" onClick={() => handleSave(plaga.id)}>💾 Guardar</button>
          <button className="btn-cancelar" onClick={() => setEditingId(null)}>❌ Cancelar</button>
        </td>
      </tr>
    );
  };

  /* =============================== RENDER PRINCIPAL =============================== */
  return (
    <div className="plagas-container">
      <h2 className="plagas-title">🌿 Gestión de Plagas</h2>

      {/* Botón para ir a la pantalla de nueva plaga */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          className="btn-guardar"
          style={{ padding: "10px 20px", fontSize: "1rem" }}
          onClick={() => navigate("/nueva-plaga")}
        >
          ➕ Registrar nueva plaga
        </button>
      </div>

      <table className="plagas-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Nombre Científico</th>
            <th>Síntomas</th>
            <th>Tratamiento</th>
            <th>Imagen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="7" align="center">Cargando...</td></tr>
          ) : plagas.length > 0 ? (
            plagas.map((p) => renderFormRow(p))
          ) : (
            <tr><td colSpan="7" align="center">No hay registros.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
