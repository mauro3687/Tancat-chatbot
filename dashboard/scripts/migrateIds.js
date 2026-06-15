// scripts/migrateIds.js — Renumera clientes, stock, reservas y ventas a IDs
// secuenciales (1, 2, 3...) y actualiza las referencias cruzadas (clienteId,
// productoId, stockItemId) en reservas, ventas y prestamos.
//
// Antes de modificar nada, guarda un backup de los datos originales en
// scripts/backup-ids-<timestamp>.json
//
// Ejecutar UNA SOLA VEZ con: node scripts/migrateIds.js

import { writeFileSync } from "fs";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc,
} from "firebase/firestore";

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

function tsValue(d) {
  return d.creadoEn?.seconds ?? 0;
}

async function fetchAll(colName) {
  const snap = await getDocs(collection(db, colName));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function buildIdMap(docs) {
  const map = {};
  docs.forEach((d, i) => { map[d.id] = String(i + 1); });
  return map;
}

async function migrate() {
  console.log("Leyendo colecciones...");
  const clientes  = (await fetchAll("clientes")).sort((a, b) => tsValue(a) - tsValue(b));
  const stock     = (await fetchAll("stock")).sort((a, b) => tsValue(a) - tsValue(b));
  const reservas  = (await fetchAll("reservas")).sort((a, b) => tsValue(a) - tsValue(b));
  const ventas    = (await fetchAll("ventas")).sort((a, b) => tsValue(a) - tsValue(b));
  const prestamos = await fetchAll("prestamos");

  // Backup de los datos originales antes de tocar nada
  const backupFile = `scripts/backup-ids-${Date.now()}.json`;
  writeFileSync(backupFile, JSON.stringify({ clientes, stock, reservas, ventas, prestamos }, null, 2));
  console.log(`Backup guardado en ${backupFile}`);

  const clienteMap = buildIdMap(clientes);
  const stockMap   = buildIdMap(stock);
  const reservaMap = buildIdMap(reservas);
  const ventaMap   = buildIdMap(ventas);

  // 1. Clientes
  for (const c of clientes) {
    const { id: oldId, ...data } = c;
    await setDoc(doc(db, "clientes", clienteMap[oldId]), data);
  }
  for (const c of clientes) {
    if (c.id !== clienteMap[c.id]) await deleteDoc(doc(db, "clientes", c.id));
  }
  console.log(`Clientes renumerados: ${clientes.length}`);

  // 2. Stock
  for (const s of stock) {
    const { id: oldId, ...data } = s;
    await setDoc(doc(db, "stock", stockMap[oldId]), data);
  }
  for (const s of stock) {
    if (s.id !== stockMap[s.id]) await deleteDoc(doc(db, "stock", s.id));
  }
  console.log(`Stock renumerado: ${stock.length}`);

  // 3. Reservas (actualiza clienteId)
  for (const r of reservas) {
    const { id: oldId, ...data } = r;
    if (data.clienteId && clienteMap[data.clienteId]) data.clienteId = clienteMap[data.clienteId];
    await setDoc(doc(db, "reservas", reservaMap[oldId]), data);
  }
  for (const r of reservas) {
    if (r.id !== reservaMap[r.id]) await deleteDoc(doc(db, "reservas", r.id));
  }
  console.log(`Reservas renumeradas: ${reservas.length}`);

  // 4. Ventas (actualiza clienteId, productoId, lineas[].productoId)
  for (const v of ventas) {
    const { id: oldId, ...data } = v;
    if (data.clienteId && clienteMap[data.clienteId]) data.clienteId = clienteMap[data.clienteId];
    if (data.productoId && stockMap[data.productoId]) data.productoId = stockMap[data.productoId];
    if (Array.isArray(data.lineas)) {
      data.lineas = data.lineas.map((l) =>
        l.productoId && stockMap[l.productoId] ? { ...l, productoId: stockMap[l.productoId] } : l
      );
    }
    await setDoc(doc(db, "ventas", ventaMap[oldId]), data);
  }
  for (const v of ventas) {
    if (v.id !== ventaMap[v.id]) await deleteDoc(doc(db, "ventas", v.id));
  }
  console.log(`Ventas renumeradas: ${ventas.length}`);

  // 5. Préstamos (actualiza clienteId y stockItemId, mantiene su propio ID)
  let prestamosActualizados = 0;
  for (const p of prestamos) {
    const updates = {};
    if (p.clienteId && clienteMap[p.clienteId]) updates.clienteId = clienteMap[p.clienteId];
    if (p.stockItemId && stockMap[p.stockItemId]) updates.stockItemId = stockMap[p.stockItemId];
    if (Object.keys(updates).length) {
      await updateDoc(doc(db, "prestamos", p.id), updates);
      prestamosActualizados++;
    }
  }
  console.log(`Préstamos con referencias actualizadas: ${prestamosActualizados}/${prestamos.length}`);

  // 6. Contadores para que los próximos addX continúen la numeración
  await setDoc(doc(db, "config", "counters"), {
    clientes: clientes.length,
    stock: stock.length,
    reservas: reservas.length,
    ventas: ventas.length,
  }, { merge: true });
  console.log("Contadores inicializados en config/counters");

  console.log("\nMigración completa.");
  process.exit(0);
}

migrate().catch((err) => { console.error("Error:", err); process.exit(1); });
