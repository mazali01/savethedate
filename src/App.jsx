import './App.css'
import React from 'react';
import MatrixCanvas from './components/MatrixCanvas';
import Hologram3D from './components/Hologram3D';
import SecretMission from './components/SecretMission';
import { usePreloadAssets } from './hooks/usePreciseLoader';

const assets = [
  '/ring-transformed.glb',
  '/peppermint_powerplant_2_1k.hdr'
]
function App() {
  const { progress, blobs } = usePreloadAssets(assets)

  if (progress < 1 || !blobs['/ring-transformed.glb'] || !blobs['/peppermint_powerplant_2_1k.hdr']) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0F0', fontSize: '24px', fontFamily: 'monospace' }}>
        <div>
          <p>טוען...</p>
          <progress value={progress} max="1" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, width: '100%', height: '100%', backgroundColor: '#000' }} >
        <MatrixCanvas />
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, width: '100%', height: '100%' }}>

        <Hologram3D glbUrl={blobs['/ring-transformed.glb']} hdrUrl={blobs['/peppermint_powerplant_2_1k.hdr']} />
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0F0', fontSize: '24px', fontFamily: 'monospace' }}>
        <SecretMission />
      </div>
    </>
  );
}

export default App
