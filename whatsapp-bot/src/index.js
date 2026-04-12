import "dotenv/config";
import express from "express";
import { getDb } from "./firebase/client.js";
import { procesarMensaje } from "./flows/botFlow.js";
import { enviarMensaje, marcarLeido } from "./whatsapp.js";

const app = express();
app.use(express.json());

// ── WEBHOOK PARA MENSAJES ENTRANTE ──────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return;

    let texto = "";
    if (message.type === "text") {
      texto = message.text.body;
    } else if (message.type === "interactive") {
      const interactive = message.interactive;
      texto = (interactive.type === "button_reply") ? interactive.button_reply.title : interactive.list_reply.title;
    }

    if (texto) {
      await marcarLeido(message.id);
      const respuesta = await procesarMensaje(message.from, texto);
      if (respuesta) await enviarMensaje(message.from, respuesta);
    }
  } catch (err) {
    console.error("❌ Error en Webhook:", err.message);
  }
});

// ── LISTENER DE FIREBASE PARA CONFIRMACIONES ────────────────────────────────
const db = getDb();
db.collection("reservas")
  .where("estado", "==", "Confirmada")
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added" || change.type === "modified") {
        const reserva = change.doc.data();
        const ahora = Date.now();
        
        // Manejo de tiempo para no repetir mensajes viejos
        const tiempoReserva = reserva.actualizadoEn?.toMillis?.() || reserva.creadoEn?.toMillis?.() || ahora;

        if (ahora - tiempoReserva < 15000) { 
          
          // 🛡️ FORMATEO SEGURO (Sin usar .getDate())
          let fechaParaMensaje = "A confirmar";

          if (typeof reserva.fecha === 'string') {
            // Si es "2026-04-12", lo convertimos a "12/04/2026"
            const partes = reserva.fecha.split("-");
            fechaParaMensaje = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : reserva.fecha;
          } else if (reserva.fecha && typeof reserva.fecha.toDate === 'function') {
            // Si es un objeto de Firebase, lo pasamos a string local
            fechaParaMensaje = reserva.fecha.toDate().toLocaleDateString('es-AR');
          }

          const textoConfirmacion = `✅ *¡RESERVA CONFIRMADA!*\n\n` +
            `Hola *${reserva.cliente}*, recibimos tu seña de *$${reserva.montoSena}*.\n\n` +
            `📍 *${reserva.local}*\n` +
            `🏟️ Cancha: *${reserva.canchaNombre}*\n` +
            `📅 Fecha: ${fechaParaMensaje}\n` + 
            `⏰ Horario: ${reserva.horario}\n\n` +
            `¡Tu lugar en TanCat ya está asegurado! 🏟️`;

          try {
            await enviarMensaje(reserva.telefono, textoConfirmacion);
            console.log(`🚀 Confirmación enviada a ${reserva.cliente} para el ${fechaParaMensaje}`);
          } catch (error) {
            console.error("❌ Error al enviar:", error.message);
          }
        }
      }
    });
  }, (err) => {
    console.error("❌ Error Listener:", err.message);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 TanCat Bot Corriendo y escuchando Firebase`));