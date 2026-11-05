
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './features/photobooth/mobile-review.css'
import './features/camera/photo-framing.css'
import './features/camera/camera-ui.css'
import './features/camera/camera-body-v2.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
