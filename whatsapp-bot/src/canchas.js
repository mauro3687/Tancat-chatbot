// src/canchas.js — Estructura de canchas (igual que el frontend)
export const CANCHAS = [
  { id:"C1", localId:"local-1", deporte:"padel",   nombre:"Padel 1",   capacidad:4  },
  { id:"C2", localId:"local-1", deporte:"padel",   nombre:"Padel 2",   capacidad:4  },
  { id:"C3", localId:"local-2", deporte:"padel",   nombre:"Padel 3",   capacidad:4  },
  { id:"C4", localId:"local-2", deporte:"padel",   nombre:"Padel 4",   capacidad:4  },
  { id:"C5", localId:"local-1", deporte:"basquet", nombre:"Básquet 1", capacidad:10 },
  { id:"C6", localId:"local-2", deporte:"basquet", nombre:"Básquet 2", capacidad:10 },
  { id:"C7", localId:"local-1", deporte:"voley",   nombre:"Voley",     capacidad:12 },
];

export const LOCALES = {
  "local-1": { nombre:"TanCat — Local Jacinto Ríos", direccion:"Jacinto Ríos 232, Córdoba" },
  "local-2": { nombre:"TanCat — Rincón",  direccion:"Rincón 985, Córdoba"  },
};

export const HORARIOS = Array.from({ length:14 }, (_,i) => {
  const h = 8 + i;
  return `${String(h).padStart(2,"0")}:00 — ${String(h+1).padStart(2,"0")}:00`;
});

export const PRECIOS     = { padel:8000, basquet:12000, voley:10000 };
export const SENA_PCT    = 0.30;
export const EMOJI       = { padel:"🎾", basquet:"🏀", voley:"🏐" };

export function asignarCancha(reservas, deporte, fecha, horario) {
  const canchasDeporte = CANCHAS.filter((c) => c.deporte === deporte);
  const ocupadas = new Set(
    reservas
      .filter((r) => r.deporte===deporte && r.fecha===fecha && r.horario===horario && r.estado!=="Cancelada")
      .map((r) => r.canchaId)
  );
  return canchasDeporte.find((c) => !ocupadas.has(c.id)) || null;
}

export function getHorariosDisponibles(reservas, deporte, fecha) {
  const canchasDeporte = CANCHAS.filter((c) => c.deporte === deporte);
  return HORARIOS.filter((h) => {
    const ocupadas = reservas.filter(
      (r) => r.deporte===deporte && r.fecha===fecha && r.horario===h && r.estado!=="Cancelada"
    ).length;
    return ocupadas < canchasDeporte.length;
  });
}

// Solo fechas de la semana actual
export function parsearFecha(input) {
  const match = input.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!match) return { error:"formato" };
  const [,d,m,y] = match;
  const fecha = new Date(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`);
  if (isNaN(fecha.getTime())) return { error:"invalida" };
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const diaSemana = hoy.getDay();
  const domingo = new Date(hoy); domingo.setDate(hoy.getDate() + (diaSemana===0?0:7-diaSemana)); domingo.setHours(23,59,59,999);
  if (fecha < hoy) return { error:"pasada" };
  if (fecha > domingo) return { error:"fuera_semana", hasta: `${String(domingo.getDate()).padStart(2,"0")}/${String(domingo.getMonth()+1).padStart(2,"0")}/${domingo.getFullYear()}` };
  return { fecha: `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}` };
}

export function formatFecha(iso) {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
