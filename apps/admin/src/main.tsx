import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { AdminModeProvider } from './contexts/AdminModeContext';
import { LocaleProvider } from './contexts/LocaleContext';
import { ToastProvider } from './components/ui/Toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <ToastProvider>
          <AdminModeProvider>
            <AuthProvider><App /></AuthProvider>
          </AdminModeProvider>
        </ToastProvider>
      </LocaleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
