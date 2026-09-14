// src/context/AuthProvider.jsx
// Mantiene el usuario en sesion: valida el token guardado al cargar, expone
// login/logout y reacciona al evento de 401 que emite lib/api.js.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./auth";
import { authApi, getToken, setToken, clearToken, UNAUTHORIZED_EVENT } from "../lib/api";

export default function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(Boolean(getToken()));
  const [aviso, setAviso] = useState("");

  // Al montar: si hay token guardado, comprobar que sigue siendo valido.
  useEffect(() => {
    if (!getToken()) return;
    let cancelado = false;
    authApi
      .me()
      .then((u) => {
        if (!cancelado) setUser(u);
      })
      .catch(() => {
        clearToken();
        if (!cancelado) setUser(null);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const logout = useCallback(
    (mensaje = "") => {
      clearToken();
      setUser(null);
      setAviso(mensaje);
      navigate("/login", { replace: true });
    },
    [navigate]
  );

  // lib/api.js emite este evento cuando el backend responde 401.
  useEffect(() => {
    const onUnauthorized = () => logout("Tu sesión expiró. Vuelve a iniciar sesión.");
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setToken(data.token);
    setUser(data.user);
    setAviso("");
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      esAdmin: user?.rol === "admin",
      cargando,
      aviso,
      login,
      logout,
      setUser,
    }),
    [user, cargando, aviso, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
