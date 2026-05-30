import { useState } from 'react'
import { fmt, fmtPct } from '../lib/calculator.js'

export default function ResultsCards({ resultado, errores }) {
  const [desgloseOpen, setDesgloseOpen] = useState(false)

  if (errores && errores.length > 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-header-icon amber">📊</div>
          <div>
            <h2>Resultados</h2>
            <p>Corregí los errores para ver el cálculo</p>
          </div>
        </div>
        <div className="card-body">
          <div className="error-box">
            <p>Por favor corregí lo siguiente:</p>
            <ul>
              {errores.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (!resultado) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-header-icon amber">📊</div>
          <div>
            <h2>Resultados</h2>
            <p>Completá el formulario y presioná calcular</p>
          </div>
        </div>
        <div className="card-body">
          <div className="results-empty">
            <div className="empty-icon">📈</div>
            <p>Completá los datos del producto y hacé clic en <strong>Calcular</strong> para ver el análisis de costos</p>
          </div>
        </div>
      </div>
    )
  }

  const { comparacionSinSubfacturacion } = resultado
  const tituloEscenario = resultado.subfacturacion
    ? 'Con subfacturación'
    : 'Resultados del análisis'

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-icon green">📊</div>
        <div>
          <h2>{tituloEscenario}</h2>
          <p>
            {resultado.subfacturacion
              ? 'Impuestos calculados sobre valor facturado'
              : 'Basado en las fórmulas de importación'}
          </p>
        </div>
      </div>
      <div className="card-body">

        <KpiGrid resultado={resultado} />

        {comparacionSinSubfacturacion && (
          <ComparacionSubfacturacion
            conSub={resultado}
            sinSub={comparacionSinSubfacturacion}
          />
        )}

        <button
          type="button"
          className={`desglose-toggle ${desgloseOpen ? 'open' : ''}`}
          onClick={() => setDesgloseOpen((v) => !v)}
        >
          Ver desglose de costos
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {desgloseOpen && <DesgloseTable resultado={resultado} />}

      </div>
    </div>
  )
}

function KpiGrid({ resultado, compact = false }) {
  const { costoUnitario, factorCosto, factorRentabilidad, gananciaPct } = resultado
  const gananciaBuena = gananciaPct !== null && gananciaPct > 0

  return (
    <div className={`kpi-grid ${compact ? 'kpi-grid-compact' : ''}`}>
      <div className="kpi-card blue">
        <div className="kpi-label">Costo unitario</div>
        <div className="kpi-value">USD {fmt(costoUnitario, 4)}</div>
        {!compact && <div className="kpi-sub">Costo final por unidad importada</div>}
      </div>
      <div className="kpi-card teal">
        <div className="kpi-label">Factor costo</div>
        <div className="kpi-value">× {fmt(factorCosto, 3)}</div>
        {!compact && <div className="kpi-sub">Multiplicador sobre precio FOB</div>}
      </div>
      <div className={`kpi-card ${gananciaBuena ? 'green' : 'red'}`}>
        <div className="kpi-label">Factor rentabilidad</div>
        <div className="kpi-value">× {fmt(factorRentabilidad, 3)}</div>
        {!compact && <div className="kpi-sub">Precio venta sobre costo unitario</div>}
      </div>
      <div className={`kpi-card ${gananciaBuena ? 'amber' : 'red'}`}>
        <div className="kpi-label">Ganancia %</div>
        <div className="kpi-value">{fmtPct(gananciaPct, 1)}</div>
        {!compact && <div className="kpi-sub">Margen sobre costo unitario</div>}
      </div>
    </div>
  )
}

function ComparacionSubfacturacion({ conSub, sinSub }) {
  const diffCostoUnit = sinSub.costoUnitario - conSub.costoUnitario
  const diffTotal = diffCostoUnit * conSub.qty
  const diffGananciaPct = (conSub.gananciaPct ?? 0) - (sinSub.gananciaPct ?? 0)
  const ahorroImpuestos =
    (sinSub.derechos + sinSub.TE + sinSub.impuestoPais + sinSub.IIBB) -
    (conSub.derechos + conSub.TE + conSub.impuestoPais + conSub.IIBB)

  const filas = [
    {
      label: 'Costo unitario',
      con: 'USD ' + fmt(conSub.costoUnitario, 4),
      sin: 'USD ' + fmt(sinSub.costoUnitario, 4),
      diff: fmtAhorroCosto(diffCostoUnit),
    },
    {
      label: 'Factor costo',
      con: '× ' + fmt(conSub.factorCosto, 3),
      sin: '× ' + fmt(sinSub.factorCosto, 3),
      diff: fmtAhorroExtra(sinSub.factorCosto - conSub.factorCosto, 3),
    },
    {
      label: 'Factor rentabilidad',
      con: '× ' + fmt(conSub.factorRentabilidad, 3),
      sin: '× ' + fmt(sinSub.factorRentabilidad, 3),
      diff: fmtAhorroMas(conSub.factorRentabilidad - sinSub.factorRentabilidad, 3),
    },
    {
      label: 'Ganancia %',
      con: fmtPct(conSub.gananciaPct, 1),
      sin: fmtPct(sinSub.gananciaPct, 1),
      diff: fmtAhorroMas(diffGananciaPct * 100, 1, true),
    },
  ]

  return (
    <div className="comparacion-block">
      <div className="comparacion-header">
        <h3>Sin subfacturación</h3>
        <p>Si declararas el valor real completo en la factura aduanera</p>
      </div>

      <KpiGrid resultado={sinSub} compact />

      <div className="comparacion-table">
        <div className="comparacion-table-head">
          <span>Métrica</span>
          <span>Con subfact.</span>
          <span>Sin subfact.</span>
          <span>Diferencia</span>
        </div>
        {filas.map((fila) => (
          <div key={fila.label} className="comparacion-table-row">
            <span className="label">{fila.label}</span>
            <span>{fila.con}</span>
            <span>{fila.sin}</span>
            <span className={`diff ${fila.diff.positive ? 'positive' : fila.diff.negative ? 'negative' : ''}`}>
              {fila.diff.text}
            </span>
          </div>
        ))}
      </div>

      <div className="comparacion-resumen">
        <div className="comparacion-resumen-item">
          <span className="label">Ahorro en impuestos (total pedido)</span>
          <span className="value positive">USD {fmt(ahorroImpuestos)}</span>
        </div>
        <div className="comparacion-resumen-item">
          <span className="label">Ahorro costo unitario</span>
          <span className="value positive">USD {fmt(diffCostoUnit, 4)}</span>
        </div>
        <div className="comparacion-resumen-item">
          <span className="label">Ahorro total del pedido</span>
          <span className="value positive">USD {fmt(diffTotal)}</span>
        </div>
      </div>
    </div>
  )
}

