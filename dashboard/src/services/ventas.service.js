// src/services/ventas.service.js — CRUD de ventas en Firestore
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";
import { nextSequentialId } from "./counters.service.js";

export async function addVenta(data) {
  const id = await nextSequentialId("ventas");
  await setDoc(doc(db, "ventas", id), {
    ...data,
    creadoEn: serverTimestamp(),
  });
  return id;
}

export async function updateVenta(id, data) {
  await updateDoc(doc(db, "ventas", id), {
    ...data,
    actualizadoEn: serverTimestamp(),
  });
}

export async function deleteVenta(id) {
  await deleteDoc(doc(db, "ventas", id));
}
