import './App.css'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import CssBaseline from '@mui/material/CssBaseline';
import { AnimatePresence, motion } from 'framer-motion';

import RingVideo from './components/RingVideo';
import WhiteCurtain from './components/WhiteCurtain';
import WeddingMenu from './components/WeddingMenu';
import UserRouteWrapper from './components/UserRouteWrapper';

// Pages
import RsvpPage from './pages/RsvpPage';
import NavPage from './pages/NavPage';
import GiftsPage from './pages/GiftsPage';
import MenuPage from './pages/MenuPage';
import SongsPage from './pages/SongsPage';
import CarpoolPage from './pages/CarpoolPage';
import SinglesPage from './pages/SinglesPage';
import AdminPage from './pages/AdminPage';

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const lightTheme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: {
      main: '#2e7d32', // Forest green
    },
    secondary: {
      main: '#d32f2f', // Elegant red
    },
    background: {
      default: '#fafafa',
    },
    text: {
      primary: '#2c2c2c', // Dark gray for readability
      secondary: '#555555',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          direction: 'rtl',
        },
      },
    },
    // Override Paper component specifically for Autocomplete dropdowns
    MuiPaper: {
      styleOverrides: {
        root: {
          // Only override for Autocomplete papers (they have specific classes)
          '&.MuiAutocomplete-paper': {
            backgroundColor: '#ffffff !important',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(46, 125, 50, 0.2)',
            borderRadius: '8px',
            overflow: 'hidden',
          },
          // Override for Select dropdown papers
          '&.MuiPaper-root.MuiMenu-paper': {
            backgroundColor: '#ffffff !important',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(46, 125, 50, 0.2)',
            borderRadius: '8px',
          },
          // Generic override for Select dropdowns
          '&.MuiSelect-paper': {
            backgroundColor: '#ffffff !important',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(46, 125, 50, 0.2)',
            borderRadius: '8px',
          },
        },
      },
    },
    // Override Menu component (used by Select)
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff !important',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(46, 125, 50, 0.2)',
          borderRadius: '8px',
        },
        list: {
          backgroundColor: '#ffffff',
          '& .MuiMenuItem-root': {
            '&:hover': {
              backgroundColor: 'rgba(46, 125, 50, 0.1)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(46, 125, 50, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(46, 125, 50, 0.2)',
              },
            },
          },
        },
      },
    },
    // Also override the Autocomplete component itself for consistent styling
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff !important',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(46, 125, 50, 0.2)',
          borderRadius: '8px',
          overflow: 'hidden',
        },
        listbox: {
          backgroundColor: '#ffffff',
          '& .MuiAutocomplete-option': {
            '&:hover': {
              backgroundColor: 'rgba(46, 125, 50, 0.1)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(46, 125, 50, 0.15)',
            },
          },
        },
      },
    },
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
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Routes location={location}>
          <Route path="/" element={<AdminPage />} />
          <Route path="/rsvp/:userId" element={<RsvpPage />} />
          <Route path="/user/:userId" element={<UserRouteWrapper><WeddingMenu /></UserRouteWrapper>} />
          <Route path="/user/:userId/nav" element={<UserRouteWrapper><NavPage /></UserRouteWrapper>} />
          <Route path="/user/:userId/gifts" element={<UserRouteWrapper><GiftsPage /></UserRouteWrapper>} />
          <Route path="/user/:userId/menu" element={<UserRouteWrapper><MenuPage /></UserRouteWrapper>} />
          <Route path="/user/:userId/songs" element={<UserRouteWrapper><SongsPage /></UserRouteWrapper>} />
          <Route path="/user/:userId/carpool" element={<UserRouteWrapper><CarpoolPage /></UserRouteWrapper>} />
          <Route path="/user/:userId/singles" element={<UserRouteWrapper><SinglesPage /></UserRouteWrapper>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <Router>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100vh',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            {/* Background layers - always visible */}
            <WhiteCurtain />
            <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 1, width: '100%', pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
              <RingVideo />
            </div>

            {/* Animated Routes - now in scrollable container */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              height: '100%',
            }}>
              <AnimatedRoutes />
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </CacheProvider>
  );
} export default App
