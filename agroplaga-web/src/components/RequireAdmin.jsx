// src/components/RequireAdmin.jsx
// Rutas solo para administradores (nueva plaga, usuarios). El lector que
// escriba la URL a mano vuelve al Dashboard.
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth";

export default function RequireAdmin() {
  const { esAdmin } = useAuth();
  return esAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
