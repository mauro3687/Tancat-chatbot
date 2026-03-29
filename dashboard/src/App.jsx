import { useState } from "react";
import { StoreProvider, useStore } from "./data/store.jsx";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import LoadingScreen from "./components/LoadingScreen";
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

function AppInner() {
  const [activeTab, setActiveTab] = useState("resumen");
  const { loading } = useStore();

  if (loading) return <LoadingScreen />;

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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Topbar />
        <div className="page-body">
          {tabs[activeTab] ?? null}
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
