// src/services/bloqueos.service.js — bloqueos/mantenimiento de horarios y canchas
// Estructura: { canchaId, fecha (YYYY-MM-DD), hora ("09:00"), motivo, tipo: "mantenimiento"|"bloqueo" }
import { collection, doc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

export async function addBloqueo(data) {
  const ref = await addDoc(collection(db, "bloqueos"), {
    ...data,
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

// Crea múltiples bloqueos para un rango de fechas y horas (programar mantenimiento)
export async function addBloqueoRango({ canchaId, fechaDesde, fechaHasta, horaDesde, horaHasta, motivo, tipo }) {
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
}

export async function deleteBloqueo(id) {
  await deleteDoc(doc(db, "bloqueos", id));
}

// Elimina todos los bloqueos de una cancha en una fecha
export async function deleteBloqueosCanchaFecha(canchaId, fecha, bloqueos) {
  const toDelete = bloqueos.filter((b) => b.canchaId === canchaId && b.fecha === fecha);
  await Promise.all(toDelete.map((b) => deleteDoc(doc(db, "bloqueos", b.id))));
}
