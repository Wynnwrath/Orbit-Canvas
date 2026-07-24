import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { JoinPage } from './pages/JoinPage';
import { CanvasPage } from './pages/CanvasPage';
import { DashboardPage } from './pages/DashboardPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JoinPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/canvas/:roomCode" element={<CanvasPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
