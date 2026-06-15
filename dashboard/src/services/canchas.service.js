// src/services/canchas.service.js — canchas creadas dinámicamente (complementan las estáticas)
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

export async function addCancha(data) {
  await addDoc(collection(db, "canchas"), {
    ...data,
    creadoEn: serverTimestamp(),
  });
}
