# Calculadora de Costos de Importación

Web app para calcular costos de importación unitarios y rentabilidad de productos, basada en la estructura del Excel de análisis de productos activos.

## Uso local

```bash
npm install
npm run dev
```

Abre **http://localhost:5173** en el navegador.

### Contraseña de acceso

El sitio en producción está protegido con contraseña (sin usuario). La clave **no va en el código** — se configura en Vercel.

En **Vercel → Settings → Environment Variables**, agregá:

| Variable | Valor |
|----------|-------|
| `SITE_PASSWORD` | Tu contraseña de acceso |
| `AUTH_SECRET` | Una clave aleatoria larga (ej. 32+ caracteres) |

Para desarrollo local, creá `.env.local` (no se sube a Git):

```
VITE_SITE_PASSWORD=tu-contraseña
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Levanta servidor local en `http://localhost:5173` |
| `npm run build:productos` | Regenera el catálogo JSON y copia el Excel a `/public` (solo local, requiere Python) |
| `npm run build` | Build de producción en `/dist` (Vercel usa este) |
| `npm run build:all` | Regenera productos + build (local, cuando actualizás el Excel) |
| `npm run preview` | Previsualiza el build de producción localmente |
| `npm test` | Corre los tests del motor de cálculo |
| `npm run kill` | Libera el puerto 5173 si quedó ocupado |

## Fórmulas implementadas

Extraídas del Excel `Costos de importación.xlsx`, hoja `PRODUCTOS ACTIVOS (2)`:

| Variable | Columna Excel | Fórmula |
|----------|--------------|---------|
| Costo unitario | R | `AD / N` |
| Factor costo | S | `R / Q` |
| Factor rentabilidad | T | `V / R` |
| Ganancia % | U | `(V - R) / R` |

Donde:
- `N` = unidades totales = `O × K / M`
- `Y` = Total FOB = `N × Q`
- `AB` = Flete+Seg al Blue = `(Z + AA) × (Blue/Oficial)`
- `AC` = CIF = `Y + AB`
- `AJ` = Derechos = `AC × AI`
- `AL` = T.E. = `AC × AK`
- `AN` = Impuesto país = `Y × AM`
- `AV` = IIBB = `(AC + AJ + AL) × AU`
- `AD` = Total = `AC + AE + AF + AG + AJ + AL + AN + AV`

## Publicación en la nube (para acceso sin tener la PC prendida)

La app es 100% estática. Opciones recomendadas:

### Vercel (recomendado, gratis)
1. Crear cuenta en [vercel.com](https://vercel.com)
2. Conectar el repositorio de GitHub
3. Framework: **Vite** — se detecta automáticamente
4. Deploy automático en cada push

### Netlify (alternativa)
1. `npm run build` → sube la carpeta `dist/` a [app.netlify.com/drop](https://app.netlify.com/drop)

### Requisitos para subir
- Subir el proyecto a un repositorio privado de GitHub (no incluir el `.xlsx` si tiene datos sensibles)
- El `.xlsx` no es necesario en producción — la lógica ya está implementada en `src/lib/calculator.js`

## Estructura del proyecto

```
├── src/
│   ├── App.jsx                   # Componente raíz
│   ├── main.jsx                  # Entry point
│   ├── index.css                 # Estilos globales
│   ├── components/
│   │   ├── ImportForm.jsx        # Formulario principal
│   │   ├── AdvancedSection.jsx   # Panel de parámetros avanzados
│   │   └── ResultsCards.jsx      # Tarjetas de resultados R/S/T/U
│   └── lib/
│       ├── calculator.js         # Motor de cálculo
│       └── calculator.test.js    # Tests unitarios
├── index.html
├── vite.config.js
└── package.json
```
