import admin from "firebase-admin";

let db = null;

export function getDb() {
  if (db) return db;
  if (!admin.apps.length) {
    try {
      // 🔐 Decodificamos el Base64 que pusiste en el .env para evitar errores de JSON
      const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
      const decoded = Buffer.from(b64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decoded);
      
      admin.initializeApp({ 
        credential: admin.credential.cert(serviceAccount) 
      });
    } catch (error) {
      console.error("❌ ERROR FATAL EN FIREBASE JSON:", error.message);
      throw error;
    }
  }
  db = admin.firestore();
  return db;
}

// --- GESTIÓN DE RESERVAS ---

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

// --- GESTIÓN DE USUARIOS (REGISTRO TANCAT) ---

export async function buscarUsuario(phone) {
  const doc = await getDb().collection("usuarios").doc(phone).get();
  return doc.exists ? doc.data() : null;
}

export async function guardarUsuario(phone, datos) {
  await getDb().collection("usuarios").doc(phone).set({
    ...datos,
    actualizadoEn: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

export async function getConfig() {
  const snap = await getDb().collection("config").doc("general").get();
  return snap.exists ? snap.data() : {};
}