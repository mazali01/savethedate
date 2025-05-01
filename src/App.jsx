import './App.css'
import React from 'react';
import MatrixCanvas from './components/MatrixCanvas';
import Hologram3D from './components/Hologram3D';
import SecretMission from './components/SecretMission';

function App() {
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, width: '100%', height: '100%', backgroundColor: '#000' }} >
        <MatrixCanvas />
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, width: '100%', height: '100%' }}>

        <Hologram3D />
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0F0', fontSize: '24px', fontFamily: 'monospace' }}>
        <SecretMission />
      </div>
    </>
  );
}

export default App
