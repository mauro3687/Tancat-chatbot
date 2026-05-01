// src/data/canchas.js — Estructura de locales, canchas y horarios

export const LOCALES = {
  "local-1": { nombre: "TanCat — Local Jacinto Ríos", direccion: "Av. Colón 1234, Córdoba" },
  "local-2": { nombre: "TanCat — Local Rincón",       direccion: "Ruta 36 Km 45, Córdoba" },
};

export const CANCHAS = [
  { id: "C1", localId: "local-1", deporte: "padel",    nombre: "Padel 1",    capacidad: 4 },
  { id: "C2", localId: "local-1", deporte: "padel",    nombre: "Padel 2",    capacidad: 4 },
  { id: "C3", localId: "local-2", deporte: "padel",    nombre: "Padel 3",    capacidad: 4 },
  { id: "C4", localId: "local-2", deporte: "padel",    nombre: "Padel 4",    capacidad: 4 },
  { id: "C5", localId: "local-1", deporte: "basquet",  nombre: "Básquet 1",  capacidad: 10 },
  { id: "C6", localId: "local-2", deporte: "basquet",  nombre: "Básquet 2",  capacidad: 10 },
  { id: "C7", localId: "local-1", deporte: "voley",    nombre: "Voley",      capacidad: 12 },
];

export const DEPORTES = ["padel", "basquet", "voley"];

export const DEPORTE_EMOJI = { padel: "🎾", basquet: "🏀", voley: "🏐" };

// Horarios disponibles (turnos de 1 hora, 8 a 22)
export const HORARIOS = Array.from({ length: 14 }, (_, i) => {
  const h = 8 + i;
  return `${String(h).padStart(2,"0")}:00 — ${String(h+1).padStart(2,"0")}:00`;
});

// Precio de seña por deporte (30% del total)
export const PRECIOS = { padel: 8000, basquet: 12000, voley: 10000 };
export const SENA_PCT = 0.30;

// Parsea un horario "HH:00 — HH:00" y devuelve { inicio, fin } en horas enteras
function parseRango(horario) {
  if (!horario) return null;
  const parts = horario.split("—").map((s) => parseInt(s.trim()));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return { inicio: parts[0], fin: parts[1] };
}

// Dado deporte + fecha + horario, devuelve la primer cancha libre.
// Usa comparación de rangos para detectar solapamiento correctamente.
export function asignarCancha(reservas, deporte, fecha, horario) {
  const canchasDeporte = CANCHAS.filter((c) => c.deporte === deporte);
  const rango = parseRango(horario);
  const ocupadas = new Set(
    reservas
      .filter((r) => {
        if (r.deporte !== deporte || r.fecha !== fecha || r.estado === "Cancelada") return false;
        if (!rango) return r.horario === horario;
        const ex = parseRango(r.horario);
        return ex && ex.inicio < rango.fin && ex.fin > rango.inicio;
      })
      .map((r) => r.canchaId)
  );
  return canchasDeporte.find((c) => !ocupadas.has(c.id)) || null;
}
