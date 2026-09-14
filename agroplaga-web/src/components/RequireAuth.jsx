// src/components/RequireAuth.jsx
// Envuelve las rutas que exigen sesion. Sin usuario -> /login (recordando a
// donde queria ir). Mientras se valida el token guardado muestra un aviso.
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth";

export default function RequireAuth() {
  const { user, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <div className="auth-cargando">Comprobando sesión…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
