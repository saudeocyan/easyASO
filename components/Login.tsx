import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@easyaso.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // onLogin will be triggered by onAuthStateChange in App.tsx
      // but we can call it here for immediate feedback if needed, 
      // though relying on the session change is better.
    } catch (err: any) {
      setError(err.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background-light font-body">
      {/* Left Side - Brand & Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary relative overflow-hidden flex-col justify-center items-center p-12 text-white text-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] opacity-10 translate-y-1/2 -translate-x-1/2"></div>

        {/* Logo Recreated with HTML/CSS to match attachment visually (Negative version for dark bg) */}
        <div className="relative z-10 mb-12 flex items-center justify-center scale-125">
          <div className="flex items-center gap-1 select-none">
            <span className="text-5xl font-bold text-primary tracking-tighter font-display">Easy</span>
            <div className="relative flex items-center">
              {/* 'A' with custom pulse crossbar */}
              <div className="relative">
                <span className="text-5xl font-bold text-white tracking-tighter font-display">A</span>
                {/* Pulse Line overlaying the A */}
                <svg className="absolute left-[-2px] top-[52%] -translate-y-1/2 w-full h-8 text-primary pointer-events-none" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 10 H8 L14 2 L22 18 L28 10 H40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-5xl font-bold text-white tracking-tighter font-display">SO</span>
              <div className="ml-3 flex items-center justify-center w-12 h-12 rounded-full bg-primary shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-white text-[2.25rem] font-bold leading-none">check</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Content - Title Only */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Gestão de Saúde Ocupacional <span className="text-primary">Simplificada</span>.
          </h1>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-0.5">
              <span className="text-3xl font-bold text-secondary tracking-tighter font-display">Easy</span>
              <span className="text-3xl font-bold text-primary tracking-tighter font-display">ASO</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-secondary mb-2">Bem-vindo de volta</h2>
            <p className="text-text-secondary">Insira suas credenciais para acessar o painel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Email Corporativo</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.nome@empresa.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Senha</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-status-danger/10 text-status-danger text-sm rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar na Plataforma</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;