// src/components/TabResumen.jsx
import { useStore } from "../data/store.jsx";
import "../styles/TabResumen.css";

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

function BarChart({ labels, values, color = "#1d9e75", height = 160 }) {
  const max = Math.max(...values, 1);
  return (
    <div className="bar-chart" style={{ '--chart-h': `${height}px` }}>
      {values.map((v, i) => (
        <div key={i} className="bar-chart-item">
          <div className="bar-chart-bar-wrap">
            <div
              className="bar-chart-bar"
              style={{ '--bar-h': `${(v / max) * 100}%`, '--bar-c': color }}
            />
          </div>
          <span className="bar-chart-label">{labels[i]}</span>
          <span className="bar-chart-value">{v}</span>
        </div>
      ))}
    </div>
  );
}

function DonaChart({ confirmadas, pendientes, canceladas }) {
  const total = confirmadas + pendientes + canceladas || 1;
  const items = [
    { label: "Confirmadas", value: confirmadas, color: "#1d9e75" },
    { label: "Pendientes",  value: pendientes,  color: "#ef9f27" },
    { label: "Canceladas",  value: canceladas,  color: "#e24b4a" },
  ];
  let pct = 0;
  const stops = items.map(({ value, color }) => {
    const start = pct;
    pct += (value / total) * 360;
    return `${color} ${start.toFixed(1)}deg ${pct.toFixed(1)}deg`;
  }).join(", ");

  return (
    <div className="dona-chart">
      <div className="dona-circle-wrap">
        <div className="dona-circle" style={{ '--dona-grad': `conic-gradient(${stops})` }} />
        <div className="dona-center">
          <span className="dona-total">{total}</span>
          <span className="dona-sub">reservas</span>
        </div>
      </div>
      <div className="chart-legend dona-legend">
        {items.map(({ label, value, color }) => (
          <span key={label} className="legend-item">
            <span className="legend-sq" style={{ '--sq-c': color }} />
            {label} {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChartBarras({ reservas, ventas }) {
  const semanas = [];
  const resData = [];
  const ventData = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const desde = new Date(now);
    desde.setDate(now.getDate() - i * 7 - 6);
    const hasta = new Date(now);
    hasta.setDate(now.getDate() - i * 7);

    semanas.push(`S${6 - i}`);
    const desdeStr = desde.toISOString().split("T")[0];
    const hastaStr = hasta.toISOString().split("T")[0];

    resData.push(reservas.filter((r) => r.fecha >= desdeStr && r.fecha <= hastaStr).length);
    ventData.push(ventas.filter((v) => v.fecha >= desdeStr && v.fecha <= hastaStr)
      .reduce((s, v) => s + (Number(v.monto) || 0), 0) / 1000);
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Reservas y ventas</div>
          <div className="card-sub">Últimas 6 semanas</div>
        </div>
      </div>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-sq" style={{ '--sq-c': "#1d9e75" }} />Reservas
        </span>
        <span className="legend-item">
          <span className="legend-sq" style={{ '--sq-c': "#378add" }} />Ventas ($K)
        </span>
      </div>
      <div className="chart-barras-grid">
        <BarChart labels={semanas} values={resData} color="#1d9e75" height={140} />
        <BarChart labels={semanas} values={ventData} color="#378add" height={140} />
      </div>
    </div>
  );
}

export default function TabResumen() {
  const { reservas, clientes, ventas, stock } = useStore();

  const hoy = new Date().toISOString().split("T")[0];
  const reservasHoy    = reservas.filter((r) => r.fecha === hoy).length;
  const totalVentasMes = ventas.reduce((s, v) => s + (Number(v.monto) || 0), 0);
  const productosBajos = stock.filter((s) => s.max > 0 && (s.cantidad / s.max) < 0.45).length;
  const confirmadas    = reservas.filter((r) => r.estado === "Confirmada").length;
  const pendientes     = reservas.filter((r) => r.estado === "Pendiente").length;
  const canceladas     = reservas.filter((r) => r.estado === "Cancelada").length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Resumen general</div>
          <div className="page-desc">Métricas y actividad en tiempo real</div>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard label="Reservas hoy"    value={reservasHoy}                                    delta={`${reservas.length} totales`}    type="up" />
        <MetricCard label="Ventas del mes"  value={`$${totalVentasMes.toLocaleString("es-AR")}`}  delta={`${ventas.length} registros`}    type="up" />
        <MetricCard label="Clientes"        value={clientes.length}                                delta="registrados"                     type="up" />
        <MetricCard label="Stock bajo"      value={productosBajos}                                 delta="Requiere atención"               type={productosBajos > 0 ? "warn" : "up"} />
      </div>

      <div className="charts-row">
        <ChartBarras reservas={reservas} ventas={ventas} />
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Estado de reservas</div>
              <div className="card-sub">Distribución actual</div>
            </div>
          </div>
          <div className="dona-wrap">
            <DonaChart confirmadas={confirmadas} pendientes={pendientes} canceladas={canceladas} />
          </div>
        </div>
      </div>
    </div>
  );
}
