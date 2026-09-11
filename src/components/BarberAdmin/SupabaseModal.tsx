import React, { useState } from 'react';
import { 
  X, Database, Check, AlertCircle, RefreshCw, Key, Globe, 
  Copy, Sparkles, Server, ShieldCheck, HelpCircle
} from 'lucide-react';
import { useBarbershop } from '../../context/BarbershopContext';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const {
    supabaseCredentials,
    saveSupabaseCredentials,
    disconnectSupabase,
    isUsingSupabase,
    syncStatus,
    syncError,
    refreshFromSupabase,
  } = useBarbershop();

  const [url, setUrl] = useState(supabaseCredentials.url);
  const [anonKey, setAnonKey] = useState(supabaseCredentials.anonKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        status: 'error',
        message: 'Informe a Project URL e a chave pública Anon do seu Supabase.',
      });
      return;
    }

    if (!url.startsWith('https://')) {
      setTestResult({
        status: 'error',
        message: 'A URL do Supabase deve começar com https:// (ex: https://xyz.supabase.co)',
      });
      return;
    }

    setTesting(true);
    setTestResult({ status: 'idle', message: '' });

    try {
      await saveSupabaseCredentials(url.trim(), anonKey.trim());
      setTestResult({
        status: 'success',
        message: 'Conexão configurada com sucesso! Os dados foram sincronizados.',
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || 'Falha ao conectar ao Supabase. Verifique suas chaves.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Deseja desconectar o Supabase e voltar para o armazenamento local?')) {
      disconnectSupabase();
      setUrl('');
      setAnonKey('');
      setTestResult({
        status: 'idle',
        message: 'Supabase desconectado.',
      });
    }
  };

  const sqlCode = `-- TABELAS DO SUPABASE:
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  category TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  service_id TEXT REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  service_price NUMERIC(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.barbershop_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir serviços" ON public.services FOR ALL USING (true);
CREATE POLICY "Permitir agendamentos" ON public.appointments FOR ALL USING (true);
CREATE POLICY "Permitir configurações" ON public.barbershop_settings FOR ALL USING (true);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#181a20] border border-zinc-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#1f222a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Conectar API Supabase
                {isUsingSupabase && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ativo
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Adicione a URL e Chave Anon da API do Supabase para persistência online.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSaveAndConnect} className="p-6 overflow-y-auto space-y-5">
          {testResult.message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                testResult.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : testResult.status === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
            >
              {testResult.status === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Input: Project URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Project URL (API URL) *
            </label>
            <input
              id="supabase-url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.supabase.co"
              className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Encontrada no seu painel em: <b>Project Settings &gt; API &gt; Project URL</b>
            </span>
          </div>

          {/* Input: Anon Public Key */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              API Key (Anon Public) *
            </label>
            <input
              id="supabase-anon-key-input"
              type="text"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Encontrada no seu painel em: <b>Project Settings &gt; API &gt; anon public</b>
            </span>
          </div>

          {/* Quick Guide & SQL Drawer toggle */}
          <div className="bg-[#121418] border border-zinc-800 rounded-xl p-3.5 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Script SQL das Tabelas
              </span>
              <button
                type="button"
                onClick={() => setShowSqlGuide(!showSqlGuide)}
                className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold underline"
              >
                {showSqlGuide ? 'Ocultar SQL' : 'Ver script SQL'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              O banco precisa das tabelas <code className="text-amber-300">services</code>, <code className="text-amber-300">appointments</code> e <code className="text-amber-300">barbershop_settings</code>.
            </p>

            {showSqlGuide && (
              <div className="mt-2 pt-2 border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">Cole no SQL Editor do Supabase:</span>
                  <button
                    type="button"
                    onClick={copySqlToClipboard}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold flex items-center gap-1 border border-zinc-700 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
                  </button>
                </div>
                <pre className="p-2.5 bg-black/50 border border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 overflow-x-auto max-h-32">
                  {sqlCode}
                </pre>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-3">
            {isUsingSupabase ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
              >
                Desconectar
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                id="save-supabase-keys-btn"
                type="submit"
                disabled={testing}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar &amp; Conectar API</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
