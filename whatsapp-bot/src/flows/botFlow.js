// src/flows/botFlow.js — Lógica completa del bot de WhatsApp
import {
  CANCHAS, LOCALES, PRECIOS, SENA_PCT, EMOJI,
  asignarCancha, getHorariosDisponibles, parsearFecha, formatFecha
} from "../canchas.js";
import { getSession, setSession, resetFlow } from "./sessionManager.js";
import { getReservas, buscarReserva, crearReserva, actualizarReserva, upsertCliente } from "../firebase/client.js";

// ── Detectar intención del mensaje ────────────────────────────────────────────
function detectarIntent(msg) {
  const m = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  if (/\b(hola|buenas|buenos|hey|hi|ola)\b/.test(m))                        return "saludo";
  if (/reserv|turno|sacar|agendar|quiero jugar|cancha/.test(m))              return "reservar";
  if (/disponib|hay lugar|horarios|canchas libres|hay cancha/.test(m))       return "disponibilidad";
  if (/cancel|anular|baja/.test(m))                                          return "cancelar";
  if (/estado|mi reserva|reserva numero|como esta|confirma/.test(m))         return "estado";
  if (/precio|cuanto|costo|tarifa|sale|cuesta/.test(m))                      return "precios";
  if (/deporte|que tienen|que canchas|cuantas|padel|basquet|voley/.test(m))  return "deportes";
  if (/donde|ubicacion|direccion|local|sucursal/.test(m))                    return "ubicacion";
  if (/horario|atienden|abren|cierran|a que hora/.test(m))                   return "horarios";
  if (/seña|adelanto|pago|como pago/.test(m))                                return "sena";
  if (/gracias|chau|hasta luego|adios|bye/.test(m))                          return "despedida";
  return "fallback";
}

// ── Detectar deporte en el texto ──────────────────────────────────────────────
function detectarDeporte(msg) {
  const m = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  if (/padel|pádel/.test(m))                               return "padel";
  if (/basquet|básquet|basket|basketball/.test(m))         return "basquet";
  if (/voley|vóley|volei|volleyball/.test(m))              return "voley";
  // Por número
  if (/^1$/.test(m.trim()))                                return "padel";
  if (/^2$/.test(m.trim()))                                return "basquet";
  if (/^3$/.test(m.trim()))                                return "voley";
  return null;
}

// ── Respuestas directas (sin flujo) ──────────────────────────────────────────
function respuestaDirecta(intent) {
  const r = {
    saludo: `¡Hola! 👋 Bienvenido/a a *TanCat*.\n\nPuedo ayudarte con:\n📅 *Reservar* una cancha\n🔍 *Ver disponibilidad*\n❌ *Cancelar* tu reserva\n📋 *Estado* de tu reserva\n💰 *Ver precios*\n\n¿Qué necesitás?`,

    precios: `Los precios por turno (1 hora) son:\n\n🎾 *Pádel:* $8.000\n🏀 *Básquet:* $12.000\n🏐 *Voley:* $10.000\n\nLa seña para confirmar es el *30%* del total.\n¿Querés reservar? Escribí *reservar* 😊`,

    deportes: `Tenemos:\n\n🎾 *Pádel* — 4 canchas (2 en cada local)\n🏀 *Básquet* — 2 canchas (1 por local)\n🏐 *Voley* — 1 cancha (Local Centro)\n\n¿Qué deporte querés jugar?`,

    ubicacion: `Tenemos 2 locales:\n\n📍 *Local Centro*\nAv. Colón 1234, Córdoba\n\n📍 *Local Norte*\nRuta 36 Km 45, Córdoba\n\nAmbos atienden *lunes a domingo de 8:00 a 22:00 hs* 🕗`,

    horarios: `Atendemos *lunes a domingo de 8:00 a 22:00 hs*.\nLos turnos son de *1 hora*.\n\n¿Querés reservar? Escribí *reservar* 😊`,

    sena: `Las señas para confirmar la reserva son:\n\n🎾 Pádel: *$2.400* (30% de $8.000)\n🏀 Básquet: *$3.600* (30% de $12.000)\n🏐 Voley: *$3.000* (30% de $10.000)\n\nEl pago se coordina directamente con el local. ¿Querés reservar?`,

    despedida: `¡Hasta pronto! Esperamos verte en TanCat 🎾🏀🏐\nCualquier consulta, acá estamos 😊`,

    fallback: `No entendí bien tu mensaje 😅\n\nPodés escribir:\n• *reservar* — para hacer una reserva\n• *disponibilidad* — ver horarios libres\n• *cancelar* — cancelar tu turno\n• *precios* — ver tarifas\n• *estado* — ver tu reserva\n\n¿Con cuál te ayudo?`,
  };
  return r[intent] || r.fallback;
}

