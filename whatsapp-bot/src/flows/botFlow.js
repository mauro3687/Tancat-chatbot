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

  // --- 1. FLUJO DE REGISTRO (Nombre -> Email -> Ciudad) ---
  if (!usuario && !session.flow) {
    if (!['REG_NOMBRE', 'REG_GMAIL', 'REG_UBICACION'].includes(session.step)) {
      session.step = 'REG_NOMBRE';
      return "¡Bienvenido a *TanCat*! 🎾 ¿Cómo es tu nombre completo?";
    }
  }

  if (session.step === 'REG_NOMBRE') { 
      session.nombreTemp = msg; 
      session.step = 'REG_GMAIL'; 
      return "¡Un gusto! Ahora ingresá tu *correo electrónico (Email)*:"; 
  }

  if (session.step === 'REG_GMAIL') {
      if (!msg.includes("@")) return "⚠️ Por favor, ingresá un correo válido.";
      session.gmailTemp = msg;
      session.step = 'REG_UBICACION';
      await enviarBotones(phone, "¿Desde dónde nos escribís?", ["Córdoba", "Otras Provincias"]);
      return null;
  }

  if (session.step === 'REG_UBICACION') {
    usuario = { 
      nombre: session.nombreTemp || "Jugador", 
      email: session.gmailTemp || "sin@mail.com", 
      ciudad: msg || "Córdoba"
    };
    
    await guardarUsuario(phone, usuario);
    resetFlow(phone);
    
    usuario = await buscarUsuario(phone);
    
    const nombreSeguro = usuario?.nombre || "Jugador";
    await enviarBotones(phone, `¡Listo ${nombreSeguro}! ✅ Registro completado. ¿Qué hacemos hoy?`, ["Reservar Cancha", "Ver mis Reservas", "Ver Precios"]);
    return null;
  }

  // --- 2. MENÚ PRINCIPAL ---
  if (!session.flow) {
    if (msg.includes("Precios")) {
      return `💰 *Tarifas TanCat:*\n\n${EMOJI.padel} Padel: $${PRECIOS.padel}\n${EMOJI.basquet} Básquet: $${PRECIOS.basquet}\n${EMOJI.voley} Voley: $${PRECIOS.voley}\n\n_Se requiere seña del 30% para confirmar._`;
    }

    if (msg.includes("mis Reservas")) {
      const todas = await getReservas();
      const misTurnos = todas.filter(r => r.clienteId === usuario.id && r.estado !== "Cancelada");
      if (misTurnos.length === 0) return `Hola ${usuario.nombre}, no tenés reservas activas. 🏟️`;
      const lista = misTurnos.map(r => `• *${r.deporte.toUpperCase()}* (${r.estado})\n  📅 ${formatFecha(r.fecha)} - ⏰ ${r.horaInicio || r.horario}`).join("\n\n");
      return `📋 *Tus reservas:*\n\n${lista}`;
    }

    if (msg.includes("Reservar") || /reserv|turno/.test(msg.toLowerCase())) {
      const todas = await getReservas();
      
      const pendientesActivas = todas.filter(r => {
        if (r.clienteId === usuario.id && r.estado === "Pendiente") {
          const ahora = new Date().getTime();
          const creacion = r.createdAt?.toMillis ? r.createdAt.toMillis() : Date.parse(r.createdAt);
          if (!creacion) return false; 
          const diferenciaHoras = (ahora - creacion) / (1000 * 60 * 60);
          return diferenciaHoras < 1; 
        }
        return false;
      });
      
      if (pendientesActivas.length > 0) {
        return `⚠️ *Atención ${usuario.nombre}:*\n\nTenés una reserva pendiente de seña. Recordá que tenés *1 hora* para enviar el comprobante.\n\nAlias: *ezeg08.mp*`;
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
  
  if (!session.flow && session.step === undefined) {
      return "Escribí *hola* para ver las opciones.";
  }
  return null;
}

async function continuarReserva(phone, session, msg, usuario) {
  const { step, data } = session;

  if (step === 0) { 
    session.step = 1; 
    session.data = { deporte: msg.toLowerCase().replace("á", "a") };
    return "📅 *¿Para qué fecha?*\n(Ej: 'Hoy', 'Mañana' o '15/04')";
  }

  if (step === 1) {
    const r = parsearFecha(msg);
    if (r.error) return r.error;
    const fechaValida = r.fecha instanceof Date ? r.fecha : new Date();
    const fechaISO = fechaValida.toISOString().split('T')[0]; 
    session.data = { ...data, fecha: fechaISO }; 
    session.step = 1.5;
    await enviarBotones(phone, `Genial, para el día ${formatFecha(fechaISO)}. ¿En qué horario preferís?`, 
      ["Turno 08 a 18hs", "Turno 18 a 22hs", "⬅️ Cambiar Fecha"]);
    return null;
  }

  if (step === 1.5) {
    if (msg.includes("Fecha")) { session.step = 1; return "📅 ¿Para qué fecha? (DD/MM/AAAA)"; }
    const todasLasReservas = await getReservas();
    const disponibles = getHorariosDisponibles(todasLasReservas, data.deporte, data.fecha);
    
    let filtrados = msg.includes("08 a 18") 
      ? disponibles.filter(h => parseInt(h.split(":")[0]) < 18) 
      : disponibles.filter(h => parseInt(h.split(":")[0]) >= 18);
    
    if (filtrados.length === 0) { 
      await enviarBotones(phone, "Sin turnos libres en este bloque.", ["Turno 08 a 18hs", "Turno 18 a 22hs", "⬅️ Cambiar Fecha"]); 
      return null; 
    }

    session.step = 2; 
    session.data = { ...data, disponibles: filtrados };
    await enviarLista(phone, "Elegí tu turno 👇", "Ver Horarios", filtrados);
    return null;
  }

  if (step === 2) {
    if (msg.includes("Turno 08 a 18hs") || msg.includes("Turno 18 a 22hs")) {
      session.step = 1.5;
      return await continuarReserva(phone, session, msg, usuario);
    }

    if (msg.includes("Cambiar Fecha")) { 
      session.step = 1; 
      return "📅 *¿Para qué fecha?* (Ej: 'Hoy', 'Mañana')"; 
    }

    const reservasCheck = await getReservas();
    const canchaLibre = asignarCancha(reservasCheck, data.deporte, data.fecha, msg);

    if (!canchaLibre) {
      session.step = 1.5;
      await enviarBotones(phone, "❌ Horario ocupado. Elegí otro:", ["Turno 08 a 18hs", "Turno 18 a 22hs"]);
      return null;
    }

    const total = PRECIOS[data.deporte] || 0;
    const sena = total * 0.30;
    const localInfo = LOCALES[canchaLibre.localId];
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + 60 * 60 * 1000);
    const horaLimite = expiracion.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    let valorLimpio = msg.split(/[—-]/)[0].trim(); 
    if (valorLimpio.length === 4) valorLimpio = "0" + valorLimpio;

    // 🚀 GUARDADO EN FIREBASE
    await crearReserva({
      clienteId: usuario.id || "", 
      cliente: usuario.nombre || "Jugador",
      email: usuario.email || "", 
      ciudad: usuario.ciudad || "",
      telefono: phone,
      deporte: data.deporte,
      fecha: data.fecha,
      horario: valorLimpio, 
      horaInicio: valorLimpio, 
      canchaId: canchaLibre.id,
      canchaNombre: canchaLibre.nombre,
      local: localInfo.nombre,
      montoTotal: total,
      montoSena: sena,
      estado: "Pendiente",
      createdAt: ahora.toISOString(),
      expiresAt: expiracion.toISOString()
    });

    // --- 🔑 CAMBIO AQUÍ: ENVIAMOS MENSAJE + BOTÓN DE CIERRE ---
    
    const textoFinal = `✅ *SOLICITUD DE RESERVA RECIBIDA*\n\n📍 *${localInfo.nombre}*\n🏟️ Cancha: ${canchaLibre.nombre}\n📅 Fecha: ${formatFecha(data.fecha)}\n⏰ Horario: ${msg}\n\n--- 💳 *DATOS DE PAGO (SEÑA)* ---\n\n💰 *Monto a transferir: $${sena}*\n🏦 *Mercado Pago:* ezeg08.mp\n⏳ *TIEMPO LÍMITE:* Tenés hasta las *${horaLimite} hs* para enviar el comprobante.`;

    await enviarMensaje(phone, textoFinal);
    
    // Reseteamos el flujo ANTES de enviar los botones para que el bot esté listo para escuchar el nuevo mensaje
    resetFlow(phone);

    // Enviamos el botón de confirmación de pago
    await enviarBotones(phone, "Confirmá cuando termines el pago para que el administrador verifique tu turno 👇", ["Ya realicé la transferencia"]);

    return null; // Devolvemos null porque ya enviamos todo por funciones externas
  }}