function fmtAhorroCosto(valor, decimales = 4) {
  if (valor === null || isNaN(valor)) return { text: '—', positive: false, negative: false }
  if (valor > 0) return { text: `USD ${fmt(valor, decimales)} menos`, positive: true, negative: false }
  if (valor < 0) return { text: `USD ${fmt(Math.abs(valor), decimales)} más`, positive: false, negative: true }
  return { text: '—', positive: false, negative: false }
}

function fmtAhorroExtra(valor, decimales) {
  if (valor === null || isNaN(valor)) return { text: '—', positive: false, negative: false }
  const formatted = Math.abs(valor).toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
  if (valor > 0) return { text: `${formatted} menos`, positive: true, negative: false }
  if (valor < 0) return { text: `${formatted} más`, positive: false, negative: true }
  return { text: '—', positive: false, negative: false }
}

function fmtAhorroMas(valor, decimales, esPct = false) {
  if (valor === null || isNaN(valor)) return { text: '—', positive: false, negative: false }
  const formatted = Math.abs(valor).toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
  const suffix = esPct ? ' pp' : ''
  if (valor > 0) return { text: `${formatted}${suffix} más`, positive: true, negative: false }
  if (valor < 0) return { text: `${formatted}${suffix} menos`, positive: false, negative: true }
  return { text: '—', positive: false, negative: false }
}

function DesgloseTable({ resultado }) {
  const {
    subfacturacion, totalFOB, totalFOBFacturado,
    qty, fleteSegBlue, CIF, CIFImpuestos,
    derechos, TE, impuestoPais, IIBB,
    costoDespacho, costoTerminal, costoAdicional,
    total, costoUnitario,
    diferencial,
  } = resultado

  const rows = [
    { label: 'Unidades totales del pedido', value: fmt(qty, 0) + ' uds' },
    ...(subfacturacion
      ? [
          { label: 'Total FOB real', value: 'USD ' + fmt(totalFOB) },
          { label: 'Total FOB facturado (base imponible)', value: 'USD ' + fmt(totalFOBFacturado) },
        ]
      : [{ label: 'Total FOB', value: 'USD ' + fmt(totalFOB) }]),
    { label: `Flete + Seguro al Blue (dif. ${fmtPct(diferencial, 1)})`, value: 'USD ' + fmt(fleteSegBlue) },
    { separator: true, label: subfacturacion ? 'CIF real (FOB real + Flete/Seg.)' : 'CIF (FOB + Flete/Seg. Blue)', value: 'USD ' + fmt(CIF) },
    ...(subfacturacion
      ? [{ label: 'CIF imponible (FOB facturado + Flete/Seg.)', value: 'USD ' + fmt(CIFImpuestos) }]
      : []),
    { label: 'Derechos de importación', value: 'USD ' + fmt(derechos) },
    { label: 'T.E. (tasa estadística)', value: 'USD ' + fmt(TE) },
    { label: 'Impuesto país', value: 'USD ' + fmt(impuestoPais) },
    { label: 'IIBB', value: 'USD ' + fmt(IIBB) },
    { label: 'Costo despacho', value: 'USD ' + fmt(costoDespacho) },
    { label: 'Costos terminal / dep. fiscal', value: 'USD ' + fmt(costoTerminal) },
    { label: 'Costos adicionales', value: 'USD ' + fmt(costoAdicional) },
    { separator: true, label: 'Total general', value: 'USD ' + fmt(total) },
    { separator: true, label: 'Costo unitario final', value: 'USD ' + fmt(costoUnitario, 4) },
  ]

  return (
    <div className="desglose-table">
      {rows.map((row, i) => (
        <div key={i} className={`desglose-row ${row.separator ? 'separator' : ''}`}>
          <span className="label">{row.label}</span>
          <span className="value">{row.value}</span>
        </div>
      ))}
    </div>
  )
}
