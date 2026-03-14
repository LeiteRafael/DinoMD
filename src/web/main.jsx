import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../renderer/src/App.jsx'
import '../renderer/src/styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
