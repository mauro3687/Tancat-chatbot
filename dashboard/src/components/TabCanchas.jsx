// src/components/TabCanchas.jsx — Gestión visual de canchas y disponibilidad
import { useState, useMemo, useCallback } from "react";
import { useStore } from "../data/store.jsx";
import { CANCHAS as CANCHAS_BASE, LOCALES, DEPORTE_EMOJI } from "../data/canchas.js";
import Modal from "./Modal";
import KpisCanchas from "./KpisCanchas.jsx";
import "../styles/TabCanchas.css";

const HORAS = Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`);
const TODAS_SEDES = ["local-1", "local-2"];

function sedeLabel(id) {
  return LOCALES[id]?.nombre.replace("TanCat — ", "") ?? id;
}

// ── SVG por tipo de cancha ──────────────────────────────────────────────────
function CourtSVG({ deporte }) {
  if (deporte === "padel") return (
    <svg viewBox="0 0 100 60" className="court-svg court-padel" aria-label="Cancha de pádel">
      <rect x="12" y="6" width="76" height="48" fill="#e8f5f0" rx="1"/>
      <rect x="12" y="6"  width="9" height="48" fill="#b2dfcf" rx="1"/>
      <rect x="79" y="6"  width="9" height="48" fill="#b2dfcf" rx="1"/>
      <rect x="12" y="6" width="76" height="48" fill="none" stroke="#00C49A" strokeWidth="2"/>
      <rect x="21" y="6" width="58" height="48" fill="none" stroke="#00C49A" strokeWidth="1" strokeDasharray="3,2"/>
      <line x1="50" y1="6" x2="50" y2="54" stroke="#00C49A" strokeWidth="1.5"/>
      <line x1="21" y1="30" x2="79" y2="30" stroke="#00C49A" strokeWidth="1"/>
      <text x="36" y="22" textAnchor="middle" fontSize="7" fill="#00C49A" fontWeight="600">PÁDEL</text>
    </svg>
  );

  if (deporte === "basquet") return (
    <svg viewBox="0 0 100 60" className="court-svg court-basquet" aria-label="Cancha de básquet">
      <rect x="12" y="6" width="76" height="48" fill="#e8f0fa" rx="1"/>
      <rect x="12" y="6" width="76" height="48" fill="none" stroke="#4D8EF0" strokeWidth="2"/>
      <line x1="50" y1="6" x2="50" y2="54" stroke="#4D8EF0" strokeWidth="1.5"/>
      <path d="M 12 12 Q 45 30 12 48" fill="none" stroke="#4D8EF0" strokeWidth="1.2"/>
      <path d="M 88 12 Q 55 30 88 48" fill="none" stroke="#4D8EF0" strokeWidth="1.2"/>
      <rect x="12" y="20" width="20" height="20" fill="#c7daf5" stroke="#4D8EF0" strokeWidth="1"/>
      <rect x="68" y="20" width="20" height="20" fill="#c7daf5" stroke="#4D8EF0" strokeWidth="1"/>
      <circle cx="50" cy="30" r="7" fill="none" stroke="#4D8EF0" strokeWidth="1"/>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#4D8EF0" fontWeight="600">BÁSQUET</text>
    </svg>
  );

  return (
    <svg viewBox="0 0 100 60" className="court-svg court-voley" aria-label="Cancha de vóley">
      <rect x="12" y="8" width="76" height="44" fill="#fef3e2" rx="1"/>
      <rect x="12" y="8" width="76" height="44" fill="none" stroke="#F0A030" strokeWidth="2"/>
      <rect x="12" y="8"  width="10" height="44" fill="rgba(239,159,39,0.08)"/>
      <rect x="78" y="8"  width="10" height="44" fill="rgba(239,159,39,0.08)"/>
      <rect x="12" y="8"  width="76" height="8"  fill="rgba(239,159,39,0.08)"/>
      <rect x="12" y="44" width="76" height="8"  fill="rgba(239,159,39,0.08)"/>
      <line x1="50" y1="8"  x2="50" y2="52" stroke="#F0A030" strokeWidth="3"/>
      <line x1="50" y1="6"  x2="50" y2="8"  stroke="#6b7280" strokeWidth="2"/>
      <line x1="50" y1="52" x2="50" y2="54" stroke="#6b7280" strokeWidth="2"/>
      <line x1="36" y1="8" x2="36" y2="52" stroke="#F0A030" strokeWidth="0.8" strokeDasharray="2,2"/>
      <line x1="64" y1="8" x2="64" y2="52" stroke="#F0A030" strokeWidth="0.8" strokeDasharray="2,2"/>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#F0A030" fontWeight="600">VÓLEY</text>
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
    return { tipo: "disponible",    label: "Disponible",           color: "var(--status-ok-text)",      bg: "var(--status-ok-bg)",      icon: "✓"  };
  if (bloqActivos.length > 0 && resActivas.length === 0)
    return { tipo: "mantenimiento", label: "Bloqueada",            color: "var(--status-neutral-text)", bg: "var(--status-neutral-bg)", icon: "🔧" };
  if (resActivas.length > 0)
    return { tipo: "parcial",       label: "Parcialmente ocupada", color: "var(--status-warn-text)",    bg: "var(--status-warn-bg)",    icon: "📅" };

  return { tipo: "disponible", label: "Disponible", color: "var(--status-ok-text)", bg: "var(--status-ok-bg)", icon: "✓" };
}

// ── Tarjeta de cancha ───────────────────────────────────────────────────────
function CanchaCard({ cancha, fecha, reservas, bloqueos, onClick }) {
  let estado = getCanchaEstado(cancha.id, fecha, reservas, bloqueos);
  if (estado.tipo === "disponible" && cancha.estadoForzado === "no-disponible") {
    estado = { tipo: "no-disponible", label: "No disponible",    color: "var(--status-neutral-text)", bg: "var(--status-neutral-bg)", icon: "🔧" };
  } else if (estado.tipo === "disponible" && cancha.estadoForzado === "mantenimiento") {
    estado = { tipo: "mantenimiento", label: "En mantenimiento", color: "var(--status-neutral-text)", bg: "var(--status-neutral-bg)", icon: "🔧" };
  }
  const local = LOCALES[cancha.localId]?.nombre ?? cancha.localId;
  return (
    <button className="cancha-card" onClick={onClick} title={`Gestionar horarios — ${cancha.nombre}`}>
      <CourtSVG deporte={cancha.deporte} />
      <div className="cancha-card-body">
        <div className="cancha-card-nombre">{cancha.nombre}</div>
        <div className="cancha-card-local">{local}</div>
        <span className="cancha-card-estado" style={{ color: estado.color, background: estado.bg }}>
          {estado.icon} {estado.label}
        </span>
      </div>
    </button>
  );
}

// ── Bloque de horario en el modal ───────────────────────────────────────────
function HoraBloque({ hora, estado, onClick }) {
  const estilos = {
    disponible:    { color: "var(--status-ok-text)",      bg: "var(--status-ok-bg)",      icon: "✓",  label: "Disponible"    },
    ocupado:       { color: "var(--status-error-text)",   bg: "var(--status-error-bg)",   icon: "📅", label: "Reservado"     },
    mantenimiento: { color: "var(--status-neutral-text)", bg: "var(--status-neutral-bg)", icon: "🔧", label: "Mantenimiento" },
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
  const [confirmPending, setConfirmPending] = useState(null);
  const [modoRango, setModoRango] = useState(false);
  const [rangoError, setRangoError] = useState("");
  const hoy = new Date().toISOString().split("T")[0];
  const [rango, setRango] = useState({ fechaDesde: fecha, fechaHasta: fecha, horaDesde: "08:00", horaHasta: "22:00", motivo: "Mantenimiento preventivo" });
  const { addBloqueoRango } = useStore();

  const getEstadoHora = useCallback((hora) => {
    const h = parseInt(hora);
    const reservaActiva = reservas.find((r) => {
      if (r.canchaId !== cancha.id || r.fecha !== fecha || r.estado === "Cancelada") return false;
      const parts = r.horario?.split("—").map((s) => parseInt(s.trim()));
      if (!parts || parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return false;
      return h >= parts[0] && h < parts[1];
    });
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
    setRangoError("");
    if (!rango.fechaDesde || !rango.fechaHasta) { setRangoError("Completá ambas fechas"); return; }
    if (rango.fechaDesde > rango.fechaHasta) { setRangoError("La fecha de inicio debe ser anterior o igual a la fecha de cierre"); return; }
    if (parseInt(rango.horaDesde) >= parseInt(rango.horaHasta)) { setRangoError("La hora de inicio debe ser anterior a la hora de cierre"); return; }
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
      <div className="modal-horarios-header">
        <div className="mh-fecha-row">
          <label className="form-label">Fecha</label>
          <input type="date" className="form-input mh-fecha-input" value={fecha} onChange={(e) => onFechaChange(e.target.value)} />
        </div>
        <div className="mh-summary">
          <span className="mh-chip" style={{ color: "var(--status-ok-text)",      background: "var(--status-ok-bg)"      }}>✓ {libres} libres</span>
          <span className="mh-chip" style={{ color: "var(--status-error-text)",   background: "var(--status-error-bg)"   }}>📅 {ocupados} reservados</span>
          <span className="mh-chip" style={{ color: "var(--status-neutral-text)", background: "var(--status-neutral-bg)" }}>🔧 {bloqueados} bloqueados</span>
        </div>
      </div>

      <div className="mh-leyenda">
        <span className="mh-ley-item" style={{ color: "var(--status-ok-text)"      }}>✓ Disponible — clic para bloquear</span>
        <span className="mh-ley-item" style={{ color: "var(--status-neutral-text)" }}>🔧 Mantenimiento — clic para liberar</span>
        <span className="mh-ley-item" style={{ color: "var(--status-error-text)"   }}>📅 Reservado — cancelar reserva primero</span>
      </div>

      <div className="horas-grid">
        {HORAS.map((h) => (
          <HoraBloque key={h} hora={h} estado={getEstadoHora(h)} onClick={() => handleHoraClick(h)} />
        ))}
      </div>

      <div className="mh-rango-section">
        <button className="btn btn-sm" onClick={() => setModoRango((v) => !v)}>
          {modoRango ? "▲ Cerrar" : "🔧 Programar mantenimiento (rango de fechas)"}
        </button>
        {modoRango && (
          <div className="mh-rango-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Desde</label>
                <input type="date" className="form-input" min={hoy} value={rango.fechaDesde} onChange={(e) => setRango((r) => ({ ...r, fechaDesde: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Hasta</label>
                <input type="date" className="form-input" min={rango.fechaDesde || hoy} value={rango.fechaHasta} onChange={(e) => setRango((r) => ({ ...r, fechaHasta: e.target.value }))} />
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
            {rangoError && <div className="form-error" style={{ marginTop: 6 }}>{rangoError}</div>}
            <div className="modal-actions" style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => { setModoRango(false); setRangoError(""); }}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleRangoSubmit}>Programar mantenimiento</button>
            </div>
          </div>
        )}
      </div>

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

// ── Modal: Alta de nueva cancha ─────────────────────────────────────────────
const CAPACIDAD_DEFAULT = { padel: 4, basquet: 10, voley: 12 };
const PRECIO_DEFAULT    = { padel: 8000, basquet: 12000, voley: 10000 };

function ModalNuevaCancha({ todasLasCanchas, sedesPermitidas, onSave, onClose }) {
  const [form, setForm] = useState({
    nombre: "", deporte: "", localId: sedesPermitidas.length === 1 ? sedesPermitidas[0] : "",
    estadoForzado: "disponible",
    horaApertura: "07:00", horaCierre: "23:00",
    precioPorHora: "",
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const isValid =
    form.nombre.trim() &&
    form.deporte &&
    form.localId &&
    Number(form.precioPorHora) > 0;

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())            e.nombre        = "El nombre es obligatorio";
    if (!form.deporte)                  e.deporte       = "Elegí un tipo de cancha";
    if (!form.localId)                  e.localId       = "Elegí una sede";
    if (!form.precioPorHora || Number(form.precioPorHora) <= 0)
                                        e.precioPorHora = "Debe ser mayor a $0";
    const dup = todasLasCanchas.find(
      (c) =>
        c.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase() &&
        c.localId === form.localId
    );
    if (dup) e.nombre = "Ya existe una cancha con ese nombre en esa sede";
    return e;
  };

  const handleGuardar = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({
      id:            `NUEVA-${Date.now()}`,
      localId:       form.localId,
      deporte:       form.deporte,
      nombre:        form.nombre.trim(),
      capacidad:     CAPACIDAD_DEFAULT[form.deporte] ?? 4,
      precioPorHora: Number(form.precioPorHora),
      horaApertura:  form.horaApertura,
      horaCierre:    form.horaCierre,
      estadoForzado: form.estadoForzado !== "disponible" ? form.estadoForzado : undefined,
    });
    onClose();
  };

  return (
    <Modal title="＋ Nueva Cancha" onClose={onClose} size="md">
      {form.deporte && (
        <div style={{ marginBottom: 16, padding: "0 20%", opacity: 0.95 }}>
          <CourtSVG deporte={form.deporte} />
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            Previsualización — {DEPORTE_EMOJI[form.deporte]} {form.deporte.charAt(0).toUpperCase() + form.deporte.slice(1)}
          </div>
        </div>
      )}

      <div className="form-grid">
        <div className="form-group form-full">
          <label className="form-label">Nombre *</label>
          <input
            className={`form-input${errors.nombre ? " input-error" : ""}`}
            placeholder='Ej: "Pádel 3", "Básquet B"'
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
          />
          {errors.nombre && <span className="form-error">{errors.nombre}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Tipo de cancha *</label>
          <select
            className={`form-input${errors.deporte ? " input-error" : ""}`}
            value={form.deporte}
            onChange={(e) => {
              const d = e.target.value;
              set("deporte", d);
              if (d && !form.precioPorHora) set("precioPorHora", PRECIO_DEFAULT[d] ?? "");
            }}
          >
            <option value="">Seleccionar...</option>
            <option value="padel">🎾 Pádel</option>
            <option value="basquet">🏀 Básquet</option>
            <option value="voley">🏐 Vóley</option>
          </select>
          {errors.deporte && <span className="form-error">{errors.deporte}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Sede *</label>
          <select
            className={`form-input${errors.localId ? " input-error" : ""}`}
            value={form.localId}
            onChange={(e) => set("localId", e.target.value)}
            disabled={sedesPermitidas.length === 1}
          >
            <option value="">Seleccionar...</option>
            {sedesPermitidas.map((id) => (
              <option key={id} value={id}>{LOCALES[id]?.nombre}</option>
            ))}
          </select>
          {errors.localId && <span className="form-error">{errors.localId}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Estado inicial *</label>
          <select className="form-input" value={form.estadoForzado} onChange={(e) => set("estadoForzado", e.target.value)}>
            <option value="disponible">✓ Disponible</option>
            <option value="no-disponible">🔧 No disponible</option>
            <option value="mantenimiento">🔧 En mantenimiento</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Precio por hora ($) *</label>
          <input
            type="number"
            min="1"
            step="100"
            className={`form-input${errors.precioPorHora ? " input-error" : ""}`}
            placeholder="Ej: 8000"
            value={form.precioPorHora}
            onChange={(e) => set("precioPorHora", e.target.value)}
          />
          {errors.precioPorHora && <span className="form-error">{errors.precioPorHora}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Hora apertura</label>
          <input type="time" className="form-input" value={form.horaApertura} onChange={(e) => set("horaApertura", e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Hora cierre</label>
          <input type="time" className="form-input" value={form.horaCierre} onChange={(e) => set("horaCierre", e.target.value)} />
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={!isValid} onClick={handleGuardar}>
          Guardar cancha
        </button>
      </div>
    </Modal>
  );
}

// ── Toast notification ──────────────────────────────────────────────────────
function Toast({ msg, tipo, onClose }) {
  if (!msg) return null;
  const colors = {
    success: { bg: "rgba(0, 196, 154, 0.14)",  color: "#00C49A", border: "rgba(0, 196, 154, 0.30)"  },
    error:   { bg: "rgba(240, 77, 106, 0.14)", color: "#F04D6A", border: "rgba(240, 77, 106, 0.30)" },
  };
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
  const { reservas, bloqueos, addBloqueo, deleteBloqueo, canchas: canchasFirestore, addCancha, currentUser } = useStore();

  const sedesPermitidas = currentUser?.rol === "encargado" && currentUser?.sede
    ? [currentUser.sede]
    : TODAS_SEDES;

  const [activeSede, setActiveSede] = useState(() => {
    const saved = sessionStorage.getItem("tancat_sede_canchas");
    return (saved && sedesPermitidas.includes(saved)) ? saved : sedesPermitidas[0];
  });

  const [fecha, setFecha]           = useState(new Date().toISOString().split("T")[0]);
  const [modal, setModal]           = useState(null);
  const [modalNueva, setModalNueva] = useState(false);
  const [toast, setToast]           = useState(null);
  const [filtroDeporte, setFiltroDeporte] = useState("");

  const handleSedeChange = (sedeId) => {
    setActiveSede(sedeId);
    sessionStorage.setItem("tancat_sede_canchas", sedeId);
    setFiltroDeporte("");
  };

  const todasLasCanchas = useMemo(
    () => [...CANCHAS_BASE, ...(canchasFirestore ?? [])],
    [canchasFirestore]
  );

  const showToast = (msg, tipo = "success") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const handleNuevaCancha = async (nuevaCancha) => {
    const { id: _tempId, ...canchaData } = nuevaCancha;
    await addCancha(canchaData);
    showToast("Cancha guardada correctamente", "success");
  };

  const canchasFiltradas = useMemo(() =>
    todasLasCanchas.filter((c) =>
      c.localId === activeSede &&
      (!filtroDeporte || c.deporte === filtroDeporte)
    ), [todasLasCanchas, activeSede, filtroDeporte]);

  const kpiHoy = useMemo(() => {
    const hoy = new Date().toISOString().split("T")[0];
    const canchasSede = todasLasCanchas.filter((c) => c.localId === activeSede);
    const idsSede = new Set(canchasSede.map((c) => c.id));
    const setOcupadas   = new Set(reservas.filter((r) => r.fecha === hoy && r.estado !== "Cancelada" && idsSede.has(r.canchaId)).map((r) => r.canchaId));
    const setBloqueadas = new Set(bloqueos.filter((b) => b.fecha === hoy && idsSede.has(b.canchaId)).map((b) => b.canchaId));
    const sinDisponibilidad = new Set([...setOcupadas, ...setBloqueadas]).size;
    const disponibles = Math.max(0, canchasSede.length - sinDisponibilidad);
    return { total: canchasSede.length, disponibles, ocupadas: setOcupadas.size, bloqueadas: setBloqueadas.size };
  }, [reservas, bloqueos, todasLasCanchas, activeSede]);

  return (
    <div>
      <Toast msg={toast?.msg} tipo={toast?.tipo} onClose={() => setToast(null)} />

      <div className="page-header">
        <div>
          <div className="page-title">Canchas</div>
          <div className="page-desc">
            {kpiHoy.total} canchas · {kpiHoy.disponibles} disponibles hoy · {kpiHoy.bloqueadas} bloqueadas
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setModalNueva(true)}>
          ＋ Nueva Cancha
        </button>
      </div>

      {/* Pestañas de sede */}
      {sedesPermitidas.length > 1 && (
        <div className="sede-tabs">
          {sedesPermitidas.map((sedeId) => (
            <button
              key={sedeId}
              className={`sede-tab${activeSede === sedeId ? " active" : ""}`}
              onClick={() => handleSedeChange(sedeId)}
            >
              {sedeLabel(sedeId)}
            </button>
          ))}
        </div>
      )}

      {/* KPIs numéricos de hoy */}
      <div className="kpi-grid kpi-grid-4" style={{ marginBottom: 16 }}>
        {[
          { label: "Total canchas",       val: kpiHoy.total,        color: "var(--text-primary)",        bg: "transparent"              },
          { label: "✓ Disponibles hoy",   val: kpiHoy.disponibles,  color: "var(--status-ok-text)",      bg: "var(--status-ok-bg)"      },
          { label: "📅 Ocupadas hoy",     val: kpiHoy.ocupadas,     color: "var(--status-warn-text)",    bg: "var(--status-warn-bg)"    },
          { label: "🔧 Bloqueadas hoy",   val: kpiHoy.bloqueadas,   color: "var(--status-neutral-text)", bg: "var(--status-neutral-bg)" },
        ].map((c) => (
          <div key={c.label} className="kpi-card" style={{ background: c.bg }}>
            <div className="metric-label">{c.label}</div>
            <div className="kpi-value" style={{ '--kpi-c': c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Grilla de canchas */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Grilla de canchas</div>
            <div className="card-sub">Clic en una cancha para gestionar su disponibilidad</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div className="filter-row" style={{ marginBottom: 0 }}>
              <input type="date" className="form-input" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ maxWidth: 160 }} min={new Date().toISOString().split("T")[0]} />
              <select className="form-input" value={filtroDeporte} onChange={(e) => setFiltroDeporte(e.target.value)} style={{ maxWidth: 140 }}>
                <option value="">Todos los deportes</option>
                <option value="padel">🎾 Pádel</option>
                <option value="basquet">🏀 Básquet</option>
                <option value="voley">🏐 Vóley</option>
              </select>
              {filtroDeporte && (
                <button className="btn" onClick={() => setFiltroDeporte("")}>Limpiar</button>
              )}
            </div>
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

      {/* KPIs analíticos y mapa de calor */}
      <KpisCanchas reservas={reservas} bloqueos={bloqueos} />

      {/* Modal: gestión de horarios */}
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

      {/* Modal: alta de nueva cancha */}
      {modalNueva && (
        <ModalNuevaCancha
          todasLasCanchas={todasLasCanchas}
          sedesPermitidas={sedesPermitidas}
          onSave={handleNuevaCancha}
          onClose={() => setModalNueva(false)}
        />
      )}
    </div>
  );
}
