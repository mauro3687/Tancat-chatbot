import "dotenv/config";
import express from "express";
import cors from "cors";
import { procesarMensaje } from "./flows/botFlow.js";
import { enviarMensaje, marcarLeido } from "./whatsapp.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === "tancatwebhook2026") {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return;

    const phone = message.from;
    const msgId = message.id;
    let texto = "";

    // Lógica para detectar Texto, Botones o Listas
    if (message.type === "text") {
      texto = message.text.body;
    } else if (message.type === "interactive") {
      const interactive = message.interactive;
      if (interactive.type === "button_reply") {
        texto = interactive.button_reply.title;
      } else if (interactive.type === "list_reply") {
        texto = interactive.list_reply.title;
      }
    } else {
      return;
    }

    await marcarLeido(msgId);
    const respuesta = await procesarMensaje(phone, texto);
    
    if (respuesta) await enviarMensaje(phone, respuesta);

  } catch (err) {
    console.error("❌ Error en Webhook:", err.message);
  }
});

app.listen(PORT, () => console.log(`🚀 TanCat Bot en puerto ${PORT}`));