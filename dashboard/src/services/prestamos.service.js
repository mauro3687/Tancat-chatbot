// src/services/prestamos.service.js — CRUD de préstamos de equipamiento en Firestore
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

export async function addPrestamo(data) {
  await addDoc(collection(db, "prestamos"), {
    ...data,
    creadoEn: serverTimestamp(),
  });
}

export async function updatePrestamo(id, data) {
  await updateDoc(doc(db, "prestamos", id), {
    ...data,
    actualizadoEn: serverTimestamp(),
  });
}

export async function deletePrestamo(id) {
  await deleteDoc(doc(db, "prestamos", id));
}
