// src/components/TabReportes.jsx — Centro de análisis avanzado de TanCat v3.0
import { useState, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, Treemap, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
} from "recharts";
import { useStore } from "../data/store.jsx";
import { CANCHAS } from "../data/canchas.js";
import "../styles/TabReportes.css";

const PERIODO_OPTS = ["Semana", "Mes", "3 meses", "Todo"];

const pLabel = (p) => ({
  Semana: "esta semana",
  Mes: "este mes",
  "3 meses": "los últimos 3 meses",
  Todo: "el historial completo",
}[p] ?? "el período seleccionado");

function exportCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function usePeriodo(data, campo = "fecha") {
  const [periodo, setPeriodo] = useState("Mes");
  const filtrado = useMemo(() => {
    if (periodo === "Todo") return data;
    const dias = periodo === "Semana" ? 7 : periodo === "Mes" ? 30 : 90;
    const desde = new Date(); desde.setDate(desde.getDate() - dias);
    const desdeStr = desde.toISOString().split("T")[0];
    return data.filter((r) => (r[campo] ?? "") >= desdeStr);
  }, [data, periodo]);
  return { filtrado, periodo, setPeriodo };
}

function PeriodoPills({ periodo, setPeriodo }) {
  return (
    <div className="kpis-filter-pills">
      {PERIODO_OPTS.map((p) => (
        <button key={p} className={`pill ${periodo === p ? "pill-active" : ""}`} onClick={() => setPeriodo(p)}>
          {p}
        </button>
      ))}
    </div>
  );
}

// ── Bloque de análisis textual debajo de cada gráfico ─────────────────────────
function ChartInsight({ text }) {
  if (!text) return null;
  return <div className="rep-chart-insight">{text}</div>;
}

