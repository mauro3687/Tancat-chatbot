import { PRECIOS, SENA_PCT, EMOJI, asignarCancha, getHorariosDisponibles, parsearFecha, formatFecha, LOCALES } from "../canchas.js";
import { getSession, resetFlow } from "./sessionManager.js"; 
import { getReservas, buscarUsuario, guardarUsuario, crearReserva } from "../firebase/client.js";
import { enviarMensaje, enviarBotones, enviarLista } from "../whatsapp.js";

export async function procesarMensaje(phone, texto) {
  const session = getSession(phone); 
  const msg = texto.trim();
  let usuario = await buscarUsuario(phone);

  if (/^(salir|menu|inicio)$/i.test(msg)) {
    resetFlow(phone);
    return "Proceso cancelado ✅ Escribí *hola* para ver el menú.";
  }

  // --- 1. REGISTRO ---
  if (!usuario && !session.flow) {
    if (session.step !== 'REG_NOMBRE' && session.step !== 'REG_DNI') {
      session.step = 'REG_NOMBRE';
      return "¡Bienvenido a *TanCat*! 🎾 ¿Cómo es tu nombre completo?";
    }
  }
  if (session.step === 'REG_NOMBRE') { session.nombreTemp = msg; session.step = 'REG_DNI'; return "¡Un gusto! Ahora ingresá tu *DNI*:"; }
  if (session.step === 'REG_DNI') {
    usuario = { nombre: session.nombreTemp, dni: msg };
    await guardarUsuario(phone, usuario);
    resetFlow(phone);
    await enviarBotones(phone, `¡Listo ${usuario.nombre}! ✅ ¿Qué querés hacer?`, ["Reservar Cancha", "Ver mis Reservas", "Ver Precios"]);
    return null;
  }

  
  if (!session.flow) {
    if (msg.includes("Precios")) {
      return `💰 *Tarifas TanCat:*\n\n${EMOJI.padel} Padel: $${PRECIOS.padel}\n${EMOJI.basquet} Básquet: $${PRECIOS.basquet}\n${EMOJI.voley} Voley: $${PRECIOS.voley}\n\n_Se requiere seña del 30% para confirmar._`;
    }

    if (msg.includes("mis Reservas")) {
      const todas = await getReservas();
      const misTurnos = todas.filter(r => r.dni === usuario.dni && r.estado !== "Cancelada");
      if (misTurnos.length === 0) return `Hola ${usuario.nombre}, no tenés reservas activas. 🏟️`;
      const lista = misTurnos.map(r => `• *${r.deporte.toUpperCase()}* (${r.estado})\n  📅 ${formatFecha(r.fecha)} - ⏰ ${r.horario}`).join("\n\n");
      return `📋 *Tus reservas:*\n\n${lista}`;
    }

   if (msg.includes("Reservar") || /reserv|turno/.test(msg.toLowerCase())) {
      const todas = await getReservas();
      
     
      const pendientesActivas = todas.filter(r => {
        if (r.dni === usuario.dni && r.estado === "Pendiente") {
          const ahora = new Date();
          const creacion = new Date(r.createdAt);
          const diferenciaHoras = (ahora - creacion) / (1000 * 60 * 60);
          return diferenciaHoras < 1; // Si tiene menos de 1 hora, lo bloquea
        }
        return false;
      });
      
      if (pendientesActivas.length > 0) {
        return `⚠️ *Atención ${usuario.nombre}:*\n\nTenés una reserva pendiente de seña. Recordá que tenés *1 hora* desde que la solicitaste para abonar y enviar el comprobante.\n\nSi ya pasó la hora, intentá de nuevo. Si no, enviá el pago a:\nAlias: *ezeg08.mp*`;
      }

      
      session.flow = "reserva";
      session.step = 0;
      await enviarBotones(phone, "🎾 ¿Qué deporte jugamos?", ["Padel", "Básquet", "Voley"]);
      return null;
    }

    if (/^(hola|buenas|inicio)$/i.test(msg) || msg.includes("Menú")) {
      resetFlow(phone);
      await enviarBotones(phone, `¡Hola ${usuario.nombre}! 👋 ¿Qué hacemos hoy?`, ["Reservar Cancha", "Ver mis Reservas", "Ver Precios"]);
      return null;
    }
  }

  if (session.flow === "reserva") return await continuarReserva(phone, session, msg, usuario);
  return "Escribí *hola* para ver las opciones.";
}

