// src/components/TabReportes.jsx — Reportes con gráficos CSS y exportación
import { useStore } from "../data/store.jsx";

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

// Gráfico de barras verticales en CSS
function BarChart({ labels, values, color = "var(--accent)", height = 180 }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, paddingTop: 8 }}>
      {labels.map((label, i) => {
        const pct = (values[i] / max) * 100;
        return (
          <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)", minHeight: 16, display: "flex", alignItems: "flex-end" }}>
              {values[i] > 0 ? values[i].toLocaleString("es-AR") : ""}
            </span>
            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
              <div style={{
                width: "100%",
                height: `${pct}%`,
                minHeight: pct > 0 ? 3 : 0,
                background: color,
                borderRadius: "3px 3px 0 0",
                transition: "height 0.4s ease",
              }} />
            </div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.2 }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Barras horizontales con porcentaje
function HBarChart({ items }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0, display: "inline-block" }} />
                {item.label}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {item.value} <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({pct}%)</span>
              </span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(item.value / max) * 100}%`,
                background: item.color,
                borderRadius: 3,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TabReportes() {
  const { reservas, ventas, clientes } = useStore();

  // Reservas por deporte
  const deportes = ["padel", "basquet", "voley"];
  const DEPORTE_LABEL = { padel: "Pádel", basquet: "Básquet", voley: "Voley" };
  const reservasPorDeporte = deportes.map((d) =>
    reservas.filter((r) => r.deporte === d || r.servicio?.toLowerCase().includes(d.replace("á","a").replace("é","e"))).length
  );

  // Ventas por mes (año actual)
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const ventasPorMes = meses.map((_, i) =>
    ventas.filter((v) => v.fecha && new Date(v.fecha).getMonth() === i).reduce((s, v) => s + Number(v.monto || 0), 0)
  );

  // Estados reservas
  const countEstados = [
    { label: "Confirmada", value: reservas.filter((r) => r.estado === "Confirmada").length, color: "var(--accent)" },
    { label: "Pendiente",  value: reservas.filter((r) => r.estado === "Pendiente").length,  color: "var(--amber)" },
    { label: "Cancelada",  value: reservas.filter((r) => r.estado === "Cancelada").length,  color: "var(--red)" },
  ];

  // Métodos de pago
  const countMetodos = [
    { label: "Efectivo",       value: ventas.filter((v) => v.metodoPago === "Efectivo").length,       color: "var(--accent)" },
    { label: "Transferencia",  value: ventas.filter((v) => v.metodoPago === "Transferencia").length,  color: "var(--blue)" },
    { label: "Tarjeta",        value: ventas.filter((v) => v.metodoPago === "Tarjeta").length,        color: "var(--amber)" },
  ];

  const totalVentas = ventas.reduce((s, v) => s + Number(v.monto || 0), 0);
  const ticketPromedio = ventas.length ? Math.round(totalVentas / ventas.length) : 0;

  const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Reportes</div>
          <div className="page-desc">Análisis y exportación de datos</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => exportCSV(reservas, "reservas-tancat.csv")}>↓ Reservas</button>
          <button className="btn" onClick={() => exportCSV(ventas, "ventas-tancat.csv")}>↓ Ventas</button>
          <button className="btn" onClick={() => exportCSV(clientes, "clientes-tancat.csv")}>↓ Clientes</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: "1.25rem" }}>
        {[
          { label: "Total reservas",   val: reservas.length },
          { label: "Ingresos totales", val: fmt(totalVentas) },
          { label: "Clientes activos", val: clientes.length },
          { label: "Ticket promedio",  val: fmt(ticketPromedio) },
        ].map((m) => (
          <div key={m.label} className="metric-card" style={{ padding: "0.85rem 1rem" }}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value" style={{ fontSize: 22 }}>{m.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Reservas por deporte */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Reservas por deporte</div>
              <div className="card-sub">Total de reservas registradas</div>
            </div>
          </div>
          <BarChart labels={deportes.map((d) => DEPORTE_LABEL[d])} values={reservasPorDeporte} color="var(--accent)" />
        </div>

        {/* Ingresos por mes */}
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Estado de reservas */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Estado de reservas</div>
          </div>
          <HBarChart items={countEstados} />
        </div>

        {/* Métodos de pago */}
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
