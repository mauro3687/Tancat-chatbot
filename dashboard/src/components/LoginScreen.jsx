// src/components/LoginScreen.jsx
import { useState } from "react";
import { useStore, USUARIOS } from "../data/store.jsx";
import logoTancat from "../assets/images/logo-tancat.png";

export default function LoginScreen() {
  const { login } = useStore();
  const [userId, setUserId]     = useState(USUARIOS[0].id);
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const ok = login(userId, password);
    if (!ok) {
      setError(true);
      setPassword("");
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#0F1117",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: 340,
          background: "#161922",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "2.25rem 2rem",
          display: "flex", flexDirection: "column", gap: 16,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
          <img
            src={logoTancat}
            alt="TanCat Deportes"
            style={{ height: 72, objectFit: "contain", marginBottom: 10 }}
          />
          <div style={{ fontSize: 11, color: "#555C72" }}>Panel administrativo</div>
        </div>

        {/* Usuario */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#555C72", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Usuario
          </label>
          <select
            className="form-input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ background: "#0F1117" }}
          >
            {USUARIOS.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>

        {/* Contraseña */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#555C72", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Contraseña
          </label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            style={{ background: "#0F1117", borderColor: error ? "#F04D6A" : undefined }}
          />
          {error && (
            <span style={{ fontSize: 12, color: "#F04D6A", fontWeight: 500 }}>
              Contraseña incorrecta
            </span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: 4, padding: "9px 16px", fontSize: 14 }}
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}
