import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://graph.facebook.com/v19.0";

// Dentro de src/whatsapp.js
const getAuth = () => {
  return {
    phoneId: process.env.PHONE_NUMBER_ID, // 👈 Nombre exacto de tu .env
    token: process.env.WHATSAPP_TOKEN
  };
};

export async function enviarMensaje(to, texto) {
  const { phoneId, token } = getAuth();
  try {
    await axios.post(`${BASE_URL}/${phoneId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: texto },
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    console.error("❌ Error en enviarMensaje:", error.response?.data || error.message);
  }
}

export async function enviarBotones(to, texto, botones) {
  const { phoneId, token } = getAuth();
  try {
    await axios.post(`${BASE_URL}/${phoneId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: texto },
        action: {
          buttons: botones.slice(0, 3).map((btn, index) => ({
            type: "reply",
            reply: { id: `btn_${index}`, title: btn.substring(0, 20) }
          }))
        }
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    console.error("❌ Error en enviarBotones:", JSON.stringify(error.response?.data, null, 2));
  }
}

export async function enviarLista(to, texto, buttonText, filas) {
  const { phoneId, token } = getAuth();
  try {
    await axios.post(`${BASE_URL}/${phoneId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: texto },
        action: {
          button: buttonText.substring(0, 20),
          sections: [{
            title: "Opciones",
            rows: filas.map((item, index) => ({
              id: `row_${index}`,
              title: item.substring(0, 24)
            }))
          }]
        }
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    console.error("❌ Error en enviarLista:", JSON.stringify(error.response?.data, null, 2));
  }
}

export async function marcarLeido(messageId) {
  const { phoneId, token } = getAuth();
  try {
    await axios.post(`${BASE_URL}/${phoneId}/messages`, {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (e) {}
}