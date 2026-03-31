import { PRECIOS, EMOJI, asignarCancha, getHorariosDisponibles, parsearFecha, formatFecha } from "../canchas.js";
import { getSession, resetFlow } from "./sessionManager.js";
import { getReservas, buscarUsuario, guardarUsuario, crearReserva } from "../firebase/client.js";
import { enviarMensaje, enviarBotones, enviarLista } from "../whatsapp.js";

export async function procesarMensaje(phone, texto) {
  const session = getSession(phone);
  const msg = texto.trim();

  if (/^(salir|menu|inicio)$/i.test(msg)) {
    resetFlow(phone);
    return "Proceso cancelado ✅ Escribí *reservar* para empezar.";
  }

  let usuario = await buscarUsuario(phone);

  // --- REGISTRO DE USUARIO ---
  if (!usuario && !session.flow) {
    if (session.step !== 'REG_NOMBRE' && session.step !== 'REG_DNI') {
      session.step = 'REG_NOMBRE';
      return "¡Bienvenido a *TanCat*! 🎾 ¿Cómo es tu nombre completo?";
    }
  }

  if (session.step === 'REG_NOMBRE') {
    session.nombreTemp = msg;
    session.step = 'REG_DNI';
    return `¡Un gusto ${msg}! Ahora ingresá tu *DNI*:`;
  }

  if (session.step === 'REG_DNI') {
    usuario = { nombre: session.nombreTemp, dni: msg };
    await guardarUsuario(phone, usuario);
    resetFlow(phone);
    return `¡Registro listo ${usuario.nombre}! ✅ Escribí *reservar* para continuar.`;
  }

  // --- FLUJO DE RESERVA ---
  if (session.flow === "reserva") return await continuarReserva(phone, session, msg, usuario);

  if (/reserv|turno/.test(msg.toLowerCase())) {
    session.flow = "reserva";
    session.step = 0;
    await enviarBotones(phone, `Hola ${usuario.nombre}, ¿qué deporte elegís?`, ["Padel", "Básquet", "Voley"]);
    return null;
  }

  return "¡Hola! 👋 Escribí *reservar* para ver turnos disponibles.";
}

async function continuarReserva(phone, session, msg, usuario) {
  if (session.step === 0) { // Deporte
    const dep = msg.toLowerCase().replace("á", "a");
    session.step = 1;
    session.data = { deporte: dep };
    return `${EMOJI[dep]} seleccionado. ¿Para qué fecha? (DD/MM/AAAA)`;
  }

  if (session.step === 1) { // Fecha
    const r = parsearFecha(msg);
    if (r.error) return "Fecha inválida ❌ Usá DD/MM/AAAA (ej: 05/04/2026).";
    
    const disponibles = getHorariosDisponibles(await getReservas(), session.data.deporte, r.fecha);
    if (disponibles.length === 0) return "Sin turnos ese día 😔";
    
    session.step = 2;
    session.data = { ...session.data, fecha: r.fecha, disponibles };
    
    // Usamos el Menú de Lista para los horarios
    await enviarLista(phone, "Seleccioná un horario 👇", "Ver Horarios", disponibles.slice(0, 10));
    return null;
  }

  if (session.step === 2) { // Confirmación
    const horario = msg; // El título de la lista es el horario elegido
    const reserva = {
      cliente: usuario.nombre, dni: usuario.dni, telefono: phone,
      deporte: session.data.deporte, fecha: session.data.fecha, horario,
      monto: PRECIOS[session.data.deporte], estado: "Pendiente"
    };
    const id = await crearReserva(reserva);
    resetFlow(phone);
    return `✅ *¡RESERVA CREADA!*\nID: ${id}\nCliente: ${usuario.nombre}\nFecha: ${formatFecha(reserva.fecha)}\nHorario: ${horario}`;
  }
}