import { useState } from "react";
import { StoreProvider, useStore } from "./context/StoreContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import LoadingScreen from "./pages/LoadingScreen";
import LoginScreen from "./pages/LoginScreen";
import TabResumen from "./pages/TabResumen";
import TabReservas from "./pages/TabReservas";
import TabClientes from "./pages/TabClientes";
import TabVentas from "./pages/TabVentas";
import TabInventario from "./pages/TabInventario";
import TabReportes from "./pages/TabReportes";
import TabCanchas from "./pages/TabCanchas";
import TabConfiguracion from "./pages/TabConfiguracion";
import TabIA from "./pages/TabIA";
import "./App.css";
import "./styles/shared.css";

// Tabs permitidos por rol (BUG-020: whatsapp removido — nav item comentado, acceso deshabilitado)
const TAB_PERMISOS = {
  admin:     ["resumen", "reservas", "canchas", "clientes", "ventas", "inventario", "ia", "reportes", "configuracion"],
  encargado: ["reservas", "canchas", "clientes", "ventas", "inventario", "configuracion"],
};

function AppInner() {
  const [activeTab, setActiveTab] = useState("resumen");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { loading, currentUser } = useStore();

  if (!currentUser) return <LoginScreen />;
  if (loading) return <LoadingScreen />;

  const permitidos = TAB_PERMISOS[currentUser.rol] ?? TAB_PERMISOS.admin;
  // Si el tab activo no está permitido para este rol, ir al primero disponible
  const safeTab = permitidos.includes(activeTab) ? activeTab : permitidos[0];

  const tabs = {
    resumen:       <TabResumen />,
    reservas:      <TabReservas />,
    canchas:       <TabCanchas />,
    clientes:      <TabClientes />,
    ventas:        <TabVentas />,
    inventario:    <TabInventario />,
    ia:            <TabIA />,
    reportes:      <TabReportes />,
    configuracion: <TabConfiguracion />,
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={safeTab}
        setActiveTab={setActiveTab}
        tabsPermitidos={permitidos}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="main-content">
        <Topbar activeTab={safeTab} onMenuClick={() => setMobileNavOpen((o) => !o)} />
        <div className="page-body">
          {tabs[safeTab] ?? null}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <AppInner />
      </StoreProvider>
    </ThemeProvider>
  );
}
