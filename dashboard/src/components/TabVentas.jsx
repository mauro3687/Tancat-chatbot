// src/components/TabVentas.jsx — Ventas de productos del inventario a clientes registrados
import { useState, useMemo } from "react";
import { useStore } from "../data/store.jsx";
import Modal from "./Modal";
import "../styles/TabVentas.css";

const METODOS      = ["Efectivo", "Transferencia", "Tarjeta", "MercadoPago"];
const ESTADOS_VENTA = ["Cobrado", "Pendiente"];

const hoy = () => new Date().toISOString().split("T")[0];

const EMPTY = {
  clienteId:      "",
  productoId:     "",
  cantidad:       1,
  fecha:          "",   // BUG-025: evaluado en openAdd con hoy(), no al cargar el módulo
  monto:          0,
  metodoPago:     "Efectivo",
  estado:         "Cobrado",
  // Campos denormalizados para display/reportes
  clienteNombre:  "",
  productoNombre: "",
  unidad:         "",
  precioUnitario: 0,
};

const fmt = (n) => `$${Number(n).toLocaleString("es-AR")}`;
const fmtFecha = (f) => {
  if (!f) return "—";
  const [y, m, d] = f.split("-");
  return `${d}/${m}/${y}`;
};
const estadoClass = { Cobrado: "s-confirmed", Pendiente: "s-pending" };

