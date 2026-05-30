import { useEffect, useState } from 'react'

export function useProductos() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/productos.json')
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar el catálogo de productos.')
        return res.json()
      })
      .then((data) => {
        setProductos(data)
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }, [])

  return { productos, cargando, error }
}

export function etiquetaProducto(p) {
  const nombre = p.nombre.length > 45 ? `${p.nombre.slice(0, 45)}…` : p.nombre
  return `${p.codigo} — ${nombre} (${p.unidadesPorCaja} u/caja · FOB $${p.precioFOBUnitario} · ${formatPctDerechos(p.pctDerechos)}% der.)`
}

export function formatPctDerechos(valor) {
  return Number(valor).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
