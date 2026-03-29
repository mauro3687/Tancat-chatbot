# 🤖 TanCat — WhatsApp Bot Backend

Bot de WhatsApp Business para reservas, disponibilidad y cancelaciones de TanCat.

---

## 📋 PASO A PASO COMPLETO — De cero a producción

---

### PARTE 1 — Crear cuenta de Meta Business y WhatsApp API

#### 1.1 Crear cuenta de Meta Business
1. Ir a **business.facebook.com**
2. Clic en "Crear cuenta"
3. Completar nombre de empresa: `TanCat`
4. Aceptar términos y verificar email

#### 1.2 Crear app en Meta Developers
1. Ir a **developers.facebook.com**
2. Clic en "Mis apps" → "Crear app"
3. Tipo de app: **Business**
4. Nombre: `TanCat Bot`
5. Asociar a tu cuenta de Meta Business

#### 1.3 Agregar producto WhatsApp
1. En tu app de Meta Developers → "Agregar producto"
2. Buscar **WhatsApp** → clic en "Configurar"
3. Asociar a tu Meta Business Account

#### 1.4 Obtener el número de prueba
1. En WhatsApp → "Configuración de API"
2. Vas a ver un **número de prueba** (ej: +1 555 123 4567)
3. Agregar tu número personal como número de prueba
4. Guardar el **Phone Number ID** (ej: `536414510727`)

#### 1.5 Generar token de acceso
1. En "Configuración de API" → "Token de acceso temporal"
2. Copiarlo (dura 24 hs para pruebas)
3. Para producción: generar **System User Token** permanente
   - Meta Business → Configuración → Usuarios del sistema → Agregar → Generar token

---

### PARTE 2 — Deploy en Render

#### 2.1 Subir el código a GitHub
```bash
git init
git add .
git commit -m "TanCat WhatsApp Bot"
git remote add origin https://github.com/tu-usuario/tancat-whatsapp.git
git push -u origin main
```

#### 2.2 Crear servicio en Render
1. Ir a **render.com** → "New Web Service"
2. Conectar con GitHub → elegir el repo `tancat-whatsapp`
3. Configuración:
   - **Name:** tancat-whatsapp-bot
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Clic en "Create Web Service"
5. Copiar la URL pública (ej: `https://tancat-whatsapp-bot.onrender.com`)

#### 2.3 Configurar variables de entorno en Render
En Render → tu servicio → "Environment":

| Variable | Valor |
|----------|-------|
| `WHATSAPP_TOKEN` | Tu token de acceso de Meta |
| `WHATSAPP_PHONE_ID` | ID del número (ej: 536414510727) |
| `WEBHOOK_VERIFY_TOKEN` | Inventá una clave (ej: `tancat_2026`) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON completo de la service account (ver abajo) |
| `PORT` | 3000 |

#### 2.4 Obtener Firebase Service Account
1. Firebase Console → Configuración del proyecto (⚙️)
2. "Cuentas de servicio" → "Generar nueva clave privada"
3. Descargar el archivo JSON
4. Copiar el contenido **completo** del JSON
5. Pegarlo como valor de `FIREBASE_SERVICE_ACCOUNT` en Render (todo en una línea)

---

### PARTE 3 — Configurar el Webhook en Meta

#### 3.1 Registrar el webhook
1. Meta Developers → tu app → WhatsApp → Configuración
2. En "Webhooks" → "Configurar"
3. **URL de devolución de llamada:** `https://tancat-whatsapp-bot.onrender.com/webhook`
4. **Token de verificación:** el mismo que pusiste en `WEBHOOK_VERIFY_TOKEN`
5. Clic en "Verificar y guardar" ✅

#### 3.2 Suscribir a eventos
En Webhooks → suscribir a:
- ✅ `messages`
- ✅ `message_deliveries`
- ✅ `message_reads`

---

### PARTE 4 — Pasar a producción (número real)

1. En Meta Developers → WhatsApp → "Números de teléfono"
2. Clic en "Agregar número de teléfono"
3. Ingresar el número de WhatsApp Business de TanCat
4. Verificar con SMS o llamada
5. Reemplazar `WHATSAPP_PHONE_ID` con el ID del número real
6. Generar **System User Token** permanente (no expira)

---

## 🧪 Probar localmente (sin deploy)

```bash
npm install
cp .env.example .env
# Completar .env con tus credenciales

# Para testear el webhook localmente necesitás ngrok:
npx ngrok http 3000
# Usar la URL de ngrok en Meta Developers

npm run dev
```

---

## 📱 Flujos del bot

| El usuario escribe | El bot hace |
|-------------------|-------------|
| "hola" | Saludo y menú de opciones |
| "reservar" | Flujo completo: deporte → fecha → horario → datos → confirmación |
| "disponibilidad" | Consulta por deporte y fecha → muestra horarios libres |
| "cancelar" | Busca la reserva y pide confirmación |
| "estado" | Muestra todos los datos de la reserva |
| "precios" | Lista precios por deporte |
| "salir" | Cancela cualquier proceso activo |

---

## 🗂️ Estructura

```
src/
├── index.js              → Servidor Express + webhook
├── whatsapp.js           → Cliente API de WhatsApp Business
├── canchas.js            → Lógica de canchas, horarios y fechas
├── flows/
│   ├── botFlow.js        → Todos los flujos conversacionales
│   └── sessionManager.js → Manejo de sesiones por número
└── firebase/
    └── client.js         → Firebase Admin SDK
```
