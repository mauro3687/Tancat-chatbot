// src/components/TabClientes.jsx — ABM completo de clientes
import { useState, useMemo } from "react";
import { useStore } from "../data/store.jsx";
import Modal from "./Modal";
import "../styles/TabClientes.css";

const EMPTY = { nombre: "", email: "", telefono: "", ciudad: "" };

const CIUDADES = [
  "Alta Gracia", "Bell Ville", "Berrotarán", "Brinkmann", "Capilla del Monte",
  "Carlos Paz", "Carrilobo", "Córdoba", "Cosquín", "Cruz del Eje",
  "Dean Funes", "Embalse", "Huerta Grande", "Jesús María", "La Carlota",
  "La Falda", "Laboulaye", "Laguna Larga", "Las Varillas", "Leones",
  "Los Cocos", "Luque", "Marcos Juárez", "Mina Clavero", "Oncativo",
  "Pilar", "Río Cuarto", "Río Segundo", "Río Tercero", "Rufino",
  "San Francisco", "San Luis", "Santa Rosa de Calamuchita", "Unquillo",
  "Villa Allende", "Villa Carlos Paz", "Villa del Rosario", "Villa Dolores",
  "Villa General Belgrano", "Villa María",
  // Otras provincias / CABA
  "Buenos Aires", "CABA", "Mendoza", "Rosario", "Santa Fe", "Tucumán",
  "Otra",
];

