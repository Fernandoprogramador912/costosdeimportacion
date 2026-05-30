import { useCallback, useEffect, useState } from 'react'
import { DEFAULTS } from '../lib/calculator.js'
import { useDolarCotizacion } from '../hooks/useDolarCotizacion.js'
import { useProductos, formatPctDerechos } from '../hooks/useProductos.js'
import AdvancedSection from './AdvancedSection.jsx'
import ProductSelector, { isAutoField } from './ProductSelector.jsx'

const CONTENEDORES = [
  { id: '20', label: 'Contenedor 20 pies', volumen: 28 },
  { id: '40', label: 'Contenedor 40 pies', volumen: 58 },
  { id: '40hq', label: 'Contenedor 40 HQ', volumen: 66 },
]

const INITIAL_MAIN = {
  subfacturacion: '',
  precioFOBUnitario: '',
  precioFOBReal: '',
  precioFOBFacturado: '',
  volumenPorCaja: '',
  unidadesPorCaja: '',
  tipoContenedor: '40hq',
  flete: '',
  pctDerechos: '',
  pctIIBB: '',
  precioVenta: '',
}

const INITIAL_ADVANCED = {
  seguro: '',
  costoDespacho: '',
  costoTerminal: '',
  costoAdicional: '',
  pctTE: '',
  pctImpuestoPais: '',
  dolarOficial: '',
  dolarBlue: '',
}

function numOrDefault(value, defaultValue) {
  if (value === '' || value === null || value === undefined) return defaultValue
  const n = Number(value)
  return Number.isFinite(n) ? n : defaultValue
}

