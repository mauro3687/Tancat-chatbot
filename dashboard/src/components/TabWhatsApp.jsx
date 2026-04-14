// src/components/TabWhatsApp.jsx
// Panel de estado y monitoreo del bot de WhatsApp
import { useState } from "react";
import { useStore } from "../data/store.jsx";
import {
  MessageCircle, CheckCircle2, Settings, ListChecks,
  KeyRound, BarChart2, Bot, Search, XCircle,
  ClipboardList, DollarSign, MapPin, Clock, LogOut,
  CalendarPlus, Check,
} from "lucide-react";
import "../styles/TabWhatsApp.css";

const STEPS = [
  {
    num: 1, titulo: "Crear cuenta de Meta Business",
    desc: "Ir a business.facebook.com → Crear cuenta → Completar datos de TanCat.",
    link: "https://business.facebook.com", linkText: "Abrir Meta Business",
    estado: "pendiente",
  },
  {
    num: 2, titulo: "Crear app en Meta Developers",
    desc: "developers.facebook.com → Nueva app → Tipo: Business → Nombre: TanCat Bot → Agregar producto WhatsApp.",
    link: "https://developers.facebook.com", linkText: "Abrir Meta Developers",
    estado: "pendiente",
  },
  {
    num: 3, titulo: "Obtener credenciales",
    desc: "En tu app → WhatsApp → Configuración de API → Copiar Phone Number ID y generar Token de acceso.",
    estado: "pendiente",
  },
  {
    num: 4, titulo: "Subir whatsapp-bot/ a GitHub",
    desc: "Crear repo en GitHub y subir la carpeta whatsapp-bot/ del proyecto.",
    link: "https://github.com", linkText: "Ir a GitHub",
    estado: "pendiente",
  },
  {
    num: 5, titulo: "Deploy en Render",
    desc: "render.com → New Web Service → conectar repo GitHub → configurar las 4 variables de entorno.",
    link: "https://render.com", linkText: "Ir a Render",
    estado: "pendiente",
  },
  {
    num: 6, titulo: "Registrar el Webhook en Meta",
    desc: "Meta Developers → WhatsApp → Webhooks → URL: https://tu-servicio.onrender.com/webhook → Token de verificación → Suscribir a 'messages'.",
    estado: "pendiente",
  },
  {
    num: 7, titulo: "Agregar número WhatsApp Business real",
    desc: "Meta Developers → Números de teléfono → Agregar → Verificar con SMS → Actualizar WHATSAPP_PHONE_ID en Render.",
    estado: "pendiente",
  },
];

const ENV_VARS = [
  { key: "WHATSAPP_TOKEN",           desc: "Token de acceso de Meta (System User Token permanente)",             ejemplo: "EAAxxxxxxxxxx" },
  { key: "WHATSAPP_PHONE_ID",        desc: "ID del número de teléfono de WhatsApp Business",                     ejemplo: "536414510727" },
  { key: "WEBHOOK_VERIFY_TOKEN",     desc: "Token de verificación del webhook (inventás vos, cualquier string)", ejemplo: "tancat_2026" },
  { key: "FIREBASE_SERVICE_ACCOUNT", desc: "JSON completo de la service account de Firebase (una sola línea)",  ejemplo: '{"type":"service_account",...}' },
];

const FLUJOS = [
  { Icon: CalendarPlus,  trigger:"reservar / quiero jugar / turno",         accion:"Flujo 6 pasos: deporte → fecha → horario → nombre → tel → email → crea reserva en Firebase" },
  { Icon: Search,        trigger:"disponibilidad / hay lugar / horarios",   accion:"Pide deporte y fecha → muestra horarios libres con cantidad de canchas disponibles" },
  { Icon: XCircle,       trigger:"cancelar / anular mi reserva",            accion:"Busca por nombre/ID/teléfono → muestra la reserva → confirma → actualiza estado en Firebase" },
  { Icon: ClipboardList, trigger:"estado / mi reserva / reserva numero",    accion:"Busca la reserva y muestra todos los datos: cancha, local, horario, monto, seña, estado" },
  { Icon: DollarSign,    trigger:"precio / cuánto cuesta / tarifa",         accion:"Responde tabla de precios: Pádel $8.000, Básquet $12.000, Voley $10.000 + seña 30%" },
  { Icon: MapPin,        trigger:"dónde están / dirección / locales",       accion:"Informa los 2 locales con direcciones" },
  { Icon: Clock,         trigger:"horario / cuando abren / a qué hora",     accion:"Informa horario de atención: lunes a domingo 8:00 a 22:00 hs" },
  { Icon: LogOut,        trigger:"salir / cancelar / menu / volver",        accion:"Cancela cualquier proceso activo y vuelve al menú principal" },
];

