// src/components/TabWhatsApp.jsx
// Panel de estado y monitoreo del bot de WhatsApp
import { useState } from "react";
import { useStore } from "../data/store.jsx";

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
  { key: "WHATSAPP_TOKEN",         desc: "Token de acceso de Meta (System User Token permanente)",       ejemplo: "EAAxxxxxxxxxx" },
  { key: "WHATSAPP_PHONE_ID",      desc: "ID del número de teléfono de WhatsApp Business",               ejemplo: "536414510727" },
  { key: "WEBHOOK_VERIFY_TOKEN",   desc: "Token de verificación del webhook (inventás vos, cualquier string)", ejemplo: "tancat_2026" },
  { key: "FIREBASE_SERVICE_ACCOUNT", desc: "JSON completo de la service account de Firebase (una sola línea)", ejemplo: '{"type":"service_account",...}' },
];

const FLUJOS = [
  { emoji:"🎾", trigger:"reservar / quiero jugar / turno", accion:"Flujo 6 pasos: deporte → fecha → horario → nombre → tel → email → crea reserva en Firebase" },
  { emoji:"🔍", trigger:"disponibilidad / hay lugar / horarios", accion:"Pide deporte y fecha → muestra horarios libres con cantidad de canchas disponibles" },
  { emoji:"❌", trigger:"cancelar / anular mi reserva", accion:"Busca por nombre/ID/teléfono → muestra la reserva → confirma → actualiza estado en Firebase" },
  { emoji:"📋", trigger:"estado / mi reserva / reserva numero", accion:"Busca la reserva y muestra todos los datos: cancha, local, horario, monto, seña, estado" },
  { emoji:"💰", trigger:"precio / cuánto cuesta / tarifa", accion:"Responde tabla de precios: Pádel $8.000, Básquet $12.000, Voley $10.000 + seña 30%" },
  { emoji:"📍", trigger:"dónde están / dirección / locales", accion:"Informa los 2 locales con direcciones" },
  { emoji:"⏰", trigger:"horario / cuando abren / a qué hora", accion:"Informa horario de atención: lunes a domingo 8:00 a 22:00 hs" },
  { emoji:"🚪", trigger:"salir / cancelar / menu / volver", accion:"Cancela cualquier proceso activo y vuelve al menú principal" },
];

function StatusBadge({ ok }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      background: ok ? "rgba(0,200,83,0.12)" : "rgba(255,179,0,0.12)",
      color: ok ? "#00C853" : "#FFB300",
    }}>
      {ok ? "✓ Configurado" : "⏳ Pendiente"}
    </span>
  );
}

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

  // Reservas recibidas por WhatsApp
  const reservasWA = reservas.filter((r) => r.notas?.toLowerCase().includes("whatsapp"));

  return (
    <div>
      <div className="page-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div className="page-title">💬 WhatsApp Bot</div>
          <div className="page-desc">Estado de configuración y monitoreo del bot de WhatsApp Business</div>
        </div>
        <div style={{
          background: pct === 100 ? "rgba(0,200,83,0.12)" : "rgba(255,179,0,0.12)",
          color: pct === 100 ? "#00C853" : "#FFB300",
          padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
        }}>
          {pct === 100 ? "✅ Bot activo" : `⚙️ Configuración ${pct}%`}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="card" style={{ marginBottom: 12, padding: "1rem 1.25rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Progreso de configuración</span>
          <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>{stepsListo}/{steps.length} pasos</span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:"#00C853", borderRadius:3, transition:"width 0.4s ease" }} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>

        {/* Pasos de configuración */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 Pasos de configuración</div>
            <span style={{ fontSize:11, color:"var(--text-muted)" }}>Marcá cada paso al completarlo</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {steps.map((s, i) => (
              <div key={i} onClick={() => toggleStep(i)} style={{
                display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px",
                borderRadius: 8, cursor:"pointer",
                background: s.estado==="listo" ? "rgba(0,200,83,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${s.estado==="listo" ? "rgba(0,200,83,0.2)" : "var(--border)"}`,
                transition:"all 0.15s",
              }}>
                <div style={{
                  width:22, height:22, borderRadius:"50%", flexShrink:0, marginTop:1,
                  background: s.estado==="listo" ? "#00C853" : "rgba(255,255,255,0.08)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:700,
                  color: s.estado==="listo" ? "#000" : "var(--text-muted)",
                }}>
                  {s.estado==="listo" ? "✓" : s.num}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:"var(--text-primary)", marginBottom:2 }}>
                    {s.titulo}
                  </div>
                  <div style={{ fontSize:11.5, color:"var(--text-muted)", lineHeight:1.5 }}>{s.desc}</div>
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize:11, color:"var(--accent)", textDecoration:"none", marginTop:4, display:"inline-block" }}>
                      → {s.linkText}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Variables de entorno */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🔑 Variables de entorno (Render)</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {ENV_VARS.map((v) => (
                <div key={v.key} style={{
                  background:"rgba(255,255,255,0.03)", borderRadius:8,
                  border:"1px solid var(--border)", padding:"8px 10px",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                    <code style={{ fontSize:12, color:"#00C853", fontFamily:"DM Mono,monospace" }}>{v.key}</code>
                    <button onClick={() => copy(v.key, v.key)} style={{
                      fontSize:10, padding:"2px 8px", borderRadius:4,
                      border:"1px solid var(--border)", background:"rgba(255,255,255,0.06)",
                      color:"var(--text-muted)", cursor:"pointer",
                    }}>
                      {copied===v.key ? "✓" : "Copiar"}
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-muted)" }}>{v.desc}</div>
                  <div style={{ fontSize:10.5, color:"rgba(255,255,255,0.25)", marginTop:2 }}>Ej: {v.ejemplo}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Reservas via WhatsApp */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📊 Reservas via WhatsApp</div>
              <span style={{ fontSize:12, fontWeight:700, color:"#00C853" }}>{reservasWA.length}</span>
            </div>
            {reservasWA.length === 0 ? (
              <p style={{ fontSize:12.5, color:"var(--text-muted)", textAlign:"center", padding:"1rem 0" }}>
                Las reservas del bot de WhatsApp aparecerán acá automáticamente.
              </p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {reservasWA.slice(0,5).map((r) => (
                  <div key={r.id} style={{ fontSize:12.5, padding:"6px 0", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"var(--text-primary)" }}>{r.cliente}</span>
                    <span style={{ color:"var(--text-muted)" }}>{r.deporte} · {r.fecha}</span>
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
          <div className="card-title">🤖 Flujos del bot — ¿Qué entiende el bot?</div>
          <span style={{ fontSize:11, color:"var(--text-muted)" }}>Comandos que reconoce el bot por WhatsApp</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {FLUJOS.map((f, i) => (
            <div key={i} style={{
              padding:"10px 12px", borderRadius:8,
              background:"rgba(255,255,255,0.02)",
              border:"1px solid var(--border)",
            }}>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:4 }}>
                {f.emoji} <code style={{ fontSize:11, color:"#00C853", fontFamily:"DM Mono,monospace" }}>{f.trigger}</code>
              </div>
              <div style={{ fontSize:11.5, color:"var(--text-muted)", lineHeight:1.5 }}>{f.accion}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
