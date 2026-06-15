// src/services/clientes.service.js — CRUD de clientes en Firestore
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";
import { nextSequentialId } from "./counters.service.js";

export async function addCliente(data) {
  const id = await nextSequentialId("clientes");
  await setDoc(doc(db, "clientes", id), {
    ...data,
    reservas: 0,
    creadoEn: serverTimestamp(),
  });
  return id;
}

export async function updateCliente(id, data) {
  await updateDoc(doc(db, "clientes", id), {
    ...data,
    actualizadoEn: serverTimestamp(),
  });
}

export async function deleteCliente(id) {
  await deleteDoc(doc(db, "clientes", id));
}

// Elimina el cliente + todas sus reservas, ventas (restaurando stock) y préstamos activos
export async function deleteClienteConRelaciones(clienteId, { reservas, ventas, stock, prestamos }) {
  // 1. Reservas
  const reservasCliente = reservas.filter((r) => r.clienteId === clienteId);
  await Promise.all(reservasCliente.map((r) => deleteDoc(doc(db, "reservas", r.id))));

  // 2. Ventas + restaurar stock
  const ventasCliente = ventas.filter((v) => v.clienteId === clienteId);
  for (const v of ventasCliente) {
    await deleteDoc(doc(db, "ventas", v.id));
    if (v.tipo === "recibo" && Array.isArray(v.lineas)) {
      for (const l of v.lineas.filter((ln) => ln.tipo === "consumible" && ln.productoId)) {
        const prod = stock.find((s) => s.id === l.productoId);
        if (prod) await updateDoc(doc(db, "stock", prod.id), { cantidad: prod.cantidad + Number(l.cantidad), actualizadoEn: serverTimestamp() });
      }
    } else if (v.productoId && v.cantidad) {
      const prod = stock.find((s) => s.id === v.productoId);
      if (prod) await updateDoc(doc(db, "stock", prod.id), { cantidad: prod.cantidad + Number(v.cantidad), actualizadoEn: serverTimestamp() });
    }
  }

  // 3. Préstamos activos + restaurar stock de equipamiento
  const prestamosCliente = (prestamos ?? []).filter((p) => p.clienteId === clienteId);
  for (const p of prestamosCliente) {
    if (p.estado === "entregado" && p.stockItemId) {
      const item = stock.find((s) => s.id === p.stockItemId);
      if (item) await updateDoc(doc(db, "stock", item.id), { cantidad: item.cantidad + Number(p.cantidad), actualizadoEn: serverTimestamp() });
    }
    await deleteDoc(doc(db, "prestamos", p.id));
  }

  // 4. Cliente
  await deleteDoc(doc(db, "clientes", clienteId));
}