export default function TabWhatsApp() {
  const { reservas } = useStore();
  const [steps, setSteps] = useState(STEPS.map((s) => ({ ...s })));
  const [copied, setCopied] = useState(null);

  const toggleStep = (i) => {
    setSteps((prev) => prev.map((s, idx) =>
      idx === i ? { ...s, estado: s.estado === "listo" ? "pendiente" : "listo" } : s
    ));
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const stepsListo = steps.filter((s) => s.estado === "listo").length;
  const pct = Math.round((stepsListo / steps.length) * 100);
  const reservasWA = reservas.filter((r) => r.notas?.toLowerCase().includes("whatsapp"));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title icon-row"><MessageCircle size={18} /> WhatsApp Bot</div>
          <div className="page-desc">Estado de configuración y monitoreo del bot de WhatsApp Business</div>
        </div>
        <div className={`wa-status-pill ${pct === 100 ? "wa-status-pill-ok" : "wa-status-pill-pending"}`}>
          {pct === 100
            ? <><CheckCircle2 size={14} /> Bot activo</>
            : <><Settings size={14} /> Configuración {pct}%</>}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="card wa-progress-card">
        <div className="wa-progress-header">
          <span className="wa-progress-title">Progreso de configuración</span>
          <span className="wa-progress-count">{stepsListo}/{steps.length} pasos</span>
        </div>
        <div className="wa-progress-bar-bg">
          <div className="wa-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="wa-main-grid">

        {/* Pasos de configuración */}
        <div className="card">
          <div className="card-header">
            <div className="card-title icon-row"><ListChecks size={15} /> Pasos de configuración</div>
            <span className="wa-steps-hint">Marcá cada paso al completarlo</span>
          </div>
          <div className="wa-steps-list">
            {steps.map((s, i) => (
              <div
                key={i}
                onClick={() => toggleStep(i)}
                className={`wa-step-item ${s.estado === "listo" ? "wa-step-done" : "wa-step-pending"}`}
              >
                <div className={`wa-step-circle ${s.estado === "listo" ? "wa-step-circle-done" : "wa-step-circle-pending"}`}>
                  {s.estado === "listo" ? <Check size={13} /> : s.num}
                </div>
                <div className="wa-step-content">
                  <div className="wa-step-title">{s.titulo}</div>
                  <div className="wa-step-desc">{s.desc}</div>
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="wa-step-link">
                      → {s.linkText}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="wa-side-col">
          {/* Variables de entorno */}
          <div className="card">
            <div className="card-header">
              <div className="card-title icon-row"><KeyRound size={15} /> Variables de entorno (Render)</div>
            </div>
            <div className="wa-env-list">
              {ENV_VARS.map((v) => (
                <div key={v.key} className="wa-env-item">
                  <div className="wa-env-header">
                    <code className="wa-env-key">{v.key}</code>
                    <button onClick={() => copy(v.key, v.key)} className="wa-copy-btn">
                      {copied === v.key ? "✓" : "Copiar"}
                    </button>
                  </div>
                  <div className="wa-env-desc">{v.desc}</div>
                  <div className="wa-env-ex">Ej: {v.ejemplo}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Reservas via WhatsApp */}
          <div className="card">
            <div className="card-header">
              <div className="card-title icon-row"><BarChart2 size={15} /> Reservas via WhatsApp</div>
              <span className="wa-res-count">{reservasWA.length}</span>
            </div>
            {reservasWA.length === 0 ? (
              <p className="wa-res-empty">
                Las reservas del bot de WhatsApp aparecerán acá automáticamente.
              </p>
            ) : (
              <div className="wa-res-list">
                {reservasWA.slice(0, 5).map((r) => (
                  <div key={r.id} className="wa-res-item">
                    <span className="wa-res-nombre">{r.cliente}</span>
                    <span className="wa-res-data">{r.deporte} · {r.fecha}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flujos del bot */}
      <div className="card">
        <div className="card-header">
          <div className="card-title icon-row"><Bot size={15} /> Flujos del bot — ¿Qué entiende el bot?</div>
          <span className="wa-flujos-hint">Comandos que reconoce el bot por WhatsApp</span>
        </div>
        <div className="wa-flujos-grid">
          {FLUJOS.map((f, i) => (
            <div key={i} className="wa-flujo-item">
              <div className="wa-flujo-title">
                <f.Icon size={14} /> <code className="wa-flujo-code">{f.trigger}</code>
              </div>
              <div className="wa-flujo-desc">{f.accion}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
