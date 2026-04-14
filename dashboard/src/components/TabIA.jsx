// src/components/TabIA.jsx — Módulo IA: análisis, marketing y estrategia de contenido
import { useState } from "react";
import { useStore } from "../data/store.jsx";
import {
  analizarConcurrencia,
  analizarHorarios,
  predecirDemanda,
} from "../data/iaAnalytics.js";
import {
  Bot, RefreshCw, Loader2, CalendarDays, Hash, Lightbulb,
  Film, BookOpen, Target, Users, Gamepad2,
} from "lucide-react";
import "../styles/TabIA.css";

// ── Paleta de cards ──────────────────────────────────────────────────────────
const COLOR_MAP = {
  verde:   { bg: "var(--green-light,#E1F5EE)", text: "var(--green-dark,#085041)", border: "#1D9E75" },
  azul:    { bg: "var(--blue-light,#E6F1FB)",  text: "var(--azul-dark,#0C447C)",  border: "#378ADD" },
  ambar:   { bg: "#FAEEDA",                    text: "#633806",                   border: "#EF9F27" },
  rojo:    { bg: "var(--red-light,#FCEBEB)",   text: "#791F1F",                   border: "#E24B4A" },
  purpura: { bg: "#F3EFFE",                    text: "#5B21B6",                   border: "#7C3AED" },
};

const TIPO_BADGE = {
  reel:     { label: "Reel",     bg: "#7C3AED22", color: "#7C3AED", border: "#7C3AED" },
  historia: { label: "Historia", bg: "#EC489922", color: "#EC4899", border: "#EC4899" },
  carrusel: { label: "Carrusel", bg: "#0EA5E922", color: "#0EA5E9", border: "#0EA5E9" },
  post:     { label: "Post",     bg: "#F5970022", color: "#F59700", border: "#F59700" },
};

// ── Pilares de contenido ─────────────────────────────────────────────────────
const PILARES = {
  bts:             { label: "Behind the Scenes", Icon: Film,     color: "#378ADD" },
  educativo:       { label: "Educativo",          Icon: BookOpen, color: "#0EA5E9" },
  promocional:     { label: "Promocional",        Icon: Target,   color: "#E24B4A" },
  comunidad:       { label: "Comunidad",          Icon: Users,    color: "#1D9E75" },
  entretenimiento: { label: "Entretenimiento",    Icon: Gamepad2, color: "#7C3AED" },
};

// ── Sets de hashtags ─────────────────────────────────────────────────────────
const HASHTAGS = {
  padel:    ["#padel", "#padelargentina", "#padelcordoba", "#padellovers", "#padellife", "#padelvideo", "#padeladictos"],
  basquet:  ["#basquet", "#basketball", "#basquetargentina", "#basquetcordoba", "#hoops", "#baloncesto"],
  voley:    ["#voley", "#volleyball", "#voleyargentina", "#volleyballlife", "#voleycordoba"],
  general:  ["#tancat", "#deportes", "#cordoba", "#canchas", "#reservas", "#actividadfisica", "#fitness"],
  reel:     ["#reels", "#reelsinstagram", "#viral", "#trending", "#fyp", "#reelsvideo"],
  historia: ["#stories", "#instastories", "#oferta", "#promos"],
  carrusel: ["#swipe", "#carousel", "#tips", "#conocemas"],
  post:     ["#cordoba", "#feed", "#instagram", "#contenido"],
};

const tags = (...keys) => keys.flatMap((k) => HASHTAGS[k] || []);

// ── Plan editorial base ──────────────────────────────────────────────────────
const DIAS_ORDEN = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const PLAN_BASE = {
  Lunes:     { tipo: "post",     pilar: "educativo",       hora: "19:00–21:00", tema: "Dato interesante o beneficio de un deporte" },
  Martes:    { tipo: "carrusel", pilar: "educativo",       hora: "11:00–13:00", tema: "Servicios, precios y deportes de TanCat" },
  Miércoles: { tipo: "reel",     pilar: "entretenimiento", hora: "19:00–21:00", tema: "Challenge deportivo o BTS del local" },
  Jueves:    { tipo: "historia", pilar: "promocional",     hora: "09:00–11:00", tema: "Promo para asegurar el fin de semana" },
  Viernes:   { tipo: "reel",     pilar: "bts",             hora: "17:00–19:00", tema: "Ambiente pre-fin de semana en TanCat" },
  Sábado:    { tipo: "historia", pilar: "comunidad",       hora: "10:00–12:00", tema: "Testimonio o repost de cliente habitual" },
  Domingo:   { tipo: "post",     pilar: "comunidad",       hora: "17:00–19:00", tema: "Resumen semanal o preview de la próxima semana" },
};