// ── Histograma de duración de reservas ─────────────────────────────────────
function HistogramaDuracion({ reservas }) {
  const { filtrado, periodo, setPeriodo } = usePeriodo(reservas);

  const data = useMemo(() => {
    const counts = { "60 min": 0, "90 min": 0, "120 min": 0, "180+ min": 0 };
    filtrado.forEach((r) => {
      if (!r.horario) return;
      const parts = r.horario.split("—").map((s) => parseInt(s.trim()));
      if (parts.length < 2) return;
      const mins = (parts[1] - parts[0]) * 60;
      if      (mins <= 60)  counts["60 min"]++;
      else if (mins <= 90)  counts["90 min"]++;
      else if (mins <= 120) counts["120 min"]++;
      else                  counts["180+ min"]++;
    });
    return Object.entries(counts).map(([duracion, cantidad]) => ({ duracion, cantidad }));
  }, [filtrado]);

  const insight = useMemo(() => {
    const total = data.reduce((s, d) => s + d.cantidad, 0);
    if (total === 0) return `Sin turnos con horario definido en ${pLabel(periodo)}.`;
    const top = data.reduce((max, d) => d.cantidad > max.cantidad ? d : max, data[0]);
    const topPct = Math.round((top.cantidad / total) * 100);
    const otros = data.filter((d) => d.duracion !== top.duracion && d.cantidad > 0);
    const otrosStr = otros.length
      ? ` Le siguen ${otros.map((d) => `${d.duracion} (${d.cantidad})`).join(", ")}.`
      : "";
    return `En ${pLabel(periodo)} se registraron ${total} turnos con horario. Los de ${top.duracion} fueron los más frecuentes: ${top.cantidad} reservas (${topPct}% del total).${otrosStr}`;
  }, [data, periodo]);

  return (
    <div className="rep-card">
      <div className="rep-card-header">
        <div>
          <div className="rep-card-title">Distribución de duración de turnos</div>
          <div className="rep-card-sub">¿Cuánto duran los turnos reservados?</div>
        </div>
        <PeriodoPills periodo={periodo} setPeriodo={setPeriodo} />
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="duracion" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} label={{ value: "Turnos", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v} turnos`, "Cantidad"]} contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="cantidad" name="Turnos" fill="#4D8EF0" radius={[4, 4, 0, 0]}
            label={{ position: "top", fontSize: 12, fontWeight: 600 }} />
        </BarChart>
      </ResponsiveContainer>
      <ChartInsight text={insight} />
    </div>
  );
}

// ── Treemap: proporción de reservas por cancha/deporte ─────────────────────
const TREEMAP_COLORS = ["#00C49A","#4D8EF0","#F0A030","#A78BFA","#F04D6A","#00C49A","#4D8EF0"];

function CustomTreemapContent({ x, y, width, height, name, value, colorIndex }) {
  if (width < 25 || height < 25) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height}
        fill={TREEMAP_COLORS[colorIndex % TREEMAP_COLORS.length]} rx={4} />
      {width > 60 && height > 35 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 7}
            textAnchor="middle" fill="#fff" fontSize={11} fontWeight={600}>{name}</text>
          <text x={x + width / 2} y={y + height / 2 + 10}
            textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={10}>{value} res.</text>
        </>
      )}
    </g>
  );
}

function TreemapCanchas({ reservas }) {
  const { filtrado, periodo, setPeriodo } = usePeriodo(reservas);

  const data = useMemo(() => {
    const counts = {};
    filtrado.filter((r) => r.estado !== "Cancelada").forEach((r) => {
      const key = r.cancha || r.deporte || "Sin asignar";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, colorIndex: i }))
      .sort((a, b) => b.value - a.value);
  }, [filtrado]);

  const insight = useMemo(() => {
    if (data.length === 0) return `Sin reservas activas en ${pLabel(periodo)}.`;
    const total = data.reduce((s, d) => s + d.value, 0);
    const top = data[0];
    const topPct = Math.round((top.value / total) * 100);
    const second = data[1] ? ` Le sigue ${data[1].name} con ${data[1].value} reservas.` : "";
    return `En ${pLabel(periodo)}, ${top.name} concentró la mayor demanda con ${top.value} reservas (${topPct}% del total).${second} Se utilizaron ${data.length} espacio${data.length !== 1 ? "s" : ""} en total.`;
  }, [data, periodo]);

  return (
    <div className="rep-card">
      <div className="rep-card-header">
        <div>
          <div className="rep-card-title">Proporción de reservas por cancha</div>
          <div className="rep-card-sub">¿Qué cancha concentra más turnos?</div>
        </div>
        <PeriodoPills periodo={periodo} setPeriodo={setPeriodo} />
      </div>
      {data.length === 0 ? (
        <div className="rep-empty">Sin reservas en el período</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <Treemap data={data} dataKey="value" nameKey="name"
            content={<CustomTreemapContent />} />
        </ResponsiveContainer>
      )}
      <ChartInsight text={insight} />
    </div>
  );
}

// ── Waterfall: ingresos → deducciones → margen ─────────────────────────────
function WaterfallIngresos({ reservas, ventas }) {
  const { filtrado: resF, periodo, setPeriodo } = usePeriodo(reservas);
  const ventF = useMemo(() => {
    if (periodo === "Todo") return ventas;
    const dias = periodo === "Semana" ? 7 : periodo === "Mes" ? 30 : 90;
    const desde = new Date(); desde.setDate(desde.getDate() - dias);
    return ventas.filter((v) => (v.fecha ?? "") >= desde.toISOString().split("T")[0]);
  }, [ventas, periodo]);

  const data = useMemo(() => {
    const brutoReservas = resF.filter((r) => r.estado !== "Cancelada")
      .reduce((s, r) => s + (Number(r.monto) || 0), 0);
    const brutoVentas  = ventF.reduce((s, v) => s + (Number(v.monto) || 0), 0);
    const cancelaciones = resF.filter((r) => r.estado === "Cancelada")
      .reduce((s, r) => s + (Number(r.monto) || 0), 0);
    const gastos = Math.round((brutoReservas + brutoVentas) * 0.18); // estimado 18%
    const neto   = brutoReservas + brutoVentas - cancelaciones - gastos;

    return [
      { label: "Res. brutas",     valor: brutoReservas,  tipo: "entrada", acum: brutoReservas },
      { label: "+ Ventas",        valor: brutoVentas,    tipo: "entrada", acum: brutoReservas + brutoVentas },
      { label: "− Cancelaciones", valor: -cancelaciones, tipo: "salida",  acum: brutoReservas + brutoVentas - cancelaciones },
      { label: "− Gastos (est.)", valor: -gastos,        tipo: "salida",  acum: neto },
      { label: "Margen neto",     valor: neto,           tipo: "result",  acum: neto },
    ];
  }, [resF, ventF]);

  const insight = useMemo(() => {
    const bruto = (data[0]?.valor || 0) + (data[1]?.valor || 0);
    if (bruto === 0) return `Sin ingresos registrados en ${pLabel(periodo)}.`;
    const neto = data[4]?.acum || 0;
    const cancelMonto = -(data[2]?.valor || 0);
    const cancelPct = bruto > 0 ? Math.round((cancelMonto / bruto) * 100) : 0;
    const f = (n) => `$${Math.round(Math.abs(n)).toLocaleString("es-AR")}`;
    return `Ingresos brutos en ${pLabel(periodo)}: ${f(bruto)} (${f(data[0].valor)} por reservas + ${f(data[1].valor)} por ventas). Las cancelaciones representaron el ${cancelPct}% del bruto. Margen neto estimado: ${f(neto)}.`;
  }, [data, periodo]);

  const COLORS = { entrada: "#00C49A", salida: "#F04D6A", result: "#4D8EF0" };
  const fmt    = (n) => `$${Math.abs(n).toLocaleString("es-AR")}`;

  return (
    <div className="rep-card">
      <div className="rep-card-header">
        <div>
          <div className="rep-card-title">Desglose de ingresos — Waterfall</div>
          <div className="rep-card-sub">Ingresos brutos → deducciones → margen neto del período</div>
        </div>
        <PeriodoPills periodo={periodo} setPeriodo={setPeriodo} />
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v, _, props) => [fmt(props.payload.valor), props.payload.label]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="acum" radius={[4, 4, 0, 0]}
            label={{ position: "top", fontSize: 10, formatter: (v) => `$${(v / 1000).toFixed(0)}K` }}>
            {data.map((entry, i) => <Cell key={i} fill={COLORS[entry.tipo]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="wf-legend">
        {[{ color: "#00C49A", label: "Entrada" }, { color: "#F04D6A", label: "Deducción" }, { color: "#4D8EF0", label: "Resultado" }].map(({ color, label }) => (
          <span key={label} className="wf-legend-item">
            <span className="wf-dot" style={{ background: color }} />{label}
          </span>
        ))}
      </div>
      <ChartInsight text={insight} />
    </div>
  );
}

// ── Radar: rendimiento comparativo de canchas ──────────────────────────────
function RadarCanchas({ reservas }) {
  const data = useMemo(() => {
    const canchaMap = {};
    CANCHAS.forEach((c) => {
      canchaMap[c.id] = { cancha: c.nombre, reservas: 0, cancelaciones: 0, ingresos: 0 };
    });
    reservas.forEach((r) => {
      const c = canchaMap[r.canchaId];
      if (!c) return;
      c.reservas++;
      if (r.estado === "Cancelada") c.cancelaciones++;
      else c.ingresos += Number(r.monto) || 0;
    });

    const maxRes = Math.max(...Object.values(canchaMap).map((c) => c.reservas), 1);
    const maxIng = Math.max(...Object.values(canchaMap).map((c) => c.ingresos), 1);

    return Object.values(canchaMap).map((c) => ({
      cancha:        c.cancha,
      Ocupación:     Math.round((c.reservas / maxRes) * 100),
      Ingresos:      Math.round((c.ingresos / maxIng) * 100),
      Confiabilidad: c.reservas > 0 ? Math.round(((c.reservas - c.cancelaciones) / c.reservas) * 100) : 0,
    }));
  }, [reservas]);

  const insight = useMemo(() => {
    if (data.length === 0) return "Sin datos de canchas para comparar.";
    const topOcup = data.reduce((max, c) => c.Ocupación > max.Ocupación ? c : max, data[0]);
    const topConf = data.reduce((max, c) => c.Confiabilidad > max.Confiabilidad ? c : max, data[0]);
    const topIng  = data.reduce((max, c) => c.Ingresos > max.Ingresos ? c : max, data[0]);
    const parts = [`${topOcup.cancha} tuvo la mayor ocupación relativa del período.`];
    if (topConf.cancha !== topOcup.cancha)
      parts.push(`${topConf.cancha} lideró en confiabilidad (menor tasa de cancelaciones).`);
    if (topIng.cancha !== topOcup.cancha)
      parts.push(`${topIng.cancha} generó los mayores ingresos relativos.`);
    parts.push("Los valores están normalizados al 100% del máximo registrado por categoría.");
    return parts.join(" ");
  }, [data]);

  const radarData = [
    { subject: "Ocupación",     ...Object.fromEntries(data.map((c) => [c.cancha, c.Ocupación]))     },
    { subject: "Ingresos",      ...Object.fromEntries(data.map((c) => [c.cancha, c.Ingresos]))      },
    { subject: "Confiabilidad", ...Object.fromEntries(data.map((c) => [c.cancha, c.Confiabilidad])) },
  ];

  const colors = ["#00C49A","#4D8EF0","#F0A030","#A78BFA","#F04D6A","#00C49A","#4D8EF0"];

  return (
    <div className="rep-card">
      <div className="rep-card-header">
        <div>
          <div className="rep-card-title">Radar de rendimiento — Canchas</div>
          <div className="rep-card-sub">Ocupación, ingresos y confiabilidad (valores normalizados 0–100)</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
          {data.slice(0, 7).map((c, i) => (
            <Radar key={c.cancha} name={c.cancha} dataKey={c.cancha}
              stroke={colors[i]} fill={colors[i]} fillOpacity={0.15} />
          ))}
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
      <ChartInsight text={insight} />
    </div>
  );
}

// ── Gauge: % cumplimiento de meta de ocupación ─────────────────────────────
function GaugeOcupacion({ reservas }) {
  const { pct, meta } = useMemo(() => {
    const metaMensual = 7 * 14 * CANCHAS.length * 0.60;
    const now  = new Date();
    const mes  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const enMes = reservas.filter((r) => r.fecha?.startsWith(mes) && r.estado !== "Cancelada").length;
    return { pct: Math.min(100, Math.round((enMes / metaMensual) * 100)), meta: Math.round(metaMensual) };
  }, [reservas]);

  const insight = useMemo(() => {
    if (pct === 0) return `Sin reservas confirmadas en el mes actual. La meta de ocupación es de ${meta} turnos mensuales.`;
    const estado = pct >= 80
      ? "La meta mensual se está cumpliendo correctamente"
      : pct >= 50
      ? "Se está avanzando hacia la meta mensual"
      : "El nivel de ocupación está por debajo del objetivo mensual";
    const now2 = new Date();
    const diasEnMes  = new Date(now2.getFullYear(), now2.getMonth() + 1, 0).getDate();
    const diaActual  = now2.getDate();
    const proyeccion = diaActual > 0 ? Math.min(150, Math.round((pct / diaActual) * diasEnMes)) : pct;
    return `${estado} con un ${pct}% alcanzado (meta: ${meta} turnos). A este ritmo, se proyecta cerrar el mes en torno al ${proyeccion}% de la meta.`;
  }, [pct, meta]);

  const radius = 70;
  const cx     = 90;
  const cy     = 90;
  const circum = Math.PI * radius;
  const offset = circum - (pct / 100) * circum;
  const color  = pct >= 80 ? "#00C49A" : pct >= 50 ? "#F0A030" : "#F04D6A";

  return (
    <div className="rep-card gauge-card">
      <div className="rep-card-header">
        <div>
          <div className="rep-card-title">Cumplimiento de meta de ocupación</div>
          <div className="rep-card-sub">Meta mensual: {meta} turnos al 60% de capacidad</div>
        </div>
      </div>
      <div className="gauge-wrap">
        <svg viewBox="0 0 180 100" className="gauge-svg">
          <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="14" strokeLinecap="round" />
          <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${circum} ${circum}`}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s" }}
          />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="28" fontWeight="800" fill={color}>{pct}%</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#8B92A8">de la meta</text>
          <text x={cx - radius} y={cy + 18} textAnchor="middle" fontSize="10" fill="#8B92A8">0%</text>
          <text x={cx + radius} y={cy + 18} textAnchor="middle" fontSize="10" fill="#8B92A8">100%</text>
        </svg>
        <div className="gauge-legend">
          {[["≥80%", "#00C49A", "Meta alcanzada"], ["50–79%", "#F0A030", "En progreso"], ["<50%", "#F04D6A", "Por debajo"]].map(([r, c, l]) => (
            <span key={l} className="gauge-item">
              <span className="gauge-dot" style={{ background: c }} />{r} — {l}
            </span>
          ))}
        </div>
      </div>
      <ChartInsight text={insight} />
    </div>
  );
}

