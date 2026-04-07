// src/components/TabIA.jsx — Módulo IA: análisis y consejos de redes sociales
import { useState } from "react";
import { useStore } from "../data/store.jsx";
import {
  analizarConcurrencia,
  analizarHorarios,
  predecirDemanda,
} from "../data/iaAnalytics.js";

const COLOR_MAP = {
  verde: { bg: "var(--green-light,#E1F5EE)", text: "var(--green-dark,#085041)", border: "#1D9E75" },
  azul:  { bg: "var(--blue-light,#E6F1FB)",  text: "var(--azul-dark,#0C447C)",  border: "#378ADD" },
  ambar: { bg: "#FAEEDA",                     text: "#633806",                   border: "#EF9F27" },
  rojo:  { bg: "var(--red-light,#FCEBEB)",    text: "#791F1F",                   border: "#E24B4A" },
};

const TIPO_BADGE = {
  reel:     { label: "Reel",     bg: "#7C3AED22", color: "#7C3AED", border: "#7C3AED" },
  historia: { label: "Historia", bg: "#EC489922", color: "#EC4899", border: "#EC4899" },
  carrusel: { label: "Carrusel", bg: "#0EA5E922", color: "#0EA5E9", border: "#0EA5E9" },
  post:     { label: "Post",     bg: "#F5970022", color: "#F59700", border: "#F59700" },
};

