// src/components/TabReservas.jsx — ABM completo de reservas con deportes y canchas
import { useState, useMemo } from "react";
import { useStore } from "../data/store.jsx";
import Modal from "./Modal";
import { CANCHAS, DEPORTES, DEPORTE_EMOJI, PRECIOS, LOCALES } from "../data/canchas.js";

const STATUS_CLASS = { Confirmada: "s-confirmed", Pendiente: "s-pending", Cancelada: "s-cancelled" };
const ESTADOS = ["Confirmada", "Pendiente", "Cancelada"];

const HORAS_INICIO = Array.from({ length: 14 }, (_, i) => {
  const h = 8 + i;
  return `${String(h).padStart(2, "0")}:00`;
});

const EMPTY = {
  clienteId: "", deporte: "", canchaId: "", cancha: "",
  localId: "", servicio: "", horaInicio: "", horas: 1,
  fecha: "", personas: 1, monto: 0, sena: 0, estado: "Pendiente", notas: "",
};

function formatFecha(f) {
  if (!f) return "-";
  const [y, m, d] = f.split("-");
  return `${d}/${m}/${y}`;
}
function formatMonto(m) {
  return "$" + Number(m).toLocaleString("es-AR");
}

function parseHorarioRange(h) {
  if (!h) return null;
  const parts = h.split("—").map((s) => parseInt(s.trim()));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return { inicio: parts[0], fin: parts[1] };
}

function buildHorario(horaInicio, horas) {
  if (!horaInicio) return "";
  const h = parseInt(horaInicio);
  return `${String(h).padStart(2, "0")}:00 — ${String(h + horas).padStart(2, "0")}:00`;
}

