// src/components/TabReportes.jsx — Reportes con gráficos y exportación
import { useEffect, useRef } from "react";
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

function ChartBarras({ id, labels, datasets, height = 220 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { size: 11, family: "DM Sans" } } },
          x: { grid: { display: false }, ticks: { font: { size: 11, family: "DM Sans" } } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, datasets]);
  return <div style={{ position: "relative", height }}><canvas ref={ref} /></div>;
}

function ChartDona({ id, labels, data, colors, height = 180 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend: { display: false } } },
    });
    return () => chartRef.current?.destroy();
  }, [data]);
  return <div style={{ position: "relative", height }}><canvas ref={ref} /></div>;
}

export default function TabReportes() {
  const { reservas, ventas, clientes } = useStore();

  useEffect(() => {
    if (window.Chart) return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    document.head.appendChild(s);
  }, []);

  // Reservas por servicio
  const servicios = [...new Set(reservas.map((r) => r.servicio))];
  const reservasPorServicio = servicios.map((s) => reservas.filter((r) => r.servicio === s).length);

  // Ventas por mes
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const ventasPorMes = meses.map((_, i) =>
    ventas.filter((v) => v.fecha && new Date(v.fecha).getMonth() === i).reduce((s, v) => s + Number(v.monto), 0)
  );

  // Estados reservas
  const estados = ["Confirmada", "Pendiente", "Cancelada"];
  const countEstados = estados.map((e) => reservas.filter((r) => r.estado === e).length);

  // Métodos de pago
  const metodos = ["Efectivo", "Transferencia", "Tarjeta"];
  const countMetodos = metodos.map((m) => ventas.filter((v) => v.metodoPago === m).length);

  const totalVentas = ventas.reduce((s, v) => s + Number(v.monto), 0);
  const ticketPromedio = ventas.length ? Math.round(totalVentas / ventas.length) : 0;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Reportes</div>
          <div className="page-desc">Análisis y exportación de datos</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => exportCSV(reservas, "reservas-tancat.csv")}>↓ Exportar reservas</button>
          <button className="btn" onClick={() => exportCSV(ventas, "ventas-tancat.csv")}>↓ Exportar ventas</button>
          <button className="btn" onClick={() => exportCSV(clientes, "clientes-tancat.csv")}>↓ Exportar clientes</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: "1.25rem" }}>
        {[
          { label: "Total reservas", val: reservas.length },
          { label: "Ingresos totales", val: "$" + totalVentas.toLocaleString("es-AR") },
          { label: "Clientes activos", val: clientes.length },
          { label: "Ticket promedio", val: "$" + ticketPromedio.toLocaleString("es-AR") },
        ].map((m) => (
          <div key={m.label} className="metric-card" style={{ padding: "0.85rem 1rem" }}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value" style={{ fontSize: 22 }}>{m.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Reservas por servicio */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Reservas por servicio</div>
          </div>
          <ChartBarras
            id="svc"
            labels={servicios.map((s) => s.split(" ").slice(0, 2).join(" "))}
            datasets={[{ data: reservasPorServicio, backgroundColor: "#1d9e75", borderRadius: 5 }]}
          />
        </div>

        {/* Ventas por mes */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ingresos por mes ($)</div>
          </div>
          <ChartBarras
            id="mes"
            labels={meses}
            datasets={[{ data: ventasPorMes, backgroundColor: "#378add", borderRadius: 5 }]}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Estado de reservas */}
        <div className="card">
          <div className="card-header"><div className="card-title">Estado de reservas</div></div>
          <ChartDona id="est" labels={estados} data={countEstados} colors={["#1d9e75", "#ef9f27", "#e24b4a"]} />
          <div className="chart-legend" style={{ marginTop: 12, justifyContent: "center" }}>
            {estados.map((e, i) => (
              <span key={e} className="legend-item">
                <span className="legend-sq" style={{ background: ["#1d9e75","#ef9f27","#e24b4a"][i] }} />
                {e}: {countEstados[i]}
              </span>
            ))}
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="card">
          <div className="card-header"><div className="card-title">Métodos de pago</div></div>
          <ChartDona id="met" labels={metodos} data={countMetodos} colors={["#1d9e75", "#378add", "#ef9f27"]} />
          <div className="chart-legend" style={{ marginTop: 12, justifyContent: "center" }}>
            {metodos.map((m, i) => (
              <span key={m} className="legend-item">
                <span className="legend-sq" style={{ background: ["#1d9e75","#378add","#ef9f27"][i] }} />
                {m}: {countMetodos[i]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
