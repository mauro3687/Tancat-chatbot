# 🎾 TanCat — Sistema Completo

Este repositorio contiene los dos proyectos del sistema TanCat en una sola carpeta.

```
tancat-system/
│
├── 📊 dashboard/          → Panel administrativo web (React + Firebase + TF.js)
│
└── 📱 whatsapp-bot/       → Bot de WhatsApp Business (Node.js + Express + Firebase)
```

---

## 📊 DASHBOARD — Panel Administrativo

**Tecnologías:** React 18 · Vite · TensorFlow.js · Firebase · Chart.js

```bash
cd dashboard
npm install
npm run dev
# → http://localhost:5173
```

**Módulos:**
- Reservas (ABM completo con deporte → cancha dinámica)
- Clientes, Ventas, Inventario
- Chatbot con NLP local (TensorFlow.js, sin API externa)
- IA & Promociones (análisis predictivo de demanda)
- Reportes con exportación CSV
- Configuración del sistema

**Primer uso — cargar datos en Firebase:**
```bash
cd dashboard
node scripts/seed.js
```

---

## 📱 WHATSAPP BOT — Backend

**Tecnologías:** Node.js · Express · Firebase Admin SDK · Meta WhatsApp Business API

```bash
cd whatsapp-bot
npm install
cp .env.example .env
# Completar .env con credenciales de Meta y Firebase
npm start
```

**Variables de entorno requeridas (.env):**
```
WHATSAPP_TOKEN=EAAxxxxxxxxxx
WHATSAPP_PHONE_ID=536414510727
WEBHOOK_VERIFY_TOKEN=tancat_2026
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
PORT=3000
```

**Deploy en Render:** ver `whatsapp-bot/README.md`

---

## 🔥 Firebase compartido

Ambos proyectos usan el **mismo proyecto Firebase** (`tancat-system`).

- El dashboard usa el SDK web (`firebase`)
- El bot usa el Admin SDK (`firebase-admin`)
- Las colecciones son compartidas: `reservas`, `clientes`, `ventas`, `stock`, `config`

Cuando un cliente reserva por WhatsApp → aparece en tiempo real en el dashboard. ✅

---

## 📁 Estructura detallada

```
tancat-system/
├── README.md                          ← Este archivo
│
├── dashboard/                         ← PROYECTO 1: Panel web
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chatbot.jsx            → Widget chatbot TF.js
│   │   │   ├── TabReservas.jsx        → ABM reservas
│   │   │   ├── TabClientes.jsx        → ABM clientes
│   │   │   ├── TabVentas.jsx          → Ventas y pagos
│   │   │   ├── TabInventario.jsx      → Control de stock
│   │   │   ├── TabIA.jsx              → IA y promociones
│   │   │   ├── TabReportes.jsx        → Reportes y CSV
│   │   │   └── TabConfiguracion.jsx   → Config del sistema
│   │   ├── data/
│   │   │   ├── store.jsx              → Estado global (Firestore)
│   │   │   ├── canchas.js             → Locales, canchas, horarios
│   │   │   ├── chatbotFlow.js         → Flujos conversacionales
│   │   │   ├── tfChatbot.js           → Modelo NLP TensorFlow.js
│   │   │   └── iaAnalytics.js         → Motor de recomendaciones
│   │   └── firebase.js                → Config Firebase web
│   ├── scripts/
│   │   └── seed.js                    → Carga datos iniciales
│   ├── firestore.rules                → Reglas de seguridad
│   └── package.json
│
└── whatsapp-bot/                      ← PROYECTO 2: Bot WhatsApp
    ├── src/
    │   ├── index.js                   → Servidor Express + webhook
    │   ├── whatsapp.js                → Cliente Meta API
    │   ├── canchas.js                 → Misma lógica de canchas
    │   ├── flows/
    │   │   ├── botFlow.js             → Flujos conversacionales
    │   │   └── sessionManager.js      → Sesiones por número
    │   └── firebase/
    │       └── client.js              → Firebase Admin SDK
    ├── render.yaml                    → Config deploy Render
    ├── .env.example
    └── package.json
```
