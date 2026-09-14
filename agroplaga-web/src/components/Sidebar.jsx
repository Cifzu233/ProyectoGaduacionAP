// src/components/Sidebar.jsx
// Barra lateral de navegacion (sustituye a la barra superior).
// El enlace de Usuarios solo se muestra a los administradores.
import React from "react";
import { NavLink } from "react-router-dom";
import Icono from "./Icono";
import { useAuth } from "../context/auth";
import "../styles/sidebar.css";

const SECCIONES = [
  { to: "/", icono: "panel", texto: "Panel", exacto: true },
  { to: "/plagas", icono: "plaga", texto: "Plagas" },
  { to: "/seguimiento", icono: "bitacora", texto: "Seguimiento" },
  { to: "/parcelas", icono: "parcela", texto: "Parcelas" },
  { to: "/camara", icono: "camara", texto: "Cámara" },
  { to: "/chat", icono: "chat", texto: "AGRO IA" },
];

export default function Sidebar({ onNavegar }) {
  const { user, esAdmin, logout } = useAuth();

  const secciones = esAdmin
    ? [...SECCIONES, { to: "/usuarios", icono: "usuarios", texto: "Usuarios" }]
    : SECCIONES;

  const clase = ({ isActive }) =>
    isActive ? "barra__enlace barra__enlace--activo" : "barra__enlace";

  return (
    <aside className="barra">
      <div className="barra__marca">
        <Icono nombre="hoja" size={28} strokeWidth={1.6} className="barra__hoja" />
        <div className="barra__marcaTexto">
          <span className="barra__nombre">Agroplaga AI</span>
          <span className="barra__lema">Centro de control</span>
        </div>
      </div>

      <nav className="barra__nav">
        {secciones.map((s) => (
          <NavLink key={s.to} to={s.to} end={s.exacto} className={clase} onClick={onNavegar}>
            <Icono nombre={s.icono} size={20} />
            <span>{s.texto}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="barra__usuario">
          <span className="barra__avatar">{iniciales(user.nombre)}</span>
          <span className="barra__datos">
            <span className="barra__usuarioNombre" title={user.email}>
              {user.nombre}
            </span>
            <span className="barra__rol">
              {user.rol === "admin" ? "administrador" : "lector"}
            </span>
          </span>
          <button
            type="button"
            className="barra__salir"
            onClick={() => logout()}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <Icono nombre="salir" size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}

function iniciales(nombre = "") {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  return (partes[0][0] + (partes[1]?.[0] || "")).toUpperCase();
}
