// src/context/StoreContext.jsx — Estado global conectado a Firebase Firestore en tiempo real
import { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase.js";
import { useCollection } from "../hooks/useCollection.js";

import * as reservasService from "../services/reservas.service.js";
import * as clientesService from "../services/clientes.service.js";
import * as ventasService from "../services/ventas.service.js";
import * as stockService from "../services/stock.service.js";
import * as prestamosService from "../services/prestamos.service.js";
import * as canchasService from "../services/canchas.service.js";
import * as bloqueosService from "../services/bloqueos.service.js";
import { updateConfigRemote } from "../services/config.service.js";

// ── Constantes del negocio (no van a Firestore) ───────────────────────────────
export const SERVICIOS = [
  { nombre: "Pádel",    precio: 8000  },
  { nombre: "Básquet",  precio: 12000 },
  { nombre: "Voley",    precio: 10000 },
];

// ── Hash de contraseña (client-side, no es seguridad de producción) ───────────
// Las contraseñas no se almacenan en texto plano — solo sus hashes.
function _hp(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x9e3779b9);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// ── Usuarios del sistema ──────────────────────────────────────────────────────
export const USUARIOS = [
  { id: "admin",     nombre: "Admin",         rol: "admin",     ph: _hp("admin123") },
  { id: "encargado", nombre: "Enc. Sucursal",     rol: "encargado", sede: "local-1", ph: _hp("enc123") },
];

// ── Context ───────────────────────────────────────────────────────────────────
const StoreContext = createContext(null);

// ── Provider principal ────────────────────────────────────────────────────────
export function StoreProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  const login = (id, password) => {
    const u = USUARIOS.find((u) => u.id === id && u.ph === _hp(password));
    if (u) { setCurrentUser(u); return true; }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const { data: reservas,  loading: loadingReservas  } = useCollection("reservas");
  const { data: clientes,  loading: loadingClientes  } = useCollection("clientes");
  const { data: ventas,    loading: loadingVentas    } = useCollection("ventas");
  const { data: stock,     loading: loadingStock     } = useCollection("stock");
  const { data: bloqueos,  loading: loadingBloqueos  } = useCollection("bloqueos");
  const { data: prestamos, loading: loadingPrestamos } = useCollection("prestamos");
  const { data: canchas,   loading: loadingCanchas   } = useCollection("canchas");
  const [config, setConfigLocal] = useState({
    nombre: "TanCat", razonSocial: "TanCat S.R.L.", cuit: "30-71234567-8",
    email: "info@tancat.com.ar", telefono: "351-000-0000",
    direccion: "Ruta 36 Km 45, Córdoba", checkin: "14:00", checkout: "11:00",
    atencion: "08:00 - 22:00", sena: 30, cancelacion: 48,
    precios: { padel: 8000, basquet: 12000, voley: 10000 },
  });

  const loading = loadingReservas || loadingClientes || loadingVentas || loadingStock || loadingBloqueos || loadingPrestamos || loadingCanchas;

  // ── Leer config desde Firestore ──
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "general"), (snap) => {
      if (snap.exists()) setConfigLocal(snap.data());
    });
    return unsub;
  }, []);

  const deleteClienteConRelaciones = (clienteId) =>
    clientesService.deleteClienteConRelaciones(clienteId, { reservas, ventas, stock, prestamos });

  const deleteBloqueosCanchaFecha = (canchaId, fecha) =>
    bloqueosService.deleteBloqueosCanchaFecha(canchaId, fecha, bloqueos);

  const updateConfig = async (data) => {
    setConfigLocal((prev) => ({ ...prev, ...data }));
    await updateConfigRemote(data);
  };

  return (
    <StoreContext.Provider value={{
      // Auth
      currentUser, login, logout,
      // Datos
      reservas, clientes, ventas, stock, prestamos, config, bloqueos, canchas, loading,
      // Reservas
      addReserva: reservasService.addReserva,
      updateReserva: reservasService.updateReserva,
      deleteReserva: reservasService.deleteReserva,
      // Clientes
      addCliente: clientesService.addCliente,
      updateCliente: clientesService.updateCliente,
      deleteCliente: clientesService.deleteCliente,
      deleteClienteConRelaciones,
      // Ventas
      addVenta: ventasService.addVenta,
      updateVenta: ventasService.updateVenta,
      deleteVenta: ventasService.deleteVenta,
      // Stock
      addStock: stockService.addStock,
      updateStock: stockService.updateStock,
      deleteStock: stockService.deleteStock,
      addMovimientoStock: stockService.addMovimientoStock,
      // Préstamos
      addPrestamo: prestamosService.addPrestamo,
      updatePrestamo: prestamosService.updatePrestamo,
      deletePrestamo: prestamosService.deletePrestamo,
      // Canchas dinámicas
      addCancha: canchasService.addCancha,
      // Bloqueos
      addBloqueo: bloqueosService.addBloqueo,
      addBloqueoRango: bloqueosService.addBloqueoRango,
      deleteBloqueo: bloqueosService.deleteBloqueo,
      deleteBloqueosCanchaFecha,
      // Config
      updateConfig,
      // Constantes
      SERVICIOS,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
