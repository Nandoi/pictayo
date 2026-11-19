
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './features/camera/camera.css'
import './features/photobooth/photobooth.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
