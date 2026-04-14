// src/components/TabConfiguracion.jsx — Configuración de la empresa
import { useState } from "react";
import { useStore } from "../data/store.jsx";
import { DEPORTES } from "../data/canchas.js";
import { Mail, Phone, Clock } from "lucide-react";
import "../styles/TabConfiguracion.css";

const DEPORTE_LABEL = { padel: "Pádel", basquet: "Básquet", voley: "Voley" };

export default function TabConfiguracion() {
  const { config, updateConfig, currentUser } = useStore();
  const readOnly = currentUser?.rol === "encargado";
  const [form, setForm] = useState({ ...config });
  const [saved, setSaved] = useState(false);
  const setField = (k, v) => { if (!readOnly) setForm((f) => ({ ...f, [k]: v })); };
  const setPrecio = (dep, v) => {
    if (!readOnly)
      setForm((f) => ({ ...f, precios: { ...(f.precios || {}), [dep]: parseInt(v) || 0 } }));
  };

  const handleSave = () => {
    updateConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Section = ({ title, children }) => (
    <div className="card config-section">
      <div className="card-title config-section-title">{title}</div>
      <div className="form-grid">{children}</div>
    </div>
  );

  const Field = ({ label, k, type = "text", placeholder = "" }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={form[k] ?? ""}
        onChange={(e) => setField(k, e.target.value)}
        placeholder={placeholder}
        disabled={readOnly}
      />
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
        <Field label="Nombre comercial" k="nombre" placeholder="TanCat" />
        <Field label="Razón social" k="razonSocial" placeholder="TanCat S.R.L." />
        <Field label="CUIT" k="cuit" placeholder="30-00000000-0" />
        <Field label="Dirección" k="direccion" placeholder="Calle 123, Córdoba" />
        <Field label="Email de contacto" k="email" type="email" placeholder="info@tancat.com.ar" />
        <Field label="Teléfono" k="telefono" placeholder="351-000-0000" />
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
                className="form-input"
                type="number"
                min="0"
                step="500"
                value={precios[dep] ?? 0}
                onChange={(e) => setPrecio(dep, e.target.value)}
                disabled={readOnly}
              />
              <span className="form-hint">
                Reserva 2 hs = {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format((precios[dep] ?? 0) * 2)}
              </span>
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
            onChange={(e) => setField("sena", parseInt(e.target.value))}
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
            onChange={(e) => setField("cancelacion", parseInt(e.target.value))}
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
