import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import logo from './assets/supporthub.png'

const favicon = document.querySelector('link[rel="icon"]')
if (favicon) favicon.href = logo

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