// ── Procesador principal ──────────────────────────────────────────────────────
export async function procesarMensaje(phone, mensaje) {
  const session = getSession(phone);
  const msg = mensaje.trim();

  // Comando global: salir de cualquier flujo
  if (/^(salir|cancelar|menu|volver|inicio)$/i.test(msg)) {
    resetFlow(phone);
    return `Proceso cancelado ✅\n\n¿En qué puedo ayudarte?\n• *reservar*\n• *disponibilidad*\n• *cancelar*\n• *estado*\n• *precios*`;
  }

  // ── Si hay flujo activo → continuar ──
  if (session.flow) {
    return await continuarFlujo(phone, session, msg);
  }

  // ── Sin flujo → detectar intent ──
  const intent = detectarIntent(msg);

  if (intent === "reservar") {
    setSession(phone, { flow:"reserva", step:0, data:{} });
    return `¡Genial! Vamos a reservar tu cancha 🎾\n\n¿Qué deporte querés jugar?\n\n1️⃣ Pádel — $8.000\n2️⃣ Básquet — $12.000\n3️⃣ Voley — $10.000\n\n_(Escribí el número o el nombre)_\n\n_Escribí *salir* para cancelar en cualquier momento_`;
  }

  if (intent === "disponibilidad") {
    setSession(phone, { flow:"disponibilidad", step:0, data:{} });
    return `Vamos a ver la disponibilidad 🔍\n\n¿Para qué deporte?\n\n1️⃣ Pádel\n2️⃣ Básquet\n3️⃣ Voley`;
  }

  if (intent === "cancelar") {
    setSession(phone, { flow:"cancelar", step:0, data:{} });
    return `Para cancelar tu reserva necesito encontrarla 🔎\n\nDecime tu *nombre completo*, número de *reserva* (ej: R-001) o *teléfono*.`;
  }

  if (intent === "estado") {
    setSession(phone, { flow:"estado", step:0, data:{} });
    return `Voy a buscar tu reserva 🔎\n\nDecime tu *nombre*, número de *reserva* o *teléfono*.`;
  }

  return respuestaDirecta(intent);
}

