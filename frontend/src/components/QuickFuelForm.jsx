import { useState, useEffect, useRef } from 'react'
import { scanTicket, getLastKm } from '../api/api.js'

const FUEL_TYPES = ['Gasoil', 'Nafta', 'Nafta Premium', 'GNC']
const todayISO   = () => new Date().toISOString().split('T')[0]
const fmtKm      = (n) => n != null ? Number(n).toLocaleString('es-AR') : '—'
const fmtDate    = (s) => { const [y,m,d] = s.split('-'); return `${d}/${m}/${y}` }

const emptyForm = () => ({
  fecha:            todayISO(),
  litros:           '',
  tipo_combustible: 'Gasoil',
  proveedor:        '',
  costo_litro:      '',
  costo_total:      '',
  km_actual:        '',
})

export default function QuickFuelForm({ vehicle, onSubmit, loading }) {
  const [step,       setStep]       = useState(1)
  const [form,       setForm]       = useState(emptyForm())
  const [fotoFile,   setFotoFile]   = useState(null)
  const [fotoPreview,setFotoPreview]= useState(null)
  const [scanning,   setScanning]   = useState(false)
  const [scanError,  setScanError]  = useState('')
  const [lastKm,     setLastKm]     = useState(null)
  const [kmWarning,  setKmWarning]  = useState(false)
  const [autoTotal,  setAutoTotal]  = useState(true)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!vehicle?.matricula) return
    getLastKm(vehicle.matricula)
      .then(data => setLastKm(data))
      .catch(() => {})
  }, [vehicle?.matricula])

  useEffect(() => {
    if (!autoTotal) return
    if (form.costo_litro && form.litros) {
      const total = (parseFloat(form.costo_litro) * parseFloat(form.litros)).toFixed(2)
      setForm(prev => ({ ...prev, costo_total: total }))
    }
  }, [form.costo_litro, form.litros, autoTotal])

  const set = (e) => {
    const { name, value } = e.target
    if (name === 'costo_total') setAutoTotal(false)
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleScan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanError('')
    setScanning(true)
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
    try {
      const datos = await scanTicket(file)
      setForm(prev => ({
        ...prev,
        ...(datos.fecha             ? { fecha: datos.fecha }                       : {}),
        ...(datos.litros != null    ? { litros: String(datos.litros) }             : {}),
        ...(datos.tipo_combustible  ? { tipo_combustible: datos.tipo_combustible } : {}),
        ...(datos.proveedor         ? { proveedor: datos.proveedor }               : {}),
        ...(datos.costo_litro != null ? { costo_litro: String(datos.costo_litro) } : {}),
        ...(datos.costo_total != null ? { costo_total: String(datos.costo_total) } : {}),
      }))
      if (datos.costo_total != null) setAutoTotal(false)
    } catch (err) {
      setScanError(err.message || 'Error al procesar el ticket')
      setFotoFile(null)
      setFotoPreview(null)
    } finally {
      setScanning(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const quitarFoto = () => {
    setFotoFile(null)
    if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    setFotoPreview(null)
  }

  const handleKmChange = (e) => {
    const val = e.target.value
    setForm(prev => ({ ...prev, km_actual: val }))
    if (lastKm?.km_actual && val && parseInt(val, 10) < lastKm.km_actual) {
      setKmWarning(true)
    } else {
      setKmWarning(false)
    }
  }

  const handleSubmit = () => {
    onSubmit(
      {
        matricula:        vehicle.matricula,
        fecha:            form.fecha,
        litros:           parseFloat(form.litros),
        km_actual:        parseInt(form.km_actual, 10),
        tipo_combustible: form.tipo_combustible || null,
        proveedor:        form.proveedor || null,
        costo_litro:      form.costo_litro  ? parseFloat(form.costo_litro)  : null,
        costo_total:      form.costo_total  ? parseFloat(form.costo_total)  : null,
      },
      fotoFile,
    )
    setStep(1)
    setForm(emptyForm())
    setAutoTotal(true)
    quitarFoto()
    setKmWarning(false)
  }

  const canGoStep2 = form.litros && parseFloat(form.litros) > 0
  const canGoStep3 = form.km_actual && parseInt(form.km_actual, 10) >= 0

  return (
    <div className="quick-form">

      {/* Vehículo info */}
      {vehicle && (
        <div className="quick-vehicle-info">
          <span className="badge" style={{ fontSize: 14, padding: '4px 14px' }}>{vehicle.matricula}</span>
          <span>{vehicle.conductor}</span>
          <span className="muted">{vehicle.modelo}</span>
        </div>
      )}

      {/* Step indicators */}
      <div className="quick-steps">
        {[1,2,3].map(s => (
          <div key={s} className={`quick-step ${step === s ? 'active' : ''} ${step > s ? 'done' : ''}`}>
            <div className="quick-step-num">{step > s ? '✓' : s}</div>
            <div className="quick-step-label">
              {s === 1 ? 'Ticket' : s === 2 ? 'Kilómetros' : 'Confirmar'}
            </div>
          </div>
        ))}
        <div className="quick-step-line" />
      </div>

      {/* ── Paso 1: Escaneo del ticket ────────────────────── */}
      {step === 1 && (
        <div className="quick-card">
          <h2 className="quick-card-title">Fotografiar el ticket</h2>
          <p className="quick-hint">La IA leerá los datos del ticket automáticamente. También podés completarlos a mano.</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleScan}
          />

          {!fotoPreview ? (
            <button
              type="button"
              className="quick-camera-btn"
              disabled={scanning}
              onClick={() => fileInputRef.current?.click()}
            >
              {scanning ? (
                <><span className="quick-spinner" /> Leyendo ticket…</>
              ) : (
                <><span style={{ fontSize: 36 }}>📷</span><br />Tomar foto del ticket</>
              )}
            </button>
          ) : (
            <div className="quick-foto-preview">
              <img src={fotoPreview} alt="Ticket" className="quick-foto-img" />
              <div className="quick-foto-actions">
                <span className="foto-ok">Foto lista</span>
                <button type="button" className="btn-quitar-foto" onClick={quitarFoto}>Quitar foto</button>
              </div>
            </div>
          )}

          {scanError && <p className="scan-error">{scanError}</p>}

          {/* Campos extraídos / manuales */}
          <div className="quick-fields">
            <div className="form-row">
              <div className="form-group">
                <label>Litros *</label>
                <input type="number" name="litros" value={form.litros} onChange={set}
                  step="0.01" min="0.01" placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label>Tipo de combustible</label>
                <select name="tipo_combustible" value={form.tipo_combustible} onChange={set}>
                  {FUEL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha</label>
                <input type="date" name="fecha" value={form.fecha} onChange={set} required />
              </div>
              <div className="form-group">
                <label>Proveedor / Estación</label>
                <input type="text" name="proveedor" value={form.proveedor} onChange={set}
                  placeholder="Ej: YPF San Martín" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Costo por litro ($)</label>
                <input type="number" name="costo_litro" value={form.costo_litro} onChange={set}
                  step="0.01" min="0" placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Costo total ($){autoTotal && form.costo_litro && form.litros && <span className="auto-label"> — auto</span>}</label>
                <input type="number" name="costo_total" value={form.costo_total} onChange={set}
                  step="0.01" min="0" placeholder="0.00" />
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary quick-next-btn"
            disabled={!canGoStep2}
            onClick={() => setStep(2)}
          >
            Continuar →
          </button>
        </div>
      )}

      {/* ── Paso 2: KM actual ────────────────────────────── */}
      {step === 2 && (
        <div className="quick-card">
          <h2 className="quick-card-title">Kilómetros al momento de carga</h2>

          {lastKm?.km_actual != null && (
            <div className="quick-last-km">
              <span className="quick-last-km-label">Última carga registrada:</span>
              <span className="quick-last-km-value">{fmtKm(lastKm.km_actual)} km</span>
              <span className="quick-last-km-date">({fmtDate(lastKm.fecha)})</span>
            </div>
          )}

          <div className="quick-km-input-wrap">
            <input
              type="number"
              className="quick-km-input"
              value={form.km_actual}
              onChange={handleKmChange}
              min="0"
              placeholder="0"
              autoFocus
            />
            <span className="quick-km-unit">km</span>
          </div>

          {kmWarning && (
            <div className="quick-km-warning">
              ⚠ El KM ingresado ({Number(form.km_actual).toLocaleString('es-AR')}) es menor al de la última carga ({fmtKm(lastKm?.km_actual)}). Verificá el dato antes de continuar.
            </div>
          )}

          <div className="quick-nav-btns">
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Volver</button>
            <button type="button" className="btn-primary" disabled={!canGoStep3} onClick={() => setStep(3)}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 3: Confirmación ─────────────────────────── */}
      {step === 3 && (
        <div className="quick-card">
          <h2 className="quick-card-title">Confirmá los datos</h2>

          <div className="quick-summary">
            <div className="quick-summary-row">
              <span>Fecha</span><strong>{fmtDate(form.fecha)}</strong>
            </div>
            <div className="quick-summary-row">
              <span>Litros</span><strong>{form.litros} L</strong>
            </div>
            <div className="quick-summary-row">
              <span>KM actual</span><strong>{fmtKm(parseInt(form.km_actual, 10))}</strong>
            </div>
            {lastKm?.km_actual && (
              <div className="quick-summary-row">
                <span>KM recorridos (est.)</span>
                <strong>{fmtKm(parseInt(form.km_actual, 10) - lastKm.km_actual)}</strong>
              </div>
            )}
            <div className="quick-summary-row">
              <span>Tipo</span><strong>{form.tipo_combustible}</strong>
            </div>
            {form.proveedor && (
              <div className="quick-summary-row">
                <span>Proveedor</span><strong>{form.proveedor}</strong>
              </div>
            )}
            {form.costo_total && (
              <div className="quick-summary-row">
                <span>Costo total</span><strong>${parseFloat(form.costo_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
              </div>
            )}
            {fotoFile && (
              <div className="quick-summary-row">
                <span>Foto del ticket</span><strong style={{ color: '#166534' }}>Incluida</strong>
              </div>
            )}
            {kmWarning && (
              <div className="quick-km-warning">
                ⚠ KM menor al anterior — se guardará igual.
              </div>
            )}
          </div>

          <div className="quick-nav-btns">
            <button type="button" className="btn-secondary" onClick={() => setStep(2)}>← Volver</button>
            <button
              type="button"
              className="btn-primary quick-submit-btn"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? 'Guardando…' : 'Registrar Carga'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
