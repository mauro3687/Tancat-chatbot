// src/services/stock.service.js — CRUD de stock/equipamiento en Firestore
import { doc, setDoc, updateDoc, deleteDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";
import { nextSequentialId } from "./counters.service.js";

export async function addStock(data) {
  const id = await nextSequentialId("stock");
  await setDoc(doc(db, "stock", id), {
    ...data,
    creadoEn: serverTimestamp(),
  });
}

export async function updateStock(id, data) {
  await updateDoc(doc(db, "stock", id), {
    ...data,
    actualizadoEn: serverTimestamp(),
  });
}

// Agrega un movimiento de consumo/ajuste al historial del ítem sin pisar otros campos
export async function addMovimientoStock(id, nuevaCantidad, movimiento) {
  await updateDoc(doc(db, "stock", id), {
    cantidad:      nuevaCantidad,
    movimientos:   arrayUnion(movimiento),
    actualizadoEn: serverTimestamp(),
  });
}

export async function deleteStock(id) {
  await deleteDoc(doc(db, "stock", id));
}