// ── Área apilada: ingresos por categoría ────────────────────────────────────
function AreaIngresosCategoria({ reservas, ventas }) {
  const { filtrado: resF, periodo, setPeriodo } = usePeriodo(reservas);
  const ventF = useMemo(() => {
    if (periodo === "Todo") return ventas;
    const dias = periodo === "Semana" ? 7 : periodo === "Mes" ? 30 : 90;
    const desde = new Date(); desde.setDate(desde.getDate() - dias);
    return ventas.filter((v) => (v.fecha ?? "") >= desde.toISOString().split("T")[0]);
  }, [ventas, periodo]);

  const data = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const semIdx = 5 - i;
      const desde  = new Date(now); desde.setDate(now.getDate() - (semIdx + 1) * 7);
      const hasta  = new Date(now); hasta.setDate(now.getDate() - semIdx * 7);
      const ds = desde.toISOString().split("T")[0];
      const hs = hasta.toISOString().split("T")[0];
      const sem  = resF.filter((r) => r.fecha >= ds && r.fecha <= hs && r.estado !== "Cancelada");
      const semV = ventF.filter((v) => (v.fecha ?? "") >= ds && (v.fecha ?? "") <= hs);
      return {
        semana:  `S${6 - i}`,
        Pádel:   Math.round(sem.filter((r) => r.deporte === "padel").reduce((s, r) => s + (Number(r.monto) || 0), 0) / 1000),
        Básquet: Math.round(sem.filter((r) => r.deporte === "basquet").reduce((s, r) => s + (Number(r.monto) || 0), 0) / 1000),
        Vóley:   Math.round(sem.filter((r) => r.deporte === "voley").reduce((s, r) => s + (Number(r.monto) || 0), 0) / 1000),
        Ventas:  Math.round(semV.reduce((s, v) => s + (Number(v.monto) || 0), 0) / 1000),
      };
    });
  }, [resF, ventF]);

  const insight = useMemo(() => {
    const totales = { Pádel: 0, Básquet: 0, Vóley: 0, Ventas: 0 };
    data.forEach((w) => {
      totales.Pádel   += w.Pádel;
      totales.Básquet += w.Básquet;
      totales.Vóley   += w.Vóley;
      totales.Ventas  += w.Ventas;
    });
    const totalGen = Object.values(totales).reduce((s, v) => s + v, 0);
    if (totalGen === 0) return `Sin ingresos registrados en las últimas 6 semanas para ${pLabel(periodo)}.`;
    const top = Object.entries(totales).sort((a, b) => b[1] - a[1])[0];
    const rowTotal = (w) => w.Pádel + w.Básquet + w.Vóley + w.Ventas;
    const semMasActiva = data.reduce((max, s) => rowTotal(s) > rowTotal(max) ? s : max, data[0]);
    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    const tendencia = prev
      ? (rowTotal(last) > rowTotal(prev) ? "tendencia alcista" : rowTotal(last) < rowTotal(prev) ? "tendencia bajista" : "estabilidad")
      : "sin comparación";
    return `${top[0]} lideró la generación de ingresos con $${top[1]}K acumulados en las últimas 6 semanas. La semana más activa fue ${semMasActiva.semana} con $${rowTotal(semMasActiva)}K en total. La última semana muestra ${tendencia} respecto a la anterior.`;
  }, [data, periodo]);

  return (
    <div className="rep-card">
      <div className="rep-card-header">
        <div>
          <div className="rep-card-title">Ingresos por categoría ($K)</div>
          <div className="rep-card-sub">Evolución semanal de ingresos por fuente</div>
        </div>
        <PeriodoPills periodo={periodo} setPeriodo={setPeriodo} />
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}K`} />
          <Tooltip formatter={(v) => [`$${v}K`, ""]} contentStyle={{ fontSize: 12 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="Pádel"   stackId="1" stroke="#00C49A" fill="#00C49A22" />
          <Area type="monotone" dataKey="Básquet" stackId="1" stroke="#4D8EF0" fill="#4D8EF022" />
          <Area type="monotone" dataKey="Vóley"   stackId="1" stroke="#F0A030" fill="#F0A03022" />
          <Area type="monotone" dataKey="Ventas"  stackId="1" stroke="#A78BFA" fill="#A78BFA22" />
        </AreaChart>
      </ResponsiveContainer>
      <ChartInsight text={insight} />
    </div>
  );
}

// ── Turnos por día de la semana ─────────────────────────────────────────────
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function TurnosPorDia({ reservas }) {
  const { filtrado, periodo, setPeriodo } = usePeriodo(reservas);

  const data = useMemo(() => {
    const counts = DIAS.map((dia) => ({ dia, turnos: 0, ingresos: 0 }));
    filtrado.filter((r) => r.estado !== "Cancelada" && r.fecha).forEach((r) => {
      const idx = (new Date(r.fecha + "T12:00:00").getDay() + 6) % 7; // 0=Lun
      counts[idx].turnos++;
      counts[idx].ingresos += Number(r.monto) || 0;
    });
    return counts;
  }, [filtrado]);

  const insight = useMemo(() => {
    const total = data.reduce((s, d) => s + d.turnos, 0);
    if (total === 0) return `Sin reservas activas en ${pLabel(periodo)}.`;
    const top  = data.reduce((max, d) => d.turnos > max.turnos ? d : max, data[0]);
    const low  = data.filter((d) => d.turnos > 0).reduce((min, d) => d.turnos < min.turnos ? d : min, data.find((d) => d.turnos > 0) ?? data[0]);
    const fds  = data[5].turnos + data[6].turnos;
    const fdsPct = Math.round((fds / total) * 100);
    return `En ${pLabel(periodo)}, ${top.dia} fue el día más activo con ${top.turnos} turnos. ${low.dia} registró la menor actividad (${low.turnos} turnos). El fin de semana concentró el ${fdsPct}% de la demanda total.`;
  }, [data, periodo]);

  return (
    <div className="rep-card">
      <div className="rep-card-header">
        <div>
          <div className="rep-card-title">Turnos por día de la semana</div>
          <div className="rep-card-sub">¿Qué días concentran más reservas?</div>
        </div>
        <PeriodoPills periodo={periodo} setPeriodo={setPeriodo} />
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v} turnos`, "Reservas"]} contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="turnos" name="Turnos" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={i >= 5 ? "#A78BFA" : "#00C49A"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartInsight text={insight} />
    </div>
  );
}

