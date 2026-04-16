// src/components/TabCanchas.jsx — Gestión visual de canchas y disponibilidad
import { useState, useMemo, useCallback } from "react";
import { useStore } from "../data/store.jsx";
import { CANCHAS, LOCALES, DEPORTE_EMOJI } from "../data/canchas.js";
import Modal from "./Modal";
import KpisCanchas from "./KpisCanchas.jsx";
import "../styles/TabCanchas.css";

const HORAS = Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`);

// ── SVG por tipo de cancha ──────────────────────────────────────────────────
function CourtSVG({ deporte }) {
  if (deporte === "padel") return (
    <svg viewBox="0 0 100 60" className="court-svg court-padel" aria-label="Cancha de pádel">
      {/* Piso */}
      <rect x="12" y="6" width="76" height="48" fill="#e8f5f0" rx="1"/>
      {/* Paredes laterales */}
      <rect x="12" y="6"  width="9" height="48" fill="#b2dfcf" rx="1"/>
      <rect x="79" y="6"  width="9" height="48" fill="#b2dfcf" rx="1"/>
      {/* Borde exterior */}
      <rect x="12" y="6" width="76" height="48" fill="none" stroke="#1d9e75" strokeWidth="2"/>
      {/* Borde interior (dentro de paredes) */}
      <rect x="21" y="6" width="58" height="48" fill="none" stroke="#1d9e75" strokeWidth="1" strokeDasharray="3,2"/>
      {/* Línea central */}
      <line x1="50" y1="6" x2="50" y2="54" stroke="#1d9e75" strokeWidth="1.5"/>
      {/* Líneas de servicio */}
      <line x1="21" y1="30" x2="79" y2="30" stroke="#1d9e75" strokeWidth="1"/>
      {/* Texto */}
      <text x="36" y="22" textAnchor="middle" fontSize="7" fill="#1d9e75" fontWeight="600">PÁDEL</text>
    </svg>
  );

  if (deporte === "basquet") return (
    <svg viewBox="0 0 100 60" className="court-svg court-basquet" aria-label="Cancha de básquet">
      {/* Media cancha */}
      <rect x="12" y="6" width="76" height="48" fill="#e8f0fa" rx="1"/>
      {/* Borde */}
      <rect x="12" y="6" width="76" height="48" fill="none" stroke="#378add" strokeWidth="2"/>
      {/* Línea central */}
      <line x1="50" y1="6" x2="50" y2="54" stroke="#378add" strokeWidth="1.5"/>
      {/* Zona de 3 puntos (arco izq) */}
      <path d="M 12 12 Q 45 30 12 48" fill="none" stroke="#378add" strokeWidth="1.2"/>
      {/* Zona de 3 puntos (arco der) */}
      <path d="M 88 12 Q 55 30 88 48" fill="none" stroke="#378add" strokeWidth="1.2"/>
      {/* Zona pintada izq */}
      <rect x="12" y="20" width="20" height="20" fill="#c7daf5" stroke="#378add" strokeWidth="1"/>
      {/* Zona pintada der */}
      <rect x="68" y="20" width="20" height="20" fill="#c7daf5" stroke="#378add" strokeWidth="1"/>
      {/* Círculo central */}
      <circle cx="50" cy="30" r="7" fill="none" stroke="#378add" strokeWidth="1"/>
      {/* Texto */}
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#378add" fontWeight="600">BÁSQUET</text>
    </svg>
  );

  // voley
  return (
    <svg viewBox="0 0 100 60" className="court-svg court-voley" aria-label="Cancha de vóley">
      {/* Piso */}
      <rect x="12" y="8" width="76" height="44" fill="#fef3e2" rx="1"/>
      {/* Borde */}
      <rect x="12" y="8" width="76" height="44" fill="none" stroke="#ef9f27" strokeWidth="2"/>
      {/* Zona libre (3m) */}
      <rect x="12" y="8"  width="10" height="44" fill="rgba(239,159,39,0.08)"/>
      <rect x="78" y="8"  width="10" height="44" fill="rgba(239,159,39,0.08)"/>
      <rect x="12" y="8"  width="76" height="8"  fill="rgba(239,159,39,0.08)"/>
      <rect x="12" y="44" width="76" height="8"  fill="rgba(239,159,39,0.08)"/>
      {/* Red central */}
      <line x1="50" y1="8"  x2="50" y2="52" stroke="#ef9f27" strokeWidth="3"/>
      <line x1="50" y1="6"  x2="50" y2="8"  stroke="#6b7280" strokeWidth="2"/>
      <line x1="50" y1="52" x2="50" y2="54" stroke="#6b7280" strokeWidth="2"/>
      {/* Líneas de ataque (3m de la red) */}
      <line x1="36" y1="8" x2="36" y2="52" stroke="#ef9f27" strokeWidth="0.8" strokeDasharray="2,2"/>
      <line x1="64" y1="8" x2="64" y2="52" stroke="#ef9f27" strokeWidth="0.8" strokeDasharray="2,2"/>
      {/* Texto */}
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#ef9f27" fontWeight="600">VÓLEY</text>
    </svg>
  );
}

// ── Estado de la cancha en un día ───────────────────────────────────────────
function getCanchaEstado(canchaId, fecha, reservas, bloqueos) {
  const resActivas = reservas.filter(
    (r) => r.canchaId === canchaId && r.fecha === fecha && r.estado !== "Cancelada"
  );
  const bloqActivos = bloqueos.filter(
    (b) => b.canchaId === canchaId && b.fecha === fecha
  );

  if (resActivas.length === 0 && bloqActivos.length === 0)
    return { tipo: "disponible",  label: "Disponible",            color: "#166534", bg: "#DCFCE7", icon: "✓" };
  if (bloqActivos.length > 0 && resActivas.length === 0)
    return { tipo: "mantenimiento", label: "Bloqueada",           color: "#6B7280", bg: "#F3F4F6", icon: "🔧" };
  if (resActivas.length > 0)
    return { tipo: "parcial",     label: "Parcialmente ocupada",  color: "#854D0E", bg: "#FEF9C3", icon: "📅" };

  return { tipo: "disponible", label: "Disponible", color: "#166534", bg: "#DCFCE7", icon: "✓" };
}

// ── Tarjeta de cancha ───────────────────────────────────────────────────────
function CanchaCard({ cancha, fecha, reservas, bloqueos, onClick }) {
  const estado = getCanchaEstado(cancha.id, fecha, reservas, bloqueos);
  const local  = LOCALES[cancha.localId]?.nombre ?? cancha.localId;
  return (
    <button className="cancha-card" onClick={onClick} title={`Gestionar horarios — ${cancha.nombre}`}>
      <CourtSVG deporte={cancha.deporte} />
      <div className="cancha-card-body">
        <div className="cancha-card-nombre">{cancha.nombre}</div>
        <div className="cancha-card-local">{local}</div>
        <span
          className="cancha-card-estado"
          style={{ color: estado.color, background: estado.bg }}
        >
          {estado.icon} {estado.label}
        </span>
      </div>
    </button>
  );
}

// ── Bloque de horario en el modal ───────────────────────────────────────────
function HoraBloque({ hora, estado, onClick }) {
  const estilos = {
    disponible:    { color: "#166534", bg: "#DCFCE7", icon: "✓",  label: "Disponible"    },
    ocupado:       { color: "#991B1B", bg: "#FEE2E2", icon: "📅", label: "Reservado"     },
    mantenimiento: { color: "#6B7280", bg: "#F3F4F6", icon: "🔧", label: "Mantenimiento" },
  };
  const s = estilos[estado] ?? estilos.disponible;

  return (
    <button
      className={`hora-bloque hora-${estado}`}
      onClick={onClick}
      style={{ '--hb-color': s.color, '--hb-bg': s.bg }}
      title={`${hora} — ${s.label}. ${estado === "disponible" ? "Clic para bloquear" : estado === "mantenimiento" ? "Clic para desbloquear" : "Hay una reserva activa"}`}
    >
      <span className="hb-hora">{hora}</span>
      <span className="hb-icon">{s.icon}</span>
      <span className="hb-label">{s.label}</span>
    </button>
  );
}

// ── Modal de gestión de horarios ─────────────────────────────────────────────
function ModalHorarios({ cancha, fecha, onFechaChange, reservas, bloqueos, addBloqueo, deleteBloqueo, onClose, showToast }) {
  const [confirmPending, setConfirmPending] = useState(null); // { tipo, hora }
  const [modoRango, setModoRango] = useState(false);
  const [rango, setRango] = useState({ fechaDesde: fecha, fechaHasta: fecha, horaDesde: "08:00", horaHasta: "22:00", motivo: "Mantenimiento preventivo" });
  const { addBloqueoRango } = useStore();

  const getEstadoHora = useCallback((hora) => {
    const reservaActiva = reservas.find(
      (r) => r.canchaId === cancha.id && r.fecha === fecha && r.estado !== "Cancelada" &&
             r.horario?.startsWith(hora)
    );
    if (reservaActiva) return "ocupado";

    const bloqueo = bloqueos.find(
      (b) => b.canchaId === cancha.id && b.fecha === fecha && b.hora === hora
    );
    if (bloqueo) return "mantenimiento";

    return "disponible";
  }, [cancha.id, fecha, reservas, bloqueos]);

  const handleHoraClick = (hora) => {
    const estado = getEstadoHora(hora);
    if (estado === "ocupado") {
      setConfirmPending({ tipo: "aviso", hora });
      return;
    }
    setConfirmPending({ tipo: estado === "disponible" ? "bloquear" : "desbloquear", hora });
  };

  const confirmarAccion = async () => {
    if (!confirmPending) return;
    const { tipo, hora } = confirmPending;
    if (tipo === "bloquear") {
      await addBloqueo({ canchaId: cancha.id, fecha, hora, motivo: "Mantenimiento", tipo: "mantenimiento" });
      showToast("Horario bloqueado por mantenimiento", "success");
    } else if (tipo === "desbloquear") {
      const b = bloqueos.find((b) => b.canchaId === cancha.id && b.fecha === fecha && b.hora === hora);
      if (b) { await deleteBloqueo(b.id); showToast("Bloqueo eliminado correctamente", "success"); }
    }
    setConfirmPending(null);
  };

  const handleRangoSubmit = async () => {
    await addBloqueoRango({ canchaId: cancha.id, ...rango, tipo: "mantenimiento" });
    showToast("Mantenimiento programado correctamente", "success");
    setModoRango(false);
  };

  const total      = HORAS.length;
  const ocupados   = HORAS.filter((h) => getEstadoHora(h) === "ocupado").length;
  const bloqueados = HORAS.filter((h) => getEstadoHora(h) === "mantenimiento").length;
  const libres     = total - ocupados - bloqueados;

  return (
    <Modal title={`${DEPORTE_EMOJI[cancha.deporte]} ${cancha.nombre} — Gestión de horarios`} onClose={onClose} size="lg">
      {/* Header: fecha + resumen */}
      <div className="modal-horarios-header">
        <div className="mh-fecha-row">
          <label className="form-label">Fecha</label>
          <input type="date" className="form-input mh-fecha-input" value={fecha} onChange={(e) => onFechaChange(e.target.value)} />
        </div>
        <div className="mh-summary">
          <span className="mh-chip" style={{ color: "#166534", background: "#DCFCE7" }}>✓ {libres} libres</span>
          <span className="mh-chip" style={{ color: "#991B1B", background: "#FEE2E2" }}>📅 {ocupados} reservados</span>
          <span className="mh-chip" style={{ color: "#6B7280", background: "#F3F4F6" }}>🔧 {bloqueados} bloqueados</span>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mh-leyenda">
        <span className="mh-ley-item" style={{ color: "#166534" }}>✓ Disponible — clic para bloquear</span>
        <span className="mh-ley-item" style={{ color: "#6B7280" }}>🔧 Mantenimiento — clic para liberar</span>
        <span className="mh-ley-item" style={{ color: "#991B1B" }}>📅 Reservado — cancelar reserva primero</span>
      </div>

      {/* Grilla de horarios */}
      <div className="horas-grid">
        {HORAS.map((h) => (
          <HoraBloque key={h} hora={h} estado={getEstadoHora(h)} onClick={() => handleHoraClick(h)} />
        ))}
      </div>

      {/* Programar mantenimiento en rango */}
      <div className="mh-rango-section">
        <button className="btn btn-sm" onClick={() => setModoRango((v) => !v)}>
          {modoRango ? "▲ Cerrar" : "🔧 Programar mantenimiento (rango de fechas)"}
        </button>
        {modoRango && (
          <div className="mh-rango-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Desde</label>
                <input type="date" className="form-input" value={rango.fechaDesde} onChange={(e) => setRango((r) => ({ ...r, fechaDesde: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Hasta</label>
                <input type="date" className="form-input" value={rango.fechaHasta} onChange={(e) => setRango((r) => ({ ...r, fechaHasta: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Hora inicio</label>
                <select className="form-input" value={rango.horaDesde} onChange={(e) => setRango((r) => ({ ...r, horaDesde: e.target.value }))}>
                  {HORAS.map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hora cierre</label>
                <select className="form-input" value={rango.horaHasta} onChange={(e) => setRango((r) => ({ ...r, horaHasta: e.target.value }))}>
                  {HORAS.map((h) => <option key={h}>{h}</option>)}
                  <option value="22:00">22:00</option>
                </select>
              </div>
              <div className="form-group form-full">
                <label className="form-label">Motivo</label>
                <input type="text" className="form-input" value={rango.motivo} onChange={(e) => setRango((r) => ({ ...r, motivo: e.target.value }))} placeholder="Ej: Mantenimiento de superficie" />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => setModoRango(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleRangoSubmit}>Programar mantenimiento</button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmar acción */}
      {confirmPending && (
        <div className="mh-confirm-overlay">
          <div className="mh-confirm-box">
            {confirmPending.tipo === "aviso" ? (
              <>
                <p className="mh-confirm-title">⚠ Horario con reserva activa</p>
                <p className="mh-confirm-desc">El turno de las <strong>{confirmPending.hora}</strong> tiene una reserva confirmada. Para bloquearlo debés cancelar la reserva primero desde el módulo de Reservas.</p>
                <button className="btn btn-primary" onClick={() => setConfirmPending(null)}>Entendido</button>
              </>
            ) : (
              <>
                <p className="mh-confirm-title">
                  {confirmPending.tipo === "bloquear" ? "🔧 Bloquear por mantenimiento" : "✓ Liberar horario"}
                </p>
                <p className="mh-confirm-desc">
                  {confirmPending.tipo === "bloquear"
                    ? `¿Bloqueás las ${confirmPending.hora} del ${fecha}? No podrá reservarse mientras esté bloqueado.`
                    : `¿Liberás el bloqueo de las ${confirmPending.hora} del ${fecha}?`}
                </p>
                <div className="modal-actions">
                  <button className="btn" onClick={() => setConfirmPending(null)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={confirmarAccion}>Confirmar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="modal-actions" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  );
}

// ── Toast notification ──────────────────────────────────────────────────────
function Toast({ msg, tipo, onClose }) {
  if (!msg) return null;
  const colors = { success: { bg: "#DCFCE7", color: "#166534", border: "#86EFAC" }, error: { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" } };
  const c = colors[tipo] ?? colors.success;
  return (
    <div className="toast-fixed" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {tipo === "success" ? "✓" : "⚠"} {msg}
      <button onClick={onClose} style={{ marginLeft: 10, background: "none", border: "none", cursor: "pointer", color: c.color, fontWeight: 700 }}>✕</button>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function TabCanchas() {
  const { reservas, bloqueos, addBloqueo, deleteBloqueo } = useStore();
  const [fecha, setFecha]     = useState(new Date().toISOString().split("T")[0]);
  const [modal, setModal]     = useState(null);
  const [toast, setToast]     = useState(null);
  const [filtroLocal, setFiltroLocal] = useState("");
  const [filtroDeporte, setFiltroDeporte] = useState("");

  const showToast = (msg, tipo = "success") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const canchasFiltradas = useMemo(() =>
    CANCHAS.filter((c) =>
      (!filtroLocal   || c.localId === filtroLocal) &&
      (!filtroDeporte || c.deporte === filtroDeporte)
    ), [filtroLocal, filtroDeporte]);

  const kpiHoy = useMemo(() => {
    const hoy = new Date().toISOString().split("T")[0];
    const ocupadas  = new Set(reservas.filter((r) => r.fecha === hoy && r.estado !== "Cancelada").map((r) => r.canchaId)).size;
    const bloqueadas = new Set(bloqueos.filter((b) => b.fecha === hoy).map((b) => b.canchaId)).size;
    const disponibles = CANCHAS.length - Math.max(ocupadas, bloqueadas);
    return { disponibles: Math.max(0, disponibles), ocupadas, bloqueadas };
  }, [reservas, bloqueos]);

  return (
    <div>
      <Toast msg={toast?.msg} tipo={toast?.tipo} onClose={() => setToast(null)} />

      <div className="page-header">
        <div>
          <div className="page-title">Canchas</div>
          <div className="page-desc">
            {CANCHAS.length} canchas · {kpiHoy.disponibles} disponibles hoy · {kpiHoy.bloqueadas} bloqueadas
          </div>
        </div>
      </div>

      {/* KPIs numéricos de hoy */}
      <div className="kpi-grid kpi-grid-4" style={{ marginBottom: 16 }}>
        {[
          { label: "Total canchas",       val: CANCHAS.length,       color: "var(--text-primary)", bg: "transparent" },
          { label: "✓ Disponibles hoy",   val: kpiHoy.disponibles,   color: "#166534",             bg: "#DCFCE7"     },
          { label: "📅 Ocupadas hoy",     val: kpiHoy.ocupadas,      color: "#854D0E",             bg: "#FEF9C3"     },
          { label: "🔧 Bloqueadas hoy",   val: kpiHoy.bloqueadas,    color: "#6B7280",             bg: "#F3F4F6"     },
        ].map((c) => (
          <div key={c.label} className="kpi-card" style={{ background: c.bg }}>
            <div className="metric-label">{c.label}</div>
            <div className="kpi-value" style={{ '--kpi-c': c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* KPIs analíticos */}
      <KpisCanchas reservas={reservas} bloqueos={bloqueos} />

      {/* Filtros de la grilla */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Grilla de canchas</div>
            <div className="card-sub">Clic en una cancha para gestionar su disponibilidad</div>
          </div>
          <div className="filter-row" style={{ marginBottom: 0 }}>
            <input type="date" className="form-input" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ maxWidth: 160 }} />
            <select className="form-input" value={filtroDeporte} onChange={(e) => setFiltroDeporte(e.target.value)} style={{ maxWidth: 140 }}>
              <option value="">Todos los deportes</option>
              <option value="padel">🎾 Pádel</option>
              <option value="basquet">🏀 Básquet</option>
              <option value="voley">🏐 Vóley</option>
            </select>
            <select className="form-input" value={filtroLocal} onChange={(e) => setFiltroLocal(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="">Todos los locales</option>
              <option value="local-1">Local Centro</option>
              <option value="local-2">Local Norte</option>
            </select>
            {(filtroLocal || filtroDeporte) && (
              <button className="btn" onClick={() => { setFiltroLocal(""); setFiltroDeporte(""); }}>Limpiar</button>
            )}
          </div>
        </div>

        <div className="canchas-grid">
          {canchasFiltradas.map((cancha) => (
            <CanchaCard
              key={cancha.id}
              cancha={cancha}
              fecha={fecha}
              reservas={reservas}
              bloqueos={bloqueos}
              onClick={() => setModal({ cancha })}
            />
          ))}
        </div>
      </div>

      {/* Modal de gestión */}
      {modal && (
        <ModalHorarios
          cancha={modal.cancha}
          fecha={fecha}
          onFechaChange={setFecha}
          reservas={reservas}
          bloqueos={bloqueos}
          addBloqueo={addBloqueo}
          deleteBloqueo={deleteBloqueo}
          onClose={() => setModal(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
