import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import Admin from './routes/Admin.jsx'
import AdminEvent from './routes/AdminEvent.jsx'
import Register from './routes/Register.jsx'
import Slides from './routes/Slides.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/:eventId" element={<AdminEvent />} />
        <Route path="/register" element={<Register />} />
        <Route path="/slides" element={<Slides />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
