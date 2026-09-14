// src/context/auth.js
// Contexto y hook de sesion. Va en un archivo sin componentes para que
// react-refresh no se queje de exportar hooks junto a componentes.
import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
