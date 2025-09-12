import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import RingRecorder from './components/RingRecorder.jsx'

function RecorderEntry() {
  return (
    <RingRecorder glbUrl={'/ring-transformed.glb'} hdrUrl={'/peppermint_powerplant_2_1k.hdr'} frames={1257} />
  )
}

const isRecorder = typeof window !== 'undefined' && window.location.pathname === '/record'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isRecorder ? <RecorderEntry /> : <App />}
  </StrictMode>,
)
