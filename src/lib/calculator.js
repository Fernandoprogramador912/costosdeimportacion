/**
 * Motor de cálculo de costos de importación.
 * Fórmulas extraídas del Excel "PRODUCTOS ACTIVOS (2)", fila 7.
 *
 * Nomenclatura original Excel → variable JS:
 *   Q  → precioFOBUnitario
 *   M  → volumenPorCaja    (cbm/ctn)
 *   K  → unidadesPorCaja   (pc/ctn)
 *   O  → volumenTotal      (cbm totales del pedido)
 *   Z  → flete
 *   AA → seguro
 *   AE → costoDespacho
 *   AF → costoTerminal
 *   AG → costoAdicional
 *   AI → pctDerechos       (decimal, ej 0.20 = 20%)
 *   AK → pctTE             (decimal, ej 0.03 = 3%)
 *   AM → pctImpuestoPais   (decimal)
 *   AU → pctIIBB           (decimal, ej 0.0274 = 2.74%)
 *   H1 → dolarOficial
 *   H2 → dolarBlue
 *   V  → precioVenta
 *
 * Resultados clave:
 *   R  = costoUnitario
 *   S  = factorCosto
 *   T  = factorRentabilidad
 *   U  = gananciaPct
 */

export const DEFAULTS = {
  seguro: 500,
  costoDespacho: 1000,
  costoTerminal: 2000,
  costoAdicional: 3000,
  pctTE: 0.03,
  pctImpuestoPais: 0,
  pctIIBB: 0.0274,
  dolarOficial: 1400,
  dolarBlue: 1400,
}

/**
 * @param {object} params
 * @param {boolean} [params.subfacturacion]     si hay subfacturación
 * @param {number} params.precioFOBUnitario  USD por unidad (Q) — sin subfacturación
 * @param {number} [params.precioFOBReal]      USD real por unidad — con subfacturación
 * @param {number} [params.precioFOBFacturado] USD facturado por unidad — base imponible
 * @param {number} params.volumenPorCaja     m³ por caja/ctn (M)
 * @param {number} params.unidadesPorCaja    piezas por ctn (K)
 * @param {number} params.volumenTotal       m³ totales del pedido (O)
 * @param {number} params.flete              USD flete total (Z)
 * @param {number} params.pctDerechos        fracción, ej 0.20 (AI)
 * @param {number} params.precioVenta        USD precio venta unitario (V)
 * @param {number} [params.seguro]           USD seguro (AA)
 * @param {number} [params.costoDespacho]    USD costo despacho (AE)
 * @param {number} [params.costoTerminal]    USD costos terminal/dep. fiscal (AF)
 * @param {number} [params.costoAdicional]   USD costos adicionales (AG)
 * @param {number} [params.pctTE]            fracción % T.E. (AK)
 * @param {number} [params.pctImpuestoPais]  fracción % impuesto país (AM)
 * @param {number} [params.pctIIBB]          fracción % IIBB (AU)
 * @param {number} [params.dolarOficial]     valor dólar oficial (H1)
 * @param {number} [params.dolarBlue]        valor dólar blue (H2)
 * @returns {object} resultado con todos los intermedios y resultados clave
 */
