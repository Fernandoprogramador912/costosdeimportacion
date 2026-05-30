import { useState } from 'react'
import { calcularCostos } from './lib/calculator.js'
import ImportForm from './components/ImportForm.jsx'
import ResultsCards from './components/ResultsCards.jsx'

export default function App() {
  const [resultado, setResultado] = useState(null)
  const [errores, setErrores] = useState([])

  function handleCalcular(params) {
    const calc = calcularCostos(params)
    if (calc.valido) {
      let resultado = calc.resultado

      if (params.subfacturacion) {
        const calcSinSub = calcularCostos({
          ...params,
          subfacturacion: false,
          precioFOBUnitario: params.precioFOBReal,
          precioFOBReal: undefined,
          precioFOBFacturado: undefined,
        })
        if (calcSinSub.valido) {
          resultado = {
            ...resultado,
            comparacionSinSubfacturacion: calcSinSub.resultado,
          }
        }
      }

      setResultado(resultado)
      setErrores([])
    } else {
      setResultado(null)
      setErrores(calc.errores)
    }
    // Scroll hacia los resultados en mobile
    setTimeout(() => {
      const el = document.getElementById('resultados')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="header-badge">
            <span>🚢</span> Herramienta de análisis
          </div>
          <h1>Calculadora de <span>Costos de Importación</span></h1>
          <p>Calculá el costo unitario, factor costo y rentabilidad de tus productos importados en segundos.</p>
        </div>
      </header>

      <main className="app-body">
        <div className="layout-grid">
          <ImportForm onCalcular={handleCalcular} />
          <div id="resultados">
            <ResultsCards resultado={resultado} errores={errores} />
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Los cálculos se basan en la estructura de costos del sistema de importación. Los valores son estimativos.</p>
      </footer>
    </>
  )
}