export default function TabVentas() {
  const { ventas, clientes, stock, addVenta, updateVenta, deleteVenta, updateStock } = useStore();

  const [search,       setSearch]       = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [errors,       setErrors]       = useState({});

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ventas.filter((v) =>
      ((v.clienteNombre || v.cliente || "").toLowerCase().includes(q) ||
       (v.productoNombre || v.servicio || "").toLowerCase().includes(q) ||
       (v.id || "").toLowerCase().includes(q)) &&
      (filterEstado === "" || v.estado === filterEstado)
    );
  }, [ventas, search, filterEstado]);

  const totalCobrado  = filtered.filter((v) => v.estado === "Cobrado").reduce((s, v) => s + Number(v.monto || 0), 0);
  const totalPendiente = filtered.filter((v) => v.estado === "Pendiente").reduce((s, v) => s + Number(v.monto || 0), 0);

  // ── Apertura de modales ────────────────────────────────────────────────────
  const openAdd    = () => { setForm({ ...EMPTY, fecha: hoy() }); setErrors({}); setModal({ mode: "add" }); };
  const openEdit   = (v) => { setForm({ ...EMPTY, ...v });        setErrors({}); setModal({ mode: "edit", data: v }); };
  const openDelete = (v) => setModal({ mode: "delete", data: v });
  const closeModal = () => setModal(null);
  const setField   = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Al cambiar cliente ─────────────────────────────────────────────────────
  const handleClienteChange = (e) => {
    const c = clientes.find((c) => c.id === e.target.value);
    setForm((f) => ({
      ...f,
      clienteId:     c ? c.id    : "",
      clienteNombre: c ? c.nombre : "",
    }));
  };

  // ── Al cambiar producto — recalcular monto ─────────────────────────────────
  const handleProductoChange = (e) => {
    const p = stock.find((s) => s.id === e.target.value);
    setForm((f) => ({
      ...f,
      productoId:     p ? p.id              : "",
      productoNombre: p ? p.nombre          : "",
      unidad:         p ? p.unidad          : "",
      precioUnitario: p ? (p.precioUnitario ?? 0) : 0,
      monto:          p ? (p.precioUnitario ?? 0) * f.cantidad : 0,
    }));
  };

  // ── Al cambiar cantidad — recalcular monto ─────────────────────────────────
  const handleCantidadChange = (e) => {
    const cant = Math.max(1, parseInt(e.target.value) || 1);
    setForm((f) => ({
      ...f,
      cantidad: cant,
      monto:    f.precioUnitario * cant,
    }));
  };

  // ── Validación ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.clienteId)  e.clienteId  = "Seleccioná un cliente registrado";
    if (!form.productoId) e.productoId = "Seleccioná un producto del inventario";
    if (!form.fecha)      e.fecha      = "La fecha es obligatoria";
    if (form.cantidad < 1) e.cantidad  = "La cantidad debe ser al menos 1";

    // Verificar stock disponible solo en alta
    if (modal?.mode === "add" && form.productoId) {
      const prod = stock.find((s) => s.id === form.productoId);
      if (prod && form.cantidad > prod.cantidad) {
        e.cantidad = `Stock insuficiente — solo hay ${prod.cantidad} ${prod.unidad} disponibles`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    if (modal.mode === "add") {
      // Registrar venta
      await addVenta({
        clienteId:      form.clienteId,
        clienteNombre:  form.clienteNombre,
        productoId:     form.productoId,
        productoNombre: form.productoNombre,
        cantidad:       form.cantidad,
        unidad:         form.unidad,
        precioUnitario: form.precioUnitario,
        monto:          form.monto,
        fecha:          form.fecha,
        metodoPago:     form.metodoPago,
        estado:         form.estado,
      });
      // Descontar del stock
      const prod = stock.find((s) => s.id === form.productoId);
      if (prod) {
        await updateStock(prod.id, { cantidad: prod.cantidad - form.cantidad });
      }
    } else {
      // Edición: solo permite cambiar fecha, método y estado (no cantidad/producto)
      await updateVenta(modal.data.id, {
        fecha:      form.fecha,
        metodoPago: form.metodoPago,
        estado:     form.estado,
      });
    }
    closeModal();
  };

  // ── Eliminar (restaura stock) ──────────────────────────────────────────────
  const handleDelete = async () => {
    const v = modal.data;
    await deleteVenta(v.id);
    // Restaurar unidades al stock
    if (v.productoId && v.cantidad) {
      const prod = stock.find((s) => s.id === v.productoId);
      if (prod) {
        await updateStock(prod.id, { cantidad: prod.cantidad + Number(v.cantidad) });
      } else {
        // BUG-015: producto ya no existe en inventario — advertir en consola y continuar
        console.warn(`TabVentas: no se restauró stock del producto ${v.productoId} (eliminado del inventario)`);
      }
    }
    closeModal();
  };

  // ── Producto seleccionado y stock disponible ───────────────────────────────
  const productoSeleccionado = stock.find((s) => s.id === form.productoId);
  const stockDisponible      = productoSeleccionado?.cantidad ?? 0;
  const clienteSeleccionado  = clientes.find((c) => c.id === form.clienteId);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Ventas</div>
          <div className="page-desc">{ventas.length} registros · Cobrado: {fmt(totalCobrado)}</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Registrar venta</button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card">
          <div className="metric-label">Total cobrado</div>
          <div className="kpi-value-md" style={{ '--kpi-c': 'var(--green)' }}>{fmt(totalCobrado)}</div>
        </div>
        <div className="kpi-card">
          <div className="metric-label">Pendiente de cobro</div>
          <div className="kpi-value-md" style={{ '--kpi-c': 'var(--amber)' }}>{fmt(totalPendiente)}</div>
        </div>
        <div className="kpi-card">
          <div className="metric-label">Registros (filtrados)</div>
          <div className="kpi-value-md">{filtered.length}</div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="filter-row">
          <input
            type="text"
            placeholder="Buscar por cliente o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS_VENTA.map((e) => <option key={e}>{e}</option>)}
          </select>
          <button className="btn" onClick={() => { setSearch(""); setFilterEstado(""); }}>Limpiar</button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th style={{ textAlign: "right" }}>Cant.</th>
                <th>Fecha</th>
                <th style={{ textAlign: "right" }}>P. Unit. ($)</th>
                <th style={{ textAlign: "right" }}>Total ($)</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="table-empty">No hay ventas registradas</td></tr>
              ) : filtered.map((v) => (
                <tr key={v.id}>
                  <td><span className="mono">{v.id}</span></td>
                  <td className="fw-500">{v.clienteNombre || v.cliente || "—"}</td>
                  <td>{v.productoNombre || v.servicio || "—"}</td>
                  <td style={{ textAlign: "right" }} className="c-secondary-sm">
                    {v.cantidad ?? "—"} {v.unidad ?? ""}
                  </td>
                  <td>{fmtFecha(v.fecha)}</td>
                  <td style={{ textAlign: "right" }}>{v.precioUnitario ? fmt(v.precioUnitario) : "—"}</td>
                  <td style={{ textAlign: "right" }} className="fw-600">{fmt(v.monto)}</td>
                  <td>{v.metodoPago}</td>
                  <td><span className={`status ${estadoClass[v.estado] ?? ""}`}>{v.estado}</span></td>
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

      {/* Modal Alta / Edición */}
      {(modal?.mode === "add" || modal?.mode === "edit") && (
        <Modal
          title={modal.mode === "add" ? "Registrar venta" : `Editar — ${modal.data.id}`}
          onClose={closeModal}
          size="lg"
        >
          <div className="form-grid">

            {/* Cliente */}
            <div className="form-group form-full">
              <label className="form-label">Cliente *</label>
              {modal.mode === "edit" ? (
                <div className="client-readonly-box">
                  <span className="client-readonly-name">{form.clienteNombre || "—"}</span>
                </div>
              ) : (
                <>
                  <select
                    className={`form-input ${errors.clienteId ? "input-error" : ""}`}
                    value={form.clienteId}
                    onChange={handleClienteChange}
                  >
                    <option value="">Seleccioná un cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}{c.telefono ? ` — ${c.telefono}` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.clienteId && <span className="form-error">{errors.clienteId}</span>}
                  {clienteSeleccionado && (
                    <div className="client-info-box">
                      {clienteSeleccionado.telefono && <span>📞 {clienteSeleccionado.telefono}</span>}
                      {clienteSeleccionado.email    && <span>✉ {clienteSeleccionado.email}</span>}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Producto */}
            <div className="form-group form-full">
              <label className="form-label">Producto del inventario *</label>
              {modal.mode === "edit" ? (
                <div className="client-readonly-box">
                  <span className="client-readonly-name">{form.productoNombre || "—"}</span>
                  <span>{form.cantidad} {form.unidad} × {fmt(form.precioUnitario ?? 0)}</span>
                </div>
              ) : (
                <>
                  <select
                    className={`form-input ${errors.productoId ? "input-error" : ""}`}
                    value={form.productoId}
                    onChange={handleProductoChange}
                  >
                    <option value="">Seleccioná un producto</option>
                    {stock
                      .filter((s) => s.cantidad > 0)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre.toUpperCase()} — {s.cantidad} {s.unidad} disponibles
                          {s.precioUnitario ? ` — ${fmt(s.precioUnitario)}/${s.unidad}` : " (sin precio)"}
                        </option>
                      ))}
                  </select>
                  {errors.productoId && <span className="form-error">{errors.productoId}</span>}
                  {productoSeleccionado && (
                    <div className="client-info-box">
                      <span>📦 Stock disponible: <strong>{stockDisponible} {productoSeleccionado.unidad}</strong></span>
                      {productoSeleccionado.precioUnitario
                        ? <span>💰 Precio: <strong>{fmt(productoSeleccionado.precioUnitario)}/{productoSeleccionado.unidad}</strong></span>
                        : <span style={{ color: "var(--status-warn-text)" }}>⚠ Este producto no tiene precio configurado. Editalo en Inventario.</span>
                      }
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Cantidad */}
            {modal.mode === "add" && (
              <div className="form-group">
                <label className="form-label">Cantidad *</label>
                <input
                  className={`form-input ${errors.cantidad ? "input-error" : ""}`}
                  type="number"
                  min="1"
                  max={stockDisponible || undefined}
                  value={form.cantidad}
                  onChange={handleCantidadChange}
                  disabled={!form.productoId}
                />
                {errors.cantidad && <span className="form-error">{errors.cantidad}</span>}
                {form.productoId && !errors.cantidad && (
                  <span className="form-hint">Máx. disponible: {stockDisponible} {form.unidad}</span>
                )}
              </div>
            )}

            {/* Monto (readonly, calculado) */}
            <div className="form-group">
              <label className="form-label">Total ($)</label>
              <input
                className="form-input input-readonly"
                type="text"
                value={fmt(form.monto)}
                readOnly
              />
              {modal.mode === "add" && form.precioUnitario > 0 && form.cantidad > 1 && (
                <span className="form-hint">
                  {fmt(form.precioUnitario)} × {form.cantidad} {form.unidad}
                </span>
              )}
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

            {/* Método de pago */}
            <div className="form-group">
              <label className="form-label">Método de pago</label>
              <select className="form-input" value={form.metodoPago} onChange={(e) => setField("metodoPago", e.target.value)}>
                {METODOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>

            {/* Estado */}
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-input" value={form.estado} onChange={(e) => setField("estado", e.target.value)}>
                {ESTADOS_VENTA.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={modal.mode === "add" && (!form.clienteId || !form.productoId)}
            >
              {modal.mode === "add" ? "Guardar venta" : "Actualizar"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Eliminar */}
      {modal?.mode === "delete" && (() => {
        const prodExiste = modal.data.productoId ? stock.some((s) => s.id === modal.data.productoId) : false;
        return (
        <Modal title="Eliminar venta" onClose={closeModal} size="sm">
          <p className="modal-confirm-text">
            ¿Eliminás la venta <strong>{modal.data.id}</strong> de{" "}
            <strong>{modal.data.clienteNombre || modal.data.cliente || "—"}</strong>?
            {modal.data.cantidad && modal.data.productoNombre && prodExiste && (
              <> Se restaurarán <strong>{modal.data.cantidad} {modal.data.unidad}</strong> de <strong>{modal.data.productoNombre}</strong> al inventario.</>
            )}
          </p>
          {modal.data.productoId && !prodExiste && (
            <div className="inv-alert-warning" style={{ marginBottom: 10 }}>
              ⚠ El producto <strong>{modal.data.productoNombre}</strong> ya no existe en el inventario. El stock NO se restaurará.
            </div>
          )}
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-delete" onClick={handleDelete}>Eliminar</button>
          </div>
        </Modal>
        );
      })()}
    </div>
  );
}