// ── Continuar flujo activo ────────────────────────────────────────────────────
async function continuarFlujo(phone, session, msg) {
  const { flow, step, data } = session;

  // ═══ FLUJO RESERVA ═══════════════════════════════════════════════════════
  if (flow === "reserva") {

    // Paso 0: deporte
    if (step === 0) {
      const dep = detectarDeporte(msg);
      if (!dep) return `No reconocí el deporte 😅\nEscribí *1* Pádel, *2* Básquet o *3* Voley.`;
      setSession(phone, { step:1, data:{ deporte:dep } });
      return `${EMOJI[dep]} *${dep.charAt(0).toUpperCase()+dep.slice(1)}* seleccionado ✅\n\n¿Para qué *fecha* querés reservar?\nFormato: DD/MM/AAAA (solo esta semana)\n\n_Ej: ${new Date().toLocaleDateString("es-AR")}_`;
    }

    // Paso 1: fecha
    if (step === 1) {
      const r = parsearFecha(msg);
      if (r.error === "formato" || r.error === "invalida")
        return `Formato de fecha incorrecto 📅\nIngresá: DD/MM/AAAA (ej: ${new Date().toLocaleDateString("es-AR")})`;
      if (r.error === "pasada")
        return `Esa fecha ya pasó ❌\nSolo podés reservar desde *hoy*.`;
      if (r.error === "fuera_semana")
        return `Solo aceptamos reservas para *esta semana* (hasta el ${r.hasta}) ❌\nIngresá una fecha dentro de ese rango.`;

      const reservas = await getReservas();
      const disponibles = getHorariosDisponibles(reservas, data.deporte, r.fecha);
      if (disponibles.length === 0) {
        return `Lo siento, no hay horarios disponibles para *${data.deporte}* el *${formatFecha(r.fecha)}* 😔\n¿Querés probar otra fecha? Ingresala en DD/MM/AAAA.`;
      }

      setSession(phone, { step:2, data:{ ...data, fecha:r.fecha, disponibles } });
      const lista = disponibles.map((h,i) => `${i+1}. ${h}`).join("\n");
      return `📅 Horarios disponibles para ${EMOJI[data.deporte]} *${data.deporte}* el *${formatFecha(r.fecha)}*:\n\n${lista}\n\n¿Cuál preferís? _(escribí el número o el horario)_`;
    }

    // Paso 2: horario
    if (step === 2) {
      const { disponibles } = data;
      const num = parseInt(msg);
      let horario = null;
      if (!isNaN(num) && num >= 1 && num <= disponibles.length) {
        horario = disponibles[num - 1];
      } else {
        horario = disponibles.find((h) => msg.includes(h.split(" ")[0])) || null;
      }
      if (!horario) return `Horario no válido ❌\nElegí un número del 1 al ${disponibles.length}.`;

      setSession(phone, { step:3, data:{ ...data, horario } });
      return `⏰ Turno *${horario}* seleccionado ✅\n\nAhora necesito tus datos para confirmar.\n\n¿Cuál es tu *nombre y apellido*?`;
    }

    // Paso 3: nombre
    if (step === 3) {
      if (msg.trim().length < 3) return `Por favor ingresá tu *nombre completo* 👤`;
      setSession(phone, { step:4, data:{ ...data, nombre:msg.trim() } });
      return `Gracias, *${msg.trim()}* 😊\n\n¿Cuál es tu *número de teléfono* o WhatsApp?`;
    }

    // Paso 4: teléfono
    if (step === 4) {
      const clean = msg.replace(/[\s\-\(\)\+]/g,"");
      if (!/^\d{8,15}$/.test(clean)) return `Número inválido ❌\nIngresá solo números (ej: 3511234567).`;
      setSession(phone, { step:5, data:{ ...data, telefono:clean } });
      return `¿Cuál es tu *email*? 📧`;
    }

    // Paso 5: email → confirmar y crear reserva
    if (step === 5) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.trim()))
        return `Email inválido ❌\nEjemplo: nombre@email.com`;

      const email = msg.trim().toLowerCase();
      const reservas = await getReservas();
      const cancha = asignarCancha(reservas, data.deporte, data.fecha, data.horario);

      if (!cancha) {
        resetFlow(phone);
        return `Lo siento, ese horario ya no está disponible ⚠️\nEscribí *reservar* para intentar con otro horario.`;
      }

      const precio = PRECIOS[data.deporte];
      const sena = Math.round(precio * SENA_PCT);
      const local = LOCALES[cancha.localId];

      // Registrar/actualizar cliente en Firestore
      const clienteId = await upsertCliente({
        nombre: data.nombre,
        email,
        telefono: data.telefono,
      });

      const reservaData = {
        clienteId,
        deporte: data.deporte,
        canchaId: cancha.id,
        cancha: cancha.nombre,
        localId: cancha.localId,
        fecha: data.fecha,
        horario: data.horario,
        personas: cancha.capacidad,
        monto: precio,
        sena,
        estado: "Pendiente",
        servicio: `${EMOJI[data.deporte]} ${data.deporte.charAt(0).toUpperCase()+data.deporte.slice(1)} — ${cancha.nombre}`,
        notas: "Reserva via WhatsApp",
      };

      const id = await crearReserva(reservaData);
      resetFlow(phone);

      return `✅ *¡Reserva registrada exitosamente!*\n\n` +
        `📋 *ID:* ${id}\n` +
        `👤 *Nombre:* ${data.nombre}\n` +
        `${EMOJI[data.deporte]} *Deporte:* ${data.deporte}\n` +
        `🏟️ *Cancha:* ${cancha.nombre}\n` +
        `📍 *Local:* ${local.nombre}\n` +
        `📅 *Fecha:* ${formatFecha(data.fecha)}\n` +
        `⏰ *Horario:* ${data.horario}\n` +
        `💰 *Precio:* $${precio.toLocaleString("es-AR")}\n` +
        `💵 *Seña (30%):* $${sena.toLocaleString("es-AR")}\n\n` +
        `⏳ *Estado:* PENDIENTE DE CONFIRMACIÓN\n` +
        `Un administrador confirmará tu reserva en breve.\n\n` +
        `¡Hasta pronto! 🎾🏀🏐`;
    }
  }

  // ═══ FLUJO DISPONIBILIDAD ════════════════════════════════════════════════
  if (flow === "disponibilidad") {
    if (step === 0) {
      const dep = detectarDeporte(msg);
      if (!dep) return `No reconocí el deporte 😅\nEscribí *1* Pádel, *2* Básquet o *3* Voley.`;
      setSession(phone, { step:1, data:{ deporte:dep } });
      return `${EMOJI[dep]} *${dep.charAt(0).toUpperCase()+dep.slice(1)}* ✅\n\n¿Para qué *fecha* querés consultar? (DD/MM/AAAA)`;
    }

    if (step === 1) {
      const r = parsearFecha(msg);
      if (r.error) {
        if (r.error === "pasada") return `Esa fecha ya pasó ❌ Ingresá una fecha desde hoy.`;
        if (r.error === "fuera_semana") return `Solo esta semana (hasta ${r.hasta}) ❌`;
        return `Formato inválido. Ingresá DD/MM/AAAA`;
      }

      const reservas = await getReservas();
      const disponibles = getHorariosDisponibles(reservas, data.deporte, r.fecha);
      const canchasTotal = CANCHAS.filter((c) => c.deporte === data.deporte).length;

      resetFlow(phone);

      if (disponibles.length === 0) {
        return `❌ No hay canchas de ${EMOJI[data.deporte]} *${data.deporte}* disponibles el *${formatFecha(r.fecha)}*.\n\n¿Querés consultar otro día? Escribí *disponibilidad*.`;
      }

      const detalle = disponibles.map((h) => {
        const ocup = reservas.filter(
          (rv) => rv.deporte===data.deporte && rv.fecha===r.fecha && rv.horario===h && rv.estado!=="Cancelada"
        ).length;
        const libres = canchasTotal - ocup;
        return `✅ ${h} — ${libres} cancha${libres>1?"s":""} libre${libres>1?"s":""}`;
      }).join("\n");

      return `📅 *Disponibilidad ${EMOJI[data.deporte]} ${data.deporte} — ${formatFecha(r.fecha)}*\n\n${detalle}\n\n¿Querés reservar? Escribí *reservar* 😊`;
    }
  }

  // ═══ FLUJO CANCELAR ══════════════════════════════════════════════════════
  if (flow === "cancelar") {
    if (step === 0) {
      const reserva = await buscarReserva(msg);
      if (!reserva) {
        return `No encontré una reserva con ese dato 🔎\nProbá con tu *nombre*, *ID* (ej: R-001) o *teléfono*.`;
      }
      if (reserva.estado === "Cancelada") {
        resetFlow(phone);
        return `La reserva *${reserva.id}* ya estaba cancelada ℹ️`;
      }
      setSession(phone, { step:1, data:{ reservaId:reserva.id, reserva } });
      return `Encontré tu reserva:\n\n` +
        `📋 *ID:* ${reserva.id}\n` +
        `${EMOJI[reserva.deporte]||"🏟️"} *${reserva.servicio || reserva.deporte}*\n` +
        `📅 *${formatFecha(reserva.fecha)}* · ${reserva.horario||""}\n` +
        `✅ *Estado:* ${reserva.estado}\n\n` +
        `¿Confirmás la cancelación? Escribí *sí* o *no*.`;
    }

    if (step === 1) {
      if (/^(si|sí|s|yes)$/i.test(msg.trim())) {
        await actualizarReserva(data.reservaId, { estado:"Cancelada" });
        resetFlow(phone);
        return `❌ Reserva *${data.reserva.id}* cancelada correctamente.\n\nRecordá: cancelación gratuita hasta 48 hs antes del turno.\n¡Hasta pronto! 😊`;
      }
      resetFlow(phone);
      return `Cancelación no realizada ✅\n¿Puedo ayudarte con algo más?`;
    }
  }

  // ═══ FLUJO ESTADO ════════════════════════════════════════════════════════
  if (flow === "estado") {
    const reserva = await buscarReserva(msg);
    resetFlow(phone);
    if (!reserva) {
      return `No encontré reservas con ese dato 🔎\nProbá con tu *nombre*, *ID de reserva* o *teléfono*.`;
    }
    const local = LOCALES[reserva.localId];
    return `📋 *Tu reserva:*\n\n` +
      `ID: ${reserva.id}\n` +
      `👤 ${reserva.cliente}\n` +
      `${EMOJI[reserva.deporte]||"🏟️"} ${reserva.deporte} — ${reserva.cancha||""}\n` +
      `📍 ${local?.nombre||""}\n` +
      `📅 ${formatFecha(reserva.fecha)} · ${reserva.horario||""}\n` +
      `💰 $${Number(reserva.monto).toLocaleString("es-AR")}\n` +
      `💵 Seña: $${Number(reserva.sena||0).toLocaleString("es-AR")}\n` +
      `✅ *Estado: ${reserva.estado}*\n\n¿Necesitás algo más?`;
  }

  // Flujo desconocido → resetear
  resetFlow(phone);
  return respuestaDirecta("fallback");
}
