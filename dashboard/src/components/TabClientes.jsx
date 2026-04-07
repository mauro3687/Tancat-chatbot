// src/components/TabClientes.jsx — ABM completo de clientes
import { useState } from "react";
import { useStore } from "../data/store.jsx";
import Modal from "./Modal";

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

  const openAdd = () => { setForm(EMPTY); setErrors({}); setModal({ mode: "add" }); };
  const openEdit = (c) => { setForm({ nombre: c.nombre, email: c.email, telefono: c.telefono, ciudad: c.ciudad }); setErrors({}); setModal({ mode: "edit", data: c }); };
  const openView = (c) => setModal({ mode: "view", data: c });
  const openDelete = (c) => setModal({ mode: "delete", data: c });
  const closeModal = () => setModal(null);
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const getReservasCliente = (clienteId) => reservas.filter((r) => r.clienteId === clienteId);

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
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--gray-400)" }}>No se encontraron clientes</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id}>
                  <td><span className="mono">{c.id}</span></td>
                  <td style={{ fontWeight: 500 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      {c.nombre}
                      {c.origen === "whatsapp" && (
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          background: "rgba(37,211,102,0.12)",
                          color: "#25D366",
                          border: "1px solid rgba(37,211,102,0.25)",
                          padding: "1px 7px", borderRadius: 20,
                        }}>WA</span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: "var(--gray-600)" }}>{c.email || "—"}</td>
                  <td>{c.telefono || "—"}</td>
                  <td>{c.ciudad || "—"}</td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ background: "var(--blue-light)", color: "var(--blue)", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {getReservasCliente(c.id).length}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className="btn" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => openView(c)}>Ver</button>
                      <button className="btn" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => openEdit(c)}>Editar</button>
                      <button className="btn" style={{ padding: "3px 10px", fontSize: 12, color: "var(--red)", borderColor: "var(--red)" }} onClick={() => openDelete(c)}>Eliminar</button>
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
          <div className="detail-grid" style={{ marginBottom: "1.25rem" }}>
            {[["ID", modal.data.id], ["Nombre", modal.data.nombre], ["Email", modal.data.email], ["Teléfono", modal.data.telefono], ["Ciudad", modal.data.ciudad]].map(([k, v]) => (
              <div key={k} className="detail-row"><span className="detail-label">{k}</span><span className="detail-value">{v}</span></div>
            ))}
          </div>
          <div className="card-title" style={{ marginBottom: 10 }}>Historial de reservas</div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Servicio</th><th>Fecha</th><th>Monto</th><th>Estado</th></tr></thead>
              <tbody>
                {getReservasCliente(modal.data.id).length === 0
                  ? <tr><td colSpan={5} style={{ textAlign: "center", padding: "1rem", color: "var(--gray-400)" }}>Sin reservas</td></tr>
                  : getReservasCliente(modal.data.id).map((r) => (
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
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "1rem" }}>
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
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "1.25rem" }}>
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>{modal.mode === "add" ? "Guardar" : "Actualizar"}</button>
          </div>
        </Modal>
      )}

      {/* Eliminar */}
      {modal?.mode === "delete" && (
        <Modal title="Eliminar cliente" onClose={closeModal} size="sm">
          <p style={{ color: "var(--gray-600)", marginBottom: "1rem" }}>
            ¿Eliminás a <strong>{modal.data.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn" style={{ background: "var(--red)", color: "#fff", borderColor: "var(--red)" }} onClick={handleDelete}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
