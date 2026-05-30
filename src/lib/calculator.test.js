import { describe, it, expect } from 'vitest'
import { calcularCostos, DEFAULTS } from './calculator.js'

// Datos base extraídos de la fila 7 del Excel original
const BASE = {
  subfacturacion: false,
  precioFOBUnitario: 0.25,     // Q
  volumenPorCaja: 0.02,        // M
  unidadesPorCaja: 100,        // K
  volumenTotal: 66,            // O
  flete: 5000,                 // Z
  pctDerechos: 0.20,           // AI
  precioVenta: 0.41,           // V
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

describe('calcularCostos – caso base del Excel', () => {
  it('calcula la cantidad de unidades correctamente (N = O * K / M)', () => {
    const { resultado } = calcularCostos(BASE)
    // N = 66 * 100 / 0.02 = 330000
    expect(resultado.qty).toBeCloseTo(330000, 0)
  })

  it('calcula el total FOB correctamente (Y = N * Q)', () => {
    const { resultado } = calcularCostos(BASE)
    // Y = 330000 * 0.25 = 82500
    expect(resultado.totalFOB).toBeCloseTo(82500, 2)
  })

  it('calcula flete+seg al Blue sin diferencial (diferencial = 0 cuando oficial == blue)', () => {
    const { resultado } = calcularCostos(BASE)
    // diferencial = (1400/1400) - 1 = 0 → AB = flete + seguro = 5500
    expect(resultado.diferencial).toBeCloseTo(0, 6)
    expect(resultado.fleteSegBlue).toBeCloseTo(5500, 2)
  })

  it('calcula CIF correctamente (AC = Y + AB)', () => {
    const { resultado } = calcularCostos(BASE)
    // CIF = 82500 + 5500 = 88000
    expect(resultado.CIF).toBeCloseTo(88000, 2)
  })

  it('calcula derechos correctamente (AJ = AC * AI)', () => {
    const { resultado } = calcularCostos(BASE)
    // Derechos = 88000 * 0.20 = 17600
    expect(resultado.derechos).toBeCloseTo(17600, 2)
  })

  it('calcula TE correctamente (AL = AC * AK)', () => {
    const { resultado } = calcularCostos(BASE)
    // TE = 88000 * 0.03 = 2640
    expect(resultado.TE).toBeCloseTo(2640, 2)
  })

  it('calcula IIBB correctamente (AV = (AC + AJ + AL) * AU)', () => {
    const { resultado } = calcularCostos(BASE)
    // base = 88000 + 17600 + 2640 = 108240 → IIBB = 108240 * 0.0274 = 2965.78
    expect(resultado.IIBB).toBeCloseTo(2965.78, 1)
  })

  it('calcula el TOTAL correctamente (AD)', () => {
    const { resultado } = calcularCostos(BASE)
    // AD = 88000 + 1000 + 2000 + 3000 + 17600 + 2640 + 0 + 2965.78 = 117205.78
    expect(resultado.total).toBeCloseTo(117205.78, 1)
  })

  it('calcula el costo unitario final (R = AD / N)', () => {
    const { resultado } = calcularCostos(BASE)
    // R = 117205.78 / 330000 ≈ 0.3552
    expect(resultado.costoUnitario).toBeCloseTo(0.3552, 3)
  })

  it('calcula el factor costo (S = R / Q)', () => {
    const { resultado } = calcularCostos(BASE)
    // S = 0.3552 / 0.25 ≈ 1.421
    expect(resultado.factorCosto).toBeCloseTo(1.421, 2)
  })

  it('calcula el factor rentabilidad (T = V / R)', () => {
    const { resultado } = calcularCostos(BASE)
    // T = 0.41 / 0.3552 ≈ 1.154
    expect(resultado.factorRentabilidad).toBeCloseTo(1.154, 2)
  })

  it('calcula ganancia % (U = (V - R) / R)', () => {
    const { resultado } = calcularCostos(BASE)
    // U = (0.41 - 0.3552) / 0.3552 ≈ 0.154 → 15.4%
    expect(resultado.gananciaPct).toBeCloseTo(0.154, 2)
  })
})

describe('calcularCostos – diferencial blue/oficial', () => {
  it('incrementa el costo cuando blue > oficial', () => {
    const { resultado: r1 } = calcularCostos(BASE)
    const { resultado: r2 } = calcularCostos({ ...BASE, dolarBlue: 2800 })
    // Con blue al doble, el costo sube por la conversión del flete
    expect(r2.costoUnitario).toBeGreaterThan(r1.costoUnitario)
  })

  it('diferencial se calcula correctamente', () => {
    const { resultado } = calcularCostos({ ...BASE, dolarOficial: 1000, dolarBlue: 1500 })
    // (1500/1000) - 1 = 0.5
    expect(resultado.diferencial).toBeCloseTo(0.5, 6)
  })
})

describe('calcularCostos – validaciones', () => {
  it('devuelve error si faltan campos obligatorios', () => {
    const { valido, errores } = calcularCostos({
      ...BASE,
      precioFOBUnitario: '',
      volumenPorCaja: '',
    })
    expect(valido).toBe(false)
    expect(errores.length).toBeGreaterThan(0)
  })

  it('devuelve error si volumen por caja es 0', () => {
    const { valido } = calcularCostos({ ...BASE, volumenPorCaja: 0 })
    expect(valido).toBe(false)
  })

  it('devuelve error si precio FOB es 0', () => {
    const { valido } = calcularCostos({ ...BASE, precioFOBUnitario: 0 })
    expect(valido).toBe(false)
  })

  it('devuelve error si flete es 0', () => {
    const { valido } = calcularCostos({ ...BASE, flete: 0 })
    expect(valido).toBe(false)
  })

  it('acepta precio de venta 0 (para análisis de break-even)', () => {
    const { valido, resultado } = calcularCostos({ ...BASE, precioVenta: 0 })
    expect(valido).toBe(true)
    expect(resultado.gananciaPct).toBeCloseTo(-1, 4) // -100%
  })

  it('acepta % de derechos 0', () => {
    const { valido } = calcularCostos({ ...BASE, pctDerechos: 0 })
    expect(valido).toBe(true)
  })
})

describe('calcularCostos – defaults', () => {
  it('usa los defaults correctos del Excel', () => {
    expect(DEFAULTS.seguro).toBe(500)
    expect(DEFAULTS.costoDespacho).toBe(1000)
    expect(DEFAULTS.costoTerminal).toBe(2000)
    expect(DEFAULTS.costoAdicional).toBe(3000)
    expect(DEFAULTS.pctTE).toBe(0.03)
    expect(DEFAULTS.pctImpuestoPais).toBe(0)
    expect(DEFAULTS.pctIIBB).toBe(0.0274)
    expect(DEFAULTS.dolarOficial).toBe(1400)
    expect(DEFAULTS.dolarBlue).toBe(1400)
  })

  it('usa defaults cuando los campos avanzados no se pasan', () => {
    const { resultado: r1 } = calcularCostos(BASE)
    const { resultado: r2 } = calcularCostos({
      subfacturacion: false,
      precioFOBUnitario: BASE.precioFOBUnitario,
      volumenPorCaja: BASE.volumenPorCaja,
      unidadesPorCaja: BASE.unidadesPorCaja,
      volumenTotal: BASE.volumenTotal,
      flete: BASE.flete,
      pctDerechos: BASE.pctDerechos,
      precioVenta: BASE.precioVenta,
    })
    expect(r1.costoUnitario).toBeCloseTo(r2.costoUnitario, 6)
  })
})

describe('calcularCostos – subfacturación', () => {
  it('reduce el costo unitario vs sin subfacturación', () => {
    const { resultado: sinSub } = calcularCostos(BASE)
    const { resultado: conSub } = calcularCostos({
      ...BASE,
      subfacturacion: true,
      precioFOBReal: 0.25,
      precioFOBFacturado: 0.15,
      precioFOBUnitario: undefined,
    })
    expect(conSub.costoUnitario).toBeLessThan(sinSub.costoUnitario)
    expect(conSub.totalFOB).toBeCloseTo(82500, 2)
    expect(conSub.totalFOBFacturado).toBeCloseTo(49500, 2)
  })

  it('calcula impuestos sobre base facturada', () => {
    const { resultado } = calcularCostos({
      ...BASE,
      subfacturacion: true,
      precioFOBReal: 0.25,
      precioFOBFacturado: 0.15,
    })
    expect(resultado.CIFImpuestos).toBeCloseTo(55000, 2)
    expect(resultado.derechos).toBeCloseTo(11000, 2)
  })

  it('factor costo usa precio real', () => {
    const { resultado } = calcularCostos({
      ...BASE,
      subfacturacion: true,
      precioFOBReal: 0.25,
      precioFOBFacturado: 0.15,
    })
    expect(resultado.factorCosto).toBeCloseTo(resultado.costoUnitario / 0.25, 4)
  })

  it('devuelve error si no se indica subfacturación', () => {
    const { valido, errores } = calcularCostos({ ...BASE, subfacturacion: null })
    expect(valido).toBe(false)
    expect(errores.some((e) => e.includes('subfacturación'))).toBe(true)
  })

  it('devuelve error si facturado supera al real', () => {
    const { valido, errores } = calcularCostos({
      ...BASE,
      subfacturacion: true,
      precioFOBReal: 0.15,
      precioFOBFacturado: 0.25,
    })
    expect(valido).toBe(false)
    expect(errores.some((e) => e.includes('facturado'))).toBe(true)
  })
})