export function calcularCostos({
  subfacturacion = false,
  precioFOBUnitario,
  precioFOBReal,
  precioFOBFacturado,
  volumenPorCaja,
  unidadesPorCaja,
  volumenTotal,
  flete,
  pctDerechos,
  precioVenta,
  seguro = DEFAULTS.seguro,
  costoDespacho = DEFAULTS.costoDespacho,
  costoTerminal = DEFAULTS.costoTerminal,
  costoAdicional = DEFAULTS.costoAdicional,
  pctTE = DEFAULTS.pctTE,
  pctImpuestoPais = DEFAULTS.pctImpuestoPais,
  pctIIBB = DEFAULTS.pctIIBB,
  dolarOficial = DEFAULTS.dolarOficial,
  dolarBlue = DEFAULTS.dolarBlue,
}) {
  const errores = validarEntradas({
    subfacturacion,
    precioFOBUnitario,
    precioFOBReal,
    precioFOBFacturado,
    volumenPorCaja,
    unidadesPorCaja,
    volumenTotal,
    flete,
    pctDerechos,
    precioVenta,
  })
  if (errores.length > 0) {
    return { valido: false, errores, resultado: null }
  }

  const precioReal = subfacturacion ? Number(precioFOBReal) : Number(precioFOBUnitario)
  const precioFacturado = subfacturacion ? Number(precioFOBFacturado) : Number(precioFOBUnitario)

  // I1 = (dolarBlue / dolarOficial) - 1
  const diferencial = dolarOficial > 0 ? (dolarBlue / dolarOficial) - 1 : 0

  // N = O * K / M  →  qty (unidades totales del pedido)
  const qty = (volumenTotal * unidadesPorCaja) / volumenPorCaja

  // Y_real = N * Q_real  →  costo real de mercadería
  const totalFOB = qty * precioReal
  // Y_fact = N * Q_fact  →  base imponible aduanera
  const totalFOBFacturado = qty * precioFacturado

  // AB = ((Z + AA) * I1) + Z + AA  →  flete+seguro convertido a blue
  const fleteSegBlue = (flete + seguro) * diferencial + flete + seguro

  // CIF real (costo mercadería + logística)
  const CIF = totalFOB + fleteSegBlue
  // CIF imponible (base para derechos, TE, IIBB)
  const CIFImpuestos = totalFOBFacturado + fleteSegBlue

  // AJ = CIF_imp * AI  →  $ derechos
  const derechos = CIFImpuestos * pctDerechos

  // AL = CIF_imp * AK  →  $ T.E.
  const TE = CIFImpuestos * pctTE

  // AN = Y_fact * AM  →  $ impuesto país (sobre FOB facturado)
  const impuestoPais = totalFOBFacturado * pctImpuestoPais

  // AV = (CIF_imp + AJ + AL) * AU  →  $ IIBB
  const baseIIBB = CIFImpuestos + derechos + TE
  const IIBB = baseIIBB * pctIIBB

  // AD = Y_real + AB + AE + AF + AG + AJ + AL + AN + AV
  const total = CIF + costoDespacho + costoTerminal + costoAdicional + derechos + TE + impuestoPais + IIBB

  if (qty <= 0) {
    return {
      valido: false,
      errores: ['La cantidad de unidades calculada es 0 o negativa. Revisá volumen/caja y volumen total.'],
      resultado: null,
    }
  }

  // R = AD / N
  const costoUnitario = total / qty

  // S = R / Q_real
  const factorCosto = precioReal > 0 ? costoUnitario / precioReal : null

  // T = V / R
  const factorRentabilidad = costoUnitario > 0 ? precioVenta / costoUnitario : null

  // U = (V - R) / R
  const gananciaPct = costoUnitario > 0 ? (precioVenta - costoUnitario) / costoUnitario : null

  return {
    valido: true,
    errores: [],
    resultado: {
      subfacturacion,
      precioReal,
      precioFacturado,
      // Intermedios
      diferencial,
      qty,
      totalFOB,
      totalFOBFacturado,
      fleteSegBlue,
      CIF,
      CIFImpuestos,
      derechos,
      TE,
      impuestoPais,
      IIBB,
      costoDespacho,
      costoTerminal,
      costoAdicional,
      total,
      // Resultados clave (columnas Excel)
      costoUnitario,       // R
      factorCosto,         // S
      factorRentabilidad,  // T
      gananciaPct,         // U
    },
  }
}

function validarEntradas(campos) {
  const errores = []

  if (campos.subfacturacion !== true && campos.subfacturacion !== false) {
    errores.push('Debés indicar si hay subfacturación (Sí o No).')
    return errores
  }

  const positivos = {
    volumenPorCaja: 'Volumen por caja',
    unidadesPorCaja: 'Unidades por caja',
    volumenTotal: 'Volumen total del pedido',
    flete: 'Flete',
  }

  if (campos.subfacturacion) {
    const fobCampos = {
      precioFOBReal: 'Valor real unitario',
      precioFOBFacturado: 'Valor facturado unitario',
    }
    for (const [key, label] of Object.entries(fobCampos)) {
      const v = campos[key]
      if (v === null || v === undefined || v === '' || isNaN(Number(v))) {
        errores.push(`${label} es obligatorio cuando hay subfacturación.`)
      } else if (Number(v) <= 0) {
        errores.push(`${label} debe ser mayor a 0.`)
      }
    }
    if (
      campos.precioFOBReal &&
      campos.precioFOBFacturado &&
      Number(campos.precioFOBFacturado) > Number(campos.precioFOBReal)
    ) {
      errores.push('El valor facturado no puede ser mayor al valor real.')
    }
  } else if (campos.subfacturacion === false) {
    positivos.precioFOBUnitario = 'Precio FOB unitario'
  }

  for (const [key, label] of Object.entries(positivos)) {
    const v = campos[key]
    if (v === null || v === undefined || v === '' || isNaN(Number(v))) {
      errores.push(`${label} es obligatorio.`)
    } else if (Number(v) <= 0) {
      errores.push(`${label} debe ser mayor a 0.`)
    }
  }
  if (
    campos.pctDerechos === null ||
    campos.pctDerechos === undefined ||
    campos.pctDerechos === '' ||
    isNaN(Number(campos.pctDerechos))
  ) {
    errores.push('% Derechos de importación es obligatorio.')
  }
  if (
    campos.precioVenta === null ||
    campos.precioVenta === undefined ||
    campos.precioVenta === '' ||
    isNaN(Number(campos.precioVenta))
  ) {
    errores.push('Precio de venta es obligatorio.')
  } else if (Number(campos.precioVenta) < 0) {
    errores.push('Precio de venta no puede ser negativo.')
  }
  return errores
}

export function fmt(valor, decimales = 2) {
  if (valor === null || valor === undefined || isNaN(valor)) return '—'
  return valor.toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
}

export function fmtPct(valor, decimales = 1) {
  if (valor === null || valor === undefined || isNaN(valor)) return '—'
  return `${(valor * 100).toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })}%`
}
