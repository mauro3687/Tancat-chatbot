// src/data/canchas.js — Estructura de locales, canchas y horarios

export const LOCALES = {
  "local-1": { nombre: "TanCat — Local Centro", direccion: "Av. Colón 1234, Córdoba" },
  "local-2": { nombre: "TanCat — Local Norte",  direccion: "Ruta 36 Km 45, Córdoba" },
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

// Dado deporte + fecha + horario, devuelve la primer cancha libre
export function asignarCancha(reservas, deporte, fecha, horario) {
  const canchasDeporte = CANCHAS.filter((c) => c.deporte === deporte);
  const ocupadas = new Set(
    reservas
      .filter((r) => r.deporte === deporte && r.fecha === fecha && r.horario === horario && r.estado !== "Cancelada")
      .map((r) => r.canchaId)
  );
  return canchasDeporte.find((c) => !ocupadas.has(c.id)) || null;
}
