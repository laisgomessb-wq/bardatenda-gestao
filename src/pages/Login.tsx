import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  GlassWater,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail de acesso.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, informe sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulação rápida para feedback visual
      await new Promise((resolve) => setTimeout(resolve, 400));
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.message || 'Erro ao realizar login. Verifique seus dados.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocorreu um erro ao entrar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-amber-500 selection:text-zinc-950">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-xl shadow-amber-950/60 border border-amber-400/30 text-zinc-950 font-bold mb-3">
            <GlassWater className="w-7 h-7 text-zinc-950" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Bar da Tenda
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
            Painel de Gestão e Controle Operacional
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Acesso Restrito</h2>
              <p className="text-xs text-zinc-400">Entre com suas credenciais de gestor</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Protegido
            </span>
          </div>

          {errorMessage && (
            <div
              id="login-error-feedback"
              className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo E-mail */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gerente@bardatenda.com.br"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-3 bg-zinc-950/70 border border-zinc-700/80 focus:border-amber-500 rounded-2xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold text-zinc-300">
                  Senha
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 bg-zinc-950/70 border border-zinc-700/80 focus:border-amber-500 rounded-2xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Lembrar-me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-zinc-100 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
                />
                <span>Lembrar meus dados</span>
              </label>
            </div>

            {/* Botão Entrar */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550 text-zinc-950 font-bold rounded-2xl text-sm shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Acessar Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Atalhos Rápidos para Acesso de Demonstração / Gestor */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Acesso Rápido de Gestão:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('gerente@bardatenda.com.br', 'admin123')}
                className="text-left px-3 py-2 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 hover:text-amber-300 transition-all text-xs flex flex-col group"
              >
                <span className="font-semibold text-zinc-200 group-hover:text-amber-400">Gerente Geral</span>
                <span className="text-[10px] text-zinc-400">gerente@bardatenda...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('caixa@bardatenda.com.br', 'caixa123')}
                className="text-left px-3 py-2 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 hover:text-amber-300 transition-all text-xs flex flex-col group"
              >
                <span className="font-semibold text-zinc-200 group-hover:text-amber-400">Operador de Caixa</span>
                <span className="text-[10px] text-zinc-400">caixa@bardatenda...</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé PWA */}
        <div className="text-center mt-6 text-[11px] text-zinc-400">
          <p>© {new Date().getFullYear()} Bar da Tenda • Sistema de Gestão Interna</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
