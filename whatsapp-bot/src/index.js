// src/index.js — Servidor principal Express
import "dotenv/config";
import express from "express";
import cors from "cors";
import { procesarMensaje } from "./flows/botFlow.js";
import { enviarMensaje, marcarLeido } from "./whatsapp.js";

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status:"ok", service:"TanCat WhatsApp Bot", version:"1.0.0" });
});

// ── Verificación del Webhook (Meta requiere esto al configurar) ───────────────
app.get("/webhook", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log("✅ Webhook verificado por Meta");
    return res.status(200).send(challenge);
  }
  console.warn("❌ Verificación de webhook fallida");
  res.sendStatus(403);
});

// ── Recibir mensajes de WhatsApp ──────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  // Responder 200 inmediatamente (Meta requiere < 5 seg)
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    const entry   = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;
    const message = value?.messages?.[0];

    if (!message) return;

    // Solo procesar mensajes de texto
    if (message.type !== "text") {
      await enviarMensaje(
        message.from,
        "Solo proceso mensajes de texto por ahora. Escribime tu consulta 😊"
      );
      return;
    }

    const phone  = message.from;      // ej: "5493511234567"
    const texto  = message.text.body;
    const msgId  = message.id;

    console.log(`📩 [${phone}]: ${texto}`);

    // Marcar como leído
    await marcarLeido(msgId);

    // Procesar y responder
    const respuesta = await procesarMensaje(phone, texto);
    await enviarMensaje(phone, respuesta);

    console.log(`📤 [${phone}]: ${respuesta.substring(0,60)}...`);

  } catch (err) {
    console.error("❌ Error procesando mensaje:", err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 TanCat WhatsApp Bot corriendo en puerto ${PORT}`);
  console.log(`📡 Webhook: /webhook`);
});
