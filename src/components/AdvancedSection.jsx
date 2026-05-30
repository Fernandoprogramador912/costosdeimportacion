import { useState } from 'react'
import { DEFAULTS } from '../lib/calculator.js'
import { formatFechaCotizacion } from '../lib/dolarApi.js'

const PCT_IIBB = (DEFAULTS.pctIIBB * 100).toLocaleString('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export default function AdvancedSection({ adv, onChange, cotizacion }) {
  const [open, setOpen] = useState(false)
  const { estado, fechaActualizacion, error, actualizar } = cotizacion ?? {}
  const fechaFormateada = formatFechaCotizacion(fechaActualizacion)

  return (
    <div className="advanced-section">
      <button
        type="button"
        className={`advanced-toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="advanced-toggle-left">
          <div className="advanced-toggle-icon">⚙️</div>
          <div className="advanced-toggle-text">
            <strong>Parámetros avanzados</strong>
            <span>Costos operativos, impuestos y tipo de cambio</span>
          </div>
        </div>
        <svg className="advanced-toggle-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={`advanced-panel ${open ? 'open' : ''}`}>

        <div className="form-section">
          <div className="form-section-title">Tipo de cambio</div>

          <div className="dolar-status">
            {estado === 'loading' && (
              <span className="dolar-status-badge loading">Actualizando cotizaciones…</span>
            )}
            {estado === 'ok' && (
              <span className="dolar-status-badge ok">
                Cotizaciones de DolarAPI
                {fechaFormateada && ` · ${fechaFormateada}`}
              </span>
            )}
            {estado === 'error' && (
              <span className="dolar-status-badge error">
                {error} Podés ingresar los valores manualmente.
              </span>
            )}
            <button
              type="button"
              className="btn-refresh-dolar"
              onClick={actualizar}
              disabled={estado === 'loading'}
            >
              {estado === 'loading' ? 'Actualizando…' : 'Actualizar cotizaciones'}
            </button>
          </div>

          <div className="field-group">
            <div className="field">
              <label>Dólar oficial <span>(ARS)</span></label>
              <div className="input-wrap has-prefix">
                <span className="prefix">$</span>
                <input
                  type="number"
                  name="dolarOficial"
                  value={adv.dolarOficial}
                  onChange={onChange}
                  min="0"
                  step="1"
                />
              </div>
            </div>
            <div className="field">
              <label>Dólar blue <span>(ARS)</span></label>
              <div className="input-wrap has-prefix">
                <span className="prefix">$</span>
                <input
                  type="number"
                  name="dolarBlue"
                  value={adv.dolarBlue}
                  onChange={onChange}
                  min="0"
                  step="1"
                />
              </div>
              <span className="field-hint">Precio venta · afecta conversión de flete y seguro</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Costos operativos (USD)</div>
          <div className="field-group">
            <div className="field">
              <label>Seguro</label>
              <div className="input-wrap has-prefix">
                <span className="prefix">$</span>
                <input
                  type="number"
                  name="seguro"
                  value={adv.seguro}
                  onChange={onChange}
                  min="0"
                  step="1"
                />
              </div>
            </div>
            <div className="field">
              <label>Costo de despacho</label>
              <div className="input-wrap has-prefix">
                <span className="prefix">$</span>
                <input
                  type="number"
                  name="costoDespacho"
                  value={adv.costoDespacho}
                  onChange={onChange}
                  min="0"
                  step="1"
                />
              </div>
            </div>
            <div className="field">
              <label>Costos terminal / dep. fiscal</label>
              <div className="input-wrap has-prefix">
                <span className="prefix">$</span>
                <input
                  type="number"
                  name="costoTerminal"
                  value={adv.costoTerminal}
                  onChange={onChange}
                  min="0"
                  step="1"
                />
              </div>
            </div>
            <div className="field">
              <label>Costos adicionales</label>
              <div className="input-wrap has-prefix">
                <span className="prefix">$</span>
                <input
                  type="number"
                  name="costoAdicional"
                  value={adv.costoAdicional}
                  onChange={onChange}
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-section" style={{ marginBottom: 0 }}>
          <div className="form-section-title">Tasas e impuestos adicionales</div>
          <div className="field-group">
            <div className="field">
              <label>% T.E. (tasa estadística)</label>
              <div className="input-wrap has-suffix">
                <input
                  type="number"
                  name="pctTE"
                  value={adv.pctTE}
                  onChange={onChange}
                  min="0"
                  max="100"
                  step="0.01"
                />
                <span className="suffix">%</span>
              </div>
            </div>
            <div className="field">
              <label>% Impuesto país</label>
              <div className="input-wrap has-suffix">
                <input
                  type="number"
                  name="pctImpuestoPais"
                  value={adv.pctImpuestoPais}
                  onChange={onChange}
                  min="0"
                  max="100"
                  step="0.01"
                />
                <span className="suffix">%</span>
              </div>
            </div>
            <div className="field">
              <label>% IIBB</label>
              <div className="input-wrap has-suffix field-fixed">
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={PCT_IIBB}
                  aria-readonly="true"
                />
                <span className="suffix">%</span>
              </div>
              <span className="field-hint">Alícuota fija del cálculo (2,74%)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
