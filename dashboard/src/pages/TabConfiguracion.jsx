// src/pages/TabConfiguracion.jsx — Configuración de la empresa
import { useState, useEffect, useRef } from "react";
import { useStore } from "../context/StoreContext.jsx";
import { DEPORTES } from "../data/canchas.js";
import { Mail, Phone, Clock } from "lucide-react";
import "../styles/TabConfiguracion.css";

const DEPORTE_LABEL = { padel: "Pádel", basquet: "Básquet", voley: "Voley" };

export default function TabConfiguracion() {
  const { config, updateConfig, currentUser } = useStore();
  const readOnly = currentUser?.rol === "encargado";
  const [form, setForm]     = useState({ ...config });
  const [saved, setSaved]   = useState(false);
  const [priceErrors, setPriceErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  // BUG-021: sincronizar form cuando config llega desde Firestore (solo la primera vez)
  const hasSynced = useRef(false);
  useEffect(() => {
    if (!hasSynced.current && config && Object.keys(config).length > 0) {
      hasSynced.current = true;
      setForm({ ...config });
    }
  }, [config]);

  const setField = (k, v) => {
    if (readOnly) return;
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((fe) => (fe[k] ? { ...fe, [k]: undefined } : fe));
  };
  const setPrecio = (dep, v) => {
    if (!readOnly)
      setForm((f) => ({ ...f, precios: { ...(f.precios || {}), [dep]: Math.max(0, parseInt(v) || 0) } }));
  };
  const setSena = (v) => {
    if (readOnly) return;
    const n = parseInt(v, 10);
    setForm((f) => ({ ...f, sena: isNaN(n) ? 0 : Math.min(100, Math.max(0, n)) }));
  };
  const setCancelacion = (v) => {
    if (readOnly) return;
    const n = parseInt(v, 10);
    setForm((f) => ({ ...f, cancelacion: isNaN(n) ? 0 : Math.max(0, n) }));
  };

  const handleSave = () => {
    // BUG-019: validar que todos los precios sean > 0
    const pe = {};
    const precios = form.precios || {};
    DEPORTES.forEach((dep) => {
      if (!precios[dep] || precios[dep] <= 0) pe[dep] = "Debe ser mayor a $0";
    });

    const fe = {};
    if (!form.nombre?.trim()) fe.nombre = "El nombre comercial es obligatorio";
    if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      fe.email = "Email inválido";
    if (form.telefono?.trim() && !/^[0-9+\-\s()]+$/.test(form.telefono.trim()))
      fe.telefono = "El teléfono solo puede contener números, espacios y + - ( )";
    if (form.cuit?.trim() && !/^\d{2}-?\d{8}-?\d{1}$/.test(form.cuit.trim()))
      fe.cuit = "Formato esperado: 30-00000000-0";

    if (Object.keys(pe).length > 0 || Object.keys(fe).length > 0) {
      setPriceErrors(pe);
      setFieldErrors(fe);
      return;
    }
    setPriceErrors({});
    setFieldErrors({});
    updateConfig({
      ...form,
      nombre:      form.nombre?.trim()      ?? "",
      razonSocial: form.razonSocial?.trim() ?? "",
      cuit:        form.cuit?.trim()        ?? "",
      direccion:   form.direccion?.trim()   ?? "",
      email:       form.email?.trim()       ?? "",
      telefono:    form.telefono?.trim()    ?? "",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Section = ({ title, children }) => (
    <div className="card config-section">
      <div className="card-title config-section-title">{title}</div>
      <div className="form-grid">{children}</div>
    </div>
  );

  const Field = ({ label, k, type = "text", placeholder = "", maxLength }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className={`form-input ${fieldErrors[k] ? "input-error" : ""}`}
        type={type}
        value={form[k] ?? ""}
        onChange={(e) => setField(k, e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={readOnly}
      />
      {fieldErrors[k] && <span className="form-error">{fieldErrors[k]}</span>}
    </div>
  );

  const precios = form.precios || { padel: 8000, basquet: 12000, voley: 10000 };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Configuración</div>
          <div className="page-desc">Datos del establecimiento y parámetros del sistema</div>
        </div>
        <div className="config-header-actions">
          {readOnly ? (
            <span className="config-badge-readonly">Solo lectura</span>
          ) : (
            <>
              {saved && <span className="config-badge-saved">✓ Cambios guardados</span>}
              <button className="btn btn-primary" onClick={handleSave}>Guardar cambios</button>
            </>
          )}
        </div>
      </div>

      <Section title="Datos del establecimiento">
        <Field label="Nombre comercial" k="nombre" placeholder="TanCat" maxLength={60} />
        <Field label="Razón social" k="razonSocial" placeholder="TanCat S.R.L." maxLength={100} />
        <Field label="CUIT" k="cuit" placeholder="30-00000000-0" maxLength={13} />
        <Field label="Dirección" k="direccion" placeholder="Calle 123, Córdoba" maxLength={100} />
        <Field label="Email de contacto" k="email" type="email" placeholder="info@tancat.com.ar" maxLength={80} />
        <Field label="Teléfono" k="telefono" placeholder="351-000-0000" maxLength={20} />
      </Section>

      <Section title="Horarios de operación">
        <Field label="Check-in" k="checkin" type="time" />
        <Field label="Check-out" k="checkout" type="time" />
        <div className="form-group">
          <label className="form-label">Horario de atención</label>
          <input
            className="form-input"
            type="text"
            value={form.atencion ?? ""}
            onChange={(e) => setField("atencion", e.target.value)}
            placeholder="08:00 - 22:00"
            disabled={readOnly}
          />
        </div>
      </Section>

      <div className="card config-section">
        <div className="card-title config-section-title">Precios por hora (cancha)</div>
        <div className="form-grid">
          {DEPORTES.map((dep) => (
            <div className="form-group" key={dep}>
              <label className="form-label">
                {DEPORTE_LABEL[dep]} — precio por hora ($)
              </label>
              <input
                className={`form-input ${priceErrors[dep] ? "input-error" : ""}`}
                type="number"
                min="1"
                step="500"
                value={precios[dep] ?? 0}
                onChange={(e) => { setPrecio(dep, e.target.value); setPriceErrors((pe) => ({ ...pe, [dep]: undefined })); }}
                disabled={readOnly}
              />
              {priceErrors[dep]
                ? <span className="form-error">{priceErrors[dep]}</span>
                : <span className="form-hint">Reserva 2 hs = {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format((precios[dep] ?? 0) * 2)}</span>
              }
            </div>
          ))}
        </div>
      </div>

      <Section title="Políticas">
        <div className="form-group">
          <label className="form-label">Porcentaje de seña (%)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            max="100"
            value={form.sena ?? 30}
            onChange={(e) => setSena(e.target.value)}
            disabled={readOnly}
          />
          <span className="form-hint">
            Se solicitará el {form.sena}% del total para confirmar la reserva
          </span>
        </div>
        <div className="form-group">
          <label className="form-label">Cancelación gratuita (horas antes)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            value={form.cancelacion ?? 48}
            onChange={(e) => setCancelacion(e.target.value)}
            disabled={readOnly}
          />
          <span className="form-hint">
            Cancelación sin cargo hasta {form.cancelacion} hs antes del check-in
          </span>
        </div>
      </Section>

      {/* Vista previa */}
      <div className="card">
        <div className="card-title config-section-title">Vista previa — Información pública</div>
        <div className="config-preview-grid">
          <div>
            <div className="config-preview-name">{form.nombre}</div>
            <div className="config-preview-text">{form.razonSocial}</div>
            <div className="config-preview-text">CUIT: {form.cuit}</div>
            <div className="config-preview-text">{form.direccion}</div>
          </div>
          <div>
            <div className="config-preview-row icon-row"><Mail size={13} /> {form.email}</div>
            <div className="config-preview-row icon-row"><Phone size={13} /> {form.telefono}</div>
            <div className="config-preview-row icon-row"><Clock size={13} /> Check-in {form.checkin} · Check-out {form.checkout}</div>
            <div className="config-preview-row-mb8 icon-row"><Clock size={13} /> Atención {form.atencion}</div>
            <div className="config-sports-row">
              {DEPORTES.map((dep) => (
                <span key={dep} className="config-sport-badge">
                  {DEPORTE_LABEL[dep]} ${(precios[dep] ?? 0).toLocaleString("es-AR")}/h
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
