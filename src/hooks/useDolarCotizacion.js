import { useCallback, useEffect, useState } from 'react'
import { fetchCotizacionesDolar } from '../lib/dolarApi.js'

export function useDolarCotizacion(onUpdate) {
  const [estado, setEstado] = useState('idle') // idle | loading | ok | error
  const [fechaActualizacion, setFechaActualizacion] = useState(null)
  const [error, setError] = useState(null)

  const actualizar = useCallback(async () => {
    setEstado('loading')
    setError(null)
    try {
      const data = await fetchCotizacionesDolar()
      onUpdate({
        dolarOficial: data.dolarOficial,
        dolarBlue: data.dolarBlue,
      })
      setFechaActualizacion(data.fechaActualizacion)
      setEstado('ok')
    } catch (err) {
      setEstado('error')
      setError(err.message || 'Error al obtener cotizaciones.')
    }
  }, [onUpdate])

  useEffect(() => {
    actualizar()
  }, [actualizar])

  return { estado, fechaActualizacion, error, actualizar }
}