export default function TabClientes() {
  const {
    clientes, addCliente, updateCliente, deleteClienteConRelaciones,
    reservas, ventas, prestamos,
    updateReserva, updateVenta,
  } = useStore();

  const [search,       setSearch]      = useState("");
  const [modal,        setModal]       = useState(null);
  const [form,         setForm]        = useState(EMPTY);
  const [errors,       setErrors]      = useState({});
  const [recuperando,  setRecuperando] = useState(false);

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.nombre || "").toLowerCase().includes(q) ||
      (c.email  || "").toLowerCase().includes(q) ||
      (c.ciudad || "").toLowerCase().includes(q) ||
      (c.telefono || "").includes(q)
    );
  });

  const openAdd    = () => { setForm(EMPTY); setErrors({}); setModal({ mode: "add" }); };
  const openEdit   = (c) => { setForm({ nombre: c.nombre, email: c.email || "", telefono: c.telefono || "", ciudad: c.ciudad || "" }); setErrors({}); setModal({ mode: "edit", data: c }); };
  const openView   = (c) => setModal({ mode: "view", data: c });
  const openDelete = (c) => setModal({ mode: "delete", data: c });
  const closeModal = () => setModal(null);
  const setField   = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const getReservasCliente = (cliente) =>
    reservas.filter((r) => r.clienteId === cliente.id);

  // ── Clientes faltantes: registros sin clienteId válido ────────────────────
  const clientesFaltantes = useMemo(() => {
    const idsValidos = new Set(clientes.map((c) => c.id));

    const resHuerfanas  = reservas.filter((r) => !r.clienteId || !idsValidos.has(r.clienteId));
    const ventHuerfanas = (ventas ?? []).filter((v) => !v.clienteId || !idsValidos.has(v.clienteId));

    const grupos = {};

    // Merge: usa el primer dato disponible de cada campo por cliente
    const mergeInfo = (grupo, src) => {
      if (!grupo.email    && src.email)    grupo.email    = src.email;
      if (!grupo.telefono && src.telefono) grupo.telefono = src.telefono;
      if (!grupo.ciudad   && src.ciudad)   grupo.ciudad   = src.ciudad;
    };

    resHuerfanas.forEach((r) => {
      const nombre = r.clienteNombre || r.cliente;
      if (!nombre) return;
      if (!grupos[nombre]) grupos[nombre] = { nombre, email: "", telefono: "", ciudad: "", reservas: [], ventas: [] };
      mergeInfo(grupos[nombre], r);
      grupos[nombre].reservas.push(r);
    });

    ventHuerfanas.forEach((v) => {
      const nombre = v.clienteNombre || v.cliente;
      if (!nombre) return;
      if (!grupos[nombre]) grupos[nombre] = { nombre, email: "", telefono: "", ciudad: "", reservas: [], ventas: [] };
      mergeInfo(grupos[nombre], v);
      grupos[nombre].ventas.push(v);
    });

    return Object.values(grupos);
  }, [clientes, reservas, ventas]);

  const handleRecuperar = async () => {
    setRecuperando(true);
    for (const grupo of clientesFaltantes) {
      const newId = await addCliente({
        nombre:   grupo.nombre,
        email:    grupo.email    || "",
        telefono: grupo.telefono || "",
        ciudad:   grupo.ciudad   || "",
        origen:   "recuperado",
      });
      for (const r of grupo.reservas) {
        await updateReserva(r.id, { clienteId: newId });
      }
      for (const v of grupo.ventas) {
        await updateVenta(v.id, { clienteId: newId, clienteNombre: grupo.nombre });
      }
    }
    setRecuperando(false);
    closeModal();
  };

  // ── Validación alta / edición ─────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (form.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido";
      else {
        const editId = modal?.mode === "edit" ? modal.data.id : null;
        const dup = clientes.find((c) => c.id !== editId && c.email?.toLowerCase() === form.email.trim().toLowerCase());
        if (dup) e.email = "Ya existe un cliente con ese email";
      }
    }
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
    deleteClienteConRelaciones(modal.data.id);
    closeModal();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Clientes</div>
          <div className="page-desc">{filtered.length} clientes registrados</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {clientesFaltantes.length > 0 && (
            <button className="btn" style={{ color: "var(--status-warn-text)", borderColor: "var(--status-warn-text)" }} onClick={() => setModal({ mode: "recuperar" })}>
              Recuperar {clientesFaltantes.length} cliente{clientesFaltantes.length !== 1 ? "s" : ""}
            </button>
          )}
          <button className="btn btn-primary" onClick={openAdd}>+ Nuevo cliente</button>
        </div>
      </div>

      <div className="card">
        <div className="filter-row">
          <input type="text" placeholder="Buscar por nombre, email, teléfono o ciudad..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                      {c.origen === "whatsapp"   && <span className="badge-wa">WA</span>}
                      {c.origen === "recuperado" && <span className="badge-rec">REC</span>}
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

      {/* Modal: Recuperar clientes faltantes */}
      {modal?.mode === "recuperar" && (
        <Modal title="Recuperar clientes faltantes" onClose={closeModal} size="lg">
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Se encontraron <strong>{clientesFaltantes.length}</strong> cliente{clientesFaltantes.length !== 1 ? "s" : ""} en reservas y ventas que no existen en el sistema. Se crearán con los datos disponibles y se vincularán a sus registros.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, maxHeight: 340, overflowY: "auto" }}>
            {clientesFaltantes.map((g) => (
              <div key={g.nombre} style={{ padding: "10px 14px", background: "var(--bg-input)", borderRadius: 8, fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span className="fw-500" style={{ flex: 1 }}>{g.nombre}</span>
                  {g.reservas.length > 0 && (
                    <span className="status s-confirmed" style={{ fontSize: 11 }}>
                      {g.reservas.length} reserva{g.reservas.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {g.ventas.length > 0 && (
                    <span className="status s-pending" style={{ fontSize: 11 }}>
                      {g.ventas.length} venta{g.ventas.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 16, color: "var(--text-muted)", fontSize: 12 }}>
                  <span>{g.email    ? `✉ ${g.email}`    : <em>sin email</em>}</span>
                  <span>{g.telefono ? `📞 ${g.telefono}` : <em>sin teléfono</em>}</span>
                  {g.ciudad && <span>📍 {g.ciudad}</span>}
                </div>
                {g.reservas.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                    {g.reservas.map((r) => (
                      <div key={r.id} style={{ fontSize: 11, color: "var(--text-muted)", paddingLeft: 8, borderLeft: "2px solid var(--border)" }}>
                        {r.servicio || r.deporte || "—"} · {r.fecha} {r.horario ? `· ${r.horario}` : ""} · ${Number(r.monto || 0).toLocaleString("es-AR")} · <em>{r.estado}</em>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button className="btn" onClick={closeModal} disabled={recuperando}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleRecuperar} disabled={recuperando}>
              {recuperando ? "Creando clientes..." : `Importar ${clientesFaltantes.length} cliente${clientesFaltantes.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Ver detalle */}
      {modal?.mode === "view" && (
        <Modal title={`Cliente — ${modal.data.nombre}`} onClose={closeModal} size="lg">
          <div className="detail-grid mb-1-25">
            {[["ID", modal.data.id], ["Nombre", modal.data.nombre], ["Email", modal.data.email || "—"], ["Teléfono", modal.data.telefono || "—"], ["Ciudad", modal.data.ciudad || "—"]].map(([k, v]) => (
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
                      <td><span className={`status ${{ Confirmada: "s-confirmed", Pendiente: "s-pending", Seña: "s-sena", Cancelada: "s-cancelled" }[r.estado] ?? ""}`}>{r.estado}</span></td>
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

      {/* Modal: Alta / Edición */}
      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <Modal title={modal.mode === "add" ? "Nuevo cliente" : `Editar — ${modal.data.nombre}`} onClose={closeModal}>
          <div className="form-grid">
            {[["nombre",   "Nombre completo *", "text",  "Juan Pérez"],
              ["email",    "Email",             "email", "juan@email.com"],
              ["telefono", "Teléfono *",        "text",  "351-000-0000"]].map(([k, label, type, ph]) => (
              <div key={k} className="form-group">
                <label className="form-label">{label}</label>
                <input className={`form-input ${errors[k] ? "input-error" : ""}`} type={type} placeholder={ph} value={form[k]} onChange={(e) => setField(k, e.target.value)} />
                {errors[k] && <span className="form-error">{errors[k]}</span>}
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Ciudad</label>
              <select
                className="form-input"
                value={form.ciudad}
                onChange={(e) => setField("ciudad", e.target.value)}
              >
                <option value="">— Seleccioná ciudad —</option>
                {CIUDADES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>{modal.mode === "add" ? "Guardar" : "Actualizar"}</button>
          </div>
        </Modal>
      )}

      {/* Modal: Eliminar */}
      {modal?.mode === "delete" && (() => {
        const id = modal.data.id;
        const cntReservas  = reservas.filter((r) => r.clienteId === id).length;
        const cntVentas    = (ventas ?? []).filter((v) => v.clienteId === id).length;
        const cntPrestamos = (prestamos ?? []).filter((p) => p.clienteId === id).length;
        const hayRelaciones = cntReservas > 0 || cntVentas > 0 || cntPrestamos > 0;
        return (
          <Modal title="Eliminar cliente" onClose={closeModal} size="sm">
            <p className="modal-confirm-text">
              ¿Eliminás a <strong>{modal.data.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            {hayRelaciones && (
              <div className="inv-alert-danger" style={{ marginBottom: 12 }}>
                ⚠ Se eliminarán también:
                <ul style={{ margin: "6px 0 0 16px", lineHeight: 1.8 }}>
                  {cntReservas  > 0 && <li><strong>{cntReservas}</strong> reserva{cntReservas !== 1 ? "s" : ""}</li>}
                  {cntVentas    > 0 && <li><strong>{cntVentas}</strong> venta{cntVentas !== 1 ? "s" : ""} (el stock se restaurará)</li>}
                  {cntPrestamos > 0 && <li><strong>{cntPrestamos}</strong> préstamo{cntPrestamos !== 1 ? "s" : ""}</li>}
                </ul>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-delete" onClick={handleDelete}>Eliminar todo</button>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