// ── Top clientes por frecuencia ─────────────────────────────────────────────
function TopClientes({ reservas, clientes }) {
  const { filtrado, periodo, setPeriodo } = usePeriodo(reservas);

  const data = useMemo(() => {
    const counts = {};
    filtrado.filter((r) => r.estado !== "Cancelada" && r.clienteId).forEach((r) => {
      counts[r.clienteId] = (counts[r.clienteId] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, cantidad]) => {
        const cl = clientes.find((c) => c.id === id);
        return { nombre: cl?.nombre ?? cl?.name ?? id.slice(0, 8), cantidad };
      });
  }, [filtrado, clientes]);

  const insight = useMemo(() => {
    if (data.length === 0) return `Sin reservas con cliente asignado en ${pLabel(periodo)}.`;
    const top = data[0];
    const totalClientes = data.length;
    const totalTurnos = data.reduce((s, d) => s + d.cantidad, 0);
    const topPct = Math.round((top.cantidad / totalTurnos) * 100);
    return `En ${pLabel(periodo)}, ${top.nombre} fue el cliente más frecuente con ${top.cantidad} reservas (${topPct}% del top ${totalClientes}). Los ${totalClientes} clientes más activos acumularon ${totalTurnos} turnos en conjunto.`;
  }, [data, periodo]);

  return (
    <div className="rep-card">
      <div className="rep-card-header">
        <div>
          <div className="rep-card-title">Clientes más frecuentes</div>
          <div className="rep-card-sub">Top 8 por cantidad de reservas en el período</div>
        </div>
        <PeriodoPills periodo={periodo} setPeriodo={setPeriodo} />
      </div>
      {data.length === 0 ? (
        <div className="rep-empty">Sin datos de clientes en el período</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
          <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v} reservas`, "Cantidad"]} contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="cantidad" name="Reservas" fill="#4D8EF0" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill={i === 0 ? "#00C49A" : "#4D8EF0"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <ChartInsight text={insight} />
    </div>
  );
}

// ── Tasa de cancelación por cancha ──────────────────────────────────────────
function CancelacionesPorCancha({ reservas }) {
  const { filtrado, periodo, setPeriodo } = usePeriodo(reservas);

  const data = useMemo(() => {
    const map = {};
    filtrado.forEach((r) => {
      const k = r.cancha || r.deporte || "Sin asignar";
      if (!map[k]) map[k] = { total: 0, canceladas: 0 };
      map[k].total++;
      if (r.estado === "Cancelada") map[k].canceladas++;
    });
    return Object.entries(map)
      .map(([cancha, { total, canceladas }]) => ({
        cancha,
        total,
        canceladas,
        tasa: total > 0 ? Math.round((canceladas / total) * 100) : 0,
      }))
      .sort((a, b) => b.tasa - a.tasa);
  }, [filtrado]);

  const insight = useMemo(() => {
    if (data.length === 0) return `Sin reservas en ${pLabel(periodo)}.`;
    const top  = data[0];
    const best = data[data.length - 1];
    const promedio = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.tasa, 0) / data.length) : 0;
    if (top.tasa === 0) return `Ninguna cancha registró cancelaciones en ${pLabel(periodo)}. Excelente retención.`;
    return `En ${pLabel(periodo)}, ${top.cancha} tuvo la mayor tasa de cancelaciones (${top.tasa}% de sus ${top.total} reservas). ${best.cancha} fue la más confiable con solo ${best.tasa}% de cancelaciones. La tasa promedio del complejo fue ${promedio}%.`;
  }, [data, periodo]);

  return (
    <div className="rep-card">
      <div className="rep-card-header">
        <div>
          <div className="rep-card-title">Tasa de cancelación por cancha</div>
          <div className="rep-card-sub">% de reservas canceladas sobre el total</div>
        </div>
        <PeriodoPills periodo={periodo} setPeriodo={setPeriodo} />
      </div>
      {data.length === 0 ? (
        <div className="rep-empty">Sin datos en el período</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 40)}>
          <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="cancha" width={110} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v, name, props) => [`${v}% (${props.payload.canceladas}/${props.payload.total})`, "Cancelaciones"]}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="tasa" name="% Cancelación" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.tasa >= 30 ? "#F04D6A" : entry.tasa >= 15 ? "#F0A030" : "#00C49A"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <ChartInsight text={insight} />
    </div>
  );
}

// ── Reservas por franja horaria ─────────────────────────────────────────────
const FRANJAS = ["08–10", "10–12", "12–14", "14–16", "16–18", "18–20", "20–22"];

function ReservasPorHora({ reservas }) {
  const { filtrado, periodo, setPeriodo } = usePeriodo(reservas);

  const data = useMemo(() => {
    const counts = FRANJAS.map((franja) => ({ franja, turnos: 0, ingresos: 0 }));
    filtrado.filter((r) => r.estado !== "Cancelada" && r.horario).forEach((r) => {
      const horaStr = r.horario.split("—")[0].trim();
      const hora = parseInt(horaStr);
      const idx  = Math.floor((hora - 8) / 2);
      if (idx >= 0 && idx < counts.length) {
        counts[idx].turnos++;
        counts[idx].ingresos += Number(r.monto) || 0;
      }
    });
    return counts;
  }, [filtrado]);

  const insight = useMemo(() => {
    const total = data.reduce((s, d) => s + d.turnos, 0);
    if (total === 0) return `Sin reservas con horario definido en ${pLabel(periodo)}.`;
    const top = data.reduce((max, d) => d.turnos > max.turnos ? d : max, data[0]);
    const topPct = Math.round((top.turnos / total) * 100);
    const tarde  = data.slice(3).reduce((s, d) => s + d.turnos, 0);
    const tardePct = Math.round((tarde / total) * 100);
    return `La franja ${top.franja}h fue la más demandada en ${pLabel(periodo)} con ${top.turnos} turnos (${topPct}% del total). La tarde-noche (14:00 a 22:00) concentró el ${tardePct}% de todas las reservas.`;
  }, [data, periodo]);

  return (
    <div className="rep-card">
      <div className="rep-card-header">
        <div>
          <div className="rep-card-title">Reservas por franja horaria</div>
          <div className="rep-card-sub">¿A qué hora se usa más el complejo?</div>
        </div>
        <PeriodoPills periodo={periodo} setPeriodo={setPeriodo} />
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="franja" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v} turnos`, "Reservas"]} contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="turnos" name="Turnos" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={
                i >= 4 ? "#F0A030" :   // tarde-noche: ámbar
                i >= 2 ? "#00C49A" :   // mediodía: teal
                "#4D8EF0"              // mañana: azul
              } />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartInsight text={insight} />
    </div>
  );
}

