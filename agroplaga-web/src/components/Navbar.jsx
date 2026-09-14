// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import "../styles/navbar.css";

function Navbar() {
  const { user, esAdmin, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar__logo">🌿 Agroplaga AI</div>
      <ul className="navbar__links">
        <li><Link to="/" className="navbar__link">🏠 Dashboard</Link></li>
        <li><Link to="/plagas" className="navbar__link">🪰 Plagas</Link></li>
        <li><Link to="/seguimiento" className="navbar__link">📘 Seguimiento</Link></li>
        <li><Link to="/parcelas" className="navbar__link">🌾 Parcelas</Link></li>
        <li><Link to="/camara" className="navbar__link">📹 Cámara</Link></li>
        <li><Link to="/chat" className="navbar__link">🤖 AGRO IA</Link></li>
        {esAdmin && (
          <li><Link to="/usuarios" className="navbar__link">👥 Usuarios</Link></li>
        )}
      </ul>
      {user && (
        <div className="navbar__user" title={user.email}>
          <span className="navbar__nombre">{user.nombre}</span>
          <span className={`navbar__rol navbar__rol--${user.rol}`}>
            {user.rol === "admin" ? "administrador" : "lector"}
          </span>
          <button type="button" className="navbar__logout" onClick={() => logout()}>
            Salir
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
