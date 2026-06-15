// src/services/reservas.service.js — CRUD de reservas en Firestore
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";
import { nextSequentialId } from "./counters.service.js";

export async function addReserva(data) {
  const id = await nextSequentialId("reservas");
  await setDoc(doc(db, "reservas", id), {
    ...data,
    creadoEn: serverTimestamp(),
  });
  return id;
}

export async function updateReserva(id, data) {
  await updateDoc(doc(db, "reservas", id), {
    ...data,
    actualizadoEn: serverTimestamp(),
  });
}

export async function deleteReserva(id) {
  await deleteDoc(doc(db, "reservas", id));
}
