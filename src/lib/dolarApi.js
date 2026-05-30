const API_BASE = 'https://dolarapi.com/v1/dolares'

/**
 * Obtiene cotización oficial y blue desde DolarAPI.
 * Usa precio de venta (referencia habitual para costos de importación).
 */
export async function fetchCotizacionesDolar() {
  const [resOficial, resBlue] = await Promise.all([
    fetch(`${API_BASE}/oficial`),
    fetch(`${API_BASE}/blue`),
  ])

  if (!resOficial.ok || !resBlue.ok) {
    throw new Error('No se pudieron obtener las cotizaciones del dólar.')
  }

  const oficial = await resOficial.json()
  const blue = await resBlue.json()

  if (!oficial?.venta || !blue?.venta) {
    throw new Error('La respuesta de DolarAPI no contiene cotizaciones válidas.')
  }

  const fechas = [oficial.fechaActualizacion, blue.fechaActualizacion].filter(Boolean)
  const fechaActualizacion = fechas.length
    ? fechas.sort((a, b) => new Date(b) - new Date(a))[0]
    : null

  return {
    dolarOficial: oficial.venta,
    dolarBlue: blue.venta,
    fechaActualizacion,
  }
}

export function formatFechaCotizacion(isoString) {
  if (!isoString) return null
  try {
    return new Date(isoString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}
