// src/components/TabReservas.jsx — ABM completo de reservas con deportes y canchas
import { useState } from "react";
import { useStore } from "../data/store.jsx";
import Modal from "./Modal";
import { CANCHAS, DEPORTES, DEPORTE_EMOJI, PRECIOS, HORARIOS, LOCALES } from "../data/canchas.js";

const STATUS_CLASS = { Confirmada: "s-confirmed", Pendiente: "s-pending", Cancelada: "s-cancelled" };
const ESTADOS = ["Confirmada", "Pendiente", "Cancelada"];

const EMPTY = {
  clienteId: "", cliente: "", deporte: "", canchaId: "", cancha: "",
  localId: "", servicio: "", horario: "", fecha: "", personas: 1,
  monto: 0, sena: 0, estado: "Pendiente", notas: "",
  email: "", telefono: "",
};

function formatFecha(f) {
  if (!f) return "-";
  const [y, m, d] = f.split("-");
  return `${d}/${m}/${y}`;
}
function formatMonto(m) {
  return "$" + Number(m).toLocaleString("es-AR");
}

export default function TabReservas() {
  const { reservas, clientes, addReserva, updateReserva, deleteReserva } = useStore();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const filtered = reservas.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.cliente.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q) || (r.servicio||"").toLowerCase().includes(q)) &&
      (filterEstado === "" || r.estado === filterEstado)
    );
  });

  const openAdd  = () => { setForm(EMPTY); setErrors({}); setModal({ mode: "add" }); };
  const openEdit = (r) => { setForm({ ...EMPTY, ...r }); setErrors({}); setModal({ mode: "edit", data: r }); };
  const openView = (r) => setModal({ mode: "view", data: r });
  const openDelete = (r) => setModal({ mode: "delete", data: r });
  const closeModal = () => setModal(null);
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Cuando cambia el cliente
  const handleClienteChange = (e) => {
    const c = clientes.find((cl) => cl.id === e.target.value);
    setForm((f) => ({ ...f, clienteId: e.target.value, cliente: c ? c.nombre : "" }));
  };

  // Cuando cambia el deporte → limpiar cancha y actualizar precio/personas
  const handleDeporteChange = (e) => {
    const dep = e.target.value;
    const precio = PRECIOS[dep] || 0;
    const sena = Math.round(precio * 0.30);
    setForm((f) => ({
      ...f,
      deporte: dep,
      canchaId: "",
      cancha: "",
      localId: "",
      servicio: "",
      monto: precio,
      sena,
    }));
  };

  // Cuando cambia la cancha
  const handleCanchaChange = (e) => {
    const cancha = CANCHAS.find((c) => c.id === e.target.value);
    if (!cancha) return;
    const local = LOCALES[cancha.localId];
    setForm((f) => ({
      ...f,
      canchaId: cancha.id,
      cancha: cancha.nombre,
      localId: cancha.localId,
      servicio: `${DEPORTE_EMOJI[f.deporte]} ${f.deporte.charAt(0).toUpperCase()+f.deporte.slice(1)} — ${cancha.nombre}`,
      personas: cancha.capacidad,
    }));
  };

  // Canchas disponibles para el deporte seleccionado
  const canchasDeporte = form.deporte
    ? CANCHAS.filter((c) => c.deporte === form.deporte)
    : [];

  const validate = () => {
    const e = {};
    if (!form.clienteId) e.clienteId = "Seleccioná un cliente";
    if (!form.deporte)   e.deporte   = "Seleccioná un deporte";
    if (!form.canchaId)  e.canchaId  = "Seleccioná una cancha";
    if (!form.fecha)     e.fecha     = "Ingresá una fecha";
    if (!form.horario)   e.horario   = "Seleccioná un horario";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (modal.mode === "add") addReserva(form);
    else updateReserva(modal.data.id, form);
    closeModal();
  };

  const totales = {
    total: filtered.length,
    confirmadas: filtered.filter((r) => r.estado === "Confirmada").length,
    pendientes:  filtered.filter((r) => r.estado === "Pendiente").length,
    canceladas:  filtered.filter((r) => r.estado === "Cancelada").length,
  };

  return (
    <div>
      <div className="page-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div className="page-title">Reservas</div>
          <div className="page-desc">{totales.total} reservas · {totales.confirmadas} confirmadas · {totales.pendientes} pendientes</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nueva reserva</button>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10, marginBottom:"1.25rem" }}>
        {[
          { label:"Total",       val:totales.total,       color:"var(--gray-800)" },
          { label:"Confirmadas", val:totales.confirmadas, color:"var(--green)" },
          { label:"Pendientes",  val:totales.pendientes,  color:"var(--amber)" },
          { label:"Canceladas",  val:totales.canceladas,  color:"var(--red)" },
        ].map((c) => (
          <div key={c.label} className="metric-card" style={{ padding:"0.85rem 1rem" }}>
            <div className="metric-label">{c.label}</div>
            <div className="metric-value" style={{ fontSize:22, color:c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filter-row">
          <input type="text" placeholder="Buscar por cliente, ID o servicio..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <tr><td colSpan={9} style={{ textAlign:"center", padding:"2rem", color:"var(--gray-400)" }}>No se encontraron reservas</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id}>
                  <td><span className="mono">{r.id}</span></td>
                  <td style={{ fontWeight:500 }}>{r.cliente}</td>
                  <td>{DEPORTE_EMOJI[r.deporte] || ""} {r.deporte || r.servicio}</td>
                  <td style={{ color:"var(--gray-600)", fontSize:13 }}>{r.cancha || "—"}</td>
                  <td>{formatFecha(r.fecha)}</td>
                  <td style={{ fontSize:12, color:"var(--gray-600)" }}>{r.horario || "—"}</td>
                  <td style={{ fontWeight:600 }}>{formatMonto(r.monto)}</td>
                  <td><span className={`status ${STATUS_CLASS[r.estado]}`}>{r.estado}</span></td>
                  <td>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn" style={{ padding:"3px 10px", fontSize:12 }} onClick={() => openView(r)}>Ver</button>
                      <button className="btn" style={{ padding:"3px 10px", fontSize:12 }} onClick={() => openEdit(r)}>Editar</button>
                      <button className="btn" style={{ padding:"3px 10px", fontSize:12, color:"var(--red)", borderColor:"var(--red)" }} onClick={() => openDelete(r)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ver detalle */}
      {modal?.mode === "view" && (
        <Modal title={`Detalle — ${modal.data.id}`} onClose={closeModal}>
          <div className="detail-grid">
            {[
              ["ID",       modal.data.id],
              ["Cliente",  modal.data.cliente],
              ["Deporte",  `${DEPORTE_EMOJI[modal.data.deporte]||""} ${modal.data.deporte||"—"}`],
              ["Cancha",   modal.data.cancha || "—"],
              ["Local",    LOCALES[modal.data.localId]?.nombre || "—"],
              ["Fecha",    formatFecha(modal.data.fecha)],
              ["Horario",  modal.data.horario || "—"],
              ["Personas", modal.data.personas],
              ["Monto",    formatMonto(modal.data.monto)],
              ["Seña",     formatMonto(modal.data.sena||0)],
              ["Estado",   modal.data.estado],
              ["Notas",    modal.data.notas || "—"],
            ].map(([k, v]) => (
              <div key={k} className="detail-row">
                <span className="detail-label">{k}</span>
                <span className="detail-value">
                  {k === "Estado" ? <span className={`status ${STATUS_CLASS[v]}`}>{v}</span> : v}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:"1.25rem" }}>
            <button className="btn" onClick={() => { closeModal(); openEdit(modal.data); }}>Editar</button>
            <button className="btn" onClick={closeModal}>Cerrar</button>
          </div>
        </Modal>
      )}

      {/* Modal Alta / Edición */}
      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <Modal title={modal.mode === "add" ? "Nueva reserva" : `Editar — ${modal.data.id}`} onClose={closeModal} size="lg">
          <div className="form-grid">

            {/* Cliente */}
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <select className={`form-input ${errors.clienteId?"input-error":""}`} value={form.clienteId} onChange={handleClienteChange}>
                <option value="">Seleccioná un cliente</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              {errors.clienteId && <span className="form-error">{errors.clienteId}</span>}
            </div>

            {/* Deporte */}
            <div className="form-group">
              <label className="form-label">Deporte *</label>
              <select className={`form-input ${errors.deporte?"input-error":""}`} value={form.deporte} onChange={handleDeporteChange}>
                <option value="">Seleccioná un deporte</option>
                {DEPORTES.map((d) => (
                  <option key={d} value={d}>
                    {DEPORTE_EMOJI[d]} {d.charAt(0).toUpperCase()+d.slice(1)} — {formatMonto(PRECIOS[d])}
                  </option>
                ))}
              </select>
              {errors.deporte && <span className="form-error">{errors.deporte}</span>}
            </div>

            {/* Cancha — solo se habilita si hay deporte seleccionado */}
            <div className="form-group">
              <label className="form-label">Cancha *</label>
              <select
                className={`form-input ${errors.canchaId?"input-error":""}`}
                value={form.canchaId}
                onChange={handleCanchaChange}
                disabled={!form.deporte}
              >
                <option value="">{form.deporte ? "Seleccioná una cancha" : "Primero elegí un deporte"}</option>
                {canchasDeporte.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} — {LOCALES[c.localId]?.nombre || c.localId}
                  </option>
                ))}
              </select>
              {errors.canchaId && <span className="form-error">{errors.canchaId}</span>}
            </div>

            {/* Fecha */}
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input className={`form-input ${errors.fecha?"input-error":""}`} type="date" value={form.fecha} onChange={(e) => setField("fecha", e.target.value)} />
              {errors.fecha && <span className="form-error">{errors.fecha}</span>}
            </div>

            {/* Horario */}
            <div className="form-group">
              <label className="form-label">Horario *</label>
              <select className={`form-input ${errors.horario?"input-error":""}`} value={form.horario} onChange={(e) => setField("horario", e.target.value)}>
                <option value="">Seleccioná un horario</option>
                {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              {errors.horario && <span className="form-error">{errors.horario}</span>}
            </div>

            {/* Monto */}
            <div className="form-group">
              <label className="form-label">Monto ($)</label>
              <input className="form-input" type="number" value={form.monto} onChange={(e) => {
                const m = parseFloat(e.target.value)||0;
                setForm((f) => ({ ...f, monto: m, sena: Math.round(m*0.30) }));
              }} />
            </div>

            {/* Seña (calculada automáticamente) */}
            <div className="form-group">
              <label className="form-label">Seña 30% ($)</label>
              <input className="form-input" type="number" value={form.sena} readOnly
                style={{ background:"var(--gray-100)", color:"var(--gray-600)" }} />
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
              <textarea className="form-input" rows={2} value={form.notas} onChange={(e) => setField("notas", e.target.value)} placeholder="Observaciones adicionales..." />
            </div>
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:"1.25rem" }}>
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {modal.mode === "add" ? "Guardar reserva" : "Actualizar"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Eliminar */}
      {modal?.mode === "delete" && (
        <Modal title="Eliminar reserva" onClose={closeModal} size="sm">
          <p style={{ color:"var(--gray-600)", marginBottom:"1rem" }}>
            ¿Eliminás la reserva <strong>{modal.data.id}</strong> de <strong>{modal.data.cliente}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn" style={{ background:"var(--red)", color:"#fff", borderColor:"var(--red)" }}
              onClick={() => { deleteReserva(modal.data.id); closeModal(); }}>
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
