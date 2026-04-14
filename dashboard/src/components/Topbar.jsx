// src/components/Topbar.jsx
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

export default function Topbar({ activeTab }) {
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
      <div>
        <div className="topbar-title">{TAB_LABELS[activeTab] ?? "Panel Administrativo"}</div>
        <div className="topbar-date">{fechaCap} · {hora}</div>
      </div>

      <div className="topbar-right">
        <div className="badge-live">
          <span className="live-dot" />
          En vivo
        </div>
      </div>
    </header>
  );
}
