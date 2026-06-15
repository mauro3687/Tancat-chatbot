// src/components/Topbar.jsx
import ThemeToggle from "./ThemeToggle.jsx";
import "../styles/Topbar.css";

const TAB_LABELS = {
  resumen:       "Resumen general",
  reservas:      "Reservas",
  clientes:      "Clientes",
  ventas:        "Ventas",
  inventario:    "Inventario",
  ia:            "Promociones",
  reportes:      "Reportes",
  whatsapp:      "WhatsApp Bot",
  configuracion: "Configuración",
};

export default function Topbar({ activeTab, onMenuClick }) {
  const now = new Date();
  const fecha = now.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hora = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Abrir menú">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div>
          <div className="topbar-title">{TAB_LABELS[activeTab] ?? "Panel Administrativo"}</div>
          <div className="topbar-date">{fechaCap} · {hora}</div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="badge-live">
          <span className="live-dot" />
          <span className="badge-live-text">En vivo</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