// ── Generadores ──────────────────────────────────────────────────────────────
function generarContenidoRedes(concurrencia, horarios) {
  const sugerencias = [];

  // Días ALTOS — generar FOMO el día anterior
  concurrencia.filter((d) => d.nivel === "alto").forEach((d) => {
    sugerencias.push({
      tipo: "reel", pilar: "bts", plataforma: "Instagram / TikTok",
      titulo: `Reel de ambiente — ${d.dia}`,
      descripcion: `${d.dia} es tu día pico con ${d.reservas} reservas en promedio. Mostrá la energía real del local para generar FOMO en tu audiencia antes de que llegue ese día.`,
      caption: `¿Ya sabés qué hacer el ${d.dia}? 👀\n\nEn TanCat la energía es diferente — canchas llenas, buena onda y deporte a full. 🎾🏀🏐\n\nSi no reservás, te quedás afuera. Los lugares se van rápido.\n\n📲 Mandanos un mensaje AHORA y asegurá tu turno.`,
      hashtags: tags("reel", "general"),
      cuandoPublicar: `Publicar el día anterior a las 18:00–20:00 para anticipar el pico`,
      horarioOptimo: "6–9h · 12–14h · 17–20h",
      color: "verde",
    });
  });

  // Días BAJOS — oferta flash para activar turnos vacíos
  concurrencia.filter((d) => d.nivel === "bajo").slice(0, 2).forEach((d) => {
    sugerencias.push({
      tipo: "historia", pilar: "promocional", plataforma: "Instagram Stories",
      titulo: `Oferta flash — ${d.dia}`,
      descripcion: `Los ${d.dia}s son los de menor actividad (${d.reservas} reservas). Una historia de urgencia con precio especial puede convertir esos turnos vacíos en ingresos reales.`,
      caption: `⚡ SOLO HOY — ${d.dia.toUpperCase()}\n\nTurnos disponibles con precio especial.\nNo dejes pasar esta oportunidad. ⏳\n\nPrimero en escribir, primero en jugar.\n\n👉 DM o WhatsApp — respondemos al instante.`,
      hashtags: tags("historia", "general"),
      cuandoPublicar: `El ${d.dia} a las 08:30 — captar reservas del mismo día antes de que arranque`,
      horarioOptimo: "8–10h · 12–13h · 20–22h",
      color: "ambar",
    });
  });

  // Turno PICO — behind the scenes
  const turnoPico = [...horarios].sort((a, b) => b.pct - a.pct)[0];
  if (turnoPico) {
    sugerencias.push({
      tipo: "reel", pilar: "bts", plataforma: "Instagram / TikTok",
      titulo: `Behind the scenes — turno ${turnoPico.label}`,
      descripcion: `El turno ${turnoPico.label.toLowerCase()} concentra el ${turnoPico.pct}% de reservas. Mostrá lo que pasa en ese momento: es el contenido más auténtico que podés generar.`,
      caption: `Nadie te contó cómo es TanCat durante el turno más movido del día... 🤫\n\nAquí va el detrás de escena. 🎬\n\n¿Cuál es tu deporte favorito? Contanos abajo 👇\n\nY si querés ser parte de esto → reservá tu lugar antes de que se llene. 📲`,
      hashtags: tags("reel", "general"),
      cuandoPublicar: `30 minutos antes del inicio del turno ${turnoPico.label.toLowerCase()}`,
      horarioOptimo: "6–9h · 12–14h · 17–20h",
      color: "azul",
    });
  }

  // Turno FLOJO — oferta de última hora
  const turnoFlojo = [...horarios].sort((a, b) => a.pct - b.pct)[0];
  if (turnoFlojo && turnoFlojo !== turnoPico) {
    sugerencias.push({
      tipo: "historia", pilar: "promocional", plataforma: "Instagram Stories",
      titulo: `Turno libre — ${turnoFlojo.label}`,
      descripcion: `El turno ${turnoFlojo.label.toLowerCase()} es el menos ocupado (${turnoFlojo.pct}%). Una historia de última hora activa ese espacio vacío con urgencia real.`,
      caption: `🕐 TURNO LIBRE — ${turnoFlojo.label.toUpperCase()}\n\nSolo hoy, precio especial en este horario.\n¿Lo aprovechás? ⏳\n\nEscribinos AHORA por WhatsApp.\nRespondemos al instante. 📲`,
      hashtags: tags("historia", "general"),
      cuandoPublicar: `Al inicio del turno ${turnoFlojo.label.toLowerCase()} — urgencia de última hora`,
      horarioOptimo: "8–10h · 12–13h · 20–22h",
      color: "ambar",
    });
  }

  // Carrusel educativo — 3 deportes
  sugerencias.push({
    tipo: "carrusel", pilar: "educativo", plataforma: "Instagram Feed",
    titulo: "Carrusel: Los 3 deportes de TanCat",
    descripcion: "Presentá pádel, básquet y voley con precios, horarios y beneficios. Los carruseles tienen hasta 3× más alcance orgánico y se guardan fácil — son el formato con mayor vida útil.",
    caption: `¿Cuál es el tuyo? 🎾🏀🏐\n\nEn TanCat tenés 3 deportes, canchas de primera y turnos disponibles hoy mismo.\n\nDeslizá para ver precios y horarios ➡️\n\n🔗 Reservá en el link de bio o escribinos directo por WhatsApp.`,
    hashtags: tags("carrusel", "padel", "basquet", "voley", "general"),
    cuandoPublicar: "Martes o miércoles 11:00–13:00 — horario de mayor reach orgánico en feed",
    horarioOptimo: "9–11h · 17–19h (martes a jueves)",
    color: "azul",
  });

  // Testimonio — comunidad
  sugerencias.push({
    tipo: "historia", pilar: "comunidad", plataforma: "Instagram Stories",
    titulo: "Testimonio de cliente habitual",
    descripcion: "Pedile a un cliente frecuente que grabe 10–15 segundos contando por qué vuelve a TanCat. El contenido UGC (user generated) genera más confianza que cualquier publicidad pagada.",
    caption: `Ellos ya saben lo que es jugar en TanCat. 💚\n\n[Nombre del cliente] viene hace [tiempo] y no para de volver. ¿Por qué? Escuchalo en su propio video.\n\n¿Vos todavía no lo probaste?\nTe esperamos. 📲`,
    hashtags: tags("historia", "general"),
    cuandoPublicar: "Domingo 17:00–19:00 — gente en casa, alta actividad en Stories",
    horarioOptimo: "8–10h · 12–13h · 20–22h",
    color: "verde",
  });

  // Post educativo — pádel
  sugerencias.push({
    tipo: "post", pilar: "educativo", plataforma: "Instagram Feed / Facebook",
    titulo: "Post educativo: Beneficios del pádel",
    descripcion: "Contenido educativo que posiciona a TanCat como referente y no solo como cancha. Los posts educativos se guardan, se comparten y generan autoridad de marca a largo plazo.",
    caption: `5 razones por las que el pádel es el deporte que necesitás en tu vida 🎾\n\n1️⃣ Quema hasta 600 kcal por hora\n2️⃣ Mejora reflejos y coordinación\n3️⃣ Es social — se juega de a 4\n4️⃣ Para todos los niveles desde el día 1\n5️⃣ Reduce el estrés comprobado\n\n¿Cuál es tu excusa para no empezar?\nTanCat tiene turnos ahora mismo. 🔗 Link en bio.`,
    hashtags: tags("post", "padel", "general"),
    cuandoPublicar: "Lunes o jueves 19:00–21:00 — pico nocturno de engagement en Instagram",
    horarioOptimo: "9–13h · 18–20h",
    color: "verde",
  });

  // Encuesta — entretenimiento
  sugerencias.push({
    tipo: "historia", pilar: "entretenimiento", plataforma: "Instagram Stories",
    titulo: "Encuesta: ¿Cuál es tu deporte favorito?",
    descripcion: "Las encuestas en Stories generan engagement inmediato y te dan datos reales de tu audiencia. Simple, rápido y 100% interactivo. Ideal para viernes antes del fin de semana.",
    caption: `🔥 EL DEBATE DEL DÍA:\n\n¿Con cuál te quedás?\n\n🎾 Pádel  vs  🏀 Básquet\n\nVotá en la encuesta ⬆️\n\nEl deporte más votado esta semana tiene turno especial este fin de semana. ¡No te lo pierdas!`,
    hashtags: tags("historia", "general"),
    cuandoPublicar: "Viernes 17:00–19:00 — alta interacción pre-fin de semana",
    horarioOptimo: "8–10h · 12–13h · 20–22h",
    color: "purpura",
  });

  // Reel challenge — entretenimiento
  sugerencias.push({
    tipo: "reel", pilar: "entretenimiento", plataforma: "Instagram / TikTok",
    titulo: "Reel: El mejor golpe de la semana",
    descripcion: "Invitá a tus clientes a mandarte su mejor golpe o jugada. Reposteás al ganador. Genera comunidad, contenido gratuito y viralidad orgánica — los mejores tres efectos del marketing de redes.",
    caption: `¿Quién tiene el mejor golpe de la semana? 🎯\n\nMandanos tu video y lo posteamos acá. 👇\n\nEl ganador se lleva [turno gratis / descuento especial] 🏆\n\n¡Animense! Tenemos hasta el domingo para recibir videos.`,
    hashtags: tags("reel", "general"),
    cuandoPublicar: "Miércoles 19:00–21:00 — mitad de semana, alto engagement en Reels",
    horarioOptimo: "6–9h · 12–14h · 17–20h",
    color: "purpura",
  });

  return sugerencias;
}

