import React, { useState } from 'react';
import { LINKORA_VERSION } from '@linkora/shared';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { getApiBase, getBuildApiBase, normalizeApiBase, setApiBaseOverride } from '../api/client';
import { useLocale } from '../contexts/LocaleContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function Login() {
  const [token, setToken] = useState('');
  const [apiOrigin, setApiOrigin] = useState(() => getApiBase());
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const { t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    const normalizedApiOrigin = normalizeApiBase(apiOrigin);
    if (apiOrigin.trim() && !normalizedApiOrigin) {
      error(t('invalidOrigin'));
      return;
    }
    setApiBaseOverride(apiOrigin);
    setLoading(true);
    const result = await login(token.trim());
    setLoading(false);
    if (result === 'authenticated') {
      navigate('/overview', { replace: true });
    } else if (result === 'unreachable') {
      error(t('unreachableApi'));
    } else {
      error(t('invalidToken'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30 mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Linkora Admin</h1>
          <p className="text-sm text-slate-400 mt-1">{t('adminSubtitle')}</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
        >
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('adminToken')}
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t('enterToken')}
                autoFocus
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('apiOrigin')}
            </label>
            <input
              type="url"
              value={apiOrigin}
              onChange={(e) => setApiOrigin(e.target.value)}
              placeholder="https://go.example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {getBuildApiBase()
                ? t('defaultValue', { value: getBuildApiBase() })
                : t('defaultSameOrigin')}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full justify-center"
            loading={loading}
            disabled={!token.trim()}
          >
            {t('signIn')}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          Linkora v{LINKORA_VERSION} — {t('selfHosted')}
        </p>
        <div className="mx-auto mt-4 w-44">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
