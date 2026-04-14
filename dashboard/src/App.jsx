import { useState } from "react";
import { StoreProvider, useStore } from "./data/store.jsx";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import LoadingScreen from "./components/LoadingScreen";
import LoginScreen from "./components/LoginScreen";
import TabResumen from "./components/TabResumen";
import TabReservas from "./components/TabReservas";
import TabClientes from "./components/TabClientes";
import TabVentas from "./components/TabVentas";
import TabInventario from "./components/TabInventario";
import TabReportes from "./components/TabReportes";
import TabConfiguracion from "./components/TabConfiguracion";
import TabIA from "./components/TabIA";
import TabWhatsApp from "./components/TabWhatsApp";
import "./App.css";
import "./styles/shared.css";

// Tabs permitidos por rol
const TAB_PERMISOS = {
  admin:     ["resumen", "reservas", "clientes", "ventas", "inventario", "ia", "reportes", "whatsapp", "configuracion"],
  encargado: ["reservas", "clientes", "ventas", "inventario", "configuracion"],
};

function AppInner() {
  const [activeTab, setActiveTab] = useState("resumen");
  const { loading, currentUser } = useStore();

  if (!currentUser) return <LoginScreen />;
  if (loading) return <LoadingScreen />;

  const permitidos = TAB_PERMISOS[currentUser.rol] ?? TAB_PERMISOS.admin;
  // Si el tab activo no está permitido para este rol, ir al primero disponible
  const safeTab = permitidos.includes(activeTab) ? activeTab : permitidos[0];

  const tabs = {
    resumen:       <TabResumen />,
    reservas:      <TabReservas />,
    clientes:      <TabClientes />,
    ventas:        <TabVentas />,
    inventario:    <TabInventario />,
    ia:            <TabIA />,
    reportes:      <TabReportes />,
    whatsapp:      <TabWhatsApp />,
    configuracion: <TabConfiguracion />,
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={safeTab} setActiveTab={setActiveTab} tabsPermitidos={permitidos} />
      <div className="main-content">
        <Topbar activeTab={safeTab} />
        <div className="page-body">
          {tabs[safeTab] ?? null}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
