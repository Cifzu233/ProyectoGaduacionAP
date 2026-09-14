// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../styles/navbar.css";

function Navbar() {
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
      </ul>
    </nav>
  );
}

export default Navbar;
