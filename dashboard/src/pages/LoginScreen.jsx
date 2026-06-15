// src/components/LoginScreen.jsx
import { useState } from "react";
import { useStore, USUARIOS } from "../data/store.jsx";
import logoTancat from "../assets/images/logo-tancat.png";
import "../styles/LoginScreen.css";

export default function LoginScreen() {
  const { login } = useStore();
  const [userId, setUserId]     = useState(USUARIOS[0].id);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 380));
    const ok = login(userId, password);
    setLoading(false);
    if (!ok) {
      setError(true);
      setPassword("");
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <div className="login-overlay">

      <div className="login-gradient" />

      <div className="login-wrapper">
        <div className="login-card">

          {/* Logo */}
          <div className="login-logo-section">
            <img src={logoTancat} alt="TanCat Deportes" className="login-logo-img" />
            <div className={`login-role-label${userId === "admin" ? " role-admin" : ""}`}>
              {userId === "admin" ? "Administrador" : "Encargado de Sucursal"}
            </div>
          </div>

          <div className="login-separator" />

          <div className="login-form-section">
            <form onSubmit={handleSubmit} className="login-form">

              {/* Usuario */}
              <div className="login-field">
                <label className="login-label">Usuario</label>
                <div className="login-input-wrap">
                  <svg className="login-icon-left"
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555C72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <select
                    className="login-input"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  >
                    {USUARIOS.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                  <svg className="login-icon-right"
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555C72" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {/* Contraseña */}
              <div className="login-field">
                <label className="login-label">Contraseña</label>
                <div className="login-input-wrap">
                  <svg className="login-icon-left"
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555C72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoFocus
                    className={`login-input login-input-pass${error ? " input-error-active" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className={`login-eye-btn${showPass ? " eye-active" : ""}`}
                    tabIndex={-1}
                    title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPass ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>

                <div className={`login-error-wrap${error ? " error-visible" : ""}`}>
                  <span className="login-error-msg">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Contraseña incorrecta
                  </span>
                </div>
              </div>

              {/* Botón */}
              <button type="submit" disabled={loading || !password} className="login-submit-btn">
                {loading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="login-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Verificando...
                  </>
                ) : "Ingresar"}
              </button>

            </form>
          </div>
        </div>

        <div className="login-footer">
          TanCat Deportes © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
