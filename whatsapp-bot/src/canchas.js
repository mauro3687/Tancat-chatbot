import axios from "axios";

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


const reservaEstaActiva = (r) => {
  if (r.estado === "Confirmada") return true;
  if (r.estado === "Cancelada") return false;
  
  if (r.estado === "Pendiente") {
    const ahora = new Date();
    const creacion = new Date(r.createdAt);
    const diferenciaHoras = (ahora - creacion) / (1000 * 60 * 60);
    return diferenciaHoras < 1; 
  }
  return false;
};

export const HORARIOS = Array.from({ length:14 }, (_,i) => {
  const h = 8 + i;
  return `${String(h).padStart(2,"0")}:00 — ${String(h+1).padStart(2,"0")}:00`;
});

export const PRECIOS  = { padel:8000, basquet:12000, voley:10000 };
export const SENA_PCT = 0.30;
export const EMOJI    = { padel:"🎾", basquet:"🏀", voley:"🏐" };

export function asignarCancha(reservas, deporte, fecha, horario) {
  const canchasDeporte = CANCHAS.filter((c) => c.deporte === deporte);
  const ocupadas = new Set(
    reservas
      .filter((r) => r.deporte===deporte && r.fecha===fecha && r.horario===horario && reservaEstaActiva(r))
      .map((r) => r.canchaId)
  );
  return canchasDeporte.find((c) => !ocupadas.has(c.id)) || null;
}

export function getHorariosDisponibles(reservas, deporte, fecha) {
  const canchasDeporte = CANCHAS.filter((c) => c.deporte === deporte);
  
  
  const ahora = new Date();
  const opciones = { timeZone: "America/Argentina/Cordoba", year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
  const formatter = new Intl.DateTimeFormat('en-US', opciones);
  const parts = formatter.formatToParts(ahora);
  
  
  const d = parts.find(p => p.type === 'day').value;
  const m = parts.find(p => p.type === 'month').value;
  const y = parts.find(p => p.type === 'year').value;
  const hoyIso = `${y}-${m}-${d}`; // Formato YYYY-MM-DD
  
  const horaActual = parseInt(parts.find(p => p.type === 'hour').value);
  const minutosActuales = parseInt(parts.find(p => p.type === 'minute').value);

  console.log(`🔍 Debug TanCat - Hoy: ${hoyIso}, Buscando: ${fecha}, Hora: ${horaActual}:${minutosActuales}`);

  return HORARIOS.filter((h) => {
    const horaInicioRef = parseInt(h.split(":")[0]);

    if (fecha === hoyIso) {
      
      if (horaActual >= horaInicioRef) return false;

      
      if (horaActual === (horaInicioRef - 1) && minutosActuales > 50) return false;
    }

   
    const ocupadas = reservas.filter(
      (r) => r.deporte === deporte && r.fecha === fecha && r.horario === h && reservaEstaActiva(r)
    ).length;

    return ocupadas < canchasDeporte.length;
  });
}

export function parsearFecha(input) {
  
  const match = input.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!match) return { error: "⚠️ Por favor, escribí la fecha en formato día/mes/año (ej: 05/04/2026)." };
  
  const [, d, m, y] = match;
  
  
  const fechaUsuario = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0, 0);
  
  if (isNaN(fechaUsuario.getTime())) return { error: "❌ Esa fecha no existe." };

  
  const ahora = new Date();
  const hoyCbaStr = ahora.toLocaleString("en-US", { 
    timeZone: "America/Argentina/Cordoba",
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  
  const [mm, dd, yyyy] = hoyCbaStr.split('/');
  const hoyArgentina = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), 0, 0, 0, 0);

  if (fechaUsuario.getTime() < hoyArgentina.getTime()) {
    return { error: "⏳ No podemos viajar al pasado. Elegí una fecha de hoy en adelante." };
  }

  const diaSemana = hoyArgentina.getDay();
  const domingo = new Date(hoyArgentina);
  const diasHastaDomingo = diaSemana === 0 ? 0 : 7 - diaSemana;
  domingo.setDate(hoyArgentina.getDate() + diasHastaDomingo);
  domingo.setHours(23, 59, 59, 999);

  if (fechaUsuario > domingo) {
    const hasta = `${String(domingo.getDate()).padStart(2,"0")}/${String(domingo.getMonth()+1).padStart(2,"0")}`;
    return { error: `📅 Solo tomamos reservas para esta semana (hasta el domingo ${hasta}).` };
  }

  return { fecha: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` };
}


export function formatFecha(iso) {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}