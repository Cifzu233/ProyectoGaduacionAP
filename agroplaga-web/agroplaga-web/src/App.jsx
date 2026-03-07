// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Plagas from './components/Plagas';
import Seguimiento from './components/Seguimiento';
import NuevaPlaga from './components/NuevaPlaga';
import Chatbot from './components/Chatbot'; // 👈 nuevo import
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/plagas" element={<Plagas />} />
        <Route path="/seguimiento" element={<Seguimiento />} />
        <Route path="/nueva-plaga" element={<NuevaPlaga />} />
        <Route path="/chat" element={<Chatbot plotId={4} />} /> {/* 👈 nueva ruta */}
      </Routes>
    </Router>
  );
}

export default App;