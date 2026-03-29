// src/flows/sessionManager.js — Manejo de sesiones por número de WhatsApp
// Las sesiones viven en memoria (se resetean si el server reinicia)
// Para producción robusta, migrar a Redis

const sessions = new Map();
const SESSION_TTL = 15 * 60 * 1000; // 15 minutos de inactividad

export function getSession(phone) {
  const s = sessions.get(phone);
  if (!s) return createSession(phone);
  // Reset TTL
  clearTimeout(s.timer);
  s.timer = setTimeout(() => sessions.delete(phone), SESSION_TTL);
  return s;
}

function createSession(phone) {
  const s = { phone, flow: null, step: 0, data: {}, timer: null };
  s.timer = setTimeout(() => sessions.delete(phone), SESSION_TTL);
  sessions.set(phone, s);
  return s;
}

export function setSession(phone, update) {
  const s = getSession(phone);
  Object.assign(s, update);
  clearTimeout(s.timer);
  s.timer = setTimeout(() => sessions.delete(phone), SESSION_TTL);
  sessions.set(phone, s);
}

export function clearSession(phone) {
  const s = sessions.get(phone);
  if (s) clearTimeout(s.timer);
  sessions.delete(phone);
  return createSession(phone);
}

export function resetFlow(phone) {
  setSession(phone, { flow: null, step: 0, data: {} });
}
