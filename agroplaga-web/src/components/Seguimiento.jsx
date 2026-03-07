import React, { useState, useEffect } from "react";
import GraficaActividades from "./GraficaActividades";
import "../styles/seguimiento.css";

const API_URL = "http://localhost:4000/api/actividades";
const API_PARCELAS = "http://localhost:4000/api/parcelas";

function Seguimiento() {
  const [actividad, setActividad] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [fecha, setFecha] = useState("");
  const [imagen, setImagen] = useState(null);
  const [parcelaSeleccionada, setParcelaSeleccionada] = useState("");
  const [filtroParcela, setFiltroParcela] = useState("");
  const [registros, setRegistros] = useState([]);
  const [parcelas, setParcelas] = useState([]);

  // ===================== Cargar datos desde backend =====================
  useEffect(() => {
    const cargarParcelas = async () => {
      try {
        const res = await fetch(API_PARCELAS);
        const data = await res.json();
        setParcelas(data);
      } catch (error) {
        console.error("❌ Error al cargar parcelas:", error);
      }
    };

    const cargarActividades = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setRegistros(data);
      } catch (error) {
        console.error("❌ Error al cargar actividades:", error);
      }
    };

    cargarParcelas();
    cargarActividades();
  }, []);

  // ===================== Subir imagen =====================
  const manejarImagen = (e) => {
    const archivo = e.target.files[0];
    if (archivo) setImagen(archivo);
  };

  // ===================== Guardar nueva actividad =====================
  const guardarRegistro = async (e) => {
    e.preventDefault();

    if (!actividad || !fecha || !parcelaSeleccionada) {
      alert("❗ Por favor llena todos los campos requeridos.");
      return;
    }

    const formData = new FormData();
    formData.append("actividad", actividad.trim());
    formData.append("observaciones", observaciones?.trim() || "");
    formData.append("fecha", fecha);
    formData.append("parcela_id", parcelaSeleccionada);
    if (imagen) formData.append("imagen", imagen);

    try {
      const res = await fetch(API_URL, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al guardar actividad");

      setActividad("");
      setObservaciones("");
      setFecha("");
      setImagen(null);
      setParcelaSeleccionada("");
      alert("✅ Actividad registrada correctamente.");

      const recargar = await fetch(API_URL);
      setRegistros(await recargar.json());
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      alert("Error al conectar con el servidor.");
    }
  };

  // ===================== Eliminar =====================
  const eliminarRegistro = async (id) => {
    if (!window.confirm("¿Eliminar este registro permanentemente?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("🗑️ Registro eliminado.");
        setRegistros(registros.filter((r) => r.id !== id));
      } else {
        alert(data.error || "Error al eliminar.");
      }
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
    }
  };

  // ===================== Exportar CSV =====================
  const exportarCSV = () => {
    if (registros.length === 0) {
      alert("⚠️ No hay registros para exportar.");
      return;
    }

    const encabezado = "Fecha,Parcela,Actividad,Observaciones\n";
    const filas = registros
      .map(
        (r) =>
          `${r.fecha},${r.parcela_nombre},${r.actividad.replace(/,/g, " ")},${r.observaciones.replace(
            /,/g,
            " "
          )}`
      )
      .join("\n");

    const csv = encabezado + filas;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "seguimiento_actividades.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ===================== Filtrar =====================
  const registrosFiltrados = filtroParcela
    ? registros.filter((r) => r.parcela_id === Number(filtroParcela))
    : registros;

  // ===================== Render =====================
  return (
    <div className="seguimiento-container">
      <h2 className="seguimiento-title">📘 Registro de Actividades</h2>

      <form onSubmit={guardarRegistro} className="seguimiento-form">
        <div className="form-group">
          <label>📅 Fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>📍 Parcela:</label>
          <select
            value={parcelaSeleccionada}
            onChange={(e) => setParcelaSeleccionada(e.target.value)}
            required
          >
            <option value="">Seleccionar parcela</option>
            {parcelas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>🧪 Actividad:</label>
          <input
            type="text"
            placeholder="Ej. Fumigación"
            value={actividad}
            onChange={(e) => setActividad(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>📝 Observaciones:</label>
          <textarea
            placeholder="Detalles..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>📷 Fotografía (opcional):</label>
          <input type="file" accept="image/*" onChange={manejarImagen} />
        </div>

        <button type="submit" className="btn btn-primary">
          Guardar Registro
        </button>
      </form>

      <h3 className="seguimiento-subtitle">📋 Historial</h3>

      {parcelas.length > 0 && (
        <div className="seguimiento-filtro">
          <label>🔍 Filtrar por parcela:</label>
          <select
            value={filtroParcela}
            onChange={(e) => setFiltroParcela(e.target.value)}
          >
            <option value="">Todas las parcelas</option>
            {parcelas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {registrosFiltrados.length === 0 ? (
        <p className="seguimiento-empty">No hay registros disponibles.</p>
      ) : (
        <>
          <table className="seguimiento-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Parcela</th>
                <th>Actividad</th>
                <th>Observaciones</th>
                <th>Foto</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>{item.fecha}</td>
                  <td>{item.parcela_nombre}</td>
                  <td>{item.actividad}</td>
                  <td>{item.observaciones || "—"}</td>
                  <td>
                    {item.imagen ? (
                      <img
                        src={`http://localhost:4000${item.imagen}`}
                        alt="foto"
                        className="seguimiento-img"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => eliminarRegistro(item.id)}
                      className="btn btn-danger"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="seguimiento-actions">
            <button onClick={exportarCSV} className="btn btn-secondary">
              📥 Exportar CSV
            </button>
          </div>

          <GraficaActividades registros={registrosFiltrados} />
        </>
      )}
    </div>
  );
}

export default Seguimiento;
