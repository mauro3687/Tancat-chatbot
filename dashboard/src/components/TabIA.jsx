// src/components/TabIA.jsx — Módulo IA: análisis y recomendaciones al admin
import { useState, useEffect, useRef } from "react";
import { useStore } from "../data/store.jsx";
import {
  analizarConcurrencia,
  analizarHorarios,
  predecirDemanda,
  generarRecomendaciones,
} from "../data/iaAnalytics.js";

const COLOR_MAP = {
  verde: { bg: "var(--green-light,#E1F5EE)", text: "var(--green-dark,#085041)", border: "#1D9E75" },
  azul:  { bg: "var(--blue-light,#E6F1FB)",  text: "var(--azul-dark,#0C447C)",  border: "#378ADD" },
  ambar: { bg: "#FAEEDA", text: "#633806", border: "#EF9F27" },
  rojo:  { bg: "var(--red-light,#FCEBEB)",   text: "#791F1F",  border: "#E24B4A" },
};

const PRIORIDAD_ORDER = { urgente: 0, alta: 1, media: 2, baja: 3 };

function NivelBar({ pct, nivel }) {
  const color = nivel === "alto" ? "#1D9E75" : nivel === "bajo" ? "#E24B4A" : "#EF9F27";
  return (
    <div style={{ flex: 1, height: 6, background: "#F1EFE8", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
    </div>
  );
}

function RecomendacionCard({ r, idx }) {
  const col = COLOR_MAP[r.color] || COLOR_MAP.azul;
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: `1px solid ${col.border}`,
        borderRadius: 12,
        background: col.bg,
        padding: "1rem 1.1rem",
        marginBottom: 10,
        animation: `fadeSlide 0.3s ease ${idx * 0.07}s both`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>{r.icono}</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: col.text }}>{r.titulo}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              background: col.border, color: "#fff", textTransform: "uppercase", letterSpacing: 0.4,
            }}>
              {r.prioridad}
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--gray-600,#5F5E5A)", margin: 0, lineHeight: 1.5 }}>
            {r.descripcion}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, border: `1px solid ${col.border}`, background: "#fff", color: col.text, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {open ? "Ocultar" : "Ver acción"}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 10, padding: "8px 12px", background: "#fff", borderRadius: 8, border: `1px solid ${col.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: col.text, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Acción recomendada
          </div>
          <div style={{ fontSize: 13, color: "var(--gray-800,#2C2C2A)", fontWeight: 500 }}>{r.accion}</div>
          <div style={{ fontSize: 11, color: "var(--gray-400,#9E9B94)", marginTop: 4 }}>Impacto estimado: {r.impacto}</div>
        </div>
      )}
    </div>
  );
}

export default function TabIA() {
  const { reservas, ventas, stock } = useStore();
  const [concurrencia, setConcurrencia] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [predicciones, setPredicciones] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [analizando, setAnalizando] = useState(false);
  const [analizado, setAnalizado] = useState(false);
  const [filtro, setFiltro] = useState("todas");

  const analizar = async () => {
    setAnalizando(true);
    const conc = analizarConcurrencia(reservas);
    const hor = analizarHorarios(reservas);
    const pred = await predecirDemanda(conc);
    const recs = generarRecomendaciones(conc, hor, ventas, stock);
    recs.sort((a, b) => (PRIORIDAD_ORDER[a.prioridad] ?? 9) - (PRIORIDAD_ORDER[b.prioridad] ?? 9));
    setConcurrencia(conc);
    setHorarios(hor);
    setPredicciones(pred);
    setRecomendaciones(recs);
    setAnalizando(false);
    setAnalizado(true);
  };

  const recsFiltered = filtro === "todas"
    ? recomendaciones
    : recomendaciones.filter((r) => r.tipo === filtro);

  const nivelColor = { alto: "#1D9E75", medio: "#EF9F27", bajo: "#E24B4A", sin_datos: "#D3D1C7" };

  return (
    <div>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Inteligencia Artificial</div>
          <div className="page-desc">Análisis predictivo y recomendaciones automáticas con TensorFlow.js</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={analizar}
          disabled={analizando}
          style={{ minWidth: 160 }}
        >
          {analizando ? "⚙️ Analizando..." : analizado ? "🔄 Re-analizar" : "🤖 Analizar con IA"}
        </button>
      </div>

      {/* Intro si no analizó aún */}
      {!analizado && !analizando && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 2rem" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-800)", marginBottom: 8 }}>
            Motor de IA listo
          </div>
          <p style={{ fontSize: 13.5, color: "var(--gray-600)", maxWidth: 480, margin: "0 auto 1.5rem" }}>
            TensorFlow.js analiza tus datos de reservas, ventas e inventario para identificar patrones de demanda y generar recomendaciones de promociones y descuentos personalizadas.
          </p>
          <button className="btn btn-primary" onClick={analizar} style={{ fontSize: 14, padding: "10px 28px" }}>
            🤖 Iniciar análisis
          </button>
        </div>
      )}

      {/* Loading */}
      {analizando && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>⚙️ TensorFlow.js procesando datos...</div>
          <div style={{ height: 4, background: "#F1EFE8", borderRadius: 2, overflow: "hidden", maxWidth: 300, margin: "0 auto" }}>
            <div style={{ height: "100%", background: "#1D9E75", borderRadius: 2, animation: "loadBar 1.5s infinite" }} />
          </div>
          <style>{`@keyframes loadBar { 0%{width:0%} 50%{width:80%} 100%{width:100%} }`}</style>
        </div>
      )}

      {analizado && !analizando && (
        <>
          {/* Concurrencia por día */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Concurrencia por día de semana</div>
                  <div className="card-sub">Basado en {reservas.length} reservas</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {concurrencia.map((d, i) => (
                  <div key={d.dia} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <span style={{ minWidth: 90, color: "var(--gray-800)", fontWeight: d.nivel === "alto" ? 600 : 400 }}>{d.dia}</span>
                    <NivelBar pct={d.pct} nivel={d.nivel} />
                    <span style={{ minWidth: 28, textAlign: "right", fontWeight: 600, color: nivelColor[d.nivel] || "#888" }}>{d.reservas}</span>
                    <span style={{
                      fontSize: 10, padding: "1px 7px", borderRadius: 20, fontWeight: 600,
                      background: nivelColor[d.nivel] + "22" || "#F1EFE8",
                      color: nivelColor[d.nivel] || "#888",
                      minWidth: 52, textAlign: "center",
                    }}>{d.nivel.replace("_"," ")}</span>
                    {predicciones[i] !== undefined && (
                      <span style={{ fontSize: 10, color: "var(--gray-400)", minWidth: 36, textAlign: "right" }}>
                        {Math.round(predicciones[i] * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 10, borderTop: "1px solid var(--gray-200)", paddingTop: 8 }}>
                Columna % = predicción de demanda futura (modelo TF)
              </div>
            </div>

            {/* Horarios */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Distribución por turno horario</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {horarios.map((h) => (
                  <div key={h.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <span style={{ minWidth: 160, color: "var(--gray-800)" }}>{h.label}</span>
                    <NivelBar pct={h.pct} nivel={h.nivel} />
                    <span style={{ minWidth: 36, textAlign: "right", fontWeight: 600, color: nivelColor[h.nivel] }}>{h.pct}%</span>
                  </div>
                ))}
              </div>
              {/* Leyenda */}
              <div style={{ display: "flex", gap: 14, marginTop: 14, paddingTop: 8, borderTop: "1px solid var(--gray-200)", fontSize: 11 }}>
                {[["#1D9E75","Alto"],["#EF9F27","Medio"],["#E24B4A","Bajo"]].map(([c,l]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--gray-600)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }}/>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recomendaciones de IA</div>
                <div className="card-sub">{recomendaciones.length} sugerencias generadas</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  ["todas", "Todas"],
                  ["promocion", "Promociones"],
                  ["descuento", "Descuentos"],
                  ["stock", "Stock"],
                  ["rentabilidad", "Rentabilidad"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFiltro(val)}
                    style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 20, cursor: "pointer",
                      border: "1px solid var(--gray-200)",
                      background: filtro === val ? "#1D9E75" : "#fff",
                      color: filtro === val ? "#fff" : "var(--gray-600)",
                      fontWeight: filtro === val ? 600 : 400,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {recsFiltered.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--gray-400)", padding: "1.5rem" }}>
                No hay recomendaciones para este filtro.
              </p>
            ) : (
              recsFiltered.map((r, i) => <RecomendacionCard key={i} r={r} idx={i} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
