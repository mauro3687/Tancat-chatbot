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
  const db = getDb();
  const q = query.toLowerCase().trim();
  const tel = query.replace(/[\s\-]/g, "");

  const [reservasSnap, clientesSnap] = await Promise.all([
    db.collection("reservas").get(),
    db.collection("clientes").get(),
  ]);

  const reservas = reservasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const clientes = clientesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 1. Buscar directamente por ID de reserva
  const porId = reservas.find((r) => r.id?.toLowerCase() === q);
  if (porId) return porId;

  // 2. Buscar cliente por nombre o teléfono, luego su reserva más reciente
  const cliente = clientes.find(
    (c) =>
      c.nombre?.toLowerCase().includes(q) ||
      (c.telefono && c.telefono.replace(/[\s\-]/g, "") === tel)
  );

  if (cliente) {
    // Devolver la reserva más reciente de ese cliente (no cancelada si es posible)
    const delCliente = reservas
      .filter((r) => r.clienteId === cliente.id)
      .sort((a, b) => {
        // Más reciente primero
        const fa = a.creadoEn?.seconds ?? 0;
        const fb = b.creadoEn?.seconds ?? 0;
        return fb - fa;
      });
    return delCliente.find((r) => r.estado !== "Cancelada") || delCliente[0] || null;
  }

  return null;
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

// Crea o actualiza un cliente por teléfono. Devuelve el clienteId.
export async function upsertCliente({ nombre, email, telefono }) {
  const snap = await getDb().collection("clientes")
    .where("telefono", "==", telefono)
    .limit(1)
    .get();

  if (!snap.empty) {
    const ref = snap.docs[0].ref;
    await ref.update({
      nombre,
      email,
      actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
    });
    return snap.docs[0].id;
  }

  const ref = await getDb().collection("clientes").add({
    nombre,
    email,
    telefono,
    ciudad: "",
    origen: "whatsapp",
    reservas: 0,
    creadoEn: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}
