// src/services/counters.service.js — IDs secuenciales (1, 2, 3...) por colección
import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase.js";

export async function nextSequentialId(colName) {
  const counterRef = doc(db, "config", "counters");
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? (snap.data()[colName] || 0) : 0;
    const value = current + 1;
    tx.set(counterRef, { [colName]: value }, { merge: true });
    return value;
  });
  return String(next);
}
