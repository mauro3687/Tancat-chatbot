// src/data/store.jsx — Estado global conectado a Firebase Firestore en tiempo real

import { createContext, useContext, useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, arrayUnion
} from "firebase/firestore";
import { db } from "../firebase.js";

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

// ── Hook para suscribirse a una colección Firestore ───────────────────────────
function useCollection(colName) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, colName),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Ordenar por creadoEn en el cliente — evita dependencia de índices Firestore
        docs.sort((a, b) => {
          const ta = a.creadoEn?.seconds ?? 0;
          const tb = b.creadoEn?.seconds ?? 0;
          return tb - ta;
        });
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(`Error en colección ${colName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [colName]);

  return { data, loading, error };
}

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

  // ── RESERVAS ──────────────────────────────────────────────────────────────
  const addReserva = async (data) => {
    const ref = await addDoc(collection(db, "reservas"), {
      ...data,
      creadoEn: serverTimestamp(),
    });
    return ref.id;
  };

  const updateReserva = async (id, data) => {
    await updateDoc(doc(db, "reservas", id), {
      ...data,
      actualizadoEn: serverTimestamp(),
    });
  };

  const deleteReserva = async (id) => {
    await deleteDoc(doc(db, "reservas", id));
  };

  // ── CLIENTES ──────────────────────────────────────────────────────────────
  const addCliente = async (data) => {
    const ref = await addDoc(collection(db, "clientes"), {
      ...data,
      reservas: 0,
      creadoEn: serverTimestamp(),
    });
    return ref.id;
  };

  const updateCliente = async (id, data) => {
    await updateDoc(doc(db, "clientes", id), {
      ...data,
      actualizadoEn: serverTimestamp(),
    });
  };

  const deleteCliente = async (id) => {
    await deleteDoc(doc(db, "clientes", id));
  };

  // ── VENTAS ────────────────────────────────────────────────────────────────
  const addVenta = async (data) => {
    const ref = await addDoc(collection(db, "ventas"), {
      ...data,
      creadoEn: serverTimestamp(),
    });
    return ref.id;
  };

  const updateVenta = async (id, data) => {
    await updateDoc(doc(db, "ventas", id), {
      ...data,
      actualizadoEn: serverTimestamp(),
    });
  };

  const deleteVenta = async (id) => {
    await deleteDoc(doc(db, "ventas", id));
  };

  // ── STOCK ─────────────────────────────────────────────────────────────────
  const addStock = async (data) => {
    await addDoc(collection(db, "stock"), {
      ...data,
      creadoEn: serverTimestamp(),
    });
  };

  const updateStock = async (id, data) => {
    await updateDoc(doc(db, "stock", id), {
      ...data,
      actualizadoEn: serverTimestamp(),
    });
  };

  // Agrega un movimiento de consumo/ajuste al historial del ítem sin pisar otros campos
  const addMovimientoStock = async (id, nuevaCantidad, movimiento) => {
    await updateDoc(doc(db, "stock", id), {
      cantidad:      nuevaCantidad,
      movimientos:   arrayUnion(movimiento),
      actualizadoEn: serverTimestamp(),
    });
  };

  const deleteStock = async (id) => {
    await deleteDoc(doc(db, "stock", id));
  };

  // ── PRÉSTAMOS ─────────────────────────────────────────────────────────────
  const addPrestamo = async (data) => {
    await addDoc(collection(db, "prestamos"), {
      ...data,
      creadoEn: serverTimestamp(),
    });
  };

  const updatePrestamo = async (id, data) => {
    await updateDoc(doc(db, "prestamos", id), {
      ...data,
      actualizadoEn: serverTimestamp(),
    });
  };

  const deletePrestamo = async (id) => {
    await deleteDoc(doc(db, "prestamos", id));
  };

  // ── CANCHAS (canchas creadas dinámicamente — complementan las estáticas) ──
  const addCancha = async (data) => {
    await addDoc(collection(db, "canchas"), {
      ...data,
      creadoEn: serverTimestamp(),
    });
  };

  // ── BLOQUEOS (mantenimiento / bloqueos manuales de horarios) ─────────────
  // Estructura: { canchaId, fecha (YYYY-MM-DD), hora ("09:00"), motivo, tipo: "mantenimiento"|"bloqueo" }
  const addBloqueo = async (data) => {
    const ref = await addDoc(collection(db, "bloqueos"), {
      ...data,
      creadoEn: serverTimestamp(),
    });
    return ref.id;
  };

  // Crea múltiples bloqueos para un rango de fechas y horas (programar mantenimiento)
  const addBloqueoRango = async ({ canchaId, fechaDesde, fechaHasta, horaDesde, horaHasta, motivo, tipo }) => {
    const from = new Date(fechaDesde + "T12:00:00");
    const to   = new Date(fechaHasta + "T12:00:00");
    const hFrom = parseInt(horaDesde);
    const hTo   = parseInt(horaHasta);
    const promises = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const fecha = d.toISOString().split("T")[0];
      for (let h = hFrom; h < hTo; h++) {
        const hora = `${String(h).padStart(2, "0")}:00`;
        promises.push(addDoc(collection(db, "bloqueos"), {
          canchaId, fecha, hora, motivo, tipo,
          creadoEn: serverTimestamp(),
        }));
      }
    }
    await Promise.all(promises);
  };

  const deleteBloqueo = async (id) => {
    await deleteDoc(doc(db, "bloqueos", id));
  };

  // Elimina todos los bloqueos de una cancha en una fecha
  const deleteBloqueosCanchaFecha = async (canchaId, fecha) => {
    const toDelete = bloqueos.filter((b) => b.canchaId === canchaId && b.fecha === fecha);
    await Promise.all(toDelete.map((b) => deleteDoc(doc(db, "bloqueos", b.id))));
  };

  // ── CONFIG ────────────────────────────────────────────────────────────────
  const updateConfig = async (data) => {
    setConfigLocal((prev) => ({ ...prev, ...data }));
    await updateDoc(doc(db, "config", "general"), {
      ...data,
      actualizadoEn: serverTimestamp(),
    }).catch(async () => {
      // Si no existe el doc, lo crea
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "config", "general"), { ...data, actualizadoEn: serverTimestamp() });
    });
  };

  return (
    <StoreContext.Provider value={{
      // Auth
      currentUser, login, logout,
      // Datos
      reservas, clientes, ventas, stock, prestamos, config, bloqueos, canchas, loading,
      // Reservas
      addReserva, updateReserva, deleteReserva,
      // Clientes
      addCliente, updateCliente, deleteCliente,
      // Ventas
      addVenta, updateVenta, deleteVenta,
      // Stock
      addStock, updateStock, deleteStock, addMovimientoStock,
      // Préstamos
      addPrestamo, updatePrestamo, deletePrestamo,
      // Canchas dinámicas
      addCancha,
      // Bloqueos
      addBloqueo, addBloqueoRango, deleteBloqueo, deleteBloqueosCanchaFecha,
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
