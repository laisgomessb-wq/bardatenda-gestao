import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { BarDaTendaLogo } from '../common/BarDaTendaLogo';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  registeredUsername?: string;
  registeredPassword?: string;
  onRegisterAccount?: (username: string, pass: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  registeredUsername = 'bardatenda',
  registeredPassword = 'tenda2026',
  onRegisterAccount,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('bardatenda');
  const [password, setPassword] = useState('tenda2026');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    setTimeout(() => {
      if (isRegisterMode) {
        if (!username.trim() || !password.trim()) {
          setError('Preencha o usuário/email e a senha.');
          setLoading(false);
          return;
        }
        if (password.length < 4) {
          setError('A senha deve ter pelo menos 4 caracteres.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('As senhas não conferem.');
          setLoading(false);
          return;
        }

        if (onRegisterAccount) {
          onRegisterAccount(username.trim(), password);
        }
        setSuccessMsg('Conta criada com sucesso! Acesse o sistema.');
        setLoading(false);
        setTimeout(() => {
          onLoginSuccess();
        }, 600);
      } else {
        if (
          username.trim().toLowerCase() === registeredUsername.trim().toLowerCase() &&
          password === registeredPassword
        ) {
          onLoginSuccess();
        } else {
          setError('Usuário ou senha incorretos. Verifique suas credenciais.');
          setLoading(false);
        }
      }
    }, 300);
  };

  const handleFillDemo = () => {
    setUsername(registeredUsername);
    setPassword(registeredPassword);
    setError('');
  };

  return (
    <div
      id="login-screen"
      className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-zinc-950 relative overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <BarDaTendaLogo id="loginscreen-logo" size="lg" showGlow className="mx-auto" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-100">
              Bar da Tenda
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              Sistema de Gestão & Operação
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs (Entrar / Cadastrar) */}
        <div className="flex bg-zinc-950/80 p-1 rounded-2xl border border-zinc-800/80">
          <button
            id="tab-login-mode"
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegisterMode
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Entrar
          </button>
          <button
            id="tab-register-mode"
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isRegisterMode
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Criar Conta / Cadastro
          </button>
        </div>

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Campo Login */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              {isRegisterMode ? 'Nome de Usuário ou E-mail' : 'Usuário / Login'}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="input-login-user"
                type="text"
                required
                autoComplete="username"
                placeholder={isRegisterMode ? 'Ex: gerente@bardatenda.com' : 'Digite o login (ex: bardatenda)'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300">
                Senha de Acesso
              </label>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="input-login-pass"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                placeholder={isRegisterMode ? 'Crie uma senha (mínimo 4 caracteres)' : 'Digite sua senha'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-10 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Campo Confirmar Senha (se cadastro) */}
          {isRegisterMode && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Confirmar Senha
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-login-pass-confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Botão Entrar / Cadastrar */}
          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
          >
            <LogIn className="w-4 h-4" />
            <span>
              {loading
                ? isRegisterMode
                  ? 'Cadastrando...'
                  : 'Acessando...'
                : isRegisterMode
                ? 'Cadastrar e Acessar'
                : 'Entrar no Sistema'}
            </span>
          </button>
        </form>

        {/* Card Informativo com Credenciais Padrão (só exibe no modo Login) */}
        {!isRegisterMode && (
          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Acesso Padrão:
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] text-amber-400 hover:underline font-bold"
              >
                Preencher dados
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/40">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase font-sans">Login:</span>
                <span className="text-amber-300 font-bold">{registeredUsername}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase font-sans">Senha:</span>
                <span className="text-amber-300 font-bold">{registeredPassword}</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">
              Você pode alterar sua senha a qualquer momento na aba <strong>Meu Perfil</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
