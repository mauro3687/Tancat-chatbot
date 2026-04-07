// src/components/TabConfiguracion.jsx — Configuración de la empresa
import { useState } from "react";
import { useStore } from "../data/store.jsx";
import { DEPORTES, DEPORTE_EMOJI } from "../data/canchas.js";

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
    <div className="card" style={{ marginBottom: 12 }}>
      <div
        className="card-title"
        style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--gray-200)" }}
      >
        {title}
      </div>
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
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <div className="page-title">Configuración</div>
          <div className="page-desc">Datos del establecimiento y parámetros del sistema</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {readOnly ? (
            <span style={{
              background: "var(--amber-bg)",
              color: "var(--amber)",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
            }}>
              Solo lectura
            </span>
          ) : (
            <>
              {saved && (
                <span style={{
                  background: "var(--green-light)",
                  color: "var(--green-dark)",
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                }}>
                  ✓ Cambios guardados
                </span>
              )}
              <button className="btn btn-primary" onClick={handleSave}>
                Guardar cambios
              </button>
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

      {/* ── Precios por hora ──────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div
          className="card-title"
          style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--gray-200)" }}
        >
          Precios por hora (cancha)
        </div>
        <div className="form-grid">
          {DEPORTES.map((dep) => (
            <div className="form-group" key={dep}>
              <label className="form-label">
                {DEPORTE_EMOJI[dep]} {DEPORTE_LABEL[dep]} — precio por hora ($)
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
              <span style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4, display: "block" }}>
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
          <span style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4, display: "block" }}>
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
          <span style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4, display: "block" }}>
            Cancelación sin cargo hasta {form.cancelacion} hs antes del check-in
          </span>
        </div>
      </Section>

      {/* Vista previa */}
      <div className="card">
        <div
          className="card-title"
          style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--gray-200)" }}
        >
          Vista previa — Información pública
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--gray-800)", marginBottom: 4 }}>
              {form.nombre}
            </div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 2 }}>{form.razonSocial}</div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 2 }}>CUIT: {form.cuit}</div>
            <div style={{ fontSize: 13, color: "var(--gray-600)" }}>{form.direccion}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 4 }}>📧 {form.email}</div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 4 }}>📞 {form.telefono}</div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 4 }}>
              🕐 Check-in {form.checkin} · Check-out {form.checkout}
            </div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>⏰ Atención {form.atencion}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DEPORTES.map((dep) => (
                <span
                  key={dep}
                  style={{
                    fontSize: 12,
                    background: "var(--gray-100)",
                    color: "var(--gray-600)",
                    padding: "3px 10px",
                    borderRadius: 20,
                    border: "1px solid var(--gray-200)",
                  }}
                >
                  {DEPORTE_EMOJI[dep]} {DEPORTE_LABEL[dep]}{" "}
                  ${(precios[dep] ?? 0).toLocaleString("es-AR")}/h
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
