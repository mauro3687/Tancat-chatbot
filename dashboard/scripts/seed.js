// scripts/seed.js — Carga datos iniciales en Firestore
// Ejecutar UNA SOLA VEZ con: node scripts/seed.js

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXPS4HjFx0Drk9mLXmabLFo7nLDrz1YDg",
  authDomain: "tancat-system.firebaseapp.com",
  projectId: "tancat-system",
  storageBucket: "tancat-system.firebasestorage.app",
  messagingSenderId: "536414510727",
  appId: "1:536414510727:web:8e8b1151cb89b2d751e222",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const clientes = [
  { nombre: "Ana Gómez",      email: "ana@email.com",    telefono: "3511112222", ciudad: "Córdoba",      reservas: 3 },
  { nombre: "Carlos Ruiz",    email: "carlos@email.com", telefono: "3513334444", ciudad: "Buenos Aires", reservas: 1 },
  { nombre: "Lucía Pérez",    email: "lucia@email.com",  telefono: "3515556666", ciudad: "Rosario",      reservas: 2 },
  { nombre: "Martín López",   email: "martin@email.com", telefono: "3517778888", ciudad: "Córdoba",      reservas: 1 },
  { nombre: "Sofía Díaz",     email: "sofia@email.com",  telefono: "3519990000", ciudad: "Mendoza",      reservas: 4 },
  { nombre: "Diego Herrera",  email: "diego@email.com",  telefono: "3511123344", ciudad: "Córdoba",      reservas: 1 },
  { nombre: "Valentina Cruz", email: "valen@email.com",  telefono: "3515567788", ciudad: "Salta",        reservas: 2 },
  { nombre: "Tomás Vega",     email: "tomas@email.com",  telefono: "3519901122", ciudad: "Córdoba",      reservas: 1 },
];

const reservas = [
  { cliente:"Ana Gómez",      email:"ana@email.com",    telefono:"3511112222", deporte:"padel",   canchaId:"C1", cancha:"Padel 1",   localId:"local-1", servicio:"🎾 Pádel — Padel 1",   fecha:"2026-03-17", horario:"16:00 — 17:00", personas:4,  monto:8000,  sena:2400, estado:"Confirmada", notas:"" },
  { cliente:"Carlos Ruiz",    email:"carlos@email.com", telefono:"3513334444", deporte:"basquet", canchaId:"C5", cancha:"Básquet 1", localId:"local-1", servicio:"🏀 Básquet — Básquet 1", fecha:"2026-03-18", horario:"10:00 — 11:00", personas:10, monto:12000, sena:3600, estado:"Pendiente",  notas:"Necesita pecheras" },
  { cliente:"Lucía Pérez",    email:"lucia@email.com",  telefono:"3515556666", deporte:"padel",   canchaId:"C2", cancha:"Padel 2",   localId:"local-1", servicio:"🎾 Pádel — Padel 2",   fecha:"2026-03-19", horario:"18:00 — 19:00", personas:4,  monto:8000,  sena:2400, estado:"Confirmada", notas:"" },
  { cliente:"Martín López",   email:"martin@email.com", telefono:"3517778888", deporte:"voley",   canchaId:"C7", cancha:"Voley",     localId:"local-1", servicio:"🏐 Voley — Voley",       fecha:"2026-03-20", horario:"20:00 — 21:00", personas:12, monto:10000, sena:3000, estado:"Cancelada",  notas:"" },
  { cliente:"Sofía Díaz",     email:"sofia@email.com",  telefono:"3519990000", deporte:"padel",   canchaId:"C3", cancha:"Padel 3",   localId:"local-2", servicio:"🎾 Pádel — Padel 3",   fecha:"2026-03-21", horario:"16:00 — 17:00", personas:4,  monto:8000,  sena:2400, estado:"Confirmada", notas:"" },
  { cliente:"Diego Herrera",  email:"diego@email.com",  telefono:"3511123344", deporte:"basquet", canchaId:"C6", cancha:"Básquet 2", localId:"local-2", servicio:"🏀 Básquet — Básquet 2", fecha:"2026-03-22", horario:"09:00 — 10:00", personas:10, monto:12000, sena:3600, estado:"Pendiente",  notas:"" },
  { cliente:"Valentina Cruz", email:"valen@email.com",  telefono:"3515567788", deporte:"padel",   canchaId:"C1", cancha:"Padel 1",   localId:"local-1", servicio:"🎾 Pádel — Padel 1",   fecha:"2026-03-23", horario:"17:00 — 18:00", personas:4,  monto:8000,  sena:2400, estado:"Confirmada", notas:"" },
  { cliente:"Tomás Vega",     email:"tomas@email.com",  telefono:"3519901122", deporte:"padel",   canchaId:"C4", cancha:"Padel 4",   localId:"local-2", servicio:"🎾 Pádel — Padel 4",   fecha:"2026-03-24", horario:"19:00 — 20:00", personas:4,  monto:8000,  sena:2400, estado:"Pendiente",  notas:"" },
];

