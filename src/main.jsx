import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import RingRecorder from './components/RingRecorder.jsx'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function RecorderEntry() {
  return (
    <RingRecorder glbUrl={'/ring-transformed.glb'} hdrUrl={'/peppermint_powerplant_2_1k.hdr'} frames={1257} />
  )
}

const isRecorder = typeof window !== 'undefined' && window.location.pathname === '/record'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {isRecorder ? <RecorderEntry /> : <App />}
    </QueryClientProvider>
  </StrictMode>,
)
