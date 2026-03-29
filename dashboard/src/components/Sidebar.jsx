import { logoTancat } from "../assets/images/index.js";

const navItems = [
  {
    label: "Principal",
    items: [
      { id: "resumen", icon: "📊", text: "Resumen" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { id: "reservas",   icon: "📅", text: "Reservas"   },
      { id: "clientes",   icon: "👥", text: "Clientes"   },
      { id: "ventas",     icon: "💳", text: "Ventas"     },
      { id: "inventario", icon: "📦", text: "Inventario" },
    ],
  },
  {
    label: "Canales",
    items: [
      { id: "whatsapp", icon: "💬", text: "WhatsApp Bot" },
    ],
  },
  {
    label: "Inteligencia",
    items: [
      { id: "ia",       icon: "🤖", text: "IA & Promociones" },
      { id: "reportes", icon: "📈", text: "Reportes"         },
    ],
  },
  {
    label: "Sistema",
    items: [
      { id: "configuracion", icon: "⚙️", text: "Configuración" },
    ],
  },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">TC</div>
        <div>
          <div className="logo-text">TanCat</div>
          <div className="logo-sub">Panel Admin</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.label}>
            <div className="nav-label">{section.label}</div>
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.text}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-row">
          <div className="user-avatar">AD</div>
          <div>
            <div className="user-name">Admin</div>
            <div className="user-role">Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
