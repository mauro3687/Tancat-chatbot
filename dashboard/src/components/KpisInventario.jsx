// src/components/KpisInventario.jsx — KPIs visuales del módulo Inventario
import { useMemo } from "react";

// ── SVG icons locales ────────────────────────────────────────────────────────
function IcoWarning({ s = 12 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function IcoBell({ s = 12 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}
function IcoCheck({ s = 12 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import "../styles/KpisInventario.css";

// ── Gauge SVG: % global de stock del inventario ─────────────────────────────
// Pregunta: "¿Qué tan lleno está el inventario en su conjunto?"
function GaugeStockGlobal({ items }) {
  const stock = items;
  const { pct, totalActual, totalMax } = useMemo(() => {
    const tMax = stock.reduce((s, p) => s + (p.max || 0), 0);
    const tAct = stock.reduce((s, p) => s + (p.cantidad || 0), 0);
    return {
      pct:         tMax > 0 ? Math.min(100, Math.round((tAct / tMax) * 100)) : 0,
      totalActual: tAct,
      totalMax:    tMax,
    };
  }, [stock]);

  const radius = 68;
  const cx = 90; const cy = 86;
  const circum = Math.PI * radius;
  const offset = circum - (pct / 100) * circum;
  const color   = pct >= 60 ? "var(--status-ok-text)"   : pct >= 30 ? "var(--status-warn-text)"  : "var(--status-error-text)";
  const bgColor = pct >= 60 ? "var(--status-ok-bg)"     : pct >= 30 ? "var(--status-warn-bg)"    : "var(--status-error-bg)";

  return (
    <div className="kpi-inv-card kpi-inv-half" style={{ background: bgColor }}>
      <div className="kpi-inv-title">Stock global del inventario</div>
      <div className="kpi-inv-sub">Unidades actuales vs. capacidad máxima total</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg viewBox="0 0 180 100" style={{ width: "100%", maxWidth: 220 }}>
          {/* Track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="14" strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${circum} ${circum}`}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
          <text x={cx} y={cy - 6}  textAnchor="middle" fontSize="26" fontWeight="800" fill={color}>{pct}%</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#8B92A8">del máximo</text>
          <text x={cx - radius + 2} y={cy + 18} textAnchor="middle" fontSize="9"  fill="#8B92A8">0%</text>
          <text x={cx + radius - 2} y={cy + 18} textAnchor="middle" fontSize="9"  fill="#8B92A8">100%</text>
        </svg>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>
          {totalActual.toLocaleString("es-AR")} u. de {totalMax.toLocaleString("es-AR")} u. máximas
        </div>
      </div>
    </div>
  );
}

// ── Pie: proporción de productos por estado ─────────────────────────────────
// Pregunta: "¿Qué fracción del catálogo está en cada nivel de alerta?"
// Colores usados en Recharts (SVG fill) → hex del sistema dark
const PIE_COLORS = { Normal: "#00C49A", Bajo: "#F0A030", Crítico: "#F04D6A" };

function PieEstados({ items }) {
  const stock = items;
  const data = useMemo(() => {
    let normal = 0, bajo = 0, critico = 0;
    stock.forEach((s) => {
      const pct = s.max > 0 ? (s.cantidad / s.max) * 100 : 0;
      if      (pct < 20) critico++;
      else if (pct < 45) bajo++;
      else               normal++;
    });
    return [
      { name: "Normal",  value: normal  },
      { name: "Bajo",    value: bajo    },
      { name: "Crítico", value: critico },
    ].filter((d) => d.value > 0);
  }, [stock]);

  const total = data.reduce((s, d) => s + d.value, 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.08) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
        {Math.round(percent * 100)}%
      </text>
    );
  };

  return (
    <div className="kpi-inv-card kpi-inv-half">
      <div className="kpi-inv-title">Distribución de estados del catálogo</div>
      <div className="kpi-inv-sub">{total} productos · proporciones por nivel de alerta</div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={45} outerRadius={80}
            dataKey="value"
            labelLine={false}
            label={<CustomLabel />}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
            ))}
          </Pie>
          <Legend
            formatter={(value, entry) => (
              <span style={{ fontSize: 12, color: PIE_COLORS[value] }}>
                {value} ({entry.payload.value})
              </span>
            )}
          />
          <Tooltip
            formatter={(v, name) => [`${v} producto${v !== 1 ? "s" : ""}`, name]}
            contentStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Barras agrupadas: actual vs. máximo por producto ─────────────────────────
// Pregunta: "¿Cuánto le falta a cada producto para estar al máximo?"
function BarrasActualVsMax({ items }) {
  const stock = items;
  const data = useMemo(() =>
    [...stock]
      .sort((a, b) => {
        const pA = a.max > 0 ? a.cantidad / a.max : 0;
        const pB = b.max > 0 ? b.cantidad / b.max : 0;
        return pA - pB; // menor stock primero
      })
      .slice(0, 10)
      .map((s) => ({
        nombre:  s.nombre.toUpperCase(),
        Actual:  s.cantidad,
        Máximo:  s.max,
        unidad:  s.unidad,
        pct:     s.max > 0 ? Math.round((s.cantidad / s.max) * 100) : 0,
      })),
  [stock]);

  const getActualColor = (pct) => {
    if (pct < 20) return "#F04D6A";   // rojo del sistema
    if (pct < 45) return "#F0A030";   // ámbar del sistema
    return "#00C49A";                  // teal accent del sistema
  };

  return (
    <div className="kpi-inv-card kpi-inv-full">
      <div className="kpi-inv-title">Stock actual vs. máximo por producto</div>
      <div className="kpi-inv-sub">Ordenado de menor a mayor nivel — top 10 productos más críticos primero</div>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 16, left: 16, bottom: 4 }}
          barGap={2}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="nombre"
            width={120}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(v, name, props) => [
              `${v} ${props.payload.unidad}`,
              name,
            ]}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {/* Máximo va primero (fondo) */}
          <Bar dataKey="Máximo" fill="rgba(255,255,255,0.07)" radius={[0, 4, 4, 0]} />
          {/* Actual va encima con color semántico */}
          <Bar dataKey="Actual" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getActualColor(entry.pct)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Lista de productos que requieren atención ───────────────────────────────
function ListaAtencion({ items }) {
  const stock = items;
  const urgentes = useMemo(() =>
    [...stock]
      .filter((s) => s.max > 0 && (s.cantidad / s.max) < 0.45)
      .sort((a, b) => (a.cantidad / a.max) - (b.cantidad / b.max))
      .slice(0, 6),
  [stock]);

  return (
    <div className="kpi-inv-card kpi-inv-half kpi-inv-alert-box">
      <div className="kpi-inv-title">Productos que requieren reposición</div>
      <div className="kpi-inv-sub">Ordenados por urgencia</div>
      <div className="atention-list">
        {urgentes.length === 0 ? (
          <div className="atent-ok"><IcoCheck s={13} /> Todos los productos en nivel normal</div>
        ) : (
          urgentes.map((s) => {
            const pct     = Math.round((s.cantidad / s.max) * 100);
            const critico = pct < 20;
            return (
              <div key={s.id} className={`atent-row ${critico ? "atent-critico" : "atent-bajo"}`}>
                <span className="atent-icon">{critico ? <IcoWarning s={12} /> : <IcoBell s={12} />}</span>
                <span className="atent-nombre">{s.nombre.toUpperCase()}</span>
                <span className="atent-pct">{pct}%</span>
                <span className="atent-qty">{s.cantidad}/{s.max} {s.unidad}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Stats resumen ────────────────────────────────────────────────────────────
function ResumenInventario({ items }) {
  const stock    = items;
  const criticos = stock.filter((s) => s.max > 0 && (s.cantidad / s.max) < 0.20).length;
  const bajos    = stock.filter((s) => { const p = s.max > 0 ? s.cantidad / s.max : 0; return p >= 0.20 && p < 0.45; }).length;
  const normales = stock.length - criticos - bajos;
  const totalU   = stock.reduce((s, p) => s + (p.cantidad || 0), 0);

  return (
    <div className="kpi-inv-card kpi-inv-half kpi-inv-stats">
      <div className="kpi-inv-title">Resumen del inventario</div>
      <div className="kpi-inv-sub">Estado actual consolidado</div>
      <div className="inv-stats-list">
        {[
          { label: "Total productos",    val: stock.length, color: null },
          { label: "Unidades en stock",  val: totalU,       color: null },
          { label: "Nivel normal",  val: normales,  color: "var(--status-ok-text)",    bg: "var(--status-ok-bg)"    },
          { label: "Stock bajo",    val: bajos,     color: "var(--status-warn-text)",  bg: "var(--status-warn-bg)"  },
          { label: "Stock crítico", val: criticos,  color: "var(--status-error-text)", bg: "var(--status-error-bg)" },
        ].map(({ label, val, color, bg }) => (
          <div key={label} className="inv-stat-row">
            <span className="inv-stat-label">{label}</span>
            <span
              className="inv-stat-val"
              style={color ? { color, background: bg, padding: "2px 8px", borderRadius: 8, fontWeight: 700 } : {}}
            >
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function KpisInventario({ stock, items, title = "Análisis de inventario", prestamos }) {
  const data = items ?? stock ?? [];
  if (!data || data.length === 0) return null;

  // Stats de categorías (solo en modo global cuando llega `prestamos`)
  const showGlobal = prestamos !== undefined;
  const cntEme   = showGlobal ? data.filter((s) => !s.categoria || s.categoria === "emergencia").length : null;
  const cntVenta = showGlobal ? data.filter((s) => s.categoria === "venta").length : null;
  const cntPre   = showGlobal ? (prestamos ?? []).filter((p) => p.estado === "entregado").length : null;

  return (
    <div className="kpis-inv-section">
      <div className="kpis-inv-header">
        <div className="kpis-inv-title">{title}</div>
        {showGlobal && (
          <div className="kpis-inv-cats">
            <span className="kpis-inv-cat-chip">🔧 {cntEme} emergencia</span>
            <span className="kpis-inv-cat-chip">🛒 {cntVenta} venta</span>
            <span className="kpis-inv-cat-chip" style={{ color: "var(--status-warn-text)" }}>🤝 {cntPre} préstamos activos</span>
          </div>
        )}
      </div>

      {/* Fila 1: gauge global + pie de estados */}
      <div className="kpis-inv-row-2">
        <GaugeStockGlobal items={data} />
        <PieEstados       items={data} />
      </div>

      {/* Fila 2: barras actual vs. máximo (full width) */}
      <BarrasActualVsMax items={data} />

      {/* Fila 3: resumen stats + lista de atención */}
      <div className="kpis-inv-row-2">
        <ResumenInventario items={data} />
        <ListaAtencion     items={data} />
      </div>
    </div>
  );
}