// ── Lógica de exportación PDF ────────────────────────────────────────────────
async function generarPDF({ reportRef, reservas, ventas, clientes, currentUser, setPdfLoading, fmt }) {
  setPdfLoading(true);
  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);

    const now      = new Date();
    const fechaStr = now.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const horaStr  = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const usuario  = currentUser?.nombre ?? "Admin";

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const PDF_W    = 210;
    const PDF_H    = 297;
    const MARGIN   = 12;
    const HDR_H    = 26;
    const FTR_H    = 14;
    const BODY_H   = PDF_H - HDR_H - FTR_H - MARGIN * 2;
    const BODY_W   = PDF_W - MARGIN * 2;

    const imgW     = BODY_W;
    const imgH     = (canvas.height * imgW) / canvas.width;
    const totalPgs = Math.ceil(imgH / BODY_H);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const addHeader = (pg) => {
      pdf.setFillColor(29, 158, 117);
      pdf.rect(0, 0, PDF_W, HDR_H, "F");
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(MARGIN, 5, 16, 16, 2, 2, "F");
      pdf.setTextColor(29, 158, 117);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("TC", MARGIN + 8, 15, { align: "center" });
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("REPORTE TANCAT v3.0", MARGIN + 22, 11);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Análisis y gestión del complejo deportivo", MARGIN + 22, 17);
      pdf.setFontSize(8);
      pdf.text(`${fechaStr}  |  Página ${pg} de ${totalPgs}`, PDF_W - MARGIN, 13, { align: "right" });
    };

    const addFooter = (pg) => {
      const y = PDF_H - FTR_H;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(MARGIN, y, PDF_W - MARGIN, y);
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generado por: ${usuario}`, MARGIN, y + 5);
      pdf.text("TanCat — Sistema de gestión deportiva", PDF_W / 2, y + 5, { align: "center" });
      pdf.text(`${fechaStr}  ${horaStr}`, PDF_W - MARGIN, y + 5, { align: "right" });
    };

    const addTablaResumen = () => {
      const totalVentas    = ventas.reduce((s, v) => s + Number(v.monto || 0), 0);
      const ticketPromedio = ventas.length ? Math.round(totalVentas / ventas.length) : 0;
      const confirmadas    = reservas.filter((r) => r.estado === "Confirmada").length;
      const canceladas     = reservas.filter((r) => r.estado === "Cancelada").length;

      const rows = [
        ["Total de reservas",    reservas.length.toString(), "u."],
        ["Reservas confirmadas", confirmadas.toString(),      "u."],
        ["Reservas canceladas",  canceladas.toString(),       "u."],
        ["Total clientes",       clientes.length.toString(),  "u."],
        ["Ingresos totales",     fmt(totalVentas),            "ARS"],
        ["Ticket promedio",      fmt(ticketPromedio),         "ARS"],
      ];

      let y = HDR_H + MARGIN + 4;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 30, 30);
      pdf.text("Resumen del período", MARGIN, y);
      y += 5;

      rows.forEach(([label, valor, unidad], i) => {
        const rowY = y + i * 8;
        if (i % 2 === 0) {
          pdf.setFillColor(245, 250, 247);
          pdf.rect(MARGIN, rowY - 4, BODY_W, 8, "F");
        }
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(50, 50, 50);
        pdf.text(label, MARGIN + 2, rowY + 1);
        pdf.setFont("helvetica", "bold");
        pdf.text(valor, PDF_W - MARGIN - 20, rowY + 1, { align: "right" });
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(120, 120, 120);
        pdf.text(unidad, PDF_W - MARGIN, rowY + 1, { align: "right" });
      });

      return y + rows.length * 8 + 4;
    };

    for (let pg = 0; pg < totalPgs; pg++) {
      if (pg > 0) pdf.addPage();
      addHeader(pg + 1);
      addFooter(pg + 1);

      if (pg === 0) {
        const tablaEndY = addTablaResumen();
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(MARGIN, tablaEndY, PDF_W - MARGIN, tablaEndY);
        const availableH  = PDF_H - tablaEndY - FTR_H - MARGIN;
        const srcPixH     = (availableH / imgW) * canvas.width;
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width  = canvas.width;
        sliceCanvas.height = Math.min(srcPixH, canvas.height);
        sliceCanvas.getContext("2d").drawImage(canvas, 0, 0, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", MARGIN, tablaEndY + 2, imgW, availableH);
      } else {
        const startY  = pg === 1 ? 0 : (pg - 1) * BODY_H;
        const srcPxPerMm = canvas.width / imgW;
        const srcY    = Math.round(startY * srcPxPerMm);
        const srcH    = Math.round(BODY_H * srcPxPerMm);
        if (srcY >= canvas.height) break;
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width  = canvas.width;
        sliceCanvas.height = Math.min(srcH, canvas.height - srcY);
        sliceCanvas.getContext("2d").drawImage(canvas, 0, srcY, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
        const sliceH = (sliceCanvas.height / canvas.width) * imgW;
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", MARGIN, HDR_H + MARGIN, imgW, sliceH);
      }
    }

    pdf.save(`reporte-tancat-${now.toISOString().split("T")[0]}.pdf`);
  } catch (err) {
    console.error("Error generando PDF:", err);
    alert("Error al generar el PDF. Revisá la consola para más detalles.");
  } finally {
    setPdfLoading(false);
  }
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function TabReportes() {
  const { reservas, ventas, clientes, currentUser } = useStore();
  const reportRef    = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const totalVentas    = ventas.reduce((s, v) => s + Number(v.monto || 0), 0);
  const ticketPromedio = ventas.length ? Math.round(totalVentas / ventas.length) : 0;
  const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const handleExportPDF = () =>
    generarPDF({ reportRef, reservas, ventas, clientes, currentUser, setPdfLoading, fmt });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Reportes</div>
          <div className="page-desc">Análisis avanzado — exportación de datos</div>
        </div>
        <div className="rep-export-btns">
          <button
            className="btn btn-primary"
            onClick={handleExportPDF}
            disabled={pdfLoading}
            style={{ minWidth: 140 }}
          >
            {pdfLoading ? "⏳ Generando…" : "⬇ Exportar PDF"}
          </button>
          <button className="btn" onClick={() => exportCSV(reservas, "reservas-tancat.csv")}>↓ Reservas CSV</button>
          <button className="btn" onClick={() => exportCSV(ventas,   "ventas-tancat.csv")}>↓ Ventas CSV</button>
          <button className="btn" onClick={() => exportCSV(clientes, "clientes-tancat.csv")}>↓ Clientes CSV</button>
        </div>
      </div>

      <div ref={reportRef}>

        {/* Fila 1: histograma duración + treemap canchas */}
        <div className="rep-charts-grid">
          <HistogramaDuracion reservas={reservas} />
          <TreemapCanchas     reservas={reservas} />
        </div>

        {/* Fila 2: waterfall ingresos + área apilada */}
        <div className="rep-charts-grid">
          <WaterfallIngresos     reservas={reservas} ventas={ventas} />
          <AreaIngresosCategoria reservas={reservas} ventas={ventas} />
        </div>

        {/* Fila 3: radar rendimiento + gauge ocupación */}
        <div className="rep-charts-grid">
          <RadarCanchas   reservas={reservas} />
          <GaugeOcupacion reservas={reservas} />
        </div>

        {/* Fila 4: turnos por día + reservas por franja horaria */}
        <div className="rep-charts-grid">
          <TurnosPorDia        reservas={reservas} />
          <ReservasPorHora     reservas={reservas} />
        </div>

        {/* Fila 5: top clientes + cancelaciones por cancha */}
        <div className="rep-charts-grid">
          <TopClientes         reservas={reservas} clientes={clientes} />
          <CancelacionesPorCancha reservas={reservas} />
        </div>
      </div>
    </div>
  );
}
