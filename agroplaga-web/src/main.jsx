import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Plagas from './components/Plagas';
import Seguimiento from './components/Seguimiento';
import NuevaPlaga from './components/NuevaPlaga';
import Parcelas from './components/Parcelas';
import Chatbot from './components/Chatbot';
import CamaraEnVivo from './components/CamaraEnVivo';
import Usuarios from './components/Usuarios';
import NotFound from './components/NotFound';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Publica */}
          <Route path="/login" element={<Login />} />

          {/* Todo lo demas exige sesion */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="plagas" element={<Plagas />} />
              <Route path="seguimiento" element={<Seguimiento />} />
              <Route path="parcelas" element={<Parcelas />} />
              <Route path="camara" element={<CamaraEnVivo />} />
              <Route path="chat" element={<Chatbot initialPlotId={4} />} />

              {/* Solo administradores */}
              <Route element={<RequireAdmin />}>
                <Route path="nueva-plaga" element={<NuevaPlaga />} />
                <Route path="usuarios" element={<Usuarios />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
