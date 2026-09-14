import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Plagas from './components/Plagas';
import Seguimiento from './components/Seguimiento';
import NuevaPlaga from './components/NuevaPlaga';
import Parcelas from './components/Parcelas';
import Chatbot from './components/Chatbot';
import CamaraEnVivo from './components/CamaraEnVivo';
import NotFound from './components/NotFound';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="plagas" element={<Plagas />} />
          <Route path="seguimiento" element={<Seguimiento />} />
          <Route path="nueva-plaga" element={<NuevaPlaga />} />
          <Route path="parcelas" element={<Parcelas />} />
          <Route path="camara" element={<CamaraEnVivo />} />
          <Route path="chat" element={<Chatbot initialPlotId={4} />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
