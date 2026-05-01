// src/components/KpisCanchas.jsx — KPIs analíticos del módulo Canchas
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { CANCHAS } from "../data/canchas.js";
import "../styles/KpisCanchas.css";

const HORAS = Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`);
const DIAS  = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// ── Mapa de calor: ocupación por cancha × franja horaria (semana actual) ───
function HeatmapCanchas({ reservas }) {
  // matrix[canchaIdx][horaIdx] = count de reservas
  const { matrix, canchaLabels } = useMemo(() => {
    const labels = CANCHAS.map((c) => c.nombre);
    const m = CANCHAS.map(() => Array(HORAS.length).fill(0));

    const now   = new Date();
    const lunes = new Date(now);
    lunes.setDate(now.getDate() - ((now.getDay() + 6) % 7));

    reservas.forEach((r) => {
      if (!r.fecha || !r.horario || r.estado === "Cancelada") return;
      const ci = CANCHAS.findIndex((c) => c.id === r.canchaId);
      if (ci === -1) return;
      const match = r.horario.match(/^(\d{2}):/);
      if (!match) return;
      const hi = parseInt(match[1]) - 8;
      if (hi >= 0 && hi < HORAS.length) m[ci][hi]++;
    });
    return { matrix: m, canchaLabels: labels };
  }, [reservas]);

  const maxVal = Math.max(...matrix.flat(), 1);

  return (
    <div className="kpic-card kpic-full">
      <div className="kpic-title">Mapa de calor — Ocupación por cancha y horario</div>
      <div className="kpic-sub">Reservas históricas por franja horaria (todas las semanas)</div>
      <div className="heatmap-c-wrap">
        <div className="heatmap-c-grid" style={{ "--cols": HORAS.length + 1 }}>
          {/* Encabezado horas */}
          <div className="hmc-cell hmc-header" />
          {HORAS.map((h) => <div key={h} className="hmc-cell hmc-header">{h}</div>)}
          {/* Filas por cancha */}
          {canchaLabels.map((nombre, ci) => (
            <>
              <div key={`lbl-${nombre}`} className="hmc-cell hmc-row-label" title={nombre}>
                {nombre.length > 10 ? nombre.substring(0, 9) + "…" : nombre}
              </div>
              {HORAS.map((_, hi) => {
                const val   = matrix[ci][hi];
                const alpha = 0.08 + (val / maxVal) * 0.87;
                return (
                  <div
                    key={`${ci}-${hi}`}
                    className="hmc-cell hmc-data"
                    style={{ background: `rgba(55,138,221,${alpha})` }}
                    title={`${nombre} ${HORAS[hi]}: ${val} reserva${val !== 1 ? "s" : ""}`}
                  >
                    {val > 0 && <span className="hmc-val">{val}</span>}
                  </div>
                );
              })}
            </>
          ))}
        </div>
        <div className="hmc-legend">
          <span>Menos ocupada</span>
          <div className="hmc-legend-bar" />
          <span>Más ocupada</span>
        </div>
      </div>
    </div>
  );
}

// ── Barras horizontales: canchas con más horas bloqueadas en el mes ─────────
function BarrasBloqueos({ bloqueos }) {
  const data = useMemo(() => {
    const now = new Date();
    const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const counts = {};
    CANCHAS.forEach((c) => { counts[c.id] = 0; });
    bloqueos
      .filter((b) => b.fecha?.startsWith(mes))
      .forEach((b) => { if (counts[b.canchaId] !== undefined) counts[b.canchaId]++; });

    return CANCHAS
      .map((c) => ({ nombre: c.nombre, horas: counts[c.id] || 0, deporte: c.deporte }))
      .sort((a, b) => b.horas - a.horas);
  }, [bloqueos]);

  const getColor = (deporte) => ({
    padel: "#00C49A", basquet: "#4D8EF0", voley: "#F0A030",
  }[deporte] ?? "#6B7280");

  const CustomLabel = ({ x, y, width, value }) =>
    value > 0 ? <text x={x + width + 6} y={y + 11} fontSize={11} fill="var(--text-muted)">{value} h</text> : null;

  return (
    <div className="kpic-card kpic-half">
      <div className="kpic-title">Horas bloqueadas este mes por cancha</div>
      <div className="kpic-sub">Mantenimiento y bloqueos manuales acumulados</div>
      {data.every((d) => d.horas === 0) ? (
        <div className="kpic-empty">✓ Sin bloqueos registrados este mes</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
          <BarChart layout="vertical" data={data} margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.07)" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}h`} />
            <YAxis type="category" dataKey="nombre" width={80} tick={{ fontSize: 11 }} tickFormatter={(v) => v.toUpperCase()} />
            <Tooltip formatter={(v) => [`${v} horas`, "Bloqueadas"]} contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="horas" name="Horas bloqueadas" radius={[0, 4, 4, 0]} label={<CustomLabel />}>
              {data.map((entry, i) => <Cell key={i} fill={getColor(entry.deporte)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Barras: reservas por cancha (comparación) ───────────────────────────────
function BarrasReservasPorCancha({ reservas }) {
  const data = useMemo(() => {
    const counts = {};
    CANCHAS.forEach((c) => { counts[c.id] = 0; });
    reservas
      .filter((r) => r.estado !== "Cancelada")
      .forEach((r) => { if (r.canchaId && counts[r.canchaId] !== undefined) counts[r.canchaId]++; });
    return CANCHAS
      .map((c) => ({ nombre: c.nombre, reservas: counts[c.id], deporte: c.deporte }))
      .sort((a, b) => b.reservas - a.reservas);
  }, [reservas]);

  const getColor = (deporte) => ({
    padel: "#00C49A", basquet: "#4D8EF0", voley: "#F0A030",
  }[deporte] ?? "#6B7280");

  return (
    <div className="kpic-card kpic-half">
      <div className="kpic-title">Reservas por cancha</div>
      <div className="kpic-sub">Total histórico de turnos activos por cancha</div>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
        <BarChart layout="vertical" data={data} margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.07)" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="nombre" width={80} tick={{ fontSize: 11 }} tickFormatter={(v) => v.toUpperCase()} />
          <Tooltip formatter={(v) => [`${v} reservas`, "Turnos"]} contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="reservas" name="Reservas" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11 }}>
            {data.map((entry, i) => <Cell key={i} fill={getColor(entry.deporte)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function KpisCanchas({ reservas, bloqueos }) {
  return (
    <div className="kpics-section">
      <div className="kpics-header">
        <div className="kpics-title">Análisis de canchas</div>
      </div>

      <HeatmapCanchas reservas={reservas} />

      <div className="kpics-row-2">
        <BarrasReservasPorCancha reservas={reservas} />
        <BarrasBloqueos bloqueos={bloqueos} />
      </div>
    </div>
  );
}
