// src/components/TabInventario.jsx
import "../styles/TabInventario.css";
import { useState } from "react";
import { useStore } from "../data/store.jsx";
import Modal from "./Modal";
import KpisInventario from "./KpisInventario.jsx";

// Colores semánticos con contraste verificado (WebAIM AA)
function getStockLevel(pct) {
  if (pct < 20) return { color: "#991B1B", bg: "#FEE2E2", label: "Crítico", icon: "⚠" };
  if (pct < 45) return { color: "#854D0E", bg: "#FEF9C3", label: "Bajo",    icon: "🔔" };
  return          { color: "#166534", bg: "#DCFCE7", label: "Normal",  icon: "✓" };
}
function getColor(pct) {
  return getStockLevel(pct).color;
}

const EMPTY = { nombre: "", cantidad: 0, max: 100, unidad: "u", precioUnitario: 0 };
const UNIDADES = ["u", "kg", "l", "caja"];

function StockRow({ item, onEdit, onDelete }) {
  const pct   = item.max > 0 ? Math.round((item.cantidad / item.max) * 100) : 0;
  const level = getStockLevel(pct);
  return (
    <div className="stock-row">
      <span className="stock-name">{item.nombre}</span>
      <div className="stock-bar-bg">
        <div className="stock-bar" style={{ '--bar-w': `${pct}%`, '--bar-c': level.color }} />
      </div>
      <span className="stock-qty">{item.cantidad}/{item.max} {item.unidad}</span>
      <span className="stock-precio">${(item.precioUnitario ?? 0).toLocaleString("es-AR")}</span>
      <span
        className="stock-badge"
        style={{ '--badge-color': level.color, '--badge-bg': level.bg }}
        title={`Stock ${level.label}`}
      >
        {level.icon} {level.label}
      </span>
      <div className="inv-actions">
        <button className="btn btn-sm" onClick={() => onEdit(item)}>Editar</button>
        <button className="btn btn-sm btn-icon-danger" onClick={() => onDelete(item)}>Eliminar</button>
      </div>
    </div>
  );
}

export default function TabInventario() {
  const { stock, updateStock, addStock, deleteStock } = useStore();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const criticos = stock.filter((s) => s.max > 0 && (s.cantidad / s.max) < 0.20);
  const bajos    = stock.filter((s) => { const p = s.max > 0 ? s.cantidad / s.max : 0; return p >= 0.20 && p < 0.45; });

  const openAdd  = () => { setForm(EMPTY); setErrors({}); setModal({ mode: "add" }); };
  const openEdit = (item) => { setForm({ ...item }); setErrors({}); setModal({ mode: "edit", data: item }); };
  const openDel  = (item) => setModal({ mode: "delete", data: item });
  const closeModal = () => setModal(null);
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (form.cantidad < 0) e.cantidad = "Cantidad no puede ser negativa";
    if (!form.max || form.max <= 0) e.max = "Máximo debe ser mayor a 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (modal.mode === "add") addStock(form);
    else updateStock(modal.data.id, form);
    closeModal();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Inventario</div>
          <div className="page-desc">{stock.length} productos · {criticos.length} críticos · {bajos.length} bajos</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Agregar producto</button>
      </div>

      {criticos.length > 0 && (
        <div className="inv-alert-danger">
          ⚠ <strong>{criticos.length} producto{criticos.length > 1 ? "s" : ""} en stock crítico:</strong>{" "}
          {criticos.map((c) => c.nombre).join(", ")}
        </div>
      )}
      {bajos.length > 0 && (
        <div className="inv-alert-warning">
          ℹ <strong>{bajos.length} producto{bajos.length > 1 ? "s" : ""} con stock bajo:</strong>{" "}
          {bajos.map((b) => b.nombre).join(", ")}
        </div>
      )}

      <KpisInventario stock={stock} />

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Stock de productos</div>
            <div className="card-sub">{stock.length} productos registrados</div>
          </div>
          <div className="chart-legend">
            {[
              { color: "#166534", bg: "#DCFCE7", icon: "✓",  label: "Normal"  },
              { color: "#854D0E", bg: "#FEF9C3", icon: "🔔", label: "Bajo"    },
              { color: "#991B1B", bg: "#FEE2E2", icon: "⚠",  label: "Crítico" },
            ].map(({ color, bg, icon, label }) => (
              <span key={label} className="legend-item">
                <span className="legend-badge" style={{ '--badge-color': color, '--badge-bg': bg }}>
                  {icon} {label}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="stock-list">
          {stock.map((s) => (
            <StockRow key={s.id} item={s} onEdit={openEdit} onDelete={openDel} />
          ))}
        </div>
      </div>

      {/* Modal Alta / Edición */}
      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <Modal title={modal.mode === "add" ? "Nuevo producto" : `Editar — ${modal.data.nombre}`} onClose={closeModal} size="sm">
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Nombre *</label>
              <input className={`form-input ${errors.nombre ? "input-error" : ""}`} type="text" value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} placeholder="Ej: Leña" />
              {errors.nombre && <span className="form-error">{errors.nombre}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Cantidad actual</label>
              <input className={`form-input ${errors.cantidad ? "input-error" : ""}`} type="number" min="0" value={form.cantidad} onChange={(e) => setField("cantidad", parseInt(e.target.value))} />
              {errors.cantidad && <span className="form-error">{errors.cantidad}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Máximo *</label>
              <input className={`form-input ${errors.max ? "input-error" : ""}`} type="number" min="1" value={form.max} onChange={(e) => setField("max", parseInt(e.target.value))} />
              {errors.max && <span className="form-error">{errors.max}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Unidad</label>
              <select className="form-input" value={form.unidad} onChange={(e) => setField("unidad", e.target.value)}>
                {UNIDADES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Precio unitario ($)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                value={form.precioUnitario ?? 0}
                onChange={(e) => setField("precioUnitario", parseFloat(e.target.value) || 0)}
                placeholder="Ej: 500"
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>{modal.mode === "add" ? "Guardar" : "Actualizar"}</button>
          </div>
        </Modal>
      )}

      {/* Modal Eliminar */}
      {modal?.mode === "delete" && (
        <Modal title="Eliminar producto" onClose={closeModal} size="sm">
          <p className="modal-confirm-text">
            ¿Eliminás <strong>{modal.data.nombre}</strong> del inventario? Esta acción no se puede deshacer.
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-delete" onClick={() => { deleteStock(modal.data.id); closeModal(); }}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
