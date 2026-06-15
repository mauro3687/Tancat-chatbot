// src/hooks/useCollection.js — Hook para suscribirse a una colección Firestore en tiempo real
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase.js";

export function useCollection(colName) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, colName),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Ordenar por creadoEn en el cliente — evita dependencia de índices Firestore
        docs.sort((a, b) => {
          const ta = a.creadoEn?.seconds ?? 0;
          const tb = b.creadoEn?.seconds ?? 0;
          return tb - ta;
        });
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(`Error en colección ${colName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [colName]);

  return { data, loading, error };
}
