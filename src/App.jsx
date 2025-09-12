import './App.css'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AnimatePresence, motion } from 'framer-motion';

import MatrixCanvas from './components/MatrixCanvas';
import RingVideo from './components/RingVideo';
import WeddingMenu from './components/WeddingMenu';

// Pages
import RsvpPage from './pages/RsvpPage';
import NavPage from './pages/NavPage';
import GiftsPage from './pages/GiftsPage';
import MenuPage from './pages/MenuPage';
import SongsPage from './pages/SongsPage';
import AlbumPage from './pages/AlbumPage';
import CarpoolPage from './pages/CarpoolPage';
import SinglesPage from './pages/SinglesPage';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ffff',
    },
    secondary: {
      main: '#00c882',
    },
    background: {
      default: '#000000',
      paper: 'rgba(0, 200, 130, 0.1)',
    },
    text: {
      primary: '#00ffff',
    },
  },
  typography: {
    fontFamily: 'monospace',
  },
});

const pageVariants = {
  initial: {
    rotateY: 90,
    opacity: 0
  },
  in: {
    rotateY: 0,
    opacity: 1
  },
  out: {
    rotateY: -90,
    opacity: 0
  }
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.25
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <div style={{ position: 'relative', zIndex: 2, width: '100%', minHeight: '100vh', perspective: '1000px' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
          }}
        >
          <div style={{ position: 'absolute', left: 0, width: '100%', height: '100%', display: 'flex' }}>
            <Routes location={location}>
              <Route path="/" element={<WeddingMenu />} />
              <Route path="/rsvp" element={<RsvpPage />} />
              <Route path="/nav" element={<NavPage />} />
              <Route path="/gifts" element={<GiftsPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/songs" element={<SongsPage />} />
              <Route path="/album" element={<AlbumPage />} />
              <Route path="/carpool" element={<CarpoolPage />} />
              <Route path="/singles" element={<SinglesPage />} />
            </Routes>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <>
          {/* Background layers - always visible */}
          <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, width: '100%', height: '100%', backgroundColor: '#000' }} >
            <MatrixCanvas />
          </div>
          <div style={{ position: 'fixed', top: -25, left: 0, zIndex: 1, width: '100%' }}>
            <RingVideo src="/ring-loop.webm" />
          </div>

          {/* Animated Routes */}
          <AnimatedRoutes />
        </>
      </Router>
    </ThemeProvider>
  );
} export default App