export default function ImportForm({ onCalcular }) {
  const [main, setMain] = useState(INITIAL_MAIN)
  const [adv, setAdv] = useState(INITIAL_ADVANCED)
  const [productoId, setProductoId] = useState('')
  const [camposAuto, setCamposAuto] = useState([])

  const { productos } = useProductos()

  const handleDolarUpdate = useCallback((values) => {
    setAdv((prev) => ({ ...prev, ...values }))
  }, [])

  const cotizacion = useDolarCotizacion(handleDolarUpdate)

  function handleMain(e) {
    const { name, value } = e.target
    setMain((prev) => ({ ...prev, [name]: value }))
    if (isAutoField(name) && camposAuto.includes(name)) {
      setCamposAuto((prev) => prev.filter((f) => f !== name))
      setProductoId('')
    }
  }

  function handleProductSelect(id) {
    setProductoId(id)
    if (!id) {
      setCamposAuto([])
      return
    }
    const producto = productos.find((p) => p.id === id)
    if (!producto) return

    const haySub = main.subfacturacion === 'si'
    const campoPrecio = haySub ? 'precioFOBReal' : 'precioFOBUnitario'
    const autoFields = ['unidadesPorCaja', 'volumenPorCaja', 'pctDerechos', campoPrecio]

    setMain((prev) => ({
      ...prev,
      unidadesPorCaja: String(producto.unidadesPorCaja),
      volumenPorCaja: String(producto.volumenPorCaja),
      pctDerechos: formatPctDerechos(producto.pctDerechos),
      [campoPrecio]: String(producto.precioFOBUnitario),
    }))
    setCamposAuto(autoFields)
  }

  const haySubfacturacion = main.subfacturacion === 'si'

  useEffect(() => {
    if (!productoId) return
    const producto = productos.find((p) => p.id === productoId)
    if (!producto || main.subfacturacion === '') return

    const campoPrecio = haySubfacturacion ? 'precioFOBReal' : 'precioFOBUnitario'
    setMain((prev) => ({
      ...prev,
      [campoPrecio]: String(producto.precioFOBUnitario),
    }))
    setCamposAuto((prev) => {
      const sinPrecio = prev.filter((f) => f !== 'precioFOBUnitario' && f !== 'precioFOBReal')
      return sinPrecio.includes(campoPrecio) ? sinPrecio : [...sinPrecio, campoPrecio]
    })
  }, [main.subfacturacion, productoId, productos, haySubfacturacion])

  function autoClass(campo) {
    return camposAuto.includes(campo) ? 'field-auto-filled' : ''
  }

  function getVolumenTotal() {
    const contenedor = CONTENEDORES.find((c) => c.id === main.tipoContenedor)
    return contenedor ? contenedor.volumen : 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    const subfacturacion =
      main.subfacturacion === 'si' ? true : main.subfacturacion === 'no' ? false : null
    onCalcular({
      subfacturacion,
      precioFOBUnitario: subfacturacion === false ? Number(main.precioFOBUnitario) : undefined,
      precioFOBReal: subfacturacion === true ? Number(main.precioFOBReal) : undefined,
      precioFOBFacturado: subfacturacion === true ? Number(main.precioFOBFacturado) : undefined,
      volumenPorCaja: Number(main.volumenPorCaja),
      unidadesPorCaja: Number(main.unidadesPorCaja),
      volumenTotal: getVolumenTotal(),
      flete: Number(main.flete),
      pctDerechos: Number(main.pctDerechos) / 100,
      pctIIBB: numOrDefault(main.pctIIBB, DEFAULTS.pctIIBB * 100) / 100,
      precioVenta: Number(main.precioVenta),
      seguro: numOrDefault(adv.seguro, DEFAULTS.seguro),
      costoDespacho: numOrDefault(adv.costoDespacho, DEFAULTS.costoDespacho),
      costoTerminal: numOrDefault(adv.costoTerminal, DEFAULTS.costoTerminal),
      costoAdicional: numOrDefault(adv.costoAdicional, DEFAULTS.costoAdicional),
      pctTE: numOrDefault(adv.pctTE, DEFAULTS.pctTE * 100) / 100,
      pctImpuestoPais: numOrDefault(adv.pctImpuestoPais, DEFAULTS.pctImpuestoPais * 100) / 100,
      dolarOficial: numOrDefault(adv.dolarOficial, DEFAULTS.dolarOficial),
      dolarBlue: numOrDefault(adv.dolarBlue, DEFAULTS.dolarBlue),
    })
  }

  function handleAdv(e) {
    setAdv((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const volumenSeleccionado = getVolumenTotal()

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="card">
        <div className="card-header">
          <div className="card-header-icon blue">📦</div>
          <div>
            <h2>Datos del producto y logística</h2>
            <p>Completá los campos para calcular el costo de importación</p>
          </div>
        </div>
        <div className="card-body">

          {/* Subfacturación */}
          <div className="form-section">
            <div className="form-section-title">Subfacturación</div>
            <div className="field">
              <label>¿Hay subfacturación? <span>(obligatorio)</span></label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="subfacturacion"
                    value="no"
                    checked={main.subfacturacion === 'no'}
                    onChange={handleMain}
                  />
                  <span>No</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="subfacturacion"
                    value="si"
                    checked={main.subfacturacion === 'si'}
                    onChange={handleMain}
                  />
                  <span>Sí</span>
                </label>
              </div>
              <span className="field-hint">
                Si hay subfacturación, los impuestos se calculan sobre el valor facturado y el costo real sobre el valor real
              </span>
            </div>
          </div>

          {/* Datos del producto */}
          <div className="form-section">
            <div className="form-section-title">Producto</div>

            <ProductSelector
              productoId={productoId}
              camposAuto={camposAuto}
              haySubfacturacion={haySubfacturacion}
              onSelect={handleProductSelect}
            />

            <div className="field-group" style={{ marginTop: '1rem' }}>
              {main.subfacturacion !== '' && !haySubfacturacion && (
                <div className={`field ${autoClass('precioFOBUnitario')}`}>
                  <label>Precio FOB unitario <span>(USD/unidad)</span></label>
                  <div className="input-wrap has-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      name="precioFOBUnitario"
                      value={main.precioFOBUnitario}
                      onChange={handleMain}
                      min="0"
                      step="0.01"
                      className={camposAuto.includes('precioFOBUnitario') ? 'input-auto-filled' : ''}
                    />
                  </div>
                  <span className="field-hint">Precio por unidad en USD FOB origen</span>
                </div>
              )}
              {haySubfacturacion && (
                <>
                  <div className={`field ${autoClass('precioFOBReal')}`}>
                    <label>Valor real unitario <span>(USD/unidad)</span></label>
                    <div className="input-wrap has-prefix">
                      <span className="prefix">$</span>
                      <input
                        type="number"
                        name="precioFOBReal"
                        value={main.precioFOBReal}
                        onChange={handleMain}
                        min="0"
                        step="0.01"
                        className={camposAuto.includes('precioFOBReal') ? 'input-auto-filled' : ''}
                      />
                    </div>
                    <span className="field-hint">Precio real que pagás por la mercadería</span>
                  </div>
                  <div className="field">
                    <label>Valor facturado unitario <span>(USD/unidad)</span></label>
                    <div className="input-wrap has-prefix">
                      <span className="prefix">$</span>
                      <input
                        type="number"
                        name="precioFOBFacturado"
                        value={main.precioFOBFacturado}
                        onChange={handleMain}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <span className="field-hint">Valor en factura aduanera — base para derechos, TE e IIBB</span>
                  </div>
                </>
              )}
              <div className={`field ${autoClass('unidadesPorCaja')}`}>
                <label>Unidades por caja <span>(pc/ctn)</span></label>
                <div className="input-wrap">
                  <input
                    type="number"
                    name="unidadesPorCaja"
                    value={main.unidadesPorCaja}
                    onChange={handleMain}
                    min="1"
                    step="1"
                    className={camposAuto.includes('unidadesPorCaja') ? 'input-auto-filled' : ''}
                  />
                </div>
                <span className="field-hint">Piezas por caja maestra (ctn)</span>
              </div>
              <div className={`field ${autoClass('volumenPorCaja')}`}>
                <label>Volumen por caja <span>(m³/ctn)</span></label>
                <div className="input-wrap has-suffix">
                  <input
                    type="number"
                    name="volumenPorCaja"
                    value={main.volumenPorCaja}
                    onChange={handleMain}
                    min="0"
                    step="0.001"
                    className={camposAuto.includes('volumenPorCaja') ? 'input-auto-filled' : ''}
                  />
                  <span className="suffix">m³</span>
                </div>
                <span className="field-hint">CBM que ocupa una caja maestra</span>
              </div>
              <div className="field">
                <label>Tipo de contenedor</label>
                <div className="input-wrap">
                  <select
                    name="tipoContenedor"
                    value={main.tipoContenedor}
                    onChange={handleMain}
                    className="select-input"
                  >
                    {CONTENEDORES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} — {c.volumen} m³
                      </option>
                    ))}
                  </select>
                </div>
                <span className="field-hint">
                  Volumen del pedido: <strong>{volumenSeleccionado} m³</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Logística e impuestos */}
          <div className="form-section">
            <div className="form-section-title">Logística e Impuestos</div>
            <div className="field-group">
              <div className="field">
                <label>Flete total <span>(USD)</span></label>
                <div className="input-wrap has-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    name="flete"
                    value={main.flete}
                    onChange={handleMain}
                    min="0"
                    step="1"
                  />
                </div>
                <span className="field-hint">Flete internacional total del pedido</span>
              </div>
              <div className={`field ${autoClass('pctDerechos')}`}>
                <label>% Derechos de importación</label>
                <div className="input-wrap has-suffix">
                  <input
                    type="number"
                    name="pctDerechos"
                    value={main.pctDerechos}
                    onChange={handleMain}
                    min="0"
                    max="100"
                    step="0.1"
                    className={camposAuto.includes('pctDerechos') ? 'input-auto-filled' : ''}
                  />
                  <span className="suffix">%</span>
                </div>
                <span className="field-hint">Arancel de importación según posición arancelaria</span>
              </div>
              <div className="field">
                <label>% IIBB</label>
                <div className="input-wrap has-suffix">
                  <input
                    type="number"
                    name="pctIIBB"
                    value={main.pctIIBB}
                    onChange={handleMain}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <span className="suffix">%</span>
                </div>
                <span className="field-hint">Valor habitual 2,74%. Podés modificarlo si corresponde otro alícuota</span>
              </div>
            </div>
          </div>

          {/* Precio de venta */}
          <div className="form-section">
            <div className="form-section-title">Precio de Venta</div>
            <div className="field-group single">
              <div className="field">
                <label>Precio de venta unitario <span>(USD)</span></label>
                <div className="input-wrap has-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    name="precioVenta"
                    value={main.precioVenta}
                    onChange={handleMain}
                    min="0"
                    step="0.01"
                  />
                </div>
                <span className="field-hint">Precio al que vas a vender el producto; se usa para calcular rentabilidad y ganancia</span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-calcular">
            Calcular costo de importación
          </button>
        </div>
      </div>

      <AdvancedSection adv={adv} onChange={handleAdv} cotizacion={cotizacion} />
    </form>
  )
}
