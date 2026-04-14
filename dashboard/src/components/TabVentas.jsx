// src/components/TabVentas.jsx — Registro y listado de ventas
import { useState } from "react";
import { useStore } from "../data/store.jsx";
import Modal from "./Modal";
import "../styles/TabVentas.css";

const METODOS = ["Efectivo", "Transferencia", "Tarjeta"];
const ESTADOS_VENTA = ["Cobrado", "Seña", "Pendiente"];
const EMPTY_VENTA = { reservaId: "", cliente: "", servicio: "", fecha: "", monto: 0, metodoPago: "Efectivo", estado: "Cobrado" };

function calcMonto(montoReserva, estado, senaPct) {
  if (estado === "Pendiente") return 0;
  if (estado === "Seña")     return Math.round(montoReserva * senaPct);
  return montoReserva; // Cobrado
}

export default function TabVentas() {
  const { ventas, reservas, addVenta, updateVenta, deleteVenta, config } = useStore();
  const senaPct = (config?.sena ?? 30) / 100;

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_VENTA);
  const [errors, setErrors] = useState({});

  const filtered = ventas.filter((v) => {
    const q = search.toLowerCase();
    return (
      ((v.cliente || "").toLowerCase().includes(q) ||
       (v.id || "").toLowerCase().includes(q) ||
       (v.servicio || "").toLowerCase().includes(q)) &&
      (filterEstado === "" || v.estado === filterEstado)
    );
  });

  const totalCobrado = filtered.filter((v) => v.estado === "Cobrado").reduce((s, v) => s + Number(v.monto), 0);
  const totalSenas   = filtered.filter((v) => v.estado === "Seña").reduce((s, v) => s + Number(v.monto), 0);

  const openAdd    = () => { setForm(EMPTY_VENTA); setErrors({}); setModal({ mode: "add" }); };
  const openEdit   = (v) => { setForm({ ...v }); setErrors({}); setModal({ mode: "edit", data: v }); };
  const openDelete = (v) => setModal({ mode: "delete", data: v });
  const closeModal = () => setModal(null);
  const setField   = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleReservaChange = (e) => {
    const r = reservas.find((r) => r.id === e.target.value);
    if (r) setForm((f) => ({ ...f, reservaId: r.id, cliente: r.cliente, servicio: r.servicio, fecha: r.fecha, monto: calcMonto(r.monto, f.estado, senaPct) }));
    else setForm((f) => ({ ...f, reservaId: "", cliente: "", servicio: "" }));
  };

  const handleEstadoChange = (e) => {
    const nuevoEstado = e.target.value;
    setForm((f) => {
      const r = f.reservaId ? reservas.find((r) => r.id === f.reservaId) : null;
      return { ...f, estado: nuevoEstado, monto: r ? calcMonto(r.monto, nuevoEstado, senaPct) : f.monto };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.cliente.trim()) e.cliente = "El cliente es obligatorio";
    if (!form.fecha) e.fecha = "La fecha es obligatoria";
    if (!form.monto || form.monto <= 0) e.monto = "El monto debe ser mayor a 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (modal.mode === "add") addVenta(form);
    else updateVenta(modal.data.id, form);
    closeModal();
  };

  const estadoColor = { Cobrado: "s-confirmed", Seña: "s-pending", Pendiente: "s-cancelled" };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Ventas</div>
          <div className="page-desc">{ventas.length} registros · Total cobrado: ${totalCobrado.toLocaleString("es-AR")}</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Registrar venta</button>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card">
          <div className="metric-label">Total cobrado</div>
          <div className="kpi-value-md" style={{ '--kpi-c': 'var(--green)' }}>${totalCobrado.toLocaleString("es-AR")}</div>
        </div>
        <div className="kpi-card">
          <div className="metric-label">Total señas</div>
          <div className="kpi-value-md" style={{ '--kpi-c': 'var(--amber)' }}>${totalSenas.toLocaleString("es-AR")}</div>
        </div>
        <div className="kpi-card">
          <div className="metric-label">Registros filtrados</div>
          <div className="kpi-value-md">{filtered.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="filter-row">
          <input type="text" placeholder="Buscar por cliente, ID o servicio..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS_VENTA.map((e) => <option key={e}>{e}</option>)}
          </select>
          <button className="btn" onClick={() => { setSearch(""); setFilterEstado(""); }}>Limpiar</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>Reserva</th><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Monto</th><th>Método</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-empty">No hay ventas registradas</td></tr>
              ) : filtered.map((v) => (
                <tr key={v.id}>
                  <td><span className="mono">{v.id}</span></td>
                  <td><span className="mono">{v.reservaId || "—"}</span></td>
                  <td className="fw-500">{v.cliente}</td>
                  <td className="c-secondary">{v.servicio}</td>
                  <td>{v.fecha}</td>
                  <td className="fw-600">${Number(v.monto).toLocaleString("es-AR")}</td>
                  <td>{v.metodoPago}</td>
                  <td><span className={`status ${estadoColor[v.estado]}`}>{v.estado}</span></td>
                  <td>
                    <div className="actions-row">
                      <button className="btn btn-sm" onClick={() => openEdit(v)}>Editar</button>
                      <button className="btn btn-sm btn-icon-danger" onClick={() => openDelete(v)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <Modal title={modal.mode === "add" ? "Registrar venta" : `Editar — ${modal.data.id}`} onClose={closeModal} size="lg">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Reserva vinculada</label>
              <select className="form-input" value={form.reservaId} onChange={handleReservaChange}>
                <option value="">Sin reserva vinculada</option>
                {reservas.map((r) => <option key={r.id} value={r.id}>{r.id} — {r.cliente}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <input className={`form-input ${errors.cliente ? "input-error" : ""}`} type="text" value={form.cliente} onChange={(e) => setField("cliente", e.target.value)} placeholder="Nombre del cliente" />
              {errors.cliente && <span className="form-error">{errors.cliente}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Servicio</label>
              <input className="form-input" type="text" value={form.servicio} onChange={(e) => setField("servicio", e.target.value)} placeholder="Servicio prestado" />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input className={`form-input ${errors.fecha ? "input-error" : ""}`} type="date" value={form.fecha} onChange={(e) => setField("fecha", e.target.value)} />
              {errors.fecha && <span className="form-error">{errors.fecha}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Monto ($) *</label>
              <input className={`form-input ${errors.monto ? "input-error" : ""}`} type="number" value={form.monto} onChange={(e) => setField("monto", parseFloat(e.target.value))} />
              {errors.monto && <span className="form-error">{errors.monto}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Método de pago</label>
              <select className="form-input" value={form.metodoPago} onChange={(e) => setField("metodoPago", e.target.value)}>
                {METODOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-input" value={form.estado} onChange={handleEstadoChange}>
                {ESTADOS_VENTA.map((e) => <option key={e}>{e}</option>)}
              </select>
              {form.reservaId && (
                <span className="form-hint">
                  {form.estado === "Cobrado"  && `Monto total de la reserva`}
                  {form.estado === "Seña"     && `${config?.sena ?? 30}% de seña`}
                  {form.estado === "Pendiente" && `Sin cobro aún — monto $0`}
                </span>
              )}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>{modal.mode === "add" ? "Guardar" : "Actualizar"}</button>
          </div>
        </Modal>
      )}

      {modal?.mode === "delete" && (
        <Modal title="Eliminar venta" onClose={closeModal} size="sm">
          <p className="modal-confirm-text">
            ¿Eliminás el registro <strong>{modal.data.id}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-delete" onClick={() => { deleteVenta(modal.data.id); closeModal(); }}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
