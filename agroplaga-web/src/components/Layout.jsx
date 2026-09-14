// src/components/Layout.jsx
// Armazon de la aplicacion: barra lateral fija + area de contenido.
// En pantallas estrechas la barra se oculta y se abre con el boton de menu.
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Icono from "./Icono";
import "../styles/layout.css";

function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className={`armazon${menuAbierto ? " armazon--menu" : ""}`}>
      <Sidebar onNavegar={() => setMenuAbierto(false)} />

      {menuAbierto && (
        <button
          type="button"
          className="armazon__velo"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <div className="armazon__cuerpo">
        <div className="armazon__barraMovil">
          <button
            type="button"
            className="armazon__menuBtn"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          >
            <Icono nombre={menuAbierto ? "cerrar" : "menu"} size={22} />
          </button>
          <span className="armazon__marcaMovil">
            <Icono nombre="hoja" size={20} strokeWidth={1.6} />
            Agroplaga AI
          </span>
        </div>

        <main className="armazon__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
