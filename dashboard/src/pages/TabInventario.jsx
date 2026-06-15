// src/components/TabInventario.jsx
import "../styles/TabInventario.css";
import { useState, useMemo } from "react";
import { useStore } from "../data/store.jsx";
import Modal from "./Modal";
import KpisInventario from "./kpis/KpisInventario.jsx";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function IcoWarning({ s = 13 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function IcoBell({ s = 13 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}
function IcoCheck({ s = 13 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IcoUsers({ s = 13 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function IcoCart({ s = 13 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
    </svg>
  );
}
function IcoBox({ s = 13 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73L13 2.27a2 2 0 00-2 0L4 6.27A2 2 0 003 8v8a2 2 0 001 1.73L11 21.73a2 2 0 002 0L20 17.73A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
function IcoReturn({ s = 13 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
    </svg>
  );
}
function IcoX({ s = 13 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getStockLevel(pct) {
  if (pct < 20) return { color: "var(--status-error-text)", bg: "var(--status-error-bg)", label: "Crítico", Icon: IcoWarning };
  if (pct < 45) return { color: "var(--status-warn-text)",  bg: "var(--status-warn-bg)",  label: "Bajo",    Icon: IcoBell   };
  return          {      color: "var(--status-ok-text)",    bg: "var(--status-ok-bg)",    label: "Normal",  Icon: IcoCheck  };
}

const UNIDADES = ["u", "kg", "l", "caja", "par", "rollo"];

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "prestamos", label: "Equipamiento", Icon: IcoUsers },
  { id: "venta",     label: "Consumibles",  Icon: IcoCart  },
];

// ── Estados de préstamo ───────────────────────────────────────────────────────
const ESTADO_CFG = {
  entregado: { color: "var(--status-warn-text)",  bg: "var(--status-warn-bg)",  label: "En préstamo", Icon: IcoUsers  },
  devuelto:  { color: "var(--status-ok-text)",    bg: "var(--status-ok-bg)",    label: "Devuelto",    Icon: IcoReturn },
  perdido:   { color: "var(--status-error-text)", bg: "var(--status-error-bg)", label: "Perdido",     Icon: IcoX      },
};

// ── KPI chip reutilizable ─────────────────────────────────────────────────────
function KpiChip({ label, val, color, bg, Icon, onClick }) {
  return (
    <div
      className={`inv-kpi-chip ${onClick ? "inv-kpi-chip-link" : ""}`}
      style={{ "--chip-color": color, "--chip-bg": bg }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {Icon && (
        <span className="inv-kpi-ico" style={{ color }}>
          <Icon s={15} />
        </span>
      )}
      <span className="inv-kpi-val">{val}</span>
      <span className="inv-kpi-label">{label}</span>
    </div>
  );
}

// ── Stock global row ─────────────────────────────────────────────────────────
function StockRow({ item, onEdit, onDelete, onConsumo }) {
  const pct   = item.max > 0 ? Math.round((item.cantidad / item.max) * 100) : 0;
  const level = getStockLevel(pct);
  const { Icon } = level;
  return (
    <div className="stock-row">
      <span className="stock-name">{item.nombre}</span>
      <div className="stock-bar-bg">
        <div className="stock-bar" style={{ "--bar-w": `${pct}%`, "--bar-c": level.color }} />
      </div>
      <span className="stock-qty">{item.cantidad}/{item.max} {item.unidad}</span>
      <span className="stock-badge" style={{ "--badge-color": level.color, "--badge-bg": level.bg }}>
        <Icon s={11} /> {level.label}
      </span>
      <div className="inv-actions">
        {onConsumo && <button className="btn btn-sm" onClick={() => onConsumo(item)}>Consumir</button>}
        <button className="btn btn-sm" onClick={() => onEdit(item)}>Editar</button>
        <button className="btn btn-sm btn-icon-danger" onClick={() => onDelete(item)}>Eliminar</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// KPI GLOBAL — chips compactos que apuntan a cada sección
// ════════════════════════════════════════════════════════════════════════════
function GlobalInvKpi({ stock, prestamos, onTabChange }) {
  const venta      = stock.filter((s) => s.categoria === "venta");
  const preActivos = (prestamos ?? []).filter((p) => p.estado === "entregado").length;
  const critVenta  = venta.filter((s) => s.max > 0 && (s.cantidad / s.max) < 0.20).length;
  const bajosVenta = venta.filter((s) => { const p = s.max > 0 ? s.cantidad / s.max : 0; return p >= 0.20 && p < 0.45; }).length;

  return (
    <div className="inv-global-kpi">
      <span className="inv-global-kpi-title">Resumen general</span>
      <div className="inv-global-chips">

        {/* Equipamiento */}
        <div className="inv-global-group" onClick={() => onTabChange("prestamos")} role="button" tabIndex={0}>
          <span className="inv-global-group-label"><IcoUsers s={11} /> Equipamiento</span>
          <div className="inv-global-group-chips">
            <span
              className="inv-global-chip"
              style={{ color: preActivos > 0 ? "var(--status-warn-text)" : "var(--text-muted)", background: preActivos > 0 ? "var(--status-warn-bg)" : "transparent" }}
            >
              <IcoUsers s={11} /> {preActivos} en préstamo
            </span>
          </div>
        </div>

        <div className="inv-global-sep" />

        {/* Venta */}
        <div className="inv-global-group" onClick={() => onTabChange("venta")} role="button" tabIndex={0}>
          <span className="inv-global-group-label"><IcoCart s={11} /> Venta</span>
          <div className="inv-global-group-chips">
            <span
              className="inv-global-chip"
              style={{ color: critVenta > 0 ? "var(--status-error-text)" : "var(--text-muted)", background: critVenta > 0 ? "var(--status-error-bg)" : "transparent" }}
            >
              <IcoWarning s={11} /> {critVenta} críticos
            </span>
            <span
              className="inv-global-chip"
              style={{ color: bajosVenta > 0 ? "var(--status-warn-text)" : "var(--text-muted)", background: bajosVenta > 0 ? "var(--status-warn-bg)" : "transparent" }}
            >
              <IcoBell s={11} /> {bajosVenta} bajos
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 1: EQUIPAMIENTO DEPORTIVO (préstamos)
// ════════════════════════════════════════════════════════════════════════════
const EQ_EMPTY      = { nombre: "", cantidad: 0, max: 1, unidad: "u" };
const PRESTAMO_EMPTY = { nombre: "", cantidad: 1, unidad: "u", clienteId: "", nota: "", stockItemId: "" };

function SeccionPrestamos() {
  const { prestamos, clientes, stock, addPrestamo, updatePrestamo, deletePrestamo, updateStock, addStock, deleteStock } = useStore();

  // Catálogo de equipamiento = ítems de stock con categoria "prestamo"
  const equipo = useMemo(() => stock.filter((s) => s.categoria === "prestamo"), [stock]);

  const [modal,       setModal]   = useState(null);
  const [form,        setForm]    = useState(PRESTAMO_EMPTY);
  const [eqForm,      setEqForm]  = useState(EQ_EMPTY);
  const [errors,      setErrors]  = useState({});
  const [filterLog,   setFilterLog] = useState("entregado");

  const hoy = new Date().toISOString().split("T")[0];

  const logsFiltered = useMemo(() => {
    if (filterLog === "todos") return prestamos;
    return prestamos.filter((p) => p.estado === filterLog);
  }, [prestamos, filterLog]);

  const totalDisponible = equipo.reduce((s, e) => s + e.cantidad, 0);
  const totalEnUso      = equipo.reduce((s, e) => s + Math.max(0, e.max - e.cantidad), 0);
  const perdidos        = prestamos.filter((p) => p.estado === "perdido").length;

  const setField   = (k, v) => setForm((f)   => ({ ...f, [k]: v }));
  const setEqField = (k, v) => setEqForm((f) => ({ ...f, [k]: v }));

  // Abrir modal de préstamo pre-cargado con el ítem seleccionado
  const openPrestar = (item) => {
    setForm({ ...PRESTAMO_EMPTY, stockItemId: item.id, nombre: item.nombre, unidad: item.unidad });
    setErrors({});
    setModal("prestar");
  };

  const validatePrestamo = () => {
    const e = {};
    if (form.cantidad < 1) e.cantidad = "Mínimo 1";
    if (form.stockItemId) {
      const item = stock.find((s) => s.id === form.stockItemId);
      if (item && form.cantidad > item.cantidad)
        e.cantidad = `Disponibles: ${item.cantidad} ${item.unidad}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSavePrestamo = async () => {
    if (!validatePrestamo()) return;
    await addPrestamo({ ...form, estado: "entregado", fechaEntrega: hoy, fechaDevolucion: null });
    if (form.stockItemId) {
      const item = stock.find((s) => s.id === form.stockItemId);
      if (item) await updateStock(item.id, { cantidad: item.cantidad - Number(form.cantidad) });
    }
    setModal(null);
  };

  const handleDevolver = async (p) => {
    await updatePrestamo(p.id, { estado: "devuelto", fechaDevolucion: hoy });
    if (p.stockItemId) {
      const item = stock.find((s) => s.id === p.stockItemId);
      if (item) await updateStock(item.id, { cantidad: item.cantidad + Number(p.cantidad) });
    }
  };

  const handlePerder = (p) => updatePrestamo(p.id, { estado: "perdido" });

  const validateEq = () => {
    const e = {};
    if (!eqForm.nombre.trim())        e.nombre = "El nombre es obligatorio";
    if (!eqForm.max || eqForm.max <= 0) e.max  = "Debe ser mayor a 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveEq = () => {
    if (!validateEq()) return;
    if (modal?.mode === "eq-add") addStock({ ...eqForm, categoria: "prestamo" });
    else updateStock(modal.data.id, { ...eqForm });
    setModal(null);
  };

  return (
    <div className="inv-section">
      {/* KPIs */}
      <div className="inv-kpis-row">
        <KpiChip label="Disponibles"  val={totalDisponible} color="var(--status-ok-text)"    bg="var(--status-ok-bg)"    Icon={IcoCheck}  />
        <KpiChip label="En préstamo"  val={totalEnUso}      color="var(--status-warn-text)"  bg="var(--status-warn-bg)"  Icon={IcoUsers}  />
        <KpiChip label="Perdidos"     val={perdidos}        color="var(--status-error-text)" bg="var(--status-error-bg)" Icon={IcoX}      />
        <KpiChip label="Tipos"        val={equipo.length}   color="var(--text-secondary)"    bg="rgba(255,255,255,0.04)" Icon={IcoBox}    />
      </div>

      {/* Catálogo de equipamiento */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Equipamiento deportivo</div>
            <div className="card-sub">{equipo.length} tipos · {totalEnUso} en préstamo · {totalDisponible} disponibles</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setEqForm(EQ_EMPTY); setErrors({}); setModal({ mode: "eq-add" }); }}
          >
            + Agregar equipo
          </button>
        </div>
        <div className="stock-list">
          {equipo.length === 0 ? (
            <div className="inv-empty">No hay equipamiento registrado. Agregá pelotas, raquetas, etc.</div>
          ) : (
            equipo.map((s) => {
              const pct   = s.max > 0 ? Math.round((s.cantidad / s.max) * 100) : 0;
              const level = getStockLevel(pct);
              const { Icon } = level;
              return (
                <div key={s.id} className="stock-row">
                  <span className="stock-name">{s.nombre}</span>
                  <div className="stock-bar-bg">
                    <div className="stock-bar" style={{ "--bar-w": `${pct}%`, "--bar-c": level.color }} />
                  </div>
                  <span className="stock-qty">{s.cantidad}/{s.max} {s.unidad}</span>
                  <span className="stock-badge" style={{ "--badge-color": level.color, "--badge-bg": level.bg }}>
                    <Icon s={11} /> {level.label}
                  </span>
                  <div className="inv-actions">
                    <button
                      className="btn btn-sm btn-ok"
                      onClick={() => openPrestar(s)}
                      disabled={s.cantidad <= 0}
                    >
                      Prestar
                    </button>
                    <button className="btn btn-sm" onClick={() => { setEqForm({ ...s }); setErrors({}); setModal({ mode: "eq-edit", data: s }); }}>
                      Editar
                    </button>
                    <button className="btn btn-sm btn-icon-danger" onClick={() => setModal({ mode: "eq-delete", data: s })}>
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Historial de préstamos */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Historial de préstamos</div>
            <div className="card-sub">{prestamos.filter((p) => p.estado === "entregado").length} activos</div>
          </div>
          <div className="inv-filter-row" style={{ marginBottom: 0 }}>
            {["entregado", "devuelto", "perdido", "todos"].map((f) => (
              <button
                key={f}
                className={`pill ${filterLog === f ? "pill-active" : ""}`}
                onClick={() => setFilterLog(f)}
              >
                {f === "todos" ? "Todos" : ESTADO_CFG[f].label}
              </button>
            ))}
          </div>
        </div>
        <div className="prestamos-list">
          {logsFiltered.length === 0 ? (
            <div className="inv-empty">
              Sin préstamos {filterLog !== "todos" ? `con estado "${ESTADO_CFG[filterLog]?.label}"` : "registrados"}
            </div>
          ) : (
            logsFiltered.map((p) => {
              const cliente = clientes.find((c) => c.id === p.clienteId);
              const ec = ESTADO_CFG[p.estado ?? "entregado"];
              return (
                <div key={p.id} className="prestamo-row">
                  <span className="pre-nombre">{p.nombre}</span>
                  <span className="pre-qty">{p.cantidad} {p.unidad}</span>
                  <div className="pre-cliente">
                    <span className="pre-cliente-nombre">{cliente?.nombre ?? "—"}</span>
                    {p.nota && <span className="pre-nota">{p.nota}</span>}
                  </div>
                  <span className="pre-fecha">{p.fechaEntrega ?? "—"}</span>
                  <span className="pre-badge" style={{ "--badge-color": ec.color, "--badge-bg": ec.bg }}>
                    <ec.Icon s={11} /> {ec.label}
                  </span>
                  <div className="inv-actions">
                    {p.estado === "entregado" && (
                      <>
                        <button className="btn btn-sm btn-ok" onClick={() => handleDevolver(p)}>Devuelto</button>
                        <button className="btn btn-sm btn-icon-danger" onClick={() => handlePerder(p)}>Perdido</button>
                      </>
                    )}
                    <button className="btn btn-sm btn-icon-danger" onClick={() => setModal({ mode: "delete", data: p })}>Eliminar</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Registrar préstamo */}
      {modal === "prestar" && (
        <Modal title="Registrar préstamo" onClose={() => setModal(null)} size="sm">
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Artículo</label>
              <div className="client-readonly-box">
                <span className="client-readonly-name">{form.nombre}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Cantidad *</label>
              <input
                className={`form-input ${errors.cantidad ? "input-error" : ""}`}
                type="number" min="1"
                value={form.cantidad}
                onChange={(e) => setField("cantidad", parseInt(e.target.value) || 1)}
              />
              {errors.cantidad && <span className="form-error">{errors.cantidad}</span>}
            </div>
            <div className="form-group form-full">
              <label className="form-label">Cliente</label>
              <select className="form-input" value={form.clienteId} onChange={(e) => setField("clienteId", e.target.value)}>
                <option value="">— Sin cliente —</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="form-group form-full">
              <label className="form-label">Nota</label>
              <input
                className="form-input"
                value={form.nota}
                onChange={(e) => setField("nota", e.target.value)}
                placeholder="Opcional..."
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSavePrestamo}>Registrar préstamo</button>
          </div>
        </Modal>
      )}

      {/* Modal: Agregar / editar equipo */}
      {(modal?.mode === "eq-add" || modal?.mode === "eq-edit") && (
        <Modal
          title={modal.mode === "eq-add" ? "Agregar equipamiento" : `Editar — ${modal.data.nombre}`}
          onClose={() => setModal(null)} size="sm"
        >
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Nombre *</label>
              <input
                className={`form-input ${errors.nombre ? "input-error" : ""}`}
                value={eqForm.nombre}
                onChange={(e) => setEqField("nombre", e.target.value)}
                placeholder="Ej: Pelota de pádel"
              />
              {errors.nombre && <span className="form-error">{errors.nombre}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Disponibles</label>
              <input className="form-input" type="number" min="0" value={eqForm.cantidad}
                onChange={(e) => setEqField("cantidad", parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Total (máx) *</label>
              <input
                className={`form-input ${errors.max ? "input-error" : ""}`}
                type="number" min="1" value={eqForm.max}
                onChange={(e) => setEqField("max", parseInt(e.target.value) || 1)}
              />
              {errors.max && <span className="form-error">{errors.max}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Unidad</label>
              <select className="form-input" value={eqForm.unidad} onChange={(e) => setEqField("unidad", e.target.value)}>
                {UNIDADES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveEq}>
              {modal.mode === "eq-add" ? "Agregar" : "Actualizar"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Eliminar préstamo */}
      {modal?.mode === "delete" && (
        <Modal title="Eliminar préstamo" onClose={() => setModal(null)} size="sm">
          <p className="modal-confirm-text">
            ¿Eliminar el préstamo de <strong>{modal.data.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-delete" onClick={() => { deletePrestamo(modal.data.id); setModal(null); }}>Eliminar</button>
          </div>
        </Modal>
      )}

      {/* Modal: Eliminar equipo del catálogo */}
      {modal?.mode === "eq-delete" && (
        <Modal title="Eliminar equipamiento" onClose={() => setModal(null)} size="sm">
          <p className="modal-confirm-text">
            ¿Eliminar <strong>{modal.data.nombre}</strong> del catálogo? Esta acción no se puede deshacer.
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-delete" onClick={() => { deleteStock(modal.data.id); setModal(null); }}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 2: VENTA
// ════════════════════════════════════════════════════════════════════════════
const VENTA_EMPTY = { nombre: "", cantidad: 0, max: 100, unidad: "u", precioUnitario: 0, precioCosto: 0 };

function SeccionVenta() {
  const { stock, addStock, updateStock, deleteStock } = useStore();
  const items = useMemo(() => stock.filter((s) => s.categoria === "venta"), [stock]);

  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(VENTA_EMPTY);
  const [errors, setErrors]   = useState({});
  const [csvText, setCsvText] = useState("");

  const criticos = items.filter((s) => s.max > 0 && (s.cantidad / s.max) < 0.20);
  const bajos    = items.filter((s) => { const p = s.max > 0 ? s.cantidad / s.max : 0; return p >= 0.20 && p < 0.45; });
  const normales = items.length - criticos.length - bajos.length;

  const margenProm = useMemo(() => {
    const conMargen = items.filter((s) => s.precioUnitario > 0 && s.precioCosto > 0);
    if (!conMargen.length) return null;
    const avg = conMargen.reduce((sum, s) => sum + ((s.precioUnitario - s.precioCosto) / s.precioUnitario) * 100, 0) / conMargen.length;
    return Math.round(avg);
  }, [items]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const margen = form.precioUnitario > 0 && form.precioCosto > 0
    ? Math.round(((form.precioUnitario - form.precioCosto) / form.precioUnitario) * 100)
    : 0;

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())        e.nombre         = "El nombre es obligatorio";
    if (!form.max || form.max <= 0) e.max             = "Debe ser mayor a 0";
    if (!form.precioUnitario || form.precioUnitario <= 0)
                                    e.precioUnitario  = "El precio de venta debe ser mayor a $0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = { ...form, categoria: "venta", margen };
    if (modal?.mode === "add") addStock(data);
    else updateStock(modal.data.id, data);
    setModal(null);
  };

  const [csvImportResult, setCsvImportResult] = useState(null);
  const csvLineCount = csvText.trim().split("\n").filter((l) => l.trim()).length;

  const handleCsvImport = async () => {
    const lines = csvText.trim().split("\n").filter((l) => l.trim());
    const lineErrors = [];
    let imported = 0;
    for (let i = 0; i < lines.length; i++) {
      const [nombre, cantidad, max, unidad, precioUnitario, precioCosto] = lines[i].split(",").map((v) => v.trim());
      if (!nombre) { lineErrors.push(`Línea ${i + 1}: nombre vacío`); continue; }
      const pu  = parseFloat(precioUnitario) || 0;
      const pc  = parseFloat(precioCosto)    || 0;
      const mx  = parseInt(max);
      const qty = parseInt(cantidad);
      if (pu <= 0)       { lineErrors.push(`Línea ${i + 1} (${nombre}): precio de venta inválido`); continue; }
      if (isNaN(mx) || mx <= 0) { lineErrors.push(`Línea ${i + 1} (${nombre}): máximo inválido`); continue; }
      if (isNaN(qty) || qty < 0) { lineErrors.push(`Línea ${i + 1} (${nombre}): cantidad inválida`); continue; }
      try {
        await addStock({
          nombre, cantidad: qty, max: mx,
          unidad:         unidad || "u",
          precioUnitario: pu, precioCosto: pc,
          margen:         pu > 0 && pc > 0 ? Math.round(((pu - pc) / pu) * 100) : 0,
          categoria:      "venta",
        });
        imported++;
      } catch (_) {
        lineErrors.push(`Línea ${i + 1} (${nombre}): error al guardar`);
      }
    }
    setCsvImportResult({ imported, errors: lineErrors });
    if (lineErrors.length === 0) { setCsvText(""); setModal(null); }
  };

  return (
    <div className="inv-section">
      {/* KPIs de sección */}
      <div className="inv-kpis-row">
        <KpiChip label="Críticos" val={criticos.length} color="var(--status-error-text)" bg="var(--status-error-bg)" Icon={IcoWarning} />
        <KpiChip label="Bajos"    val={bajos.length}    color="var(--status-warn-text)"  bg="var(--status-warn-bg)"  Icon={IcoBell}    />
        <KpiChip label="Normales" val={normales}        color="var(--status-ok-text)"    bg="var(--status-ok-bg)"    Icon={IcoCheck}   />
        {margenProm !== null && (
          <KpiChip
            label="Margen prom."
            val={`${margenProm}%`}
            color={margenProm >= 30 ? "var(--status-ok-text)" : margenProm >= 10 ? "var(--status-warn-text)" : "var(--status-error-text)"}
            bg={margenProm >= 30 ? "var(--status-ok-bg)" : margenProm >= 10 ? "var(--status-warn-bg)" : "var(--status-error-bg)"}
            Icon={IcoCart}
          />
        )}
      </div>

      {/* Alertas inline */}
      {criticos.length > 0 && (
        <div className="inv-alert-danger">
          <IcoWarning s={13} />
          <strong>{criticos.length} en stock crítico:</strong>{" "}
          {criticos.slice(0, 5).map((c) => c.nombre).join(", ")}
          {criticos.length > 5 && ` y ${criticos.length - 5} más`}
        </div>
      )}
      {bajos.length > 0 && (
        <div className="inv-alert-warning">
          <IcoBell s={13} />
          <strong>{bajos.length} con stock bajo:</strong>{" "}
          {bajos.slice(0, 5).map((b) => b.nombre).join(", ")}
          {bajos.length > 5 && ` y ${bajos.length - 5} más`}
        </div>
      )}

      {/* Lista */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Productos de venta</div>
            <div className="card-sub">{items.length} productos · {criticos.length + bajos.length} con stock bajo</div>
          </div>
          <div className="inv-header-actions">
            <button className="btn" onClick={() => setModal({ mode: "csv" })}>Importar CSV</button>
            <button className="btn btn-primary" onClick={() => { setForm(VENTA_EMPTY); setErrors({}); setModal({ mode: "add" }); }}>
              + Agregar
            </button>
          </div>
        </div>
        <div className="stock-list">
          {items.length === 0 ? (
            <div className="inv-empty">No hay productos de venta registrados</div>
          ) : (
            items.map((s) => {
              const pct   = s.max > 0 ? Math.round((s.cantidad / s.max) * 100) : 0;
              const level = getStockLevel(pct);
              const { Icon } = level;
              const mg = s.margen ?? (s.precioUnitario > 0 && s.precioCosto > 0
                ? Math.round(((s.precioUnitario - s.precioCosto) / s.precioUnitario) * 100)
                : null);
              return (
                <div key={s.id} className="stock-row">
                  <span className="stock-name">{s.nombre}</span>
                  <div className="stock-bar-bg">
                    <div className="stock-bar" style={{ "--bar-w": `${pct}%`, "--bar-c": level.color }} />
                  </div>
                  <span className="stock-qty">{s.cantidad}/{s.max} {s.unidad}</span>
                  <span className="stock-precio">${(s.precioUnitario ?? 0).toLocaleString("es-AR")}</span>
                  {mg !== null && (
                    <span className="stock-margen" style={{
                      color: mg >= 30 ? "var(--status-ok-text)" : mg >= 10 ? "var(--status-warn-text)" : "var(--status-error-text)",
                    }}>
                      {mg}% margen
                    </span>
                  )}
                  <span className="stock-badge" style={{ "--badge-color": level.color, "--badge-bg": level.bg }}>
                    <Icon s={11} /> {level.label}
                  </span>
                  <div className="inv-actions">
                    <button className="btn btn-sm" onClick={() => { setForm({ ...s }); setErrors({}); setModal({ mode: "edit", data: s }); }}>
                      Editar
                    </button>
                    <button className="btn btn-sm btn-icon-danger" onClick={() => setModal({ mode: "delete", data: s })}>Eliminar</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Charts KPI — debajo de la lista */}
      <KpisInventario items={items} title="Análisis — Productos de venta" />

      {/* Modal alta/edición */}
      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <Modal
          title={modal.mode === "add" ? "Nuevo producto" : `Editar — ${modal.data.nombre}`}
          onClose={() => setModal(null)} size="sm"
        >
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Nombre *</label>
              <input
                className={`form-input ${errors.nombre ? "input-error" : ""}`}
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                placeholder="Ej: Pelota de pádel"
              />
              {errors.nombre && <span className="form-error">{errors.nombre}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Stock actual</label>
              <input className="form-input" type="number" min="0" value={form.cantidad}
                onChange={(e) => setField("cantidad", parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Máximo *</label>
              <input
                className={`form-input ${errors.max ? "input-error" : ""}`}
                type="number" min="1" value={form.max}
                onChange={(e) => setField("max", parseInt(e.target.value) || 1)}
              />
              {errors.max && <span className="form-error">{errors.max}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Unidad</label>
              <select className="form-input" value={form.unidad} onChange={(e) => setField("unidad", e.target.value)}>
                {UNIDADES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Precio de venta ($) *</label>
              <input className={`form-input ${errors.precioUnitario ? "input-error" : ""}`} type="number" min="1" value={form.precioUnitario}
                onChange={(e) => setField("precioUnitario", parseFloat(e.target.value) || 0)} />
              {errors.precioUnitario && <span className="form-error">{errors.precioUnitario}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Costo ($)</label>
              <input className="form-input" type="number" min="0" value={form.precioCosto}
                onChange={(e) => setField("precioCosto", parseFloat(e.target.value) || 0)} />
            </div>
            {margen > 0 && (
              <div className="form-group form-full">
                <div className="inv-margen-preview" style={{
                  color:      margen >= 30 ? "var(--status-ok-text)"   : margen >= 10 ? "var(--status-warn-text)"  : "var(--status-error-text)",
                  background: margen >= 30 ? "var(--status-ok-bg)"     : margen >= 10 ? "var(--status-warn-bg)"    : "var(--status-error-bg)",
                }}>
                  Margen estimado: {margen}%
                </div>
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>{modal.mode === "add" ? "Guardar" : "Actualizar"}</button>
          </div>
        </Modal>
      )}

      {/* Modal CSV */}
      {modal?.mode === "csv" && (
        <Modal title="Importar productos desde CSV" onClose={() => { setModal(null); setCsvText(""); setCsvImportResult(null); }} size="md">
          <p className="form-hint" style={{ marginBottom: 10 }}>
            Formato por línea: <code>nombre, cantidad, max, unidad, precioVenta, precioCosto</code>
          </p>
          <textarea
            className="form-input inv-csv-textarea"
            rows={8}
            placeholder={"Pelota de padel, 10, 20, u, 5000, 3500\nGrifo repuesto, 5, 10, u, 2000, 1200"}
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); setCsvImportResult(null); }}
          />
          {csvImportResult && (
            <div style={{ marginTop: 8 }}>
              {csvImportResult.imported > 0 && (
                <div className="inv-alert-ok" style={{ color: "var(--status-ok-text)", background: "var(--status-ok-bg)", padding: "6px 10px", borderRadius: 6, marginBottom: 4 }}>
                  ✓ {csvImportResult.imported} producto{csvImportResult.imported !== 1 ? "s" : ""} importado{csvImportResult.imported !== 1 ? "s" : ""} correctamente
                </div>
              )}
              {csvImportResult.errors.map((err, i) => (
                <div key={i} className="form-error" style={{ marginBottom: 2 }}>{err}</div>
              ))}
              {csvImportResult.errors.length > 0 && (
                <p className="form-hint" style={{ marginTop: 4 }}>Corregí las líneas con error y volvé a importar.</p>
              )}
            </div>
          )}
          <div className="modal-actions">
            <button className="btn" onClick={() => { setModal(null); setCsvText(""); setCsvImportResult(null); }}>Cerrar</button>
            <button className="btn btn-primary" onClick={handleCsvImport} disabled={!csvText.trim()}>
              Importar {csvLineCount > 0 ? `${csvLineCount} producto${csvLineCount !== 1 ? "s" : ""}` : ""}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal eliminar */}
      {modal?.mode === "delete" && (
        <Modal title="Eliminar producto" onClose={() => setModal(null)} size="sm">
          <p className="modal-confirm-text">¿Eliminar <strong>{modal.data.nombre}</strong>? Esta acción no se puede deshacer.</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-delete" onClick={() => { deleteStock(modal.data.id); setModal(null); }}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function TabInventario() {
  const { stock, prestamos } = useStore();
  const [tab, setTab] = useState("prestamos");

  const tabStats = useMemo(() => {
    const venta = stock.filter((s) => s.categoria === "venta");
    return {
      prePendientes: (prestamos ?? []).filter((p) => p.estado === "entregado").length,
      critVenta:     venta.filter((s) => s.max > 0 && (s.cantidad / s.max) < 0.20).length,
    };
  }, [stock, prestamos]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Inventario</div>
          <div className="page-desc">
            {stock.filter((s) => s.categoria === "venta").length} venta ·{" "}
            {stock.filter((s) => s.categoria === "prestamo").length} equipamiento ·{" "}
            {tabStats.prePendientes} préstamos activos
          </div>
        </div>
      </div>

      {/* KPI global */}
      <GlobalInvKpi stock={stock} prestamos={prestamos} onTabChange={setTab} />

      {/* Tabs */}
      <div className="inv-tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`inv-tab ${tab === id ? "inv-tab-active" : ""}`}
            onClick={() => setTab(id)}
          >
            <Icon s={14} /> {label}
            {id === "prestamos" && tabStats.prePendientes > 0 && (
              <span className="inv-tab-badge">{tabStats.prePendientes}</span>
            )}
            {id === "venta" && tabStats.critVenta > 0 && (
              <span className="inv-tab-badge inv-tab-badge-danger">{tabStats.critVenta}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "prestamos" && <SeccionPrestamos />}
      {tab === "venta"     && <SeccionVenta />}
    </div>
  );
}
