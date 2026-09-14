import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/plagas.css";
import { apiUrl, get, put, del, upload } from "../lib/api";
import { useAuth } from "../context/auth";
import Icono from "./Icono";

const FORM_VACIO = {
  nombre: "",
  nombre_cientifico: "",
  sintomas: "",
  tratamiento: "",
  imagen: "",
};

export default function Plagas() {
  const navigate = useNavigate();
  const { esAdmin } = useAuth();
  const [plagas, setPlagas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandidas, setExpandidas] = useState(() => new Set());
  const [formData, setFormData] = useState(FORM_VACIO);

  /* =============================== CARGAR PLAGAS =============================== */
  const fetchPlagas = async () => {
    try {
      setLoading(true);
      setPlagas(await get("/api/plagas"));
    } catch (err) {
      console.error("Error al cargar plagas:", err);
      alert(`Error al cargar plagas: ${err.message}`);
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
      const data = await upload("/api/upload", form);
      return data?.ok && data.url ? data.url : "";
    } catch (err) {
      console.error("Error al subir imagen:", err);
      alert(`No se pudo subir la imagen: ${err.message}`);
      return "";
    }
  };

  /* ============================== EDITAR / BORRAR ============================== */
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
      const data = await put(`/api/plagas/${id}`, formData);
      if (data?.ok) {
        setEditingId(null);
        fetchPlagas();
      } else {
        alert("No se pudo actualizar la plaga.");
      }
    } catch (err) {
      console.error(err);
      alert(`Error al actualizar: ${err.message}`);
    }
  };

  const handleDelete = async (plaga) => {
    if (!window.confirm(`¿Eliminar "${plaga.nombre}" del catálogo?`)) return;
    try {
      await del(`/api/plagas/${plaga.id}`);
      fetchPlagas();
    } catch (err) {
      console.error(err);
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const alternarTexto = (id) => {
    setExpandidas((actual) => {
      const copia = new Set(actual);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  };

  /* ================================= RENDER ================================== */
  return (
    <div className="plagas ap-entra">
      <header className="plagas__cabecera">
        <div>
          <h1 className="plagas__titulo">Catálogo de plagas del duraznero</h1>
          <p className="plagas__sub">
            {plagas.length > 0
              ? `${plagas.length} plagas registradas para el melocotón en el altiplano de Guatemala.`
              : "Fichas de identificación y manejo integrado."}
          </p>
        </div>
        {esAdmin && (
          <button
            type="button"
            className="ap-btn ap-btn--primario"
            onClick={() => navigate("/nueva-plaga")}
          >
            <Icono nombre="plaga" size={16} />
            Registrar nueva plaga
          </button>
        )}
      </header>

      {loading && <p className="plagas__vacio">Cargando catálogo…</p>}
      {!loading && plagas.length === 0 && (
        <p className="plagas__vacio">Todavía no hay plagas registradas.</p>
      )}

      <div className="plagas__rejilla">
        {plagas.map((plaga, indice) => {
          const enEdicion = esAdmin && editingId === plaga.id;
          // El catálogo está ordenado: la primera ficha es la plaga principal.
          const esPrincipal = indice === 0 && !enEdicion;
          const abierta = expandidas.has(plaga.id);

          if (enEdicion) {
            return (
              <article className="plaga plaga--edicion" key={plaga.id}>
                <label className="plaga__campo">
                  Nombre común
                  <input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </label>
                <label className="plaga__campo">
                  Nombre científico
                  <input
                    value={formData.nombre_cientifico}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre_cientifico: e.target.value })
                    }
                  />
                </label>
                <label className="plaga__campo">
                  Síntomas
                  <textarea
                    rows="4"
                    value={formData.sintomas}
                    onChange={(e) => setFormData({ ...formData, sintomas: e.target.value })}
                  />
                </label>
                <label className="plaga__campo">
                  Tratamiento
                  <textarea
                    rows="4"
                    value={formData.tratamiento}
                    onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                  />
                </label>
                <label className="plaga__campo">
                  Fotografía
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
                </label>
                {formData.imagen && (
                  <img className="plaga__previa" src={apiUrl(formData.imagen)} alt="Vista previa" />
                )}
                <div className="plaga__acciones">
                  <button
                    type="button"
                    className="ap-btn ap-btn--primario"
                    onClick={() => handleSave(plaga.id)}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="ap-btn ap-btn--suave"
                    onClick={() => setEditingId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </article>
            );
          }

          return (
            <article className={`plaga${esPrincipal ? " plaga--principal" : ""}`} key={plaga.id}>
              <div className="plaga__foto">
                {plaga.imagen ? (
                  <img src={apiUrl(plaga.imagen)} alt={plaga.nombre} loading="lazy" />
                ) : (
                  <div className="plaga__sinFoto">
                    <Icono nombre="camara" size={26} />
                    <span>Sin fotografía</span>
                  </div>
                )}
                {esPrincipal && <span className="plaga__insignia">Plaga principal</span>}
              </div>

              <div className="plaga__cuerpo">
                <h2 className="plaga__nombre">{plaga.nombre}</h2>
                <p className="plaga__ciencia">{plaga.nombre_cientifico}</p>

                <div className={`plaga__bloques${abierta ? " plaga__bloques--abierto" : ""}`}>
                  <section className="plaga__bloque">
                    <span className="plaga__etiqueta">
                      <Icono nombre="aviso" size={14} />
                      Síntomas
                    </span>
                    <p className="plaga__texto">{plaga.sintomas}</p>
                  </section>
                  <section className="plaga__bloque">
                    <span className="plaga__etiqueta plaga__etiqueta--verde">
                      <Icono nombre="check" size={14} strokeWidth={2.4} />
                      Manejo
                    </span>
                    <p className="plaga__texto">{plaga.tratamiento}</p>
                  </section>
                </div>

                <button
                  type="button"
                  className="plaga__mas"
                  onClick={() => alternarTexto(plaga.id)}
                >
                  {abierta ? "Ver menos" : "Ver ficha completa"}
                </button>
              </div>

              {esAdmin && (
                <footer className="plaga__pie">
                  <button
                    type="button"
                    className="plaga__accion"
                    onClick={() => handleEdit(plaga)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="plaga__accion plaga__accion--borrar"
                    onClick={() => handleDelete(plaga)}
                  >
                    Eliminar
                  </button>
                </footer>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
