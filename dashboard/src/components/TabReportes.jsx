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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="duracion" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} label={{ value: "Turnos", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v} turnos`, "Cantidad"]} contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="cantidad" name="Turnos" fill="#378add" radius={[4, 4, 0, 0]}
            label={{ position: "top", fontSize: 12, fontWeight: 600 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Treemap: proporción de reservas por cancha/deporte ─────────────────────
const TREEMAP_COLORS = ["#1d9e75","#378add","#ef9f27","#9b59b6","#e24b4a","#16a085","#2980b9"];

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
      { label: "Res. brutas",    valor: brutoReservas,    tipo: "entrada", acum: brutoReservas },
      { label: "+ Ventas",       valor: brutoVentas,      tipo: "entrada", acum: brutoReservas + brutoVentas },
      { label: "− Cancelaciones",valor: -cancelaciones,   tipo: "salida",  acum: brutoReservas + brutoVentas - cancelaciones },
      { label: "− Gastos (est.)",valor: -gastos,          tipo: "salida",  acum: neto },
      { label: "Margen neto",    valor: neto,             tipo: "result",  acum: neto },
    ];
  }, [resF, ventF]);

  const COLORS = { entrada: "#1d9e75", salida: "#991B1B", result: "#378add" };
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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
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
        {[{ color: "#1d9e75", label: "Entrada" }, { color: "#991B1B", label: "Deducción" }, { color: "#378add", label: "Resultado" }].map(({ color, label }) => (
          <span key={label} className="wf-legend-item">
            <span className="wf-dot" style={{ background: color }} />{label}
          </span>
        ))}
      </div>
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

    // Normalizar a 0-100
    const maxRes = Math.max(...Object.values(canchaMap).map((c) => c.reservas), 1);
    const maxIng = Math.max(...Object.values(canchaMap).map((c) => c.ingresos), 1);

    return Object.values(canchaMap).map((c) => ({
      cancha:        c.cancha,
      Ocupación:     Math.round((c.reservas / maxRes) * 100),
      Ingresos:      Math.round((c.ingresos / maxIng) * 100),
      Confiabilidad: c.reservas > 0 ? Math.round(((c.reservas - c.cancelaciones) / c.reservas) * 100) : 0,
    }));
  }, [reservas]);

  // Formato para recharts radar: needs subject + one key per cancha
  const radarData = [
    { subject: "Ocupación",     ...Object.fromEntries(data.map((c) => [c.cancha, c.Ocupación]))     },
    { subject: "Ingresos",      ...Object.fromEntries(data.map((c) => [c.cancha, c.Ingresos]))      },
    { subject: "Confiabilidad", ...Object.fromEntries(data.map((c) => [c.cancha, c.Confiabilidad])) },
  ];

  const colors = ["#1d9e75","#378add","#ef9f27","#9b59b6","#e24b4a","#16a085","#2980b9"];

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
    </div>
  );
}

// ── Gauge: % cumplimiento de meta de ocupación ─────────────────────────────
function GaugeOcupacion({ reservas }) {
  const { pct, meta } = useMemo(() => {
    const metaMensual = 7 * 14 * CANCHAS.length * 0.60; // 60% de slots del mes = meta
    const now  = new Date();
    const mes  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const enMes = reservas.filter((r) => r.fecha?.startsWith(mes) && r.estado !== "Cancelada").length;
    return { pct: Math.min(100, Math.round((enMes / metaMensual) * 100)), meta: Math.round(metaMensual) };
  }, [reservas]);

  // SVG gauge manual (semicírculo)
  const radius = 70;
  const cx     = 90;
  const cy     = 90;
  const circum = Math.PI * radius;   // semicírculo
  const offset = circum - (pct / 100) * circum;
  const color  = pct >= 80 ? "#1d9e75" : pct >= 50 ? "#ef9f27" : "#991B1B";

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
          {/* Track */}
          <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="14" strokeLinecap="round" />
          {/* Fill */}
          <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${circum} ${circum}`}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s" }}
          />
          {/* Valor */}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="28" fontWeight="800" fill={color}>{pct}%</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="var(--text-muted, #888)">de la meta</text>
          <text x={cx - radius} cy={cy + 18} textAnchor="middle" fontSize="10" fill="var(--text-muted, #888)">0%</text>
          <text x={cx + radius} cy={cy + 18} textAnchor="middle" fontSize="10" fill="var(--text-muted, #888)">100%</text>
        </svg>
        <div className="gauge-legend">
          {[["≥80%", "#1d9e75", "Meta alcanzada"], ["50–79%", "#ef9f27", "En progreso"], ["<50%", "#991B1B", "Por debajo"]].map(([r, c, l]) => (
            <span key={l} className="gauge-item">
              <span className="gauge-dot" style={{ background: c }} />{r} — {l}
            </span>
          ))}
        </div>
      </div>
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
      const sem = resF.filter((r) => r.fecha >= ds && r.fecha <= hs && r.estado !== "Cancelada");
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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}K`} />
          <Tooltip formatter={(v) => [`$${v}K`, ""]} contentStyle={{ fontSize: 12 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="Pádel"   stackId="1" stroke="#1d9e75" fill="#1d9e7533" />
          <Area type="monotone" dataKey="Básquet" stackId="1" stroke="#378add" fill="#378add33" />
          <Area type="monotone" dataKey="Vóley"   stackId="1" stroke="#ef9f27" fill="#ef9f2733" />
          <Area type="monotone" dataKey="Ventas"  stackId="1" stroke="#9b59b6" fill="#9b59b633" />
        </AreaChart>
      </ResponsiveContainer>
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

    // Capturar contenido
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // Dimensiones A4
    const PDF_W    = 210;
    const PDF_H    = 297;
    const MARGIN   = 12;
    const HDR_H    = 26;   // altura del header
    const FTR_H    = 14;   // altura del footer
    const BODY_H   = PDF_H - HDR_H - FTR_H - MARGIN * 2;
    const BODY_W   = PDF_W - MARGIN * 2;

    const imgW     = BODY_W;
    const imgH     = (canvas.height * imgW) / canvas.width;
    const totalPgs = Math.ceil(imgH / BODY_H);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const addHeader = (pg) => {
      // Fondo header
      pdf.setFillColor(29, 158, 117);
      pdf.rect(0, 0, PDF_W, HDR_H, "F");

      // Logo "TC"
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(MARGIN, 5, 16, 16, 2, 2, "F");
      pdf.setTextColor(29, 158, 117);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("TC", MARGIN + 8, 15, { align: "center" });

      // Título
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("REPORTE TANCAT v3.0", MARGIN + 22, 11);

      // Subtítulo
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Análisis y gestión del complejo deportivo", MARGIN + 22, 17);

      // Fecha + página
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

    // Tabla resumen en página 1 (antes de los gráficos)
    const addTablaResumen = () => {
      const totalVentas    = ventas.reduce((s, v) => s + Number(v.monto || 0), 0);
      const ticketPromedio = ventas.length ? Math.round(totalVentas / ventas.length) : 0;
      const confirmadas    = reservas.filter((r) => r.estado === "Confirmada").length;
      const canceladas     = reservas.filter((r) => r.estado === "Cancelada").length;

      const rows = [
        ["Total de reservas",    reservas.length.toString(),        "u."],
        ["Reservas confirmadas", confirmadas.toString(),             "u."],
        ["Reservas canceladas",  canceladas.toString(),              "u."],
        ["Total clientes",       clientes.length.toString(),         "u."],
        ["Ingresos totales",     fmt(totalVentas),                   "ARS"],
        ["Ticket promedio",      fmt(ticketPromedio),                "ARS"],
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

    // ── Generar páginas ──
    for (let pg = 0; pg < totalPgs; pg++) {
      if (pg > 0) pdf.addPage();

      addHeader(pg + 1);
      addFooter(pg + 1);

      if (pg === 0) {
        // Tabla resumen en la primera página antes de los gráficos
        const tablaEndY = addTablaResumen();

        // Separador
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(MARGIN, tablaEndY, PDF_W - MARGIN, tablaEndY);

        // Gráficos: slice de la imagen ajustado al espacio restante
        const availableH  = PDF_H - tablaEndY - FTR_H - MARGIN;
        const srcPixH     = (availableH / imgW) * canvas.width;
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width  = canvas.width;
        sliceCanvas.height = Math.min(srcPixH, canvas.height);
        sliceCanvas.getContext("2d").drawImage(canvas, 0, 0, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", MARGIN, tablaEndY + 2, imgW, availableH);
      } else {
        // Páginas siguientes: resto de los gráficos
        const startY  = pg === 1
          ? 0  // continúa donde terminó la página 1 (aproximado)
          : (pg - 1) * BODY_H;
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

      {/* Todo lo que va al PDF está dentro de este ref */}
      <div ref={reportRef}>
        {/* KPIs resumen */}
        <div className="kpi-grid kpi-grid-4">
          {[
            { label: "Total reservas",   val: reservas.length },
            { label: "Ingresos totales", val: fmt(totalVentas) },
            { label: "Clientes activos", val: clientes.length },
            { label: "Ticket promedio",  val: fmt(ticketPromedio) },
          ].map((m) => (
            <div key={m.label} className="kpi-card">
              <div className="metric-label">{m.label}</div>
              <div className="kpi-value">{m.val}</div>
            </div>
          ))}
        </div>

        {/* Fila 1: histograma duración + treemap canchas */}
        <div className="rep-charts-grid">
          <HistogramaDuracion reservas={reservas} />
          <TreemapCanchas     reservas={reservas} />
        </div>

        {/* Fila 2: waterfall ingresos + área apilada */}
        <div className="rep-charts-grid">
          <WaterfallIngresos reservas={reservas} ventas={ventas} />
          <AreaIngresosCategoria reservas={reservas} ventas={ventas} />
        </div>

        {/* Fila 3: radar rendimiento + gauge ocupación */}
        <div className="rep-charts-grid">
          <RadarCanchas   reservas={reservas} />
          <GaugeOcupacion reservas={reservas} />
        </div>
      </div>
    </div>
  );
}
