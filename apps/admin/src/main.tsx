import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { AdminModeProvider } from './contexts/AdminModeContext';
import { LocaleProvider } from './contexts/LocaleContext';
import { DisplayPreferencesProvider } from './contexts/DisplayPreferencesContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import './index.css';

const routerBaseName = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBaseName}>
      <ThemeProvider>
        <LocaleProvider>
          <AppErrorBoundary>
            <ToastProvider>
              <AdminModeProvider>
                <AuthProvider>
                  <DisplayPreferencesProvider>
                    <App />
                  </DisplayPreferencesProvider>
                </AuthProvider>
              </AdminModeProvider>
            </ToastProvider>
          </AppErrorBoundary>
        </LocaleProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
