// src/components/KpisReservas.jsx — KPIs visuales para el módulo de Reservas
// Según las pautas del profe: heatmap ocupación + área apilada + KPI numérico.
// Histograma de duración y treemap van en REPORTES, no aquí.
import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "../styles/KpisReservas.css";

const HORAS        = Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`);
const DIAS         = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const PERIODO_OPTS = ["Semana", "Mes", "Todo"];

// ── Heatmap de ocupación ────────────────────────────────────────────────────
function HeatmapOcupacion({ reservas }) {
  const matrix = useMemo(() => {
    const m = Array.from({ length: 7 }, () => Array(14).fill(0));
    reservas.forEach((r) => {
      if (!r.fecha || !r.horario || r.estado === "Cancelada") return;
      const d   = new Date(r.fecha + "T12:00:00");
      const dow = (d.getDay() + 6) % 7;
      const match = r.horario.match(/^(\d{2}):/);
      if (!match) return;
      const hi = parseInt(match[1]) - 8;
      if (hi >= 0 && hi < 14) m[dow][hi]++;
    });
    return m;
  }, [reservas]);

  const maxVal = Math.max(...matrix.flat(), 1);

  return (
    <div className="kpi-card-full">
      <div className="kpi-title">Mapa de calor — Días y horarios de mayor ocupación</div>
      <div className="kpi-sub">Cantidad de reservas activas por franja horaria</div>
      <div className="heatmap-wrap">
        <div className="heatmap-grid" style={{ "--cols": HORAS.length + 1 }}>
          <div className="hm-cell hm-header" />
          {HORAS.map((h) => <div key={h} className="hm-cell hm-header">{h}</div>)}
          {DIAS.map((dia, di) => (
            <>
              <div key={`lbl-${dia}`} className="hm-cell hm-row-label">{dia}</div>
              {HORAS.map((_, hi) => {
                const val   = matrix[di][hi];
                const alpha = 0.08 + (val / maxVal) * 0.87;
                return (
                  <div
                    key={`${di}-${hi}`}
                    className="hm-cell hm-data"
                    style={{ background: `rgba(29,158,117,${alpha})` }}
                    title={`${dia} ${HORAS[hi]}: ${val} reserva${val !== 1 ? "s" : ""}`}
                  >
                    {val > 0 && <span className="hm-val">{val}</span>}
                  </div>
                );
              })}
            </>
          ))}
        </div>
        <div className="heatmap-legend">
          <span>Menos</span>
          <div className="hm-legend-bar" />
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}

// ── Área apilada: evolución por tipo de cancha ──────────────────────────────
function AreaApilada({ reservas }) {
  const data = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const semIdx = 4 - i;
      const desde  = new Date(now);
      const hasta  = new Date(now);
      desde.setDate(now.getDate() - (semIdx + 1) * 7);
      hasta.setDate(now.getDate() - semIdx * 7);
      const ds = desde.toISOString().split("T")[0];
      const hs = hasta.toISOString().split("T")[0];
      const sem = reservas.filter((r) => r.fecha >= ds && r.fecha <= hs && r.estado !== "Cancelada");
      return {
        semana:  `S${5 - i}`,
        padel:   sem.filter((r) => r.deporte === "padel").length,
        basquet: sem.filter((r) => r.deporte === "basquet").length,
        voley:   sem.filter((r) => r.deporte === "voley").length,
      };
    });
  }, [reservas]);

  return (
    <div className="kpi-card-half">
      <div className="kpi-title">Reservas por tipo de deporte</div>
      <div className="kpi-sub">Evolución semanal — últimas 5 semanas</div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="padel"   name="🎾 Pádel"   stackId="1" stroke="#1d9e75" fill="#1d9e7533" />
          <Area type="monotone" dataKey="basquet" name="🏀 Básquet" stackId="1" stroke="#378add" fill="#378add33" />
          <Area type="monotone" dataKey="voley"   name="🏐 Vóley"   stackId="1" stroke="#ef9f27" fill="#ef9f2733" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── KPI numérico: ocupación % vs. período anterior ──────────────────────────
function KpiOcupacion({ reservas }) {
  const { pctActual, pctAnterior, delta } = useMemo(() => {
    const now    = new Date();
    const hoy    = now.toISOString().split("T")[0];
    // Esta semana
    const lunes  = new Date(now); lunes.setDate(now.getDate()  - ((now.getDay() + 6) % 7));
    const lunesS = lunes.toISOString().split("T")[0];
    // Semana pasada
    const lunesP = new Date(lunes); lunesP.setDate(lunes.getDate() - 7);
    const lunesSP = lunesP.toISOString().split("T")[0];
    const domP    = new Date(lunes); domP.setDate(lunes.getDate() - 1);
    const domSP   = domP.toISOString().split("T")[0];

    // Total slots disponibles esta semana (7 días × 7 canchas × 14 horas)
    const totalSlots = 7 * 7 * 14;

    const semActual  = reservas.filter((r) => r.fecha >= lunesS && r.fecha <= hoy && r.estado !== "Cancelada").length;
    const semAnterior = reservas.filter((r) => r.fecha >= lunesSP && r.fecha <= domSP && r.estado !== "Cancelada").length;

    const pA = Math.min(100, Math.round((semActual  / totalSlots) * 100));
    const pP = Math.min(100, Math.round((semAnterior / totalSlots) * 100));
    return { pctActual: pA, pctAnterior: pP, delta: pA - pP };
  }, [reservas]);

  const color = delta >= 0 ? "#166534" : "#991B1B";
  const bg    = delta >= 0 ? "#DCFCE7" : "#FEE2E2";

  return (
    <div className="kpi-card-half kpi-ocu-box">
      <div className="kpi-title">Ocupación del complejo</div>
      <div className="kpi-sub">Semana actual vs. semana anterior</div>
      <div className="kpi-ocu-main">
        <span className="kpi-ocu-value">{pctActual}%</span>
        <span className="kpi-ocu-label">ocupación esta semana</span>
      </div>
      <div className="kpi-ocu-delta" style={{ color, background: bg }}>
        {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs. semana pasada ({pctAnterior}%)
      </div>
      <div className="kpi-ocu-bar-bg">
        <div className="kpi-ocu-bar-fill" style={{ width: `${pctActual}%`, background: "#1d9e75" }} />
      </div>

      {/* Tabla rápida por estado */}
      <div className="stats-list" style={{ marginTop: 12 }}>
        {[
          { label: "Confirmadas",  val: reservas.filter((r) => r.estado === "Confirmada").length, color: "#166534", bg: "#DCFCE7" },
          { label: "Con seña",     val: reservas.filter((r) => r.estado === "Seña").length,       color: "#854D0E", bg: "#FEF9C3" },
          { label: "Pendientes",   val: reservas.filter((r) => r.estado === "Pendiente").length,  color: "#854D0E", bg: "#FEF9C3" },
          { label: "Canceladas",   val: reservas.filter((r) => r.estado === "Cancelada").length,  color: "#991B1B", bg: "#FEE2E2" },
        ].map(({ label, val, color: c, bg: b }) => (
          <div key={label} className="stat-row">
            <span className="stat-label">{label}</span>
            <span className="stat-val" style={{ color: c, background: b, padding: "2px 8px", borderRadius: 8 }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function KpisReservas({ reservas }) {
  const [periodo, setPeriodo] = useState("Mes");

  const filtradas = useMemo(() => {
    if (periodo === "Todo") return reservas;
    const dias = periodo === "Semana" ? 7 : 30;
    const desde = new Date(); desde.setDate(desde.getDate() - dias);
    const desdeStr = desde.toISOString().split("T")[0];
    return reservas.filter((r) => r.fecha >= desdeStr);
  }, [reservas, periodo]);

  return (
    <div className="kpis-section">
      <div className="kpis-header">
        <div className="kpis-title">Análisis de reservas</div>
        <div className="kpis-filter-pills">
          {PERIODO_OPTS.map((p) => (
            <button key={p} className={`pill ${periodo === p ? "pill-active" : ""}`} onClick={() => setPeriodo(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <HeatmapOcupacion reservas={filtradas} />

      <div className="kpis-row-2">
        <AreaApilada    reservas={filtradas} />
        <KpiOcupacion   reservas={reservas}  />
      </div>
    </div>
  );
}
