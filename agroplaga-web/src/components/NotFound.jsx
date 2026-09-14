// src/components/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="notfound">
      <h2>404</h2>
      <p>Página no encontrada</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}

export default NotFound;
