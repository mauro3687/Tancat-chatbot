// src/components/TabResumen.jsx
import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useStore } from "../data/store.jsx";
import KpisReservas from "./kpis/KpisReservas.jsx";
import { DEPORTE_EMOJI } from "../data/canchas.js";
import "../styles/TabResumen.css";

const STATUS_CLASS = { Confirmada: "s-confirmed", Pendiente: "s-pending", Seña: "s-sena", Cancelada: "s-cancelled" };
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function MetricCard({ label, value, delta, type }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-delta ${type === "up" ? "delta-up" : type === "warn" ? "delta-warn" : "delta-down"}`}>
        {type === "up" ? "↑ " : type === "warn" ? "⚠ " : "↓ "}{delta}
      </div>
    </div>
  );
}

// ── Ingresos mensuales del año actual (LineChart) ───────────────────────────
// Pregunta: "¿Cómo evoluciona la facturación mes a mes este año?"
function LineIngresosAnuales({ ventas, reservas }) {
  const year = new Date().getFullYear();
  const mesActual = new Date().getMonth(); // 0-indexed

  const data = useMemo(() => {
    return MESES.map((mes, i) => {
      const prefix = `${year}-${String(i + 1).padStart(2, "0")}`;
      const ingVentas = ventas
        .filter((v) => (v.fecha ?? "").startsWith(prefix))
        .reduce((s, v) => s + (Number(v.monto) || 0), 0);
      const ingReservas = reservas
        .filter((r) => (r.fecha ?? "").startsWith(prefix) && r.estado !== "Cancelada")
        .reduce((s, r) => s + (Number(r.monto) || 0), 0);
      return {
        mes,
        "Reservas ($K)": Math.round(ingReservas / 1000),
        "Ventas ($K)":   Math.round(ingVentas   / 1000),
        total:           Math.round((ingReservas + ingVentas) / 1000),
        futuro:          i > mesActual,
      };
    });
  }, [ventas, reservas, year]);

  const totalAnual = data.reduce((s, d) => s + d["Reservas ($K)"] + d["Ventas ($K)"], 0);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Ingresos mensuales {year}</div>
          <div className="card-sub">Reservas + ventas · Total acumulado: <strong>${totalAnual}K</strong></div>
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-sq" style={{ '--sq-c': "#00C49A" }} />Reservas</span>
          <span className="legend-item"><span className="legend-sq" style={{ '--sq-c': "#4D8EF0" }} />Ventas</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}K`} />
          <Tooltip
            formatter={(v, name) => [`$${v}K`, name]}
            contentStyle={{ fontSize: 12 }}
          />
          <ReferenceLine
            x={MESES[mesActual]}
            stroke="rgba(0,0,0,0.2)"
            strokeDasharray="4 3"
            label={{ value: "Hoy", position: "top", fontSize: 10, fill: "var(--text-muted, #888)" }}
          />
          <Line
            type="monotone" dataKey="Reservas ($K)"
            stroke="#00C49A" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
          />
          <Line
            type="monotone" dataKey="Ventas ($K)"
            stroke="#4D8EF0" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Turnos de hoy (mini tabla operativa) ────────────────────────────────────
// Pregunta: "¿Qué turnos tengo programados hoy?"
function TurnosHoy({ reservas, clientes }) {
  const hoy = new Date().toISOString().split("T")[0];

  const turnosHoy = useMemo(() => {
    return reservas
      .filter((r) => r.fecha === hoy && r.estado !== "Cancelada")
      .map((r) => {
        const cliente = clientes.find((c) => c.id === r.clienteId);
        return { ...r, nombreCliente: cliente?.nombre ?? r.cliente ?? "—" };
      })
      .sort((a, b) => (a.horario ?? "").localeCompare(b.horario ?? ""));
  }, [reservas, clientes, hoy]);

  const fmt = (n) => `$${Number(n).toLocaleString("es-AR")}`;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Turnos de hoy</div>
          <div className="card-sub">
            {turnosHoy.length === 0
              ? "Sin turnos programados"
              : `${turnosHoy.length} turno${turnosHoy.length !== 1 ? "s" : ""} · ${new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}`}
          </div>
        </div>
      </div>
      {turnosHoy.length === 0 ? (
        <div className="turnos-vacio">
          <span className="turnos-vacio-icon">📅</span>
          <span>No hay turnos registrados para hoy</span>
        </div>
      ) : (
        <div className="turnos-lista">
          {turnosHoy.map((r) => (
            <div key={r.id} className="turno-row">
              <span className="turno-hora">{r.horario?.split("—")[0]?.trim() ?? "—"}</span>
              <span className="turno-deporte">{DEPORTE_EMOJI[r.deporte] ?? "🎾"}</span>
              <div className="turno-info">
                <span className="turno-cliente">{r.nombreCliente}</span>
                <span className="turno-cancha">{r.cancha ?? "—"} · {r.horario ?? "—"}</span>
              </div>
              <span className="turno-monto">{fmt(r.monto)}</span>
              <span className={`status ${STATUS_CLASS[r.estado] ?? ""}`}>{r.estado}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function TabResumen() {
  const { reservas, clientes, ventas, stock } = useStore();

  const hoy              = new Date().toISOString().split("T")[0];
  const reservasHoy      = reservas.filter((r) => r.fecha === hoy).length;
  const totalVentasMes   = ventas.reduce((s, v) => s + (Number(v.monto) || 0), 0);
  const productosBajos   = stock.filter((s) => s.max > 0 && (s.cantidad / s.max) < 0.45).length;
  const pendientesCount  = reservas.filter((r) => r.estado === "Pendiente").length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Resumen general</div>
          <div className="page-desc">Métricas y actividad en tiempo real</div>
        </div>
      </div>

      {/* 4 KPIs operativos */}
      <div className="metrics-grid">
        <MetricCard
          label="Turnos hoy"
          value={reservasHoy}
          delta={`${reservas.length} totales`}
          type="up"
        />
        <MetricCard
          label="Ventas del mes"
          value={`$${totalVentasMes.toLocaleString("es-AR")}`}
          delta={`${ventas.length} registros`}
          type="up"
        />
        <MetricCard
          label="Pendientes de cobro"
          value={pendientesCount}
          delta={pendientesCount > 0 ? "Requieren seguimiento" : "Todo al día"}
          type={pendientesCount > 0 ? "warn" : "up"}
        />
        <MetricCard
          label="Stock bajo"
          value={productosBajos}
          delta="productos con reposición urgente"
          type={productosBajos > 0 ? "warn" : "up"}
        />
      </div>

      {/* Gráficos: ingresos anuales + turnos de hoy */}
      <div className="charts-row">
        <LineIngresosAnuales ventas={ventas} reservas={reservas} />
        <TurnosHoy reservas={reservas} clientes={clientes} />
      </div>

      {/* KPIs de reservas: heatmap + área apilada + % ocupación */}
      <KpisReservas reservas={reservas} />
    </div>
  );
}
