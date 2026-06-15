// src/services/config.service.js — configuración general del sistema
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

export async function updateConfigRemote(data) {
  await updateDoc(doc(db, "config", "general"), {
    ...data,
    actualizadoEn: serverTimestamp(),
  }).catch(async () => {
    // Si no existe el doc, lo crea
    await setDoc(doc(db, "config", "general"), { ...data, actualizadoEn: serverTimestamp() });
  });
}
