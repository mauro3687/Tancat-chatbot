import "dotenv/config";
import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v19.0";

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  "Content-Type": "application/json",
});

const getPhoneId = () => process.env.PHONE_NUMBER_ID;

const formatNumber = (to) => to.startsWith("549") ? "54" + to.substring(3) : to;

export async function enviarMensaje(to, texto) {
  await axios.post(`${BASE_URL}/${getPhoneId()}/messages`, {
    messaging_product: "whatsapp",
    to: formatNumber(to),
    type: "text",
    text: { body: texto },
  }, { headers: getHeaders() });
}

export async function enviarBotones(to, texto, opciones) {
  await axios.post(`${BASE_URL}/${getPhoneId()}/messages`, {
    messaging_product: "whatsapp",
    to: formatNumber(to),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: texto },
      action: {
        buttons: opciones.map((opt, i) => ({
          type: "reply",
          reply: { id: `btn_${i}`, title: opt }
        }))
      }
    }
  }, { headers: getHeaders() });
}

export async function enviarLista(to, texto, tituloBoton, filas) {
  await axios.post(`${BASE_URL}/${getPhoneId()}/messages`, {
    messaging_product: "whatsapp",
    to: formatNumber(to),
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: texto },
      action: {
        button: tituloBoton,
        sections: [{ title: "Horarios", rows: filas.map((f, i) => ({ id: `h_${i}`, title: f })) }]
      }
    }
  }, { headers: getHeaders() });
}

export async function marcarLeido(messageId) {
  await axios.post(`${BASE_URL}/${getPhoneId()}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId
  }, { headers: getHeaders() }).catch(() => {});
}