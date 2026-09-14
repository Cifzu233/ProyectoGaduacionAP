// src/components/Login.jsx
import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import "../styles/login.css";

export default function Login() {
  const { user, login, aviso } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const destino = location.state?.from?.pathname || "/";

  if (user) return <Navigate to={destino} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err?.message || "No se pudo iniciar sesión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={onSubmit}>
        <div className="login__logo">🌿 Agroplaga AI</div>
        <h1 className="login__titulo">Iniciar sesión</h1>
        <p className="login__sub">Monitoreo de plagas con sensores, cámara e inteligencia artificial</p>

        {aviso && !error && <div className="login__aviso">{aviso}</div>}
        {error && <div className="login__error">{error}</div>}

        <label className="login__label" htmlFor="login-email">Correo</label>
        <input
          id="login-email"
          className="login__input"
          type="email"
          name="email"
          autoComplete="username"
          placeholder="usuario@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <label className="login__label" htmlFor="login-password">Contraseña</label>
        <input
          id="login-password"
          className="login__input"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="login__btn" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>

        <p className="login__nota">
          ¿No tienes cuenta? Pide al administrador que te cree una.
        </p>
      </form>
    </div>
  );
}
