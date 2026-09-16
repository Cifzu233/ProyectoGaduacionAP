// src/components/Login.jsx
import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import Icono from "./Icono";
import "../styles/login.css";

export default function Login() {
  const { user, login, aviso } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verClave, setVerClave] = useState(false);
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

  // El ojo revela la contraseña mientras se mantiene pulsado.
  const mostrar = () => setVerClave(true);
  const ocultar = () => setVerClave(false);

  return (
    <div className="login">
      <div className="login__marco">
        {/* ---------------------------- presentación ---------------------------- */}
        <aside className="login__lado">
          <div className="login__marca">
            <Icono nombre="hoja" size={34} strokeWidth={1.6} />
            <span>Agroplaga AI</span>
          </div>

          <h2 className="login__claim">
            Monitoreo de plagas del duraznero, en tiempo real
          </h2>

          <ul className="login__puntos">
            <li>
              <Icono nombre="temperatura" size={18} />
              Temperatura y humedad del lote, medidas en campo
            </li>
            <li>
              <Icono nombre="camara" size={18} />
              Cámara en vivo sobre la trampa de monitoreo
            </li>
            <li>
              <Icono nombre="chat" size={18} />
              Diagnóstico asistido y recomendaciones de manejo
            </li>
          </ul>

          <p className="login__pie">Lote El Durazno · Sumpango, Sacatepéquez</p>
        </aside>

        {/* ------------------------------ formulario ---------------------------- */}
        <form className="login__form" onSubmit={onSubmit}>
          <h1 className="login__titulo">Iniciar sesión</h1>
          <p className="login__sub">Ingresa con la cuenta que te asignaron.</p>

          {aviso && !error && <div className="login__aviso">{aviso}</div>}
          {error && (
            <div className="login__error" role="alert">
              <Icono nombre="aviso" size={18} />
              <span>{error}</span>
            </div>
          )}

          <label className="login__label" htmlFor="login-email">
            Correo
          </label>
          <div className="login__campo">
            <Icono nombre="correo" size={18} className="login__campoIcono" />
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
          </div>

          <label className="login__label" htmlFor="login-password">
            Contraseña
          </label>
          <div className="login__campo login__campo--clave">
            <Icono nombre="candado" size={18} className="login__campoIcono" />
            <input
              id="login-password"
              className="login__input"
              type={verClave ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="login__ojo"
              title="Mantén pulsado para ver la contraseña"
              aria-label="Mantén pulsado para ver la contraseña"
              onPointerDown={mostrar}
              onPointerUp={ocultar}
              onPointerLeave={ocultar}
              onPointerCancel={ocultar}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") mostrar();
              }}
              onKeyUp={ocultar}
              onBlur={ocultar}
              onContextMenu={(e) => e.preventDefault()}
            >
              <Icono nombre={verClave ? "ojoTachado" : "ojo"} size={19} />
            </button>
          </div>
          <span className="login__ayuda">
            Mantén pulsado el ojo para ver lo que escribiste.
          </span>

          <button type="submit" className="login__btn" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>

          <p className="login__nota">
            ¿No tienes cuenta? Pide al administrador que te cree una.
          </p>
        </form>
      </div>
    </div>
  );
}
