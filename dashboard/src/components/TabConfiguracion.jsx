// src/components/TabConfiguracion.jsx — Configuración de la empresa
import { useState } from "react";
import { useStore } from "../data/store.jsx";

export default function TabConfiguracion() {
  const { config, updateConfig } = useStore();
  const [form, setForm] = useState({ ...config });
  const [saved, setSaved] = useState(false);
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    updateConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Section = ({ title, children }) => (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-title" style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--gray-200)" }}>{title}</div>
      <div className="form-grid">{children}</div>
    </div>
  );

  const Field = ({ label, k, type = "text", placeholder = "" }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={form[k]} onChange={(e) => setField(k, e.target.value)} placeholder={placeholder} />
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Configuración</div>
          <div className="page-desc">Datos del establecimiento y parámetros del sistema</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && (
            <span style={{ background: "var(--green-light)", color: "var(--green-dark)", padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
              ✓ Cambios guardados
            </span>
          )}
          <button className="btn btn-primary" onClick={handleSave}>Guardar cambios</button>
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
          <input className="form-input" type="text" value={form.atencion} onChange={(e) => setField("atencion", e.target.value)} placeholder="08:00 - 20:00" />
        </div>
      </Section>

      <Section title="Políticas">
        <div className="form-group">
          <label className="form-label">Porcentaje de seña (%)</label>
          <input className="form-input" type="number" min="0" max="100" value={form.sena} onChange={(e) => setField("sena", parseInt(e.target.value))} />
          <span style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4, display: "block" }}>
            Se solicitará el {form.sena}% del total para confirmar la reserva
          </span>
        </div>
        <div className="form-group">
          <label className="form-label">Cancelación gratuita (horas antes)</label>
          <input className="form-input" type="number" min="0" value={form.cancelacion} onChange={(e) => setField("cancelacion", parseInt(e.target.value))} />
          <span style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4, display: "block" }}>
            Cancelación sin cargo hasta {form.cancelacion} hs antes del check-in
          </span>
        </div>
      </Section>

      {/* Vista previa */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--gray-200)" }}>Vista previa — Información pública</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--gray-800)", marginBottom: 4 }}>{form.nombre}</div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 2 }}>{form.razonSocial}</div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 2 }}>CUIT: {form.cuit}</div>
            <div style={{ fontSize: 13, color: "var(--gray-600)" }}>{form.direccion}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 4 }}>📧 {form.email}</div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 4 }}>📞 {form.telefono}</div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 4 }}>🕐 Check-in {form.checkin} · Check-out {form.checkout}</div>
            <div style={{ fontSize: 13, color: "var(--gray-600)" }}>⏰ Atención {form.atencion}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
