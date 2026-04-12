import admin from "firebase-admin";

let db = null;

export function getDb() {
  if (db) return db;

  if (!admin.apps.length) {
    try {
      // 🛡️ Credenciales Hardcodeadas (Mantenemos tu configuración actual)
      const serviceAccount = {
        "type": "service_account",
        "project_id": "tancat-system",
        "private_key_id": "76a4f84f95b3132895daeaddb42fae13d2655cd7",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDnyOPNPuyb6ppW\n7B4f8si8WJdW10Rch4MnLKX/+U3zpM0eP1vfoBtZOge/cBigtbSqCVdYhr46fAn3\naA91FFXwTlUzq6ibD9rdknlFY3QfaEh7KJu0kJfgbtche3/+scjQ1tjgqklCB436\nOiJBZZsOZWlZdbJKJWTnK2/XYUy61A9iC+F3xFp9ZricT5BtMzub+e4vdXX+Rooy\nf6Obne1eF78vZPEUAeMFQ2JHxfmGpO4Ipmj96gJ1U1pU0+W4F5Oq3eedVv3XgalU\nYywe0+G05PZ1kzn8BcCgUA4LFB0cvMu9wBlV3G2C8ki30bNxLRrdizrmQ7ARyRm6\n2e8M0ZXBAgMBAAECggEAKtsgj6MKUZvTlK3MtiCIUBbbSKG90JP3wocFXGpmqN14\VZbmcFckp19M7m8WBqUCNgxLG6GyS5MCrr2NWhr79tYs98ROBPmuAJjkFlnYrzPz\nbt4nx/+SLVuhKF4y4M9Tb5XB/OxPZkeKT1FvYwMb49IJZBKYeBAo83s7Dyo86zAP\nVccTFjZvgUf28uQGQqTifBBV7jcA2wt7KeOw84JPZGXtzsBamRjuC7XzDtaaSpBg\nCPDrVe2XPIR63XHFL6JLTs6TEzuHhq6jlNLn9hYm2+bgCExDIjt+8l4sc2CKYaQT\nhQ2HjYEgoyq3b/oTQ5BbNiU5ptyjtW9yCBAIv5qZjwKBgQD7kbmICMTQqcKz3wUD\ny6a/l81UhwWk7zcmEDbcvSYf3/GX7nQIcPAeDYPx7QOqLU96Xn0HjFMu6gfGFoWx\n8xU1KdEb24oD4y8oxXNClwHI+BuuK9bt7N3AGntWUkoJaoKoATmzqyAzGO4Lnrhc\n8TnK4oOIHRuhAIvO+N6KV6wK8wKBgQDr3fXx7c8ySNyPA+V82JSFNRiq4rHFoN4u\n5eBPT2IpJUNgoR2rGLuSBLAYa4plYV5wZNtzJqJOG2el6B3/2nFGFx/VV4r7ff1L\nJsNGyyNGt9PAfnYCwtLWY4+uIRyvwOvk8iHivtgHEhH1RkcVCVgJoSCx/d8WJ1hS\n9GNskwUhewKBgQC89UZQYZXDzd9LT/bqVOuY+aLnHMwmiO/5jTBIOWMLiiBjqF5L\ngNk7GZfD/e1Ew+fw2Ew9gS9yC6NvLLebZCTH2/MPY6WVKe3gR/89Q0O5+nKALrmv\n2LzvcHS37/NggzpEizcWNzFmcBFNdRix5xcrx1xYvtRj6I8bFV/Ctfup9QKBgQC4\njmTzeHC3l+t8vD/FAHK2CGXU0KzpRoaTi6uIY0UbjNy7r1XXmvKpvqFLelpAGYAb\n0c8kuwYkt6zSVF2k5PfdMBrohCdrwZmARERoEGr52r0F0e3lGyx+NEkopyAbJYlv\nC0cYdNv0LF+A3AyimT0Zy8oZe9wjKYYi4rcpLaDGIQKBgQD23r5hXvXXhaFEQjG/\I74Go4lb1k8TKln7nBz4cumPiddNF6vgorgxfgnxXLgJr2kog9HdTisRG0ht88bt\Bj+Hzb3hfI/FrHpe7DVbQ4X5Z7B7Nzm3XRS1mIUapQRyEzRSxnVjMt0Q9otb8F5J\ypkWLq7R5tINosCa3YGizM6Elw==\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-fbsvc@tancat-system.iam.gserviceaccount.com",
        "client_id": "108753722540250439554",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40tancat-system.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("✅ Firebase conectado con éxito (Sintaxis Admin SDK).");
    } catch (e) {
      console.error("❌ [ERROR DE FIREBASE]:", e.message);
    }
  }
  db = admin.firestore();
  return db;
}

// --- FUNCIONES EXPORTADAS PARA EL BOTFLOW ---

/**
 * Busca un usuario por teléfono y devuelve su data + ID de documento.
 */
export async function buscarUsuario(phone) {
  try {
    const database = getDb();
    if (!database) return null;

    const snapshot = await database.collection("clientes")
      .where("telefono", "==", phone)
      .get();
    
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("❌ Error en buscarUsuario:", error);
    return null;
  }
}

/**
 * Guarda un cliente nuevo en la colección 'clientes' con Gmail y Ubicación.
 */
export async function guardarUsuario(phone, data) {
  try {
    const database = getDb();
    if (!database) return null;

    const docRef = await database.collection("clientes").add({
      nombre: data.nombre,
      email: data.email,
      ciudad: data.ciudad,
      telefono: phone,
      creadoEn: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`👤 Cliente ${data.nombre} creado con ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error al guardar usuario:", error);
    return null;
  }
}

/**
 * Obtiene todas las reservas.
 */
export async function getReservas() {
  try {
    const database = getDb();
    if (!database) return [];
    // Las traemos todas para que el bot pueda filtrar por cliente o disponibilidad
    const snap = await database.collection("reservas").get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("❌ Error al obtener reservas:", error);
    return [];
  }
}

/**
 * Crea una reserva en Firestore.
 */
export async function crearReserva(data) {
  try {
    const database = getDb();
    if (!database) return null;
    const ref = await database.collection("reservas").add({
      ...data,
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    console.error("❌ Error al crear reserva:", error);
    return null;
  }
}