function generarCalendario(concurrencia) {
  return DIAS_ORDEN.map((dia) => {
    const base = PLAN_BASE[dia];
    const concDia = concurrencia.find((c) => c.dia === dia);
    const nivel = concDia?.nivel || "medio";
    let nota = "";
    let tipo = base.tipo;
    let pilar = base.pilar;
    if (nivel === "bajo") {
      nota = "⚡ Día tranquilo — priorizar promo urgente";
      tipo = "historia";
      pilar = "promocional";
    } else if (nivel === "alto") {
      nota = "🔥 Día pico — publicar la tarde/noche anterior";
    }
    return { dia, tipo, pilar, hora: base.hora, tema: base.tema, nivel, nota };
  });
}

// ── Componentes auxiliares ───────────────────────────────────────────────────
function NivelBar({ pct, nivel }) {
  const color = nivel === "alto" ? "#1D9E75" : nivel === "bajo" ? "#E24B4A" : "#EF9F27";
  return (
    <div className="nivel-bar-bg">
      <div className="nivel-bar-fill" style={{ '--w': `${pct}%`, '--c': color }} />
    </div>
  );
}

function CopyBtn({ text, label = "Copiar" }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };
  return (
    <button className={`copy-btn${copiado ? " copy-btn-ok" : ""}`} onClick={copiar}>
      {copiado ? "✓ Copiado" : label}
    </button>
  );
}

