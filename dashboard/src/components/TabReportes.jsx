// src/components/TabReportes.jsx — Reportes con gráficos CSS y exportación
import { useStore } from "../data/store.jsx";
import "../styles/TabReportes.css";

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

function BarChart({ labels, values, color = "var(--accent)", height = 180 }) {
  const max = Math.max(...values, 1);
  return (
    <div className="rep-bar-chart" style={{ '--chart-h': `${height}px` }}>
      {labels.map((label, i) => {
        const pct = (values[i] / max) * 100;
        return (
          <div key={label} className="rep-bar-item">
            <span className="rep-bar-val">
              {values[i] > 0 ? values[i].toLocaleString("es-AR") : ""}
            </span>
            <div className="rep-bar-wrap">
              <div
                className="rep-bar"
                style={{
                  '--bar-h': `${pct}%`,
                  '--bar-minh': pct > 0 ? '3px' : '0px',
                  '--bar-c': color,
                }}
              />
            </div>
            <span className="rep-bar-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function HBarChart({ items }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="hbar-chart">
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.label}>
            <div className="hbar-header">
              <span className="hbar-label">
                <span className="hbar-dot" style={{ '--c': item.color }} />
                {item.label}
              </span>
              <span className="hbar-pct">
                {item.value} <span>({pct}%)</span>
              </span>
            </div>
            <div className="hbar-bg">
              <div
                className="hbar-fill"
                style={{ '--w': `${(item.value / max) * 100}%`, '--c': item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TabReportes() {
  const { reservas, ventas, clientes } = useStore();

  const deportes = ["padel", "basquet", "voley"];
  const DEPORTE_LABEL = { padel: "Pádel", basquet: "Básquet", voley: "Voley" };
  const reservasPorDeporte = deportes.map((d) =>
    reservas.filter((r) => r.deporte === d || r.servicio?.toLowerCase().includes(d.replace("á","a").replace("é","e"))).length
  );

  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const ventasPorMes = meses.map((_, i) =>
    ventas.filter((v) => v.fecha && new Date(v.fecha).getMonth() === i).reduce((s, v) => s + Number(v.monto || 0), 0)
  );

  const countEstados = [
    { label: "Confirmada", value: reservas.filter((r) => r.estado === "Confirmada").length, color: "var(--accent)" },
    { label: "Pendiente",  value: reservas.filter((r) => r.estado === "Pendiente").length,  color: "var(--amber)" },
    { label: "Cancelada",  value: reservas.filter((r) => r.estado === "Cancelada").length,  color: "var(--red)" },
  ];

  const countMetodos = [
    { label: "Efectivo",      value: ventas.filter((v) => v.metodoPago === "Efectivo").length,      color: "var(--accent)" },
    { label: "Transferencia", value: ventas.filter((v) => v.metodoPago === "Transferencia").length, color: "var(--blue)" },
    { label: "Tarjeta",       value: ventas.filter((v) => v.metodoPago === "Tarjeta").length,       color: "var(--amber)" },
  ];

  const totalVentas = ventas.reduce((s, v) => s + Number(v.monto || 0), 0);
  const ticketPromedio = ventas.length ? Math.round(totalVentas / ventas.length) : 0;
  const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Reportes</div>
          <div className="page-desc">Análisis y exportación de datos</div>
        </div>
        <div className="rep-export-btns">
          <button className="btn" onClick={() => exportCSV(reservas, "reservas-tancat.csv")}>↓ Reservas</button>
          <button className="btn" onClick={() => exportCSV(ventas, "ventas-tancat.csv")}>↓ Ventas</button>
          <button className="btn" onClick={() => exportCSV(clientes, "clientes-tancat.csv")}>↓ Clientes</button>
        </div>
      </div>

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

      <div className="rep-charts-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Reservas por deporte</div>
              <div className="card-sub">Total de reservas registradas</div>
            </div>
          </div>
          <BarChart labels={deportes.map((d) => DEPORTE_LABEL[d])} values={reservasPorDeporte} color="var(--accent)" />
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Ingresos por mes</div>
              <div className="card-sub">Año {new Date().getFullYear()}</div>
            </div>
          </div>
          <BarChart labels={meses} values={ventasPorMes} color="var(--blue)" height={180} />
        </div>
      </div>

      <div className="rep-charts-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Estado de reservas</div>
          </div>
          <HBarChart items={countEstados} />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Métodos de pago</div>
          </div>
          <HBarChart items={countMetodos} />
        </div>
      </div>
    </div>
  );
}
