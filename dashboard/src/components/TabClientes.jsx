// src/components/TabClientes.jsx — ABM completo de clientes
import { useState } from "react";
import { useStore } from "../data/store.jsx";
import Modal from "./Modal";
import "../styles/TabClientes.css";

const EMPTY = { nombre: "", email: "", telefono: "", ciudad: "" };

export default function TabClientes() {
  const { clientes, addCliente, updateCliente, deleteCliente, reservas } = useStore();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.nombre || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.ciudad || "").toLowerCase().includes(q) ||
      (c.telefono || "").includes(q)
    );
  });

  const openAdd    = () => { setForm(EMPTY); setErrors({}); setModal({ mode: "add" }); };
  const openEdit   = (c) => { setForm({ nombre: c.nombre, email: c.email, telefono: c.telefono, ciudad: c.ciudad }); setErrors({}); setModal({ mode: "edit", data: c }); };
  const openView   = (c) => setModal({ mode: "view", data: c });
  const openDelete = (c) => setModal({ mode: "delete", data: c });
  const closeModal = () => setModal(null);
  const setField   = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const getReservasCliente = (cliente) =>
    reservas.filter((r) =>
      r.clienteId === cliente.id ||
      (r.cliente && r.cliente === cliente.nombre)
    );

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!form.email.trim()) e.email = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido";
    if (!form.telefono.trim()) e.telefono = "El teléfono es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (modal.mode === "add") addCliente(form);
    else updateCliente(modal.data.id, form);
    closeModal();
  };

  const handleDelete = () => {
    deleteCliente(modal.data.id);
    closeModal();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Clientes</div>
          <div className="page-desc">{filtered.length} clientes registrados</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nuevo cliente</button>
      </div>

      <div className="card">
        <div className="filter-row">
          <input type="text" placeholder="Buscar por nombre, email o ciudad..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn" onClick={() => setSearch("")}>Limpiar</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Ciudad</th><th>Reservas</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">No se encontraron clientes</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id}>
                  <td><span className="mono">{c.id}</span></td>
                  <td className="fw-500">
                    <div className="tc-name-cell">
                      {c.nombre}
                      {c.origen === "whatsapp" && <span className="badge-wa">WA</span>}
                    </div>
                  </td>
                  <td className="c-secondary">{c.email || "—"}</td>
                  <td>{c.telefono || "—"}</td>
                  <td>{c.ciudad || "—"}</td>
                  <td className="col-center">
                    <span className="badge-count">{getReservasCliente(c).length}</span>
                  </td>
                  <td>
                    <div className="actions-row">
                      <button className="btn btn-sm" onClick={() => openView(c)}>Ver</button>
                      <button className="btn btn-sm" onClick={() => openEdit(c)}>Editar</button>
                      <button className="btn btn-sm btn-icon-danger" onClick={() => openDelete(c)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ver detalle */}
      {modal?.mode === "view" && (
        <Modal title={`Cliente — ${modal.data.nombre}`} onClose={closeModal} size="lg">
          <div className="detail-grid mb-1-25">
            {[["ID", modal.data.id], ["Nombre", modal.data.nombre], ["Email", modal.data.email], ["Teléfono", modal.data.telefono], ["Ciudad", modal.data.ciudad]].map(([k, v]) => (
              <div key={k} className="detail-row"><span className="detail-label">{k}</span><span className="detail-value">{v}</span></div>
            ))}
          </div>
          <div className="card-title mb-10">Historial de reservas</div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Servicio</th><th>Fecha</th><th>Monto</th><th>Estado</th></tr></thead>
              <tbody>
                {getReservasCliente(modal.data).length === 0
                  ? <tr><td colSpan={5} className="table-empty">Sin reservas</td></tr>
                  : getReservasCliente(modal.data).map((r) => (
                    <tr key={r.id}>
                      <td><span className="mono">{r.id}</span></td>
                      <td>{r.servicio}</td>
                      <td>{r.fecha}</td>
                      <td>${Number(r.monto).toLocaleString("es-AR")}</td>
                      <td><span className={`status ${{ Confirmada: "s-confirmed", Pendiente: "s-pending", Cancelada: "s-cancelled" }[r.estado]}`}>{r.estado}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="modal-actions-sm">
            <button className="btn" onClick={() => { closeModal(); openEdit(modal.data); }}>Editar</button>
            <button className="btn" onClick={closeModal}>Cerrar</button>
          </div>
        </Modal>
      )}

      {/* Alta / Edición */}
      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <Modal title={modal.mode === "add" ? "Nuevo cliente" : `Editar — ${modal.data.nombre}`} onClose={closeModal}>
          <div className="form-grid">
            {[["nombre", "Nombre completo *", "text", "Juan Pérez"],
              ["email", "Email *", "email", "juan@email.com"],
              ["telefono", "Teléfono *", "text", "351-000-0000"],
              ["ciudad", "Ciudad", "text", "Córdoba"]].map(([k, label, type, ph]) => (
              <div key={k} className="form-group">
                <label className="form-label">{label}</label>
                <input className={`form-input ${errors[k] ? "input-error" : ""}`} type={type} placeholder={ph} value={form[k]} onChange={(e) => setField(k, e.target.value)} />
                {errors[k] && <span className="form-error">{errors[k]}</span>}
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>{modal.mode === "add" ? "Guardar" : "Actualizar"}</button>
          </div>
        </Modal>
      )}

      {/* Eliminar */}
      {modal?.mode === "delete" && (
        <Modal title="Eliminar cliente" onClose={closeModal} size="sm">
          <p className="modal-confirm-text">
            ¿Eliminás a <strong>{modal.data.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-delete" onClick={handleDelete}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
