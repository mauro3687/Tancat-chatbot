// src/components/TabResumen.jsx
import { useEffect, useRef } from "react";
import { useStore } from "../data/store.jsx";

const SEMANAS = ["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6"];
const RESERVAS_DATA = [18,22,15,28,24,31];
const VENTAS_DATA   = [28,34,22,42,38,48];

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

function ChartBarras() {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: {
        labels: SEMANAS,
        datasets: [
          { label:"Reservas", data:RESERVAS_DATA, backgroundColor:"#1d9e75", borderRadius:5, yAxisID:"y" },
          { label:"Ventas ($K)", data:VENTAS_DATA, backgroundColor:"#378add", borderRadius:5, yAxisID:"y1" },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{
          y:  { position:"left",  grid:{ color:"rgba(0,0,0,0.05)" }, ticks:{ font:{ size:11, family:"DM Sans" } } },
          y1: { position:"right", grid:{ drawOnChartArea:false },    ticks:{ font:{ size:11, family:"DM Sans" } } },
          x:  { grid:{ display:false }, ticks:{ font:{ size:11, family:"DM Sans" } } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, []);
  return (
    <div className="card">
      <div className="card-header">
        <div><div className="card-title">Reservas y ventas</div><div className="card-sub">Últimas 6 semanas</div></div>
      </div>
      <div className="chart-legend">
        <span className="legend-item"><span className="legend-sq" style={{ background:"#1d9e75" }}/>Reservas</span>
        <span className="legend-item"><span className="legend-sq" style={{ background:"#378add" }}/>Ventas ($K)</span>
      </div>
      <div style={{ position:"relative", height:220 }}><canvas ref={ref} /></div>
    </div>
  );
}

function ChartDona({ confirmadas, pendientes, canceladas }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type:"doughnut",
      data:{
        labels:["Confirmadas","Pendientes","Canceladas"],
        datasets:[{ data:[confirmadas,pendientes,canceladas], backgroundColor:["#1d9e75","#ef9f27","#e24b4a"], borderWidth:0, hoverOffset:6 }],
      },
      options:{ responsive:true, maintainAspectRatio:false, cutout:"68%", plugins:{ legend:{ display:false } } },
    });
    return () => chartRef.current?.destroy();
  }, [confirmadas, pendientes, canceladas]);
  return (
    <div className="card">
      <div className="card-header"><div><div className="card-title">Estado de reservas</div><div className="card-sub">Distribución actual</div></div></div>
      <div style={{ position:"relative", height:180 }}><canvas ref={ref} /></div>
      <div className="chart-legend" style={{ marginTop:12, justifyContent:"center" }}>
        <span className="legend-item"><span className="legend-sq" style={{ background:"#1d9e75" }}/>Confirmadas {confirmadas}</span>
        <span className="legend-item"><span className="legend-sq" style={{ background:"#ef9f27" }}/>Pendientes {pendientes}</span>
        <span className="legend-item"><span className="legend-sq" style={{ background:"#e24b4a" }}/>Canceladas {canceladas}</span>
      </div>
    </div>
  );
}

export default function TabResumen() {
  const { reservas, clientes, ventas, stock } = useStore();

  useEffect(() => {
    if (window.Chart) return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    document.head.appendChild(s);
  }, []);

  const hoy = new Date().toISOString().split("T")[0];
  const reservasHoy = reservas.filter((r) => r.fecha === hoy).length;
  const totalVentasMes = ventas.reduce((s, v) => s + Number(v.monto), 0);
  const productosBajos = stock.filter((s) => (s.cantidad / s.max) < 0.45).length;
  const confirmadas = reservas.filter((r) => r.estado === "Confirmada").length;
  const pendientes  = reservas.filter((r) => r.estado === "Pendiente").length;
  const canceladas  = reservas.filter((r) => r.estado === "Cancelada").length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Resumen general</div>
        <div className="page-desc">Métricas y actividad en tiempo real</div>
      </div>
      <div className="metrics-grid">
        <MetricCard label="Reservas hoy"       value={reservasHoy || reservas.length} delta="+12% vs ayer"         type="up" />
        <MetricCard label="Ventas del mes"      value={`$${totalVentasMes.toLocaleString("es-AR")}`} delta="+8% vs mes anterior" type="up" />
        <MetricCard label="Clientes activos"    value={clientes.length}                delta="+23 nuevos"           type="up" />
        <MetricCard label="Productos bajos"     value={productosBajos}                 delta="Requiere atención"    type={productosBajos > 0 ? "warn" : "up"} />
      </div>
      <div className="charts-row">
        <ChartBarras />
        <ChartDona confirmadas={confirmadas} pendientes={pendientes} canceladas={canceladas} />
      </div>
    </div>
  );
}
