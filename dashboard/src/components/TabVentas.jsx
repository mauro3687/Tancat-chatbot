// src/components/TabVentas.jsx — Registro y listado de ventas
import { useState } from "react";
import { useStore } from "../data/store.jsx";
import Modal from "./Modal";

const METODOS = ["Efectivo", "Transferencia", "Tarjeta"];
const ESTADOS_VENTA = ["Cobrado", "Seña", "Pendiente"];
const EMPTY_VENTA = { reservaId: "", cliente: "", servicio: "", fecha: "", monto: 0, metodoPago: "Efectivo", estado: "Cobrado" };

export default function TabVentas() {
  const { ventas, reservas, addVenta, updateVenta, deleteVenta } = useStore();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_VENTA);
  const [errors, setErrors] = useState({});

  const filtered = ventas.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.cliente.toLowerCase().includes(q) || v.id.toLowerCase().includes(q) || v.servicio.toLowerCase().includes(q)) &&
      (filterEstado === "" || v.estado === filterEstado)
    );
  });

  const totalCobrado = filtered.filter((v) => v.estado === "Cobrado").reduce((s, v) => s + Number(v.monto), 0);
  const totalSenas = filtered.filter((v) => v.estado === "Seña").reduce((s, v) => s + Number(v.monto), 0);

  const openAdd = () => { setForm(EMPTY_VENTA); setErrors({}); setModal({ mode: "add" }); };
  const openEdit = (v) => { setForm({ ...v }); setErrors({}); setModal({ mode: "edit", data: v }); };
  const openDelete = (v) => setModal({ mode: "delete", data: v });
  const closeModal = () => setModal(null);
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleReservaChange = (e) => {
    const r = reservas.find((r) => r.id === e.target.value);
    if (r) setForm((f) => ({ ...f, reservaId: r.id, cliente: r.cliente, servicio: r.servicio, monto: r.monto, fecha: r.fecha }));
    else setForm((f) => ({ ...f, reservaId: "", cliente: "", servicio: "" }));
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
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Ventas</div>
          <div className="page-desc">{ventas.length} registros · Total cobrado: ${totalCobrado.toLocaleString("es-AR")}</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Registrar venta</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginBottom: "1.25rem" }}>
        <div className="metric-card" style={{ padding: "0.85rem 1rem" }}>
          <div className="metric-label">Total cobrado</div>
          <div className="metric-value" style={{ fontSize: 20, color: "var(--green)" }}>${totalCobrado.toLocaleString("es-AR")}</div>
        </div>
        <div className="metric-card" style={{ padding: "0.85rem 1rem" }}>
          <div className="metric-label">Total señas</div>
          <div className="metric-value" style={{ fontSize: 20, color: "var(--amber)" }}>${totalSenas.toLocaleString("es-AR")}</div>
        </div>
        <div className="metric-card" style={{ padding: "0.85rem 1rem" }}>
          <div className="metric-label">Registros filtrados</div>
          <div className="metric-value" style={{ fontSize: 20 }}>{filtered.length}</div>
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
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "var(--gray-400)" }}>No hay ventas registradas</td></tr>
              ) : filtered.map((v) => (
                <tr key={v.id}>
                  <td><span className="mono">{v.id}</span></td>
                  <td><span className="mono">{v.reservaId || "—"}</span></td>
                  <td style={{ fontWeight: 500 }}>{v.cliente}</td>
                  <td style={{ color: "var(--gray-600)" }}>{v.servicio}</td>
                  <td>{v.fecha}</td>
                  <td style={{ fontWeight: 600 }}>${Number(v.monto).toLocaleString("es-AR")}</td>
                  <td>{v.metodoPago}</td>
                  <td><span className={`status ${estadoColor[v.estado]}`}>{v.estado}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className="btn" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => openEdit(v)}>Editar</button>
                      <button className="btn" style={{ padding: "3px 10px", fontSize: 12, color: "var(--red)", borderColor: "var(--red)" }} onClick={() => openDelete(v)}>Eliminar</button>
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
              <select className="form-input" value={form.estado} onChange={(e) => setField("estado", e.target.value)}>
                {ESTADOS_VENTA.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "1.25rem" }}>
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>{modal.mode === "add" ? "Guardar" : "Actualizar"}</button>
          </div>
        </Modal>
      )}

      {modal?.mode === "delete" && (
        <Modal title="Eliminar venta" onClose={closeModal} size="sm">
          <p style={{ color: "var(--gray-600)", marginBottom: "1rem" }}>
            ¿Eliminás el registro <strong>{modal.data.id}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn" style={{ background: "var(--red)", color: "#fff", borderColor: "var(--red)" }} onClick={() => { deleteVenta(modal.data.id); closeModal(); }}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
