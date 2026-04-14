// src/data/store.jsx — Estado global conectado a Firebase Firestore en tiempo real

import { createContext, useContext, useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase.js";

// ── Constantes del negocio (no van a Firestore) ───────────────────────────────
export const SERVICIOS = [
  { nombre: "Pádel",    precio: 8000  },
  { nombre: "Básquet",  precio: 12000 },
  { nombre: "Voley",    precio: 10000 },
];

// ── Usuarios del sistema ──────────────────────────────────────────────────────
export const USUARIOS = [
  { id: "admin",     nombre: "Admin",         rol: "admin",     password: "admin123" },
  { id: "encargado", nombre: "Enc. Sucursal",  rol: "encargado", password: "enc123"   },
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
    const u = USUARIOS.find((u) => u.id === id && u.password === password);
    if (u) { setCurrentUser(u); return true; }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const { data: reservas,  loading: loadingReservas  } = useCollection("reservas");
  const { data: clientes,  loading: loadingClientes  } = useCollection("clientes");
  const { data: ventas,    loading: loadingVentas    } = useCollection("ventas");
  const { data: stock,     loading: loadingStock     } = useCollection("stock");
  const [config, setConfigLocal] = useState({
    nombre: "TanCat", razonSocial: "TanCat S.R.L.", cuit: "30-71234567-8",
    email: "info@tancat.com.ar", telefono: "351-000-0000",
    direccion: "Ruta 36 Km 45, Córdoba", checkin: "14:00", checkout: "11:00",
    atencion: "08:00 - 22:00", sena: 30, cancelacion: 48,
    precios: { padel: 8000, basquet: 12000, voley: 10000 },
  });

  const loading = loadingReservas || loadingClientes || loadingVentas || loadingStock;

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

  const deleteStock = async (id) => {
    await deleteDoc(doc(db, "stock", id));
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
      reservas, clientes, ventas, stock, config, loading,
      // Reservas
      addReserva, updateReserva, deleteReserva,
      // Clientes
      addCliente, updateCliente, deleteCliente,
      // Ventas
      addVenta, updateVenta, deleteVenta,
      // Stock
      addStock, updateStock, deleteStock,
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
