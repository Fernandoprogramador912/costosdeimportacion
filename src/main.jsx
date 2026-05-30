import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthGate from './components/AuthGate.jsx'
import './index.css'

const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  import.meta.env.DEV ? <AuthGate>{app}</AuthGate> : app,
)
