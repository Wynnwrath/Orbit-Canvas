import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { JoinPage } from './pages/JoinPage';
import { CanvasPage } from './pages/CanvasPage';
import { DashboardPage } from './pages/DashboardPage';
import { easings, durations } from './lib/animation';
import { useThemeStore } from './stores/theme.store';

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: durations.normal, ease: easings.default }}
        style={{ width: '100%', minHeight: '100vh' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export const App: React.FC = () => {
  const mode = useThemeStore(s => s.mode);
  const accent = useThemeStore(s => s.accent);

  // Set initial theme from localStorage OR system preference on first visit
  useEffect(() => {
    if (!localStorage.getItem('theme-prefs')) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      useThemeStore.getState().setMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.style.setProperty('--color-accent', accent);
    root.style.setProperty('--accent', accent);
  }, [mode, accent]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageTransition><JoinPage /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
        <Route path="/canvas/:roomCode" element={<PageTransition><CanvasPage /></PageTransition>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