const ventas = [
  { cliente:"Ana Gómez",      servicio:"🎾 Pádel",   fecha:"2026-03-17", monto:8000,  metodoPago:"Transferencia", estado:"Cobrado" },
  { cliente:"Lucía Pérez",    servicio:"🎾 Pádel",   fecha:"2026-03-19", monto:8000,  metodoPago:"Efectivo",      estado:"Cobrado" },
  { cliente:"Sofía Díaz",     servicio:"🎾 Pádel",   fecha:"2026-03-21", monto:8000,  metodoPago:"Tarjeta",       estado:"Cobrado" },
  { cliente:"Valentina Cruz", servicio:"🎾 Pádel",   fecha:"2026-03-23", monto:8000,  metodoPago:"Transferencia", estado:"Cobrado" },
  { cliente:"Carlos Ruiz",    servicio:"🏀 Básquet", fecha:"2026-03-18", monto:3600,  metodoPago:"Efectivo",      estado:"Seña"    },
  { cliente:"Diego Herrera",  servicio:"🏀 Básquet", fecha:"2026-03-22", monto:3600,  metodoPago:"Transferencia", estado:"Seña"    },
];

const stock = [
  { nombre:"Pelotas de Pádel",    cantidad:24, max:60,  unidad:"u" },
  { nombre:"Pelotas de Básquet",  cantidad:8,  max:20,  unidad:"u" },
  { nombre:"Pelotas de Voley",    cantidad:5,  max:12,  unidad:"u" },
  { nombre:"Pecheras",            cantidad:15, max:40,  unidad:"u" },
  { nombre:"Mallas de red",       cantidad:3,  max:10,  unidad:"u" },
  { nombre:"Paletas de Pádel",    cantidad:12, max:30,  unidad:"u" },
  { nombre:"Bebidas/Agua",        cantidad:48, max:200, unidad:"u" },
  { nombre:"Botiquín primeros auxilios", cantidad:2, max:4, unidad:"u" },
];

const configGeneral = {
  nombre: "TanCat", razonSocial: "TanCat S.R.L.", cuit: "30-71234567-8",
  email: "info@tancat.com.ar", telefono: "351-000-0000",
  direccion: "Ruta 36 Km 45, Córdoba", checkin: "08:00", checkout: "22:00",
  atencion: "08:00 - 22:00", sena: 30, cancelacion: 48,
};

async function seed() {
  console.log("🌱 Iniciando carga de datos en Firestore...\n");

  // Config
  await setDoc(doc(db, "config", "general"), { ...configGeneral, actualizadoEn: serverTimestamp() });
  console.log("✅ Config cargada");

  // Clientes
  for (const c of clientes) {
    await addDoc(collection(db, "clientes"), { ...c, creadoEn: serverTimestamp() });
  }
  console.log(`✅ ${clientes.length} clientes cargados`);

  // Reservas
  for (const r of reservas) {
    await addDoc(collection(db, "reservas"), { ...r, creadoEn: serverTimestamp() });
  }
  console.log(`✅ ${reservas.length} reservas cargadas`);

  // Ventas
  for (const v of ventas) {
    await addDoc(collection(db, "ventas"), { ...v, creadoEn: serverTimestamp() });
  }
  console.log(`✅ ${ventas.length} ventas cargadas`);

  // Stock
  for (const s of stock) {
    await addDoc(collection(db, "stock"), { ...s, creadoEn: serverTimestamp() });
  }
  console.log(`✅ ${stock.length} items de stock cargados`);

  console.log("\n🎉 ¡Datos cargados exitosamente en Firestore!");
  process.exit(0);
}

seed().catch((err) => { console.error("❌ Error:", err); process.exit(1); });
