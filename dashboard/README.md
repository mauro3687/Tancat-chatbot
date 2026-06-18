# TanCat — Dashboard Administrativo

Panel de administración para TanCat. React + Vite + Firebase.

## Correr el proyecto

```bash
npm install
npm run dev
```

Abre en http://localhost:5173

## Build y deploy

```bash
npm run build
firebase deploy --only hosting
```

## Estructura

```
src/
├── components/       componentes reutilizables (Sidebar, Topbar, etc.)
├── pages/            tabs del panel (Reservas, Clientes, Inventario...)
├── context/          StoreContext (datos Firebase), ThemeContext
├── styles/           CSS por componente + shared.css
├── assets/
└── App.jsx
```

## Firebase

El proyecto usa Firestore en tiempo real (`onSnapshot`). Colecciones:

| Colección   | Uso                              |
|-------------|----------------------------------|
| `reservas`  | Reservas de canchas              |
| `clientes`  | Base de clientes                 |
| `ventas`    | Ventas y pagos                   |
| `stock`     | Inventario                       |
| `prestamos` | Préstamos de equipamiento        |
| `config`    | Configuración general            |

Para configurar las reglas de seguridad: Firebase Console → Firestore → Rules, usar el archivo `firestore.rules` del repo.

## Acceso

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | Administrador — acceso completo |
| `encargado` | `enc123` | Encargado de sucursal — sin configuración ni reportes |

## Variables de entorno

Crear `.env` en la raíz con la config de Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

