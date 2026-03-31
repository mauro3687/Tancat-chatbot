import "dotenv/config";
import express from "express";
import { getDb } from "./firebase/client.js";
import { procesarMensaje } from "./flows/botFlow.js";
import { enviarMensaje, marcarLeido } from "./whatsapp.js";

const app = express();
app.use(express.json());

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

const db = getDb();
db.collection("reservas")
  .where("estado", "==", "Confirmada")
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      
      
      if (change.type === "added" || change.type === "modified") {
        const reserva = change.doc.data();

        const ahora = Date.now();
        const tiempoReserva = reserva.actualizadoEn ? reserva.actualizadoEn.toMillis() : (reserva.creadoEn ? reserva.creadoEn.toMillis() : 0);
        
        if (ahora - tiempoReserva < 15000) { 
          const textoConfirmacion = `✅ *¡RESERVA CONFIRMADA!*\n\n` +
            `Hola *${reserva.cliente}*, recibimos tu seña de *$${reserva.montoSena}*.\n\n` +
            `📍 *${reserva.local}*\n` +
            `🏟️ Cancha: *${reserva.canchaNombre}*\n` +
            `📅 Fecha: ${reserva.fecha}\n` +
            `⏰ Horario: ${reserva.horario}\n\n` +
            `¡Tu lugar en TanCat ya está asegurado! 🏟️`;

          try {
            await enviarMensaje(reserva.telefono, textoConfirmacion);
            console.log(`🚀 Confirmación instantánea enviada a ${reserva.cliente}`);
          } catch (error) {
            console.error("❌ Error al enviar mensaje:", error.message);
          }
        }
      }
    });
  }, (err) => {
    console.error("❌ Error en el Listener de Firebase:", err.message);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 TanCat Bot Corriendo y escuchando Firebase`));