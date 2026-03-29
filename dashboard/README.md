# TanCat — Dashboard Administrativo

Panel de administración web para el sistema de información de TanCat.
Desarrollado con **React + Vite**.

---

## 🚀 Cómo correr el proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar en modo desarrollo

```bash
npm run dev
```

Abrir en el navegador: **http://localhost:5173**

### 3. Build para producción

```bash
npm run build
```

---

## 📁 Estructura del proyecto

```
tancat-dashboard/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx       → Menú lateral de navegación
│   │   ├── Topbar.jsx        → Barra superior
│   │   ├── TabResumen.jsx    → Métricas y gráficos
│   │   ├── TabReservas.jsx   → Tabla de reservas con filtros
│   │   └── TabInventario.jsx → Control de stock
│   ├── data/
│   │   └── mockData.js       → Datos de ejemplo (reemplazar con Firebase)
│   ├── App.jsx               → Componente raíz
│   ├── App.css               → Estilos globales
│   └── main.jsx              → Entry point
├── index.html
├── package.json
└── vite.config.js
```

---

## 🔥 Próximo paso: Conectar Firebase

### Instalar Firebase
```bash
npm install firebase
```

### Crear archivo de configuración
```js
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  // ...resto de la config
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### Reemplazar datos mock por Firestore
```js
// Ejemplo: obtener reservas en tiempo real
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

useEffect(() => {
  const unsub = onSnapshot(collection(db, "reservas"), (snap) => {
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setReservas(data);
  });
  return unsub;
}, []);
```

---

---

## 🤖 Chatbot con IA (Claude API)

El chatbot usa la API de Anthropic directamente desde el frontend.
Para que funcione en producción necesitás un **backend proxy** que proteja tu API key.

### Configuración rápida (desarrollo)

Creá un archivo `.env` en la raíz del proyecto:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-tu-api-key-aqui
```

Luego modificá el fetch en `Chatbot.jsx`:

```js
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  },
  body: JSON.stringify({ ... }),
});
```

### ⚠️ Para producción: usar un backend proxy

```js
// En Chatbot.jsx — apuntar al backend propio
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages }),
});
```

```js
// En el backend Node.js/Express
app.post("/api/chat", async (req, res) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: req.body.messages,
    }),
  });
  const data = await response.json();
  res.json(data);
});
```

---

## 🛠️ Tecnologías

- React 18
- Vite 5
- Chart.js (gráficos)
- Firebase (próximamente)

---

## 🔥 Conexión a Firebase

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar reglas de Firestore
En Firebase Console → Firestore → Rules, pegá el contenido de `firestore.rules`.

### 3. Cargar datos iniciales (solo una vez)
```bash
node scripts/seed.js
```

### 4. Levantar el proyecto
```bash
npm run dev
```

### Colecciones en Firestore
| Colección  | Descripción                        |
|------------|------------------------------------|
| `reservas` | Reservas de canchas                |
| `clientes` | Base de datos de clientes          |
| `ventas`   | Registro de pagos y señas          |
| `stock`    | Inventario de productos            |
| `config`   | Configuración general del sistema  |

### Tiempo real
Todos los módulos usan `onSnapshot()` — cualquier cambio en Firestore se refleja instantáneamente en el dashboard sin recargar.
