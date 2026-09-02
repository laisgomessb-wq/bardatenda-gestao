import React, { useState } from 'react';
import {
  User,
  Sun,
  Moon,
  Bell,
  Smartphone,
  Package,
  Clock,
  AlertTriangle,
  Calendar,
  Save,
  CheckCircle2,
  Sparkles,
  Share2,
  Check,
  Globe,
  Radio,
  Edit3,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { NotificationSettings } from '../../types';
import { updateCredentials } from '../../utils/storage';

interface ProfileModuleProps {
  currentUsername: string;
  userEmail?: string;
  theme: 'dark' | 'light';
  onToggleTheme: (theme: 'dark' | 'light') => void;
  notificationSettings: NotificationSettings;
  onUpdateNotificationSettings: (settings: NotificationSettings) => void;
  onCredentialsUpdated: (newUsername: string, newPass: string) => void;
  showToast: (msg: string) => void;
  onLogout?: () => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  currentUsername,
  userEmail,
  theme,
  onToggleTheme,
  notificationSettings,
  onUpdateNotificationSettings,
  onCredentialsUpdated,
  showToast,
  onLogout,
}) => {
  // Alterar identificação do operador
  const [operatorNameInput, setOperatorNameInput] = useState(currentUsername || 'Equipe Bar da Tenda');
  const [nameSuccess, setNameSuccess] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Local notification settings copy
  const [settings, setSettings] = useState<NotificationSettings>(notificationSettings);
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopiedLink(true);
    showToast('Link do aplicativo copiado para a área de transferência!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Salvar identificação do operador
  const handleSaveOperatorName = (e: React.FormEvent) => {
    e.preventDefault();
    setNameSuccess('');
    const trimmed = operatorNameInput.trim() || 'Equipe Bar da Tenda';
    updateCredentials(trimmed, '');
    onCredentialsUpdated(trimmed, '');
    setNameSuccess('Nome de identificação salvo!');
    showToast(`Identificação atualizada para "${trimmed}"`);
    setTimeout(() => setNameSuccess(''), 3000);
  };

  // Notification toggles
  const handleToggle = (key: keyof Omit<NotificationSettings, 'advanceDaysWarning'>) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(updated);
    onUpdateNotificationSettings(updated);
  };

  const handleChangeAdvanceDays = (days: number) => {
    const updated = {
      ...settings,
      advanceDaysWarning: days,
    };
    setSettings(updated);
    onUpdateNotificationSettings(updated);
    showToast(`Alerta de antecedência configurado para ${days} dias.`);
  };

  // Test push / notification on mobile or browser
  const handleTestNotification = async () => {
    setTestNotificationStatus('Disparando alerta de teste...');
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('Bar da Tenda - Teste de Alerta', {
            body: 'As notificações estão ativas e funcionando perfeitamente!',
            icon: '/favicon.ico',
          });
        }
      } else if (Notification.permission === 'granted') {
        new Notification('Bar da Tenda - Teste de Alerta', {
          body: 'As notificações estão ativas e funcionando perfeitamente!',
          icon: '/favicon.ico',
        });
      }
    }
    showToast('Notificação de teste emitida com sucesso!');
    setTimeout(() => {
      setTestNotificationStatus('Notificação enviada!');
      setTimeout(() => setTestNotificationStatus(null), 3000);
    }, 600);
  };

  const isDark = theme === 'dark';

  return (
    <div id="module-profile" className="space-y-5 pb-28 animate-in fade-in duration-200">
      {/* Cabeçalho do Perfil / Sessão Autenticada */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isDark 
          ? 'bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-950 border-amber-500/30' 
          : 'bg-gradient-to-r from-amber-100 via-white to-amber-50 border-amber-300'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-zinc-950 flex items-center justify-center font-black text-xl shadow-md border border-amber-400/40 shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {currentUsername || 'Gestor Bar da Tenda'}
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Sessão Ativa
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {userEmail ? `Conectado como: ${userEmail}` : 'Acesso Seguro Protegido por Autenticação'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              id="btn-logout-profile"
              className="py-2.5 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            id="btn-copy-share-link"
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-450 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-amber-500/20 shrink-0"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Link Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Copiar Link do App</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Aparência & Link de Acesso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. MODO ESCURO / CLARO */}
        <section className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-4 ${
          isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Aparência do Aplicativo
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Alterne entre modo escuro e claro
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Opção Escuro */}
            <button
              onClick={() => onToggleTheme('dark')}
              id="theme-dark-btn"
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                isDark
                  ? 'bg-zinc-950 border-amber-500 text-amber-400 shadow-md ring-1 ring-amber-500/40'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <Moon className="w-6 h-6" />
              <div className="text-center">
                <span className="text-xs font-bold block">Modo Escuro</span>
                <span className="text-[10px] opacity-75">Ideal para uso noturno no bar</span>
              </div>
              {isDark && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                  Ativo
                </span>
              )}
            </button>

            {/* Opção Claro */}
            <button
              onClick={() => onToggleTheme('light')}
              id="theme-light-btn"
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                !isDark
                  ? 'bg-amber-50/80 border-amber-500 text-amber-800 shadow-md ring-1 ring-amber-500/40'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <Sun className="w-6 h-6 text-amber-500" />
              <div className="text-center">
                <span className="text-xs font-bold block">Modo Claro</span>
                <span className="text-[10px] opacity-75">Alto contraste para o dia</span>
              </div>
              {!isDark && (
                <span className="text-[10px] bg-amber-500 text-zinc-950 px-2 py-0.5 rounded-full font-bold">
                  Ativo
                </span>
              )}
            </button>
          </div>
        </section>

        {/* 2. COMPARTILHAMENTO & IDENTIFICAÇÃO DO OPERADOR */}
        <section className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-4 ${
          isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Compartilhar & Identificação
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Link direto e nome para o registro de atividades
              </p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Link direto de acesso */}
            <div className={`p-3 rounded-xl border space-y-2 ${
              isDark ? 'bg-zinc-950/70 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  Link de Acesso Direto:
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Livre para Todos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? window.location.href : ''}
                  className={`w-full text-[11px] rounded-lg px-2.5 py-1.5 font-mono truncate focus:outline-none select-all ${
                    isDark ? 'bg-zinc-900 text-zinc-300 border border-zinc-700' : 'bg-white text-zinc-700 border border-zinc-300'
                  }`}
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-450 text-zinc-950 text-xs font-bold shrink-0 transition-colors"
                >
                  {copiedLink ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Form de identificação do operador */}
            <form onSubmit={handleSaveOperatorName} className="space-y-2">
              <label className={`block text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Seu Nome ou Função (para o histórico de alterações):
              </label>

              {nameSuccess && (
                <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {nameSuccess}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: Bartender João, Caixa Principal..."
                  value={operatorNameInput}
                  onChange={(e) => setOperatorNameInput(e.target.value)}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-zinc-950 border border-zinc-700 text-zinc-100' : 'bg-zinc-50 border border-zinc-300 text-zinc-900'
                  }`}
                />
                <button
                  type="submit"
                  id="btn-save-operator-name"
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-zinc-700 shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* 3. CONFIGURAÇÕES DE NOTIFICAÇÕES */}
      <section className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-4 ${
        isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Configurações de Notificações & Alertas
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Personalize os avisos operacionais do Bar da Tenda
              </p>
            </div>
          </div>

          <button
            onClick={handleTestNotification}
            id="btn-test-notification"
            className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold text-xs inline-flex items-center gap-1.5 border border-zinc-700 self-start sm:self-auto"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Testar Alerta no Aparelho</span>
          </button>
        </div>

        {testNotificationStatus && (
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{testNotificationStatus}</span>
          </div>
        )}

        {/* Lista de Toggles com ON / OFF */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Toggle 1: Notificação no celular */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                settings.mobileNotifications ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
              }`}>
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Notificação no celular
                </span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Alertas em tempo real no smartphone
                </span>
              </div>
            </div>

            <button
              onClick={() => handleToggle('mobileNotifications')}
              className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 font-bold text-[10px] ${
                settings.mobileNotifications ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-400'
              }`}
            >
              <span className={`transition-transform duration-200 w-5 h-5 rounded-full bg-white shadow-md block ${
                settings.mobileNotifications ? 'translate-x-7' : 'translate-x-0'
              }`} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] pointer-events-none pr-1">
                {settings.mobileNotifications ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Toggle 2: Alertar estoque baixo */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                settings.lowStockAlert ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-500'
              }`}>
                <Package className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Alertar estoque baixo
                </span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Aviso quando atingir estoque mínimo
                </span>
              </div>
            </div>

            <button
              onClick={() => handleToggle('lowStockAlert')}
              className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 font-bold text-[10px] ${
                settings.lowStockAlert ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-400'
              }`}
            >
              <span className={`transition-transform duration-200 w-5 h-5 rounded-full bg-white shadow-md block ${
                settings.lowStockAlert ? 'translate-x-7' : 'translate-x-0'
              }`} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] pointer-events-none pr-1">
                {settings.lowStockAlert ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Toggle 3: Alertar conta a vencer */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                settings.dueBillsAlert ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Alertar conta a vencer
                </span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Lembrete prévio de vencimento
                </span>
              </div>
            </div>

            <button
              onClick={() => handleToggle('dueBillsAlert')}
              className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 font-bold text-[10px] ${
                settings.dueBillsAlert ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-400'
              }`}
            >
              <span className={`transition-transform duration-200 w-5 h-5 rounded-full bg-white shadow-md block ${
                settings.dueBillsAlert ? 'translate-x-7' : 'translate-x-0'
              }`} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] pointer-events-none pr-1">
                {settings.dueBillsAlert ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Toggle 4: Alertar conta vencida */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                settings.overdueBillsAlert ? 'bg-rose-500/20 text-rose-400' : 'bg-zinc-800 text-zinc-500'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Alertar conta vencida
                </span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Aviso urgente de boletos atrasados
                </span>
              </div>
            </div>

            <button
              onClick={() => handleToggle('overdueBillsAlert')}
              className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 font-bold text-[10px] ${
                settings.overdueBillsAlert ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-400'
              }`}
            >
              <span className={`transition-transform duration-200 w-5 h-5 rounded-full bg-white shadow-md block ${
                settings.overdueBillsAlert ? 'translate-x-7' : 'translate-x-0'
              }`} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] pointer-events-none pr-1">
                {settings.overdueBillsAlert ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Seletor: Avisar com quantos dias de antecedência */}
        <div className={`p-4 rounded-xl border space-y-2.5 ${
          isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Avisar com quantos dias de antecedência:
              </span>
            </div>
            <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-md border border-amber-500/30">
              {settings.advanceDaysWarning} {settings.advanceDaysWarning === 1 ? 'dia' : 'dias'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            {[1, 2, 3, 5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleChangeAdvanceDays(d)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  settings.advanceDaysWarning === d
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {d} {d === 1 ? 'dia' : 'dias'} {d === 2 && '(padrão)'}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
