// src/components/Topbar.jsx

export default function Topbar() {
  const now = new Date();
  const fecha = now.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">Panel Administrativo</div>
        <div className="topbar-date">{fechaCap}</div>
      </div>
      <div className="badge-live">
        <span className="live-dot" />
        En vivo
      </div>
    </header>
  );
}
