// src/components/Usuarios.jsx
// Administracion de cuentas (solo admin): crear, cambiar rol, activar o
// desactivar, restablecer contrasena y eliminar. Tambien permite al usuario
// en sesion cambiar su propia contrasena.
import React, { useEffect, useState } from "react";
import { usuariosApi, authApi } from "../lib/api";
import { useAuth } from "../context/auth";
import "../styles/usuarios.css";

const ROL_LABEL = { admin: "Administrador", lector: "Lector" };

function fechaCorta(value) {
  if (!value) return "nunca";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "lector" });
  const [pw, setPw] = useState({ actual: "", nueva: "" });

  async function cargar() {
    try {
      setCargando(true);
      setUsuarios(await usuariosApi.list());
    } catch (e) {
      setError(e.message || "No se pudieron cargar los usuarios");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function aviso(msg) {
    setError("");
    setOk(msg);
    setTimeout(() => setOk(""), 3500);
  }

  async function ejecutar(fn, mensajeOk) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      if (mensajeOk) aviso(mensajeOk);
      await cargar();
    } catch (e) {
      setError(e.message || "Operación fallida");
    } finally {
      setBusy(false);
    }
  }

  const crear = (e) => {
    e.preventDefault();
    ejecutar(async () => {
      await usuariosApi.create(form);
      setForm({ nombre: "", email: "", password: "", rol: "lector" });
    }, "Usuario creado");
  };

  const cambiarRol = (u, rol) =>
    ejecutar(() => usuariosApi.update(u.id, { rol }), `Rol de ${u.nombre} actualizado`);

  const alternarActivo = (u) =>
    ejecutar(
      () => usuariosApi.update(u.id, { activo: !u.activo }),
      u.activo ? `${u.nombre} desactivado` : `${u.nombre} activado`
    );

  const restablecer = (u) => {
    const nueva = window.prompt(`Nueva contraseña para ${u.nombre} (mínimo 8 caracteres):`);
    if (!nueva) return;
    ejecutar(() => usuariosApi.resetPassword(u.id, nueva), `Contraseña de ${u.nombre} restablecida`);
  };

  const eliminar = (u) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${u.nombre} (${u.email})?`)) return;
    ejecutar(() => usuariosApi.remove(u.id), "Usuario eliminado");
  };

  const cambiarMiPassword = (e) => {
    e.preventDefault();
    ejecutar(async () => {
      await authApi.cambiarPassword(pw.actual, pw.nueva);
      setPw({ actual: "", nueva: "" });
    }, "Tu contraseña se actualizó");
  };

  return (
    <div className="usuarios">
      <h2 className="usuarios__titulo">👥 Usuarios y accesos</h2>
      <p className="usuarios__sub">
        Los <strong>administradores</strong> pueden crear, editar y borrar datos; los{" "}
        <strong>lectores</strong> solo consultan (y pueden usar el chat y el análisis con IA).
      </p>

      {error && <div className="usuarios__error">{error}</div>}
      {ok && <div className="usuarios__ok">{ok}</div>}

      <div className="usuarios__grid">
        <form className="usuarios__card" onSubmit={crear}>
          <h3>➕ Nuevo usuario</h3>
          <label>Nombre</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <label>Correo</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <label>Contraseña inicial (mín. 8)</label>
          <input
            type="password"
            value={form.password}
            minLength={8}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <label>Rol</label>
          <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
            <option value="lector">Lector (solo consulta)</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" className="usuarios__btn" disabled={busy}>
            Crear usuario
          </button>
        </form>

        <form className="usuarios__card" onSubmit={cambiarMiPassword}>
          <h3>🔑 Mi contraseña</h3>
          <p className="usuarios__hint">Sesión: {user?.nombre} ({user?.email})</p>
          <label>Contraseña actual</label>
          <input
            type="password"
            value={pw.actual}
            autoComplete="current-password"
            onChange={(e) => setPw({ ...pw, actual: e.target.value })}
            required
          />
          <label>Nueva contraseña (mín. 8)</label>
          <input
            type="password"
            value={pw.nueva}
            minLength={8}
            autoComplete="new-password"
            onChange={(e) => setPw({ ...pw, nueva: e.target.value })}
            required
          />
          <button type="submit" className="usuarios__btn usuarios__btn--ghost" disabled={busy}>
            Cambiar mi contraseña
          </button>
        </form>
      </div>

      <h3 className="usuarios__subtitulo">📋 Cuentas registradas</h3>
      {cargando ? (
        <p>Cargando…</p>
      ) : (
        <div className="usuarios__tablaWrap">
          <table className="usuarios__tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const esYo = u.id === user?.id;
                return (
                  <tr key={u.id} className={u.activo ? "" : "usuarios__fila--inactiva"}>
                    <td>
                      {u.nombre} {esYo && <span className="usuarios__yo">tú</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.rol}
                        disabled={busy || esYo}
                        onChange={(e) => cambiarRol(u, e.target.value)}
                        title={esYo ? "No puedes cambiar tu propio rol" : "Cambiar rol"}
                      >
                        <option value="admin">{ROL_LABEL.admin}</option>
                        <option value="lector">{ROL_LABEL.lector}</option>
                      </select>
                    </td>
                    <td>
                      <span className={`usuarios__estado ${u.activo ? "usuarios__estado--on" : "usuarios__estado--off"}`}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>{fechaCorta(u.ultimo_login_at)}</td>
                    <td className="usuarios__acciones">
                      <button
                        type="button"
                        className="usuarios__mini"
                        disabled={busy || esYo}
                        onClick={() => alternarActivo(u)}
                      >
                        {u.activo ? "⏸ Desactivar" : "▶️ Activar"}
                      </button>
                      <button
                        type="button"
                        className="usuarios__mini"
                        disabled={busy}
                        onClick={() => restablecer(u)}
                      >
                        🔑 Contraseña
                      </button>
                      <button
                        type="button"
                        className="usuarios__mini usuarios__mini--danger"
                        disabled={busy || esYo}
                        onClick={() => eliminar(u)}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