async function continuarReserva(phone, session, msg, usuario) {
  const { step, data } = session;

  if (step === 0) { 
    session.step = 1; session.data = { deporte: msg.toLowerCase().replace("á", "a") };
    return "📅 ¿Para qué fecha? (DD/MM/AAAA)";
  }

 if (step === 1) { 
    const r = parsearFecha(msg);
    
    
    if (r.error) {
      
      return r.error; 
    }
    
    session.data = { ...data, fecha: r.fecha }; 
    session.step = 1.5;
    
    await enviarBotones(phone, `Genial, para el día ${formatFecha(r.fecha)}. ¿En qué horario preferís?`, [
      "Turno 08 a 18hs", 
      "Turno 18 a 22hs",
      "⬅️ Cambiar Fecha"
    ]);
    return null;
  }

  if (step === 1.5) {
    if (msg.includes("Fecha")) { session.step = 1; return "📅 ¿Para qué fecha? (DD/MM/AAAA)"; }
    const disponibles = getHorariosDisponibles(await getReservas(), data.deporte, data.fecha);
    let filtrados = msg.includes("08 a 18") ? disponibles.filter(h => parseInt(h.split(":")[0]) < 18) : disponibles.filter(h => parseInt(h.split(":")[0]) >= 18);
    
    if (filtrados.length === 0) { 
      await enviarBotones(phone, "Sin turnos libres en este bloque.", ["Turno 08 a 18hs", "Turno 18 a 22hs", "⬅️ Cambiar Fecha"]); 
      return null; 
    }

    session.step = 2; 
    session.data = { ...data, disponibles: filtrados };
    await enviarLista(phone, "Elegí tu turno 👇", "Ver Horarios", filtrados);
    
    await enviarBotones(phone, "¿Querés cambiar de bloque?", ["Turno 08 a 18hs", "Turno 18 a 22hs"]);
    return null;
  }

  if (step === 2) {
    
    if (msg.includes("Turno 08 a 18hs") || msg.includes("Turno 18 a 22hs")) {
      session.step = 1.5; // Volvemos al paso de procesamiento de bloques
      return await continuarReserva(phone, session, msg, usuario);
    }

    if (msg.includes("Cambiar Fecha")) { session.step = 1; return "📅 ¿Para qué fecha? (DD/MM/AAAA)"; }

    const reservasCheck = await getReservas();
    const canchaLibre = asignarCancha(reservasCheck, data.deporte, data.fecha, msg);

    if (!canchaLibre) {
      
      if (!msg.includes(" — ")) {
        return "⚠️ Por favor, seleccioná un horario de la lista *Ver Horarios* de arriba.";
      }
      session.step = 1.5;
      await enviarBotones(phone, "❌ Se ocupó el lugar. Elegí otro horario:", ["Turno 08 a 18hs", "Turno 18 a 22hs"]);
      return null;
    }

    const total = PRECIOS[data.deporte];
    const sena = total * 0.30;
    const localInfo = LOCALES[canchaLibre.localId];
    
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + 60 * 60 * 1000);
    const horaLimite = expiracion.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    await crearReserva({
      cliente: usuario.nombre,
      dni: usuario.dni,
      telefono: phone,
      deporte: data.deporte,
      fecha: data.fecha,
      horario: msg,
      canchaId: canchaLibre.id,
      canchaNombre: canchaLibre.nombre,
      local: localInfo.nombre,
      montoTotal: total,
      montoSena: sena,
      estado: "Pendiente",
      createdAt: ahora.toISOString(),
      expiresAt: expiracion.toISOString()
    });

    resetFlow(phone);

    return `✅ *SOLICITUD DE RESERVA RECIBIDA*\n\n📍 *${localInfo.nombre}*\n🏟️ Cancha: ${canchaLibre.nombre}\n📅 Fecha: ${formatFecha(data.fecha)}\n⏰ Horario: ${msg}\n\n--- 💳 *DATOS DE PAGO (SEÑA)* ---\n\n💰 *Monto a transferir: $${sena}*\n_(Corresponde al 30% del total $${total})_\n\n🏦 *Mercado Pago:*\n• Alias: *ezeg08.mp*\n• Titular: *Mauro Ezequiel Gorosito*\n\n⏳ *TIEMPO LÍMITE:* Tienes hasta las *${horaLimite} hs* para enviar el comprobante. Pasada la hora, la solicitud se cancelará automáticamente.`;
  }
}