function HashtagChips({ hashtags }) {
  return (
    <div className="hashtag-row">
      <div className="hashtag-chips">
        {hashtags.map((h) => <span key={h} className="hashtag-chip">{h}</span>)}
      </div>
      <CopyBtn text={hashtags.join(" ")} label="Copiar tags" />
    </div>
  );
}

function ContenidoCard({ s, idx }) {
  const col   = COLOR_MAP[s.color] || COLOR_MAP.azul;
  const badge = TIPO_BADGE[s.tipo] || TIPO_BADGE.post;
  const pilar = PILARES[s.pilar];
  const [open, setOpen] = useState(false);

  return (
    <div className="contenido-card" style={{
      '--col-border': col.border, '--col-bg': col.bg, '--col-text': col.text,
      '--anim-delay': `${idx * 0.07}s`,
    }}>
      <div className="contenido-card-header">
        <div className="contenido-card-body">
          <div className="contenido-badges">
            <span className="contenido-tipo-badge" style={{ '--badge-bg': badge.bg, '--badge-color': badge.color, '--badge-border': badge.border }}>
              {badge.label}
            </span>
            {pilar && (
              <span className="pilar-badge" style={{ '--pilar-c': pilar.color }}>
                <pilar.Icon size={10} /> {pilar.label}
              </span>
            )}
            <span className="contenido-title">{s.titulo}</span>
            <span className="contenido-platform">— {s.plataforma}</span>
          </div>
          <p className="contenido-desc">{s.descripcion}</p>
          {s.hashtags?.length > 0 && <HashtagChips hashtags={s.hashtags} />}
        </div>
        <button onClick={() => setOpen((o) => !o)} className="contenido-toggle-btn">
          {open ? "Ocultar" : "Ver caption"}
        </button>
      </div>

      {open && (
        <div className="contenido-caption">
          <div className="contenido-caption-header">
            <div className="contenido-caption-title">Caption sugerido — estructura AIDA</div>
            <CopyBtn text={s.caption} label="Copiar caption" />
          </div>
          <div className="contenido-caption-text">{s.caption}</div>
          <div className="contenido-when">
            <span>🕐 <strong>Cuándo publicar:</strong> {s.cuandoPublicar}</span>
            {s.horarioOptimo && (
              <span className="contenido-horario-optimo">📊 Pico de engagement: {s.horarioOptimo}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarioEditorial({ calendario }) {
  return (
    <div>
      <div className="card-header">
        <div>
          <div className="card-title icon-row"><CalendarDays size={15} /> Calendario editorial semanal</div>
          <div className="card-sub">Plan de publicaciones adaptado a tus datos de concurrencia</div>
        </div>
      </div>
      <div className="cal-grid">
        {calendario.map(({ dia, tipo, pilar, hora, tema, nivel, nota }) => {
          const tipoBadge = TIPO_BADGE[tipo] || TIPO_BADGE.post;
          const pilarInfo = PILARES[pilar];
          const nivelColor = { alto: "#1D9E75", medio: "#EF9F27", bajo: "#E24B4A", sin_datos: "#888" };
          return (
            <div key={dia} className="cal-row">
              <div className="cal-dia">
                <span className="cal-dia-nombre">{dia}</span>
                <span className="cal-nivel-dot" style={{ '--nd-c': nivelColor[nivel] || "#888" }} />
              </div>
              <div className="cal-tipo">
                <span className="contenido-tipo-badge" style={{ '--badge-bg': tipoBadge.bg, '--badge-color': tipoBadge.color, '--badge-border': tipoBadge.border }}>
                  {tipoBadge.label}
                </span>
              </div>
              <div className="cal-pilar">
                {pilarInfo && (
                  <span className="pilar-badge" style={{ '--pilar-c': pilarInfo.color }}>
                    <pilarInfo.Icon size={10} /> {pilarInfo.label}
                  </span>
                )}
              </div>
              <div className="cal-hora">{hora}</div>
              <div className="cal-tema">
                <span>{tema}</span>
                {nota && <span className="cal-nota">{nota}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        {[["#1D9E75", "Día alto"], ["#EF9F27", "Día medio"], ["#E24B4A", "Día bajo"]].map(([c, l]) => (
          <span key={l} className="cal-legend-item">
            <span className="cal-nivel-dot" style={{ '--nd-c': c }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

function HashtagKit() {
  const grupos = [
    { label: "🎾 Pádel",              keys: ["padel"] },
    { label: "🏀 Básquet",            keys: ["basquet"] },
    { label: "🏐 Voley",              keys: ["voley"] },
    { label: "📱 Reels & TikTok",     keys: ["reel"] },
    { label: "📖 Stories & Promos",   keys: ["historia"] },
    { label: "🏠 TanCat & Córdoba",   keys: ["general"] },
  ];

  return (
    <div>
      <div className="card-header">
        <div>
          <div className="card-title icon-row"><Hash size={15} /> Kit de hashtags</div>
          <div className="card-sub">Sets organizados por deporte y formato — copiá el que necesites</div>
        </div>
      </div>
      <div className="hashtag-kit-grid">
        {grupos.map(({ label, keys }) => {
          const allTags = tags(...keys);
          return (
            <div key={label} className="hashtag-kit-card">
              <div className="hashtag-kit-label">{label}</div>
              <div className="hashtag-chips hashtag-chips-sm">
                {allTags.map((h) => <span key={h} className="hashtag-chip">{h}</span>)}
              </div>
              <CopyBtn text={allTags.join(" ")} label="Copiar set" />
            </div>
          );
        })}
      </div>
      <div className="hashtag-kit-tip icon-row">
        <Lightbulb size={13} /> <span><strong>Tip:</strong> Combiná 3–5 tags de tu deporte + 2–3 de formato + 3–4 generales de TanCat para máximo alcance orgánico.</span>
      </div>
    </div>
  );
}

// ── Vista principal ──────────────────────────────────────────────────────────
const nivelColor = { alto: "#1D9E75", medio: "#EF9F27", bajo: "#E24B4A", sin_datos: "#D3D1C7" };

const FILTROS_TIPO  = [
  { val: "todos", label: "Todos" }, { val: "reel", label: "Reels" },
  { val: "historia", label: "Historias" }, { val: "carrusel", label: "Carruseles" },
  { val: "post", label: "Posts" },
];

const FILTROS_PILAR = [
  { val: "todos", label: "Todos los pilares", Icon: null },
  ...Object.entries(PILARES).map(([k, p]) => ({ val: k, label: p.label, Icon: p.Icon })),
];

export default function TabIA() {
  const { reservas } = useStore();
  const [concurrencia, setConcurrencia] = useState([]);
  const [horarios, setHorarios]         = useState([]);
  const [predicciones, setPredicciones] = useState([]);
  const [contenidoRedes, setContenidoRedes] = useState([]);
  const [calendario, setCalendario]     = useState([]);
  const [analizando, setAnalizando]     = useState(false);
  const [analizado, setAnalizado]       = useState(false);
  const [filtroTipo, setFiltroTipo]     = useState("todos");
  const [filtroPilar, setFiltroPilar]   = useState("todos");

  const analizar = async () => {
    setAnalizando(true);
    const conc     = analizarConcurrencia(reservas);
    const hor      = analizarHorarios(reservas);
    const pred     = await predecirDemanda(conc);
    const contenido = generarContenidoRedes(conc, hor);
    const cal       = generarCalendario(conc);
    setConcurrencia(conc);
    setHorarios(hor);
    setPredicciones(pred);
    setContenidoRedes(contenido);
    setCalendario(cal);
    setAnalizando(false);
    setAnalizado(true);
  };

  const contenidoFiltrado = contenidoRedes
    .filter((s) => filtroTipo  === "todos" || s.tipo  === filtroTipo)
    .filter((s) => filtroPilar === "todos" || s.pilar === filtroPilar);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">IA & Marketing Digital</div>
          <div className="page-desc">Estrategia de contenido, calendario editorial y kit de hashtags basados en tus datos</div>
        </div>
        <button className="btn btn-primary ia-btn-analyze" onClick={analizar} disabled={analizando}>
          {analizando
            ? <><Loader2 size={14} className="icon-spin" /> Analizando...</>
            : analizado
            ? <><RefreshCw size={14} /> Re-analizar</>
            : <><Bot size={14} /> Analizar con IA</>}
        </button>
      </div>

      {!analizado && !analizando && (
        <div className="card ia-initial">
          <div className="ia-initial-emoji">📱</div>
          <div className="ia-initial-title">Motor de marketing listo</div>
          <p className="ia-initial-desc">
            Analizá tus datos de reservas y obtené una estrategia completa: calendario editorial semanal,
            captions con estructura AIDA, kit de hashtags por deporte y pilares de contenido personalizados.
          </p>
          <button className="btn btn-primary ia-initial-btn" onClick={analizar}>
            <Bot size={15} /> Iniciar análisis
          </button>
        </div>
      )}

      {analizando && (
        <div className="card ia-loading">
          <div className="ia-loading-text">⚙️ Procesando datos y generando estrategia...</div>
          <div className="ia-loading-bar-bg">
            <div className="ia-loading-bar" />
          </div>
        </div>
      )}

      {analizado && !analizando && (
        <>
          {/* Análisis de datos */}
          <div className="ia-analysis-grid">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Concurrencia por día</div>
                  <div className="card-sub">Basado en {reservas.length} reservas</div>
                </div>
              </div>
              <div className="ia-conc-list">
                {concurrencia.map((d, i) => {
                  const nc = nivelColor[d.nivel] || "#888";
                  return (
                    <div key={d.dia} className="ia-conc-item">
                      <span className={`ia-conc-day${d.nivel === "alto" ? " ia-conc-day-bold" : ""}`}>{d.dia}</span>
                      <NivelBar pct={d.pct} nivel={d.nivel} />
                      <span className="ia-conc-count" style={{ '--nc': nc }}>{d.reservas}</span>
                      <span className="ia-conc-badge" style={{ '--nc': nc, '--nb-bg': nc + "22" }}>
                        {d.nivel.replace("_", " ")}
                      </span>
                      {predicciones[i] !== undefined && (
                        <span className="ia-conc-pred">{Math.round(predicciones[i] * 100)}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="ia-conc-footer">Columna % = predicción de demanda futura (TensorFlow.js)</div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Distribución por turno</div>
              </div>
              <div className="ia-hor-list">
                {horarios.map((h) => (
                  <div key={h.key} className="ia-hor-item">
                    <span className="ia-hor-label">{h.label}</span>
                    <NivelBar pct={h.pct} nivel={h.nivel} />
                    <span className="ia-hor-pct" style={{ '--nc': nivelColor[h.nivel] }}>{h.pct}%</span>
                  </div>
                ))}
              </div>
              <div className="ia-hor-legend">
                {[["#1D9E75", "Alto"], ["#EF9F27", "Medio"], ["#E24B4A", "Bajo"]].map(([c, l]) => (
                  <span key={l} className="ia-hor-legend-item">
                    <span className="ia-hor-legend-dot" style={{ '--c': c }} />{l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Calendario editorial */}
          <div className="card" style={{ marginBottom: 12 }}>
            <CalendarioEditorial calendario={calendario} />
          </div>

          {/* Sugerencias de contenido */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-header">
              <div>
                <div className="card-title icon-row"><Bot size={15} /> Estrategia de contenido</div>
                <div className="card-sub">
                  {contenidoRedes.length} ideas con captions AIDA, hashtags y horarios óptimos
                </div>
              </div>
            </div>

            <div className="ia-filter-section">
              <div className="ia-filter-group">
                <span className="ia-filter-label">Formato</span>
                <div className="ia-filter-row">
                  {FILTROS_TIPO.map(({ val, label }) => (
                    <button key={val} onClick={() => setFiltroTipo(val)}
                      className={`ia-filter-btn${filtroTipo === val ? " ia-filter-btn-active" : ""}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ia-filter-group">
                <span className="ia-filter-label">Pilar</span>
                <div className="ia-filter-row">
                  {FILTROS_PILAR.map(({ val, label, Icon }) => (
                    <button key={val} onClick={() => setFiltroPilar(val)}
                      className={`ia-filter-btn${filtroPilar === val ? " ia-filter-btn-active" : ""}`}>
                      {Icon && <Icon size={11} />}{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {contenidoFiltrado.length === 0 ? (
              <p className="ia-no-content">No hay sugerencias para este filtro.</p>
            ) : (
              contenidoFiltrado.map((s, i) => <ContenidoCard key={i} s={s} idx={i} />)
            )}
          </div>

          {/* Kit de hashtags */}
          <div className="card">
            <HashtagKit />
          </div>
        </>
      )}
    </div>
  );
}
