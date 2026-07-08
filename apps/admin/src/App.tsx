import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Links } from './pages/Links';
import { CreateLink } from './pages/CreateLink';
import { BulkCreateLinks } from './pages/BulkCreateLinks';
import { EditLink } from './pages/EditLink';
import { ImportExport } from './pages/ImportExport';
import { Tags } from './pages/Tags';
import { Settings } from './pages/Settings';
import { AuditLogs } from './pages/AuditLogs';
import { Analytics } from './pages/Analytics';
import { Backups } from './pages/Backups';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="links" element={<Links />} />
        <Route path="links/create" element={<CreateLink />} />
        <Route path="links/bulk-create" element={<BulkCreateLinks />} />
        <Route path="links/:id/edit" element={<EditLink />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="tags" element={<Tags />} />
        <Route path="import-export" element={<ImportExport />} />
        <Route path="backups" element={<Backups />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}
