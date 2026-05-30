import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useProductos, etiquetaProducto, formatPctDerechos } from '../hooks/useProductos.js'

const EXCEL_URL = '/codigos-productos-y-datos.xlsx'
const MAX_FILTRADOS = 80

export default function ProductSelector({
  productoId,
  camposAuto,
  haySubfacturacion,
  onSelect,
}) {
  const { productos, cargando, error } = useProductos()
  const producto = productos.find((p) => p.id === productoId)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [dropdownPos, setDropdownPos] = useState(null)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (producto) {
      setQuery(etiquetaProducto(producto))
    } else if (!productoId) {
      setQuery('')
    }
  }, [productoId, producto])

  const { items: filtrados, total: totalFiltrados, browsing } = useMemo(
    () => filtrarProductos(productos, query, producto),
    [productos, query, producto],
  )

  useEffect(() => {
    setHighlight(0)
  }, [query])

  function updateDropdownPosition() {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }

  useEffect(() => {
    if (!open) return
    updateDropdownPosition()
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [open, query])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current?.contains(e.target)) return
      if (listRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(e) {
    const value = e.target.value
    setQuery(value)
    setOpen(true)
    if (productoId) onSelect('')
  }

  function handleFocus() {
    if (!cargando && !error) {
      setOpen(true)
      updateDropdownPosition()
      if (productoId) {
        requestAnimationFrame(() => inputRef.current?.select())
      }
    }
  }

  function seleccionar(p) {
    onSelect(p.id)
    setQuery(etiquetaProducto(p))
    setOpen(false)
    inputRef.current?.blur()
  }

  function handleKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }
    if (!open) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((i) => Math.min(i + 1, filtrados.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtrados[highlight]) seleccionar(filtrados[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function limpiar() {
    setQuery('')
    onSelect('')
    setOpen(false)
    inputRef.current?.focus()
  }

  const showDropdown = open && !cargando && !error && dropdownPos

  const dropdown = showDropdown ? (
    <div
      ref={listRef}
      className="autocomplete-list autocomplete-list-portal"
      role="listbox"
      style={{
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
      }}
    >
      {filtrados.length === 0 ? (
        <div className="autocomplete-empty">No se encontraron productos</div>
      ) : (
        <>
          {browsing && (
            <div className="autocomplete-browse-hint">
              {totalFiltrados} productos — desplazate para ver más o escribí para filtrar
            </div>
          )}
          <ul className="autocomplete-options">
            {filtrados.map((p, idx) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={idx === highlight}
                  className={`autocomplete-option ${idx === highlight ? 'highlighted' : ''} ${p.id === productoId ? 'selected' : ''}`}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => seleccionar(p)}
                >
                  <span className="autocomplete-option-code">{p.codigo}</span>
                  <span className="autocomplete-option-name">{p.nombre}</span>
                  <span className="autocomplete-option-meta">
                    {p.unidadesPorCaja} u/caja · FOB ${p.precioFOBUnitario} · {formatPctDerechos(p.pctDerechos)} der.
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {totalFiltrados > filtrados.length && (
            <div className="autocomplete-footer">
              Mostrando {filtrados.length} de {totalFiltrados}. Seguí escribiendo para acotar.
            </div>
          )}
        </>
      )}
    </div>
  ) : null

  return (
    <div className="producto-catalogo">
      <div className="producto-catalogo-top">
        <div>
          <label htmlFor="productoBusqueda">Buscar producto del catálogo</label>
          <span className="field-hint" style={{ marginTop: '.25rem' }}>
            Hacé clic en el campo para ver todos los productos, o escribí para filtrar
          </span>
        </div>
        <a href={EXCEL_URL} download className="btn-download-excel">
          Descargar Excel de productos
        </a>
      </div>

      <div className="autocomplete-wrap" ref={wrapRef}>
        <div className="autocomplete-input-wrap">
          <input
            ref={inputRef}
            id="productoBusqueda"
            type="text"
            className="autocomplete-input"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={cargando ? 'Cargando catálogo…' : 'Buscar por código o descripción…'}
            disabled={cargando || !!error}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
          />
          {query && (
            <button type="button" className="autocomplete-clear" onClick={limpiar} aria-label="Limpiar búsqueda">
              ×
            </button>
          )}
        </div>
      </div>

      {dropdown && createPortal(dropdown, document.body)}

      {error && (
        <span className="field-hint" style={{ color: 'var(--color-red)' }}>
          {error} Podés completar los datos manualmente.
        </span>
      )}

      {producto && (
        <div className="producto-cargado-badge">
          <span className="badge-icon">✓</span>
          <div>
            <strong>Datos cargados del catálogo</strong>
            <span>{producto.codigo} — {producto.nombre}</span>
          </div>
        </div>
      )}

      {camposAuto.length > 0 && (
        <div className="campos-auto-list">
          Campos completados automáticamente:{' '}
          {camposAuto.map((campo) => (
            <span key={campo} className="campo-auto-tag">{labelCampo(campo, haySubfacturacion)}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function filtrarProductos(productos, query, productoSeleccionado) {
  const q = query.trim().toLowerCase()

  const esEtiquetaSeleccionada =
    productoSeleccionado &&
    q === etiquetaProducto(productoSeleccionado).toLowerCase()

  if (q.length === 0 || esEtiquetaSeleccionada) {
    return {
      items: productos,
      total: productos.length,
      browsing: true,
    }
  }

  const palabras = q.split(/\s+/).filter(Boolean)
  const matches = productos.filter((p) => {
    const texto = `${p.codigo} ${p.nombre}`.toLowerCase()
    return palabras.every((pal) => texto.includes(pal))
  })

  // Priorizar coincidencias en el código (evita confundir AL4063 "AR111" con códigos AR111-*)
  matches.sort((a, b) => {
    const aEnCodigo = palabras.every((pal) => a.codigo.toLowerCase().includes(pal))
    const bEnCodigo = palabras.every((pal) => b.codigo.toLowerCase().includes(pal))
    if (aEnCodigo !== bEnCodigo) return aEnCodigo ? -1 : 1
    return a.codigo.localeCompare(b.codigo)
  })

  return {
    items: matches.slice(0, MAX_FILTRADOS),
    total: matches.length,
    browsing: false,
  }
}

function labelCampo(campo, haySubfacturacion) {
  const labels = {
    unidadesPorCaja: 'Unidades por caja',
    volumenPorCaja: 'Volumen por caja',
    precioFOBUnitario: 'Precio FOB',
    precioFOBReal: 'Valor real',
    pctDerechos: '% Derechos',
  }
  return labels[campo] || campo
}

export function isAutoField(name) {
  return ['unidadesPorCaja', 'volumenPorCaja', 'precioFOBUnitario', 'precioFOBReal', 'pctDerechos'].includes(name)
}
