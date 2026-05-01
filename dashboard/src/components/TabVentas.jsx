// src/components/TabVentas.jsx — Ventas de productos del inventario a clientes registrados
import { useState, useMemo, Fragment } from "react";
import { useStore } from "../data/store.jsx";
import Modal from "./Modal";
import "../styles/TabVentas.css";

const METODOS       = ["Efectivo", "Transferencia", "Tarjeta", "MercadoPago"];
const ESTADOS_VENTA = ["Cobrado", "Pendiente"];

const RECIBO_EMPTY = {
  clienteId: "", clienteNombre: "",
  lineas: [],
  metodoPago: "Efectivo",
  estado: "Cobrado",
};
const LINEA_CONSUMIBLE_EMPTY = { productoId: "", nombre: "", cantidad: 1, precioUnitario: 0, monto: 0, unidad: "u" };

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
  const { ventas, clientes, stock, reservas, prestamos, addVenta, updateVenta, deleteVenta, updateStock } = useStore();

  const [search,       setSearch]       = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [errors,       setErrors]       = useState({});

  // ── Estado del recibo ──────────────────────────────────────────────────────
  const [recibo,            setRecibo]            = useState(null);
  const [reciboForm,        setReciboForm]        = useState(RECIBO_EMPTY);
  const [reciboLineas,      setReciboLineas]      = useState([]); // consumibles (existentes + nuevos)
  const [reciboReservas,    setReciboReservas]    = useState([]); // { ...reserva, incluido: true }
  const [reciboPrestamos,   setReciboPrestamos]   = useState([]); // { ...prestamo, incluido: true, monto: 0 }
  const [expandedId,        setExpandedId]        = useState(null);

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

  // ── Helpers de recibo ──────────────────────────────────────────────────────
  const openRecibo = () => {
    setReciboForm(RECIBO_EMPTY);
    setReciboLineas([{ ...LINEA_CONSUMIBLE_EMPTY }]);
    setReciboReservas([]);
    setReciboPrestamos([]);
    setRecibo("open");
  };

  // Al cambiar cliente, carga automáticamente sus reservas, ventas y préstamos
  const handleReciboClienteChange = (e) => {
    const cid = e.target.value;
    const c   = clientes.find((cl) => cl.id === cid);
    setReciboForm((f) => ({ ...f, clienteId: cid, clienteNombre: c ? c.nombre : "" }));

    if (!cid) {
      setReciboReservas([]);
      setReciboLineas([{ ...LINEA_CONSUMIBLE_EMPTY }]);
      setReciboPrestamos([]);
      return;
    }

    // Reservas activas del cliente → todas pre-seleccionadas
    const resCliente = reservas
      .filter((r) => r.clienteId === cid && r.estado !== "Cancelada")
      .map((r) => ({ ...r, incluido: true }));
    setReciboReservas(resCliente);

    // Ventas ya registradas del cliente (no recibos) → pre-cargadas como líneas
    const ventasCliente = (ventas ?? [])
      .filter((v) => v.clienteId === cid && v.tipo !== "recibo")
      .map((v) => ({
        productoId:     v.productoId     || "",
        nombre:         v.productoNombre || v.servicio || "",
        cantidad:       v.cantidad       || 1,
        precioUnitario: v.precioUnitario || 0,
        monto:          Number(v.monto)  || 0,
        unidad:         v.unidad         || "u",
        fromVenta:      true,
        ventaId:        v.id,
        incluido:       true,
      }));

    // Préstamos activos del cliente → pre-cargados
    const presCliente = (prestamos ?? [])
      .filter((p) => p.clienteId === cid && p.estado === "entregado")
      .map((p) => ({
        prestamoId:  p.id,
        nombre:      p.nombre,
        cantidad:    p.cantidad,
        unidad:      p.unidad || "u",
        monto:       0,
        fromPrestamo: true,
        incluido:    true,
      }));

    setReciboLineas([...ventasCliente, { ...LINEA_CONSUMIBLE_EMPTY }]);
    setReciboPrestamos(presCliente);
  };

  const toggleReserva     = (id) => setReciboReservas((prev) => prev.map((r) => r.id === id ? { ...r, incluido: !r.incluido } : r));
  const toggleLinea       = (i)  => setReciboLineas((prev)   => prev.map((l, idx) => idx === i ? { ...l, incluido: !l.incluido } : l));
  const togglePrestamo    = (i)  => setReciboPrestamos((prev) => prev.map((p, idx) => idx === i ? { ...p, incluido: !p.incluido } : p));

  const addLineaConsumo = () =>
    setReciboLineas((prev) => [...prev, { ...LINEA_CONSUMIBLE_EMPTY }]);

  const addLineaPrestamo = () =>
    setReciboPrestamos((prev) => [...prev, { prestamoId: null, nombre: "", cantidad: 1, unidad: "u", monto: 0, fromPrestamo: false, incluido: true }]);

  const removeLinea    = (i) => setReciboLineas((prev)    => prev.filter((_, idx) => idx !== i));
  const removePrestamo = (i) => setReciboPrestamos((prev) => prev.filter((_, idx) => idx !== i));

  const updateLinea = (i, field, value) => {
    setReciboLineas((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === "productoId") {
        const prod = stock.find((s) => s.id === value);
        if (prod) {
          next[i].nombre         = prod.nombre;
          next[i].precioUnitario = prod.precioUnitario ?? 0;
          next[i].unidad         = prod.unidad ?? "u";
          next[i].monto          = (prod.precioUnitario ?? 0) * next[i].cantidad;
        }
      }
      if (field === "cantidad") {
        next[i].monto = (next[i].precioUnitario || 0) * Number(value);
      }
      return next;
    });
  };

  const updatePrestamo = (i, field, value) =>
    setReciboPrestamos((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  const totalRecibo = useMemo(() => {
    const sumReservas  = reciboReservas.filter((r) => r.incluido).reduce((s, r) => s + (Number(r.monto) || 0), 0);
    const sumConsumo   = reciboLineas.filter((l) => l.incluido !== false && l.monto > 0).reduce((s, l) => s + (Number(l.monto) || 0), 0);
    const sumPrestamos = reciboPrestamos.filter((p) => p.incluido && p.monto > 0).reduce((s, p) => s + (Number(p.monto) || 0), 0);
    return sumReservas + sumConsumo + sumPrestamos;
  }, [reciboReservas, reciboLineas, reciboPrestamos]);

  const handleSaveRecibo = async () => {
    if (!reciboForm.clienteId) return;
    const hoy = new Date().toISOString().split("T")[0];

    const lineas = [
      ...reciboReservas.filter((r) => r.incluido).map((r) => ({
        tipo:          "cancha",
        reservaId:     r.id,
        descripcion:   `${r.servicio || r.deporte || "Cancha"} — ${r.fecha}${r.horario ? ` ${r.horario}` : ""}`,
        cantidad:      1,
        precioUnitario: Number(r.monto) || 0,
        monto:         Number(r.monto)  || 0,
      })),
      ...reciboLineas
        .filter((l) => l.incluido !== false && l.monto > 0)
        .map((l) => ({
          tipo:          "consumible",
          productoId:    l.productoId || null,
          ventaId:       l.ventaId    || null,
          descripcion:   l.nombre,
          cantidad:      l.cantidad,
          precioUnitario: l.precioUnitario,
          monto:         l.monto,
          unidad:        l.unidad,
        })),
      ...reciboPrestamos.filter((p) => p.incluido).map((p) => ({
        tipo:        "prestamo",
        prestamoId:  p.prestamoId || null,
        descripcion: p.nombre,
        cantidad:    p.cantidad,
        unidad:      p.unidad,
        monto:       Number(p.monto) || 0,
      })),
    ];

    await addVenta({
      tipo:          "recibo",
      clienteId:     reciboForm.clienteId,
      clienteNombre: reciboForm.clienteNombre,
      lineas,
      monto:         totalRecibo,
      fecha:         hoy,
      metodoPago:    reciboForm.metodoPago,
      estado:        reciboForm.estado,
    });

    // Descontar stock solo de consumibles NUEVOS (no los que vienen de ventas ya registradas)
    for (const l of reciboLineas.filter((x) => x.productoId && !x.fromVenta && x.incluido !== false)) {
      const prod = stock.find((s) => s.id === l.productoId);
      if (prod) await updateStock(prod.id, { cantidad: prod.cantidad - Number(l.cantidad) });
    }

    setRecibo(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Ventas</div>
          <div className="page-desc">{ventas.length} registros · Cobrado: {fmt(totalCobrado)}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={openRecibo}>Generar recibo</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Registrar venta</button>
        </div>
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
              ) : filtered.map((v) => {
                const esRecibo = v.tipo === "recibo";
                const expanded = expandedId === v.id;
                return (
                  <Fragment key={v.id}>
                    <tr>
                      <td><span className="mono">{v.id}</span></td>
                      <td className="fw-500">
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{v.clienteNombre || v.cliente || "—"}</span>
                          {(() => {
                            const activos = (prestamos ?? []).filter((p) => p.clienteId === v.clienteId && p.estado === "entregado");
                            return activos.length > 0 ? (
                              <span className="badge-prestamo-venta" title={activos.map((p) => p.nombre).join(", ")}>
                                {activos.length} préstamo{activos.length !== 1 ? "s" : ""}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </td>
                      <td>
                        {esRecibo
                          ? <span className="badge-recibo">Recibo — {(v.lineas ?? []).length} ítems</span>
                          : (v.productoNombre || v.servicio || "—")}
                      </td>
                      <td style={{ textAlign: "right" }} className="c-secondary-sm">
                        {esRecibo ? "—" : `${v.cantidad ?? "—"} ${v.unidad ?? ""}`}
                      </td>
                      <td>{fmtFecha(v.fecha)}</td>
                      <td style={{ textAlign: "right" }}>{!esRecibo && v.precioUnitario ? fmt(v.precioUnitario) : "—"}</td>
                      <td style={{ textAlign: "right" }} className="fw-600">{fmt(v.monto)}</td>
                      <td>{v.metodoPago}</td>
                      <td><span className={`status ${estadoClass[v.estado] ?? ""}`}>{v.estado}</span></td>
                      <td>
                        <div className="actions-row">
                          {esRecibo
                            ? <button className="btn btn-sm" onClick={() => setExpandedId(expanded ? null : v.id)}>
                                {expanded ? "Ocultar" : "Ver detalle"}
                              </button>
                            : <button className="btn btn-sm" onClick={() => openEdit(v)}>Editar</button>
                          }
                          <button className="btn btn-sm btn-icon-danger" onClick={() => openDelete(v)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                    {esRecibo && expanded && (
                      <tr key={`${v.id}-detail`} className="recibo-detail-row">
                        <td colSpan={10}>
                          <div className="recibo-lineas">
                            {(v.lineas ?? []).map((l, i) => (
                              <div key={i} className="recibo-linea">
                                <span className={`recibo-tipo-badge tipo-${l.tipo}`}>
                                  {l.tipo === "cancha" ? "Cancha" : "Consumible"}
                                </span>
                                <span className="recibo-desc">{l.descripcion}</span>
                                {l.cantidad > 1 && <span className="recibo-qty">× {l.cantidad}</span>}
                                <span className="recibo-monto">{fmt(l.monto)}</span>
                              </div>
                            ))}
                            <div className="recibo-total-row">
                              <span>Total cobrado</span>
                              <span className="fw-600">{fmt(v.monto)}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
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

      {/* Modal Generar Recibo */}
      {recibo === "open" && (
        <Modal title="Generar recibo" onClose={() => setRecibo(null)} size="lg">
          <div className="form-grid">

            {/* Cliente */}
            <div className="form-group form-full">
              <label className="form-label">Cliente *</label>
              <select className="form-input" value={reciboForm.clienteId} onChange={handleReciboClienteChange}>
                <option value="">Seleccioná un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` — ${c.telefono}` : ""}</option>
                ))}
              </select>
            </div>

            {/* ── CANCHA ── */}
            {reciboReservas.length > 0 && (
              <div className="form-group form-full">
                <label className="form-label">Cancha alquilada</label>
                <div className="recibo-reservas-list">
                  {reciboReservas.map((r) => (
                    <label key={r.id} className={`recibo-reserva-item ${r.incluido ? "selected" : ""}`}>
                      <input type="checkbox" checked={r.incluido} onChange={() => toggleReserva(r.id)} />
                      <span>{r.servicio || r.deporte} — {fmtFecha(r.fecha)} {r.horario || ""}</span>
                      <span className="fw-600">{fmt(r.monto)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── CONSUMIBLES (existentes + nuevos) ── */}
            <div className="form-group form-full">
              <label className="form-label">Consumibles</label>

              {/* Consumibles ya registrados para este cliente */}
              {reciboLineas.filter((l) => l.fromVenta).map((l, i) => (
                <div key={i} className={`recibo-linea-form ${l.incluido === false ? "recibo-linea-excluida" : ""}`}>
                  <input type="checkbox" checked={l.incluido !== false} onChange={() => toggleLinea(i)} />
                  <span style={{ flex: 2, fontSize: 13 }}>{l.nombre || "—"}</span>
                  <span className="c-secondary-sm">× {l.cantidad} {l.unidad}</span>
                  <span className="fw-600" style={{ minWidth: 75, textAlign: "right" }}>{fmt(l.monto)}</span>
                  <span style={{ width: 20 }} />
                </div>
              ))}

              {/* Nuevos consumibles */}
              {reciboLineas.filter((l) => !l.fromVenta).map((l, i) => {
                const realIdx = reciboLineas.indexOf(l);
                return (
                  <div key={realIdx} className="recibo-linea-form">
                    <select
                      className="form-input"
                      style={{ flex: 2 }}
                      value={l.productoId}
                      onChange={(e) => updateLinea(realIdx, "productoId", e.target.value)}
                    >
                      <option value="">— Seleccioná producto —</option>
                      {stock.filter((s) => s.cantidad > 0 && s.categoria === "venta").map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} — {fmt(s.precioUnitario ?? 0)}/{s.unidad}
                        </option>
                      ))}
                    </select>
                    <input
                      className="form-input"
                      style={{ flex: "0 0 65px" }}
                      type="number" min="1"
                      value={l.cantidad}
                      disabled={!l.productoId}
                      onChange={(e) => updateLinea(realIdx, "cantidad", parseInt(e.target.value) || 1)}
                    />
                    <span style={{ minWidth: 75, textAlign: "right", fontWeight: 600 }}>{fmt(l.monto)}</span>
                    <button className="btn btn-sm btn-icon-danger" onClick={() => removeLinea(realIdx)}>✕</button>
                  </div>
                );
              })}
              <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={addLineaConsumo}>
                + Agregar consumible
              </button>
            </div>

            {/* ── PRÉSTAMOS (existentes + nuevos) ── */}
            <div className="form-group form-full">
              <label className="form-label">Equipamiento prestado</label>

              {reciboPrestamos.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Sin préstamos activos para este cliente.</div>
              )}

              {reciboPrestamos.map((p, i) => (
                <div key={i} className={`recibo-linea-form ${!p.incluido ? "recibo-linea-excluida" : ""}`}>
                  <input type="checkbox" checked={p.incluido} onChange={() => togglePrestamo(i)} />
                  {p.fromPrestamo ? (
                    <span style={{ flex: 2, fontSize: 13 }}>{p.nombre} <span className="c-secondary-sm">× {p.cantidad} {p.unidad}</span></span>
                  ) : (
                    <input
                      className="form-input"
                      style={{ flex: 2 }}
                      placeholder="Ej: Pelota de pádel"
                      value={p.nombre}
                      onChange={(e) => updatePrestamo(i, "nombre", e.target.value)}
                    />
                  )}
                  <input
                    className="form-input"
                    style={{ flex: "0 0 65px" }}
                    type="number" min="0"
                    placeholder="$0"
                    value={p.monto}
                    onChange={(e) => updatePrestamo(i, "monto", parseFloat(e.target.value) || 0)}
                  />
                  <button className="btn btn-sm btn-icon-danger" onClick={() => removePrestamo(i)}>✕</button>
                </div>
              ))}
              <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={addLineaPrestamo}>
                + Agregar equipo no registrado
              </button>
            </div>

            {/* ── MÉTODO / ESTADO ── */}
            <div className="form-group">
              <label className="form-label">Método de pago</label>
              <select className="form-input" value={reciboForm.metodoPago} onChange={(e) => setReciboForm((f) => ({ ...f, metodoPago: e.target.value }))}>
                {METODOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-input" value={reciboForm.estado} onChange={(e) => setReciboForm((f) => ({ ...f, estado: e.target.value }))}>
                {ESTADOS_VENTA.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>

            {/* ── TOTAL ── */}
            <div className="form-group form-full">
              <div className="recibo-total-preview">
                {reciboReservas.filter((r) => r.incluido).map((r) => (
                  <div key={r.id} className="recibo-total-line">
                    <span>Cancha — {r.servicio || r.deporte}</span>
                    <span>{fmt(r.monto)}</span>
                  </div>
                ))}
                {reciboLineas.filter((l) => l.incluido !== false && l.monto > 0).map((l, i) => (
                  <div key={i} className="recibo-total-line">
                    <span>{l.nombre || "Consumible"}{l.cantidad > 1 ? ` × ${l.cantidad}` : ""}</span>
                    <span>{fmt(l.monto)}</span>
                  </div>
                ))}
                {reciboPrestamos.filter((p) => p.incluido && p.nombre).map((p, i) => (
                  <div key={i} className="recibo-total-line">
                    <span>{p.nombre} (préstamo){p.monto > 0 ? "" : " — gratis"}</span>
                    <span>{p.monto > 0 ? fmt(p.monto) : "$0"}</span>
                  </div>
                ))}
                <div className="recibo-total-sum">
                  <span>TOTAL</span>
                  <span>{fmt(totalRecibo)}</span>
                </div>
              </div>
            </div>

          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setRecibo(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveRecibo} disabled={!reciboForm.clienteId}>
              Guardar recibo
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