export default function TabReservas() {
  const { reservas, clientes, addReserva, updateReserva, deleteReserva, config } = useStore();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const getPrecio = (dep) => config?.precios?.[dep] ?? PRECIOS[dep] ?? 0;
  const senaPct = (config?.sena ?? 30) / 100;

  // Resuelve el nombre del cliente desde la colección clientes
  const clienteNombre = (r) => {
    if (r.clienteId) {
      const c = clientes.find((cl) => cl.id === r.clienteId);
      if (c) return c.nombre;
    }
    return r.cliente || "—"; // fallback para reservas antiguas
  };

  const filtered = reservas.filter((r) => {
    const q = search.toLowerCase();
    const nombre = clienteNombre(r).toLowerCase();
    return (
      (nombre.includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        (r.servicio || "").toLowerCase().includes(q)) &&
      (filterEstado === "" || r.estado === filterEstado)
    );
  });

  // ── Disponibilidad ─────────────────────────────────────────────────────────
  const { canchasLibres, todasOcupadas } = useMemo(() => {
    if (!form.deporte || !form.fecha || !form.horaInicio) {
      return { canchasLibres: CANCHAS.filter((c) => c.deporte === form.deporte), todasOcupadas: false };
    }
    const hInicio = parseInt(form.horaInicio);
    const nuevaRange = { inicio: hInicio, fin: hInicio + (form.horas || 1) };
    const currentId = modal?.data?.id;
    const canchasDeporte = CANCHAS.filter((c) => c.deporte === form.deporte);
    const libres = canchasDeporte.filter((cancha) => {
      const ocupada = reservas.some((r) => {
        if (r.canchaId !== cancha.id || r.fecha !== form.fecha) return false;
        if (r.estado === "Cancelada" || r.id === currentId) return false;
        const ex = parseHorarioRange(r.horario);
        return ex && ex.inicio < nuevaRange.fin && ex.fin > nuevaRange.inicio;
      });
      return !ocupada;
    });
    return { canchasLibres: libres, todasOcupadas: canchasDeporte.length > 0 && libres.length === 0 };
  }, [form.deporte, form.fecha, form.horaInicio, form.horas, reservas, modal?.data?.id]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY); setErrors({}); setModal({ mode: "add" }); };
  const openEdit = (r) => {
    const editForm = { ...EMPTY, ...r };
    if (r.horario) {
      const parts = r.horario.split("—").map((s) => s.trim());
      if (parts.length === 2) {
        editForm.horaInicio = parts[0];
        const inicio = parseInt(parts[0]);
        const fin = parseInt(parts[1]);
        editForm.horas = isNaN(inicio) || isNaN(fin) ? 1 : fin - inicio;
      }
    }
    setForm(editForm);
    setErrors({});
    setModal({ mode: "edit", data: r });
  };
  const openView = (r) => setModal({ mode: "view", data: r });
  const openDelete = (r) => setModal({ mode: "delete", data: r });
  const closeModal = () => setModal(null);
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleClienteChange = (e) => {
    setForm((f) => ({ ...f, clienteId: e.target.value }));
  };

  const handleDeporteChange = (e) => {
    const dep = e.target.value;
    const precio = getPrecio(dep);
    const monto = precio * (form.horas || 1);
    setForm((f) => ({
      ...f, deporte: dep, canchaId: "", cancha: "",
      localId: "", servicio: "", monto, sena: Math.round(monto * senaPct),
    }));
  };

  const handleCanchaChange = (e) => {
    const cancha = CANCHAS.find((c) => c.id === e.target.value);
    if (!cancha) return;
    setForm((f) => ({
      ...f,
      canchaId: cancha.id,
      cancha: cancha.nombre,
      localId: cancha.localId,
      servicio: `${DEPORTE_EMOJI[f.deporte]} ${f.deporte.charAt(0).toUpperCase() + f.deporte.slice(1)} — ${cancha.nombre}`,
      personas: cancha.capacidad,
    }));
  };

  const handleHorasChange = (newHoras) => {
    const precio = getPrecio(form.deporte);
    const monto = precio * newHoras;
    setForm((f) => ({ ...f, horas: newHoras, monto, sena: Math.round(monto * senaPct) }));
  };

  const maxHoras = form.horaInicio ? Math.min(6, 22 - parseInt(form.horaInicio)) : 6;

  const validate = () => {
    const e = {};
    if (!form.clienteId)  e.clienteId  = "Seleccioná un cliente";
    if (!form.deporte)    e.deporte    = "Seleccioná un deporte";
    if (!form.canchaId)   e.canchaId   = "Seleccioná una cancha";
    if (!form.fecha)      e.fecha      = "Ingresá una fecha";
    if (!form.horaInicio) e.horaInicio = "Seleccioná una hora de inicio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const horario = buildHorario(form.horaInicio, form.horas);
    // Solo guardamos campos limpios — sin cliente/email/telefono sueltos
    const { horaInicio, ...rest } = form;
    const savedForm = { ...rest, horario };
    if (modal.mode === "add") addReserva(savedForm);
    else updateReserva(modal.data.id, savedForm);
    closeModal();
  };

  const totales = {
    total:       filtered.length,
    confirmadas: filtered.filter((r) => r.estado === "Confirmada").length,
    pendientes:  filtered.filter((r) => r.estado === "Pendiente").length,
    canceladas:  filtered.filter((r) => r.estado === "Cancelada").length,
  };

  const canchasParaSelect = form.deporte
    ? (form.fecha && form.horaInicio ? canchasLibres : CANCHAS.filter((c) => c.deporte === form.deporte))
    : [];

  // Cliente seleccionado en el formulario
  const clienteSeleccionado = clientes.find((c) => c.id === form.clienteId);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Reservas</div>
          <div className="page-desc">
            {totales.total} reservas · {totales.confirmadas} confirmadas · {totales.pendientes} pendientes
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nueva reserva</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: "1.25rem" }}>
        {[
          { label: "Total",       val: totales.total,       color: "var(--gray-800)" },
          { label: "Confirmadas", val: totales.confirmadas, color: "var(--green)" },
          { label: "Pendientes",  val: totales.pendientes,  color: "var(--amber)" },
          { label: "Canceladas",  val: totales.canceladas,  color: "var(--red)" },
        ].map((c) => (
          <div key={c.label} className="metric-card" style={{ padding: "0.85rem 1rem" }}>
            <div className="metric-label">{c.label}</div>
            <div className="metric-value" style={{ fontSize: 22, color: c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filter-row">
          <input
            type="text"
            placeholder="Buscar por cliente, ID o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e}>{e}</option>)}
          </select>
          <button className="btn" onClick={() => { setSearch(""); setFilterEstado(""); }}>Limpiar</button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Cliente</th><th>Deporte</th><th>Cancha</th>
                <th>Fecha</th><th>Horario</th><th>Monto</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "var(--gray-400)" }}>
                    No se encontraron reservas
                  </td>
                </tr>
              ) : filtered.map((r) => (
                <tr key={r.id}>
                  <td><span className="mono">{r.id}</span></td>
                  <td style={{ fontWeight: 500 }}>{clienteNombre(r)}</td>
                  <td>{DEPORTE_EMOJI[r.deporte] || ""} {r.deporte || r.servicio}</td>
                  <td style={{ color: "var(--gray-600)", fontSize: 13 }}>{r.cancha || "—"}</td>
                  <td>{formatFecha(r.fecha)}</td>
                  <td style={{ fontSize: 12, color: "var(--gray-600)" }}>{r.horario || "—"}</td>
                  <td style={{ fontWeight: 600 }}>{formatMonto(r.monto)}</td>
                  <td><span className={`status ${STATUS_CLASS[r.estado]}`}>{r.estado}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className="btn" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => openView(r)}>Ver</button>
                      <button className="btn" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => openEdit(r)}>Editar</button>
                      <button className="btn" style={{ padding: "3px 10px", fontSize: 12, color: "var(--red)", borderColor: "var(--red)" }} onClick={() => openDelete(r)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Ver detalle ─────────────────────────────────────────────── */}
      {modal?.mode === "view" && (() => {
        const r = modal.data;
        const c = clientes.find((cl) => cl.id === r.clienteId);
        return (
          <Modal title={`Detalle — ${r.id}`} onClose={closeModal}>
            {c && (
              <div style={{
                background: "var(--accent-muted)",
                border: "1px solid var(--accent-border)",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 14,
                display: "flex",
                gap: 16,
                fontSize: 13,
              }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Cliente</span>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>
                    {c.nombre}
                    {c.origen === "whatsapp" && (
                      <span style={{ marginLeft: 7, fontSize: 10, fontWeight: 600, background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)", padding: "1px 7px", borderRadius: 20 }}>WA</span>
                    )}
                  </div>
                </div>
                {c.telefono && <div><span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Teléfono</span><div style={{ marginTop: 2 }}>{c.telefono}</div></div>}
                {c.email    && <div><span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Email</span><div style={{ marginTop: 2 }}>{c.email}</div></div>}
              </div>
            )}
            <div className="detail-grid">
              {[
                ["ID",       r.id],
                ["Deporte",  `${DEPORTE_EMOJI[r.deporte] || ""} ${r.deporte || "—"}`],
                ["Cancha",   r.cancha || "—"],
                ["Local",    LOCALES[r.localId]?.nombre || "—"],
                ["Fecha",    formatFecha(r.fecha)],
                ["Horario",  r.horario || "—"],
                ["Personas", r.personas],
                ["Monto",    formatMonto(r.monto)],
                ["Seña",     formatMonto(r.sena || 0)],
                ["Estado",   r.estado],
                ["Notas",    r.notas || "—"],
              ].map(([k, v]) => (
                <div key={k} className="detail-row">
                  <span className="detail-label">{k}</span>
                  <span className="detail-value">
                    {k === "Estado" ? <span className={`status ${STATUS_CLASS[v]}`}>{v}</span> : v}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "1.25rem" }}>
              <button className="btn" onClick={() => { closeModal(); openEdit(r); }}>Editar</button>
              <button className="btn" onClick={closeModal}>Cerrar</button>
            </div>
          </Modal>
        );
      })()}

      {/* ── Modal Alta / Edición ──────────────────────────────────────────── */}
      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <Modal
          title={modal.mode === "add" ? "Nueva reserva" : `Editar — ${modal.data.id}`}
          onClose={closeModal}
          size="lg"
        >
          <div className="form-grid">

            {/* Cliente */}
            <div className="form-group form-full">
              <label className="form-label">Cliente *</label>
              <select
                className={`form-input ${errors.clienteId ? "input-error" : ""}`}
                value={form.clienteId}
                onChange={handleClienteChange}
              >
                <option value="">Seleccioná un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}{c.telefono ? ` — ${c.telefono}` : ""}{c.origen === "whatsapp" ? " (WA)" : ""}
                  </option>
                ))}
              </select>
              {errors.clienteId && <span className="form-error">{errors.clienteId}</span>}
              {/* Info del cliente seleccionado */}
              {clienteSeleccionado && (
                <div style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  background: "var(--accent-muted)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                }}>
                  {clienteSeleccionado.telefono && <span>📞 {clienteSeleccionado.telefono}</span>}
                  {clienteSeleccionado.email    && <span>✉ {clienteSeleccionado.email}</span>}
                  {clienteSeleccionado.ciudad   && <span>📍 {clienteSeleccionado.ciudad}</span>}
                </div>
              )}
            </div>

            {/* Deporte */}
            <div className="form-group">
              <label className="form-label">Deporte *</label>
              <select
                className={`form-input ${errors.deporte ? "input-error" : ""}`}
                value={form.deporte}
                onChange={handleDeporteChange}
              >
                <option value="">Seleccioná un deporte</option>
                {DEPORTES.map((d) => (
                  <option key={d} value={d}>
                    {DEPORTE_EMOJI[d]} {d.charAt(0).toUpperCase() + d.slice(1)} — {formatMonto(getPrecio(d))}/h
                  </option>
                ))}
              </select>
              {errors.deporte && <span className="form-error">{errors.deporte}</span>}
            </div>

            {/* Fecha */}
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input
                className={`form-input ${errors.fecha ? "input-error" : ""}`}
                type="date"
                value={form.fecha}
                onChange={(e) => setField("fecha", e.target.value)}
              />
              {errors.fecha && <span className="form-error">{errors.fecha}</span>}
            </div>

            {/* Hora de inicio */}
            <div className="form-group">
              <label className="form-label">Hora de inicio *</label>
              <select
                className={`form-input ${errors.horaInicio ? "input-error" : ""}`}
                value={form.horaInicio}
                onChange={(e) => {
                  setField("horaInicio", e.target.value);
                  setField("canchaId", "");
                  setField("cancha", "");
                }}
              >
                <option value="">Seleccioná hora</option>
                {HORAS_INICIO.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              {errors.horaInicio && <span className="form-error">{errors.horaInicio}</span>}
            </div>

            {/* Duración */}
            <div className="form-group">
              <label className="form-label">Duración (horas)</label>
              <select
                className="form-input"
                value={form.horas}
                onChange={(e) => handleHorasChange(parseInt(e.target.value))}
                disabled={!form.horaInicio}
              >
                {Array.from({ length: maxHoras }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "hora" : "horas"}</option>
                ))}
              </select>
              {form.horaInicio && (
                <span style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4, display: "block" }}>
                  Turno: {buildHorario(form.horaInicio, form.horas)}
                </span>
              )}
            </div>

            {/* Cancha */}
            <div className="form-group">
              <label className="form-label">Cancha *</label>
              {todasOcupadas ? (
                <div style={{
                  background: "var(--red-light)", border: "1px solid var(--red)",
                  borderRadius: 6, padding: "8px 12px", fontSize: 13,
                  color: "var(--red)", fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
                }}>
                  ⛔ No hay canchas disponibles para ese día y horario
                </div>
              ) : (
                <select
                  className={`form-input ${errors.canchaId ? "input-error" : ""}`}
                  value={form.canchaId}
                  onChange={handleCanchaChange}
                  disabled={!form.deporte || !form.fecha || !form.horaInicio}
                >
                  <option value="">
                    {!form.deporte ? "Primero elegí un deporte"
                      : !form.fecha || !form.horaInicio ? "Primero elegí fecha y horario"
                      : "Seleccioná una cancha"}
                  </option>
                  {canchasParaSelect.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} — {LOCALES[c.localId]?.nombre || c.localId}
                    </option>
                  ))}
                </select>
              )}
              {errors.canchaId && !todasOcupadas && <span className="form-error">{errors.canchaId}</span>}
            </div>

            {/* Monto */}
            <div className="form-group">
              <label className="form-label">Monto ($)</label>
              <input
                className="form-input"
                type="number"
                value={form.monto}
                onChange={(e) => {
                  const m = parseFloat(e.target.value) || 0;
                  setForm((f) => ({ ...f, monto: m, sena: Math.round(m * senaPct) }));
                }}
              />
              {form.deporte && form.horas > 1 && (
                <span style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4, display: "block" }}>
                  {formatMonto(getPrecio(form.deporte))}/h × {form.horas}h
                </span>
              )}
            </div>

            {/* Seña */}
            <div className="form-group">
              <label className="form-label">Seña {config?.sena ?? 30}% ($)</label>
              <input
                className="form-input"
                type="number"
                value={form.sena}
                readOnly
                style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}
              />
            </div>

            {/* Estado */}
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-input" value={form.estado} onChange={(e) => setField("estado", e.target.value)}>
                {ESTADOS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>

            {/* Notas */}
            <div className="form-group form-full">
              <label className="form-label">Notas</label>
              <textarea
                className="form-input"
                rows={2}
                value={form.notas}
                onChange={(e) => setField("notas", e.target.value)}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "1.25rem" }}>
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={todasOcupadas}>
              {modal.mode === "add" ? "Guardar reserva" : "Actualizar"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal Eliminar ────────────────────────────────────────────────── */}
      {modal?.mode === "delete" && (
        <Modal title="Eliminar reserva" onClose={closeModal} size="sm">
          <p style={{ color: "var(--gray-600)", marginBottom: "1rem" }}>
            ¿Eliminás la reserva <strong>{modal.data.id}</strong> de{" "}
            <strong>{clienteNombre(modal.data)}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button
              className="btn"
              style={{ background: "var(--red)", color: "#fff", borderColor: "var(--red)" }}
              onClick={() => { deleteReserva(modal.data.id); closeModal(); }}
            >
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
