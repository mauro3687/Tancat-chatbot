// src/whatsapp.js — Cliente de la API de WhatsApp Business
import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v19.0";

export async function enviarMensaje(to, texto) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token   = process.env.WHATSAPP_TOKEN;

  await axios.post(
    `${BASE_URL}/${phoneId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: texto },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function marcarLeido(messageId) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token   = process.env.WHATSAPP_TOKEN;

  await axios.post(
    `${BASE_URL}/${phoneId}/messages`,
    {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  ).catch(() => {}); // ignorar error si ya fue leído
}