function NivelBar({ pct, nivel }) {
  const color = nivel === "alto" ? "#1D9E75" : nivel === "bajo" ? "#E24B4A" : "#EF9F27";
  return (
    <div style={{ flex: 1, height: 6, background: "#F1EFE8", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
    </div>
  );
}

// ── Generador de consejos de redes sociales ─────────────────────────────────
function generarContenidoRedes(concurrencia, horarios) {
  const sugerencias = [];

  // Días de alta concurrencia → reel de ambiente
  const diasAltos = concurrencia.filter((d) => d.nivel === "alto");
  diasAltos.forEach((d) => {
    sugerencias.push({
      tipo: "reel",
      plataforma: "Instagram / TikTok",
      titulo: `Reel de ambiente — ${d.dia}`,
      descripcion: `${d.dia} es tu día estrella con ${d.reservas} reservas en promedio. Mostrá la energía del local ese día.`,
      caption: `"El ${d.dia} en TanCat es diferente 🔥 ¿Reservaste tu lugar? Escribinos 📲"`,
      cuandoPublicar: `Publicar el día anterior (${d.dia === "Lunes" ? "domingo" : "día previo"}) a las 18:00`,
      color: "verde",
    });
  });

  // Días de baja concurrencia → historia con promo
  const diasBajos = concurrencia.filter((d) => d.nivel === "bajo");
  diasBajos.slice(0, 2).forEach((d) => {
    sugerencias.push({
      tipo: "historia",
      plataforma: "Instagram Stories",
      titulo: `Promo del ${d.dia}`,
      descripcion: `Los ${d.dia}s tienen poca actividad (${d.reservas} reservas). Una historia con descuento puede llenar esos turnos vacíos.`,
      caption: `"⚡ Solo hoy: turnos disponibles los ${d.dia}s con descuento especial. ¡Mandanos un mensaje!"`,
      cuandoPublicar: `El ${d.dia} a las 09:00 para captar reservas del mismo día`,
      color: "ambar",
    });
  });

  // Turno de mayor concurrencia → behind the scenes
  const turnoPico = [...horarios].sort((a, b) => b.pct - a.pct)[0];
  if (turnoPico) {
    sugerencias.push({
      tipo: "reel",
      plataforma: "Instagram / TikTok",
      titulo: `Behind the scenes — turno ${turnoPico.label}`,
      descripcion: `El turno ${turnoPico.label.toLowerCase()} concentra el ${turnoPico.pct}% de tus reservas. Es el momento ideal para grabar contenido auténtico.`,
      caption: `"Así se vive TanCat durante el horario más movido 🎾🏀🏐 ¿Ya reservaste el tuyo?"`,
      cuandoPublicar: `30 minutos antes del inicio del turno para máximo alcance`,
      color: "azul",
    });
  }

  // Turno de menor concurrencia → promoción horaria
  const turnoFlojo = [...horarios].sort((a, b) => a.pct - b.pct)[0];
  if (turnoFlojo && turnoFlojo !== turnoPico) {
    sugerencias.push({
      tipo: "historia",
      plataforma: "Instagram Stories",
      titulo: `Oferta turno ${turnoFlojo.label}`,
      descripcion: `El turno ${turnoFlojo.label.toLowerCase()} es el menos ocupado (${turnoFlojo.pct}%). Una historia con oferta puede activar esas horas muertas.`,
      caption: `"Turno libre disponible ahora mismo 🕐 Precio especial hoy. ¡Consultanos por WhatsApp!"`,
      cuandoPublicar: `Al inicio de ese turno para generar reservas inmediatas`,
      color: "ambar",
    });
  }

  // Siempre recomendar carrusel de servicios
  sugerencias.push({
    tipo: "carrusel",
    plataforma: "Instagram Feed",
    titulo: "Carrusel: Los 3 deportes de TanCat",
    descripcion: "Un carrusel mostrando Pádel, Básquet y Voley con precios y disponibilidad. Los carruseles tienen hasta 3× más alcance orgánico que una foto.",
    caption: `"¿Cuál es tu deporte favorito? 🎾🏀🏐 Reservá tu cancha en TanCat — link en bio o escribinos al WhatsApp"`,
    cuandoPublicar: "Martes o miércoles entre 11:00 y 13:00 (mayor interacción semanal)",
    color: "azul",
  });

  // Siempre recomendar testimonio
  sugerencias.push({
    tipo: "historia",
    plataforma: "Instagram Stories",
    titulo: "Testimonio de cliente habitual",
    descripcion: "Pedile a un cliente frecuente que grabe 10 segundos contando su experiencia post-partido. El contenido generado por usuarios genera más confianza que cualquier publicidad.",
    caption: `"Nuestros clientes lo dicen todo 💚 ¡Sumate a la comunidad TanCat!"`,
    cuandoPublicar: "Domingo a las 17:00 (cierre de fin de semana, alta actividad en redes)",
    color: "verde",
  });

  // Recomendación de post educativo
  sugerencias.push({
    tipo: "post",
    plataforma: "Instagram Feed / Facebook",
    titulo: "Post educativo: Beneficios del pádel",
    descripcion: "Un post con datos sobre los beneficios del pádel para la salud posiciona a TanCat como referente, no solo como cancha de alquiler.",
    caption: `"¿Sabías que el pádel quema hasta 600 kcal por hora? 🔥 Reservá tu clase en TanCat y empezá hoy."`,
    cuandoPublicar: "Lunes o jueves a las 20:00 (momento de mayor navegación post-trabajo)",
    color: "verde",
  });

  return sugerencias;
}

// ── Componente de tarjeta de contenido ─────────────────────────────────────
function ContenidoCard({ s, idx }) {
  const col = COLOR_MAP[s.color] || COLOR_MAP.azul;
  const badge = TIPO_BADGE[s.tipo] || TIPO_BADGE.post;
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: `1px solid ${col.border}`,
        borderRadius: 12,
        background: col.bg,
        padding: "1rem 1.1rem",
        marginBottom: 10,
        animation: `fadeSlide 0.3s ease ${idx * 0.07}s both`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            {/* Tipo badge */}
            <span
              style={{
                fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                background: badge.bg, color: badge.color,
                border: `1px solid ${badge.border}`,
                textTransform: "uppercase", letterSpacing: 0.5,
              }}
            >
              {badge.label}
            </span>
            <span style={{ fontWeight: 600, fontSize: 14, color: col.text }}>{s.titulo}</span>
            <span style={{ fontSize: 11, color: "var(--gray-400)" }}>— {s.plataforma}</span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--gray-600,#5F5E5A)", margin: 0, lineHeight: 1.5 }}>
            {s.descripcion}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            fontSize: 12, padding: "4px 10px", borderRadius: 8,
            border: `1px solid ${col.border}`, background: "#fff",
            color: col.text, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          {open ? "Ocultar" : "Ver caption"}
        </button>
      </div>

      {open && (
        <div
          style={{
            marginTop: 10, padding: "10px 14px",
            background: "#fff", borderRadius: 8,
            border: `1px solid ${col.border}`,
          }}
        >
          <div
            style={{
              fontSize: 11, fontWeight: 700, color: col.text,
              marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5,
            }}
          >
            Caption sugerido
          </div>
          <div
            style={{
              fontSize: 13, color: "var(--gray-800,#2C2C2A)",
              fontWeight: 500, lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            {s.caption}
          </div>
          <div
            style={{
              marginTop: 8, paddingTop: 8,
              borderTop: `1px solid ${col.border}`,
              fontSize: 11, color: "var(--gray-400)",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            🕐 <strong>Cuándo publicar:</strong> {s.cuandoPublicar}
          </div>
        </div>
      )}
    </div>
  );
}

const nivelColor = { alto: "#1D9E75", medio: "#EF9F27", bajo: "#E24B4A", sin_datos: "#D3D1C7" };

// ── Componente principal ────────────────────────────────────────────────────
export default function TabIA() {
  const { reservas, ventas, stock } = useStore();
  const [concurrencia, setConcurrencia] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [predicciones, setPredicciones] = useState([]);
  const [contenidoRedes, setContenidoRedes] = useState([]);
  const [analizando, setAnalizando] = useState(false);
  const [analizado, setAnalizado] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const analizar = async () => {
    setAnalizando(true);
    const conc = analizarConcurrencia(reservas);
    const hor = analizarHorarios(reservas);
    const pred = await predecirDemanda(conc);
    const contenido = generarContenidoRedes(conc, hor);
    setConcurrencia(conc);
    setHorarios(hor);
    setPredicciones(pred);
    setContenidoRedes(contenido);
    setAnalizando(false);
    setAnalizado(true);
  };

  const tiposFiltro = [
    { val: "todos",    label: "Todos" },
    { val: "reel",     label: "Reels" },
    { val: "historia", label: "Historias" },
    { val: "carrusel", label: "Carruseles" },
    { val: "post",     label: "Posts" },
  ];

  const contenidoFiltrado = filtroTipo === "todos"
    ? contenidoRedes
    : contenidoRedes.filter((s) => s.tipo === filtroTipo);

  return (
    <div>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">IA & Redes Sociales</div>
          <div className="page-desc">Análisis de demanda y consejos de contenido para Instagram y TikTok</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={analizar}
          disabled={analizando}
          style={{ minWidth: 160 }}
        >
          {analizando ? "⚙️ Analizando..." : analizado ? "🔄 Re-analizar" : "🤖 Analizar con IA"}
        </button>
      </div>

      {/* Pantalla inicial */}
      {!analizado && !analizando && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 2rem" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-800)", marginBottom: 8 }}>
            Motor de análisis listo
          </div>
          <p style={{ fontSize: 13.5, color: "var(--gray-600)", maxWidth: 520, margin: "0 auto 1.5rem" }}>
            Analizá tus datos de reservas para descubrir qué días y horarios son los más activos,
            y recibí consejos específicos de qué reels, historias y posts publicar para llenar las canchas vacías.
          </p>
          <button className="btn btn-primary" onClick={analizar} style={{ fontSize: 14, padding: "10px 28px" }}>
            🤖 Iniciar análisis
          </button>
        </div>
      )}

      {/* Loading */}
      {analizando && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>
            ⚙️ Procesando datos de reservas...
          </div>
          <div style={{ height: 4, background: "#F1EFE8", borderRadius: 2, overflow: "hidden", maxWidth: 300, margin: "0 auto" }}>
            <div style={{ height: "100%", background: "#1D9E75", borderRadius: 2, animation: "loadBar 1.5s infinite" }} />
          </div>
          <style>{`@keyframes loadBar { 0%{width:0%} 50%{width:80%} 100%{width:100%} }`}</style>
        </div>
      )}

      {analizado && !analizando && (
        <>
          {/* Análisis de concurrencia + horarios */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Concurrencia por día</div>
                  <div className="card-sub">Basado en {reservas.length} reservas</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {concurrencia.map((d, i) => (
                  <div key={d.dia} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <span style={{ minWidth: 90, color: "var(--gray-800)", fontWeight: d.nivel === "alto" ? 600 : 400 }}>
                      {d.dia}
                    </span>
                    <NivelBar pct={d.pct} nivel={d.nivel} />
                    <span style={{ minWidth: 28, textAlign: "right", fontWeight: 600, color: nivelColor[d.nivel] || "#888" }}>
                      {d.reservas}
                    </span>
                    <span style={{
                      fontSize: 10, padding: "1px 7px", borderRadius: 20, fontWeight: 600,
                      background: (nivelColor[d.nivel] || "#888") + "22",
                      color: nivelColor[d.nivel] || "#888",
                      minWidth: 52, textAlign: "center",
                    }}>
                      {d.nivel.replace("_", " ")}
                    </span>
                    {predicciones[i] !== undefined && (
                      <span style={{ fontSize: 10, color: "var(--gray-400)", minWidth: 36, textAlign: "right" }}>
                        {Math.round(predicciones[i] * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 10, borderTop: "1px solid var(--gray-200)", paddingTop: 8 }}>
                Columna % = predicción de demanda futura (TensorFlow.js)
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Distribución por turno</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {horarios.map((h) => (
                  <div key={h.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <span style={{ minWidth: 160, color: "var(--gray-800)" }}>{h.label}</span>
                    <NivelBar pct={h.pct} nivel={h.nivel} />
                    <span style={{ minWidth: 36, textAlign: "right", fontWeight: 600, color: nivelColor[h.nivel] }}>
                      {h.pct}%
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 14, paddingTop: 8, borderTop: "1px solid var(--gray-200)", fontSize: 11 }}>
                {[["#1D9E75", "Alto"], ["#EF9F27", "Medio"], ["#E24B4A", "Bajo"]].map(([c, l]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--gray-600)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Consejos de contenido para redes */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">📱 Consejos de contenido para redes</div>
                <div className="card-sub">
                  {contenidoRedes.length} ideas generadas según tus datos · Instagram & TikTok
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {tiposFiltro.map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => setFiltroTipo(val)}
                    style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 20, cursor: "pointer",
                      border: "1px solid var(--gray-200)",
                      background: filtroTipo === val ? "#1D9E75" : "#fff",
                      color: filtroTipo === val ? "#fff" : "var(--gray-600)",
                      fontWeight: filtroTipo === val ? 600 : 400,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leyenda de tipos */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              {Object.entries(TIPO_BADGE).map(([key, b]) => (
                <span
                  key={key}
                  style={{
                    fontSize: 11, padding: "2px 10px", borderRadius: 20,
                    background: b.bg, color: b.color,
                    border: `1px solid ${b.border}`,
                    fontWeight: 600,
                  }}
                >
                  {b.label}
                </span>
              ))}
              <span style={{ fontSize: 11, color: "var(--gray-400)", alignSelf: "center" }}>
                — Hacé clic en "Ver caption" para ver el texto sugerido y cuándo publicar
              </span>
            </div>

            {contenidoFiltrado.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--gray-400)", padding: "1.5rem" }}>
                No hay sugerencias para este tipo de contenido.
              </p>
            ) : (
              contenidoFiltrado.map((s, i) => <ContenidoCard key={i} s={s} idx={i} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
