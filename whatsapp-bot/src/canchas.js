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
  "local-1": { nombre:"TanCat — Local Centro", direccion:"Av. Colón 1234, Córdoba" },
  "local-2": { nombre:"TanCat — Local Norte",  direccion:"Ruta 36 Km 45, Córdoba"  },
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

export function getHorariosDisponibles(reservas, deporte, fechaSeleccionada) {
  const todosLosHorarios = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
  
  const ahora = new Date();
  const esHoy = formatFecha(fechaSeleccionada) === formatFecha(ahora);

  return todosLosHorarios.filter(horario => {
    // 1. Verificamos si el horario ya está ocupado en Firebase
    const ocupado = reservas.some(r => 
      r.deporte === deporte && 
      formatFecha(r.fecha) === formatFecha(fechaSeleccionada) && 
      r.horario.includes(horario) &&
      r.estado !== "Cancelada"
    );

    if (ocupado) return false;

    // 2. Lógica de tolerancia para el día de hoy
    if (esHoy) {
      const [horaH, minH] = horario.split(":").map(Number);
      const fechaHorario = new Date(ahora);
      fechaHorario.setHours(horaH, minH, 0, 0);

      // Margen de 5 minutos (300,000 milisegundos)
      const margenTolerancia = 5 * 60 * 1000; 
      
      // Si la hora actual menos el margen es mayor a la hora del turno, ya pasó
      if (ahora.getTime() - margenTolerancia > fechaHorario.getTime()) {
        return false;
      }
    }

    return true;
  });
}


// Solo fechas de la semana actual
// src/canchas.js

// whatsapp-bot/src/flows/botFlow.js

// whatsapp-bot/src/canchas.js

// whatsapp-bot/src/canchas.js

export function parsearFecha(input) {
  const texto = input.toLowerCase().trim();
  const hoy = new Date();
  let fechaFinal;
  
  // 1. Lógica para palabras relativas
  if (texto === "hoy") {
    fechaFinal = hoy;
  } else if (texto === "mañana") {
    fechaFinal = new Date();
    fechaFinal.setDate(hoy.getDate() + 1);
  } else {
    // 2. Lógica de regex para DD/MM
    const regex = /^(\d{1,2})\/(\d{1,2})(\/(\d{2,4}))?$/;
    const match = texto.match(regex);

    if (match) {
      let [_, dia, mes, __, anio] = match;
      fechaFinal = new Date(
        anio ? (anio.length === 2 ? 2000 + parseInt(anio) : parseInt(anio)) : hoy.getFullYear(),
        parseInt(mes) - 1,
        parseInt(dia)
      );
    }
  }

  // 🛡️ VALIDACIONES DE SEGURIDAD
  if (!fechaFinal || isNaN(fechaFinal.getTime())) {
    return { error: "⚠️ No entendí la fecha. Probá con 'Hoy', 'Mañana' o 'DD/MM'." };
  }
  
  // Resetear horas para comparar solo días
  const hoySinHora = new Date();
  hoySinHora.setHours(0,0,0,0);
  
  if (fechaFinal < hoySinHora) {
    return { error: "❌ No podés reservar para el pasado." };
  }

  return { fecha: fechaFinal };
}

// También corregimos formatFecha para que acepte objetos Date
export function formatFecha(fecha) {
  if (!fecha) return "";

  // 1. Si ya es un String (ej: "2026-04-12") lo desarmamos y rearmamos
  if (typeof fecha === 'string') {
    if (fecha.includes("-")) {
      const [y, m, d] = fecha.split("-");
      return `${d}/${m}/${y}`;
    }
    return fecha; // Si no tiene guiones, lo devolvemos tal cual
  }

  // 2. Si es un Objeto Date real, usamos los métodos de fecha
  try {
    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
      const d = String(fecha.getDate()).padStart(2, "0");
      const m = String(fecha.getMonth() + 1).padStart(2, "0");
      const y = fecha.getFullYear();
      return `${d}/${m}/${y}`;
    }
  } catch (e) {
    console.error("Error en formatFecha:", e);
  }

  return String(fecha);
}