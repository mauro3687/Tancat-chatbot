// src/firebase/client.js — Firebase Admin SDK
import admin from "firebase-admin";

let db = null;

export function getDb() {
  if (db) return db;
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  db = admin.firestore();
  return db;
}

export async function getReservas() {
  const snap = await getDb().collection("reservas").orderBy("creadoEn","desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function buscarReserva(query) {
  const snap = await getDb().collection("reservas").get();
  const q = query.toLowerCase().trim();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .find((r) =>
      r.id?.toLowerCase() === q ||
      r.cliente?.toLowerCase().includes(q) ||
      r.telefono === query.replace(/[\s\-]/g,"")
    ) || null;
}

export async function crearReserva(data) {
  const ref = await getDb().collection("reservas").add({
    ...data,
    creadoEn: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function actualizarReserva(id, data) {
  await getDb().collection("reservas").doc(id).update({
    ...data,
    actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function getConfig() {
  const snap = await getDb().collection("config").doc("general").get();
  return snap.exists ? snap.data() : {};
}
