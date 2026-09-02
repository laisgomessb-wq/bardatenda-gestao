import React, { useState, useEffect } from 'react';
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
  Sparkles,
  LogOut,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { NotificationSettings, ActiveTab, ThemeMode } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Usuarios } from '../../pages/Usuarios';

interface ProfileModuleProps {
  currentUsername: string;
  userEmail?: string;
  theme: ThemeMode;
  onToggleTheme: (theme: ThemeMode) => void;
  notificationSettings: NotificationSettings;
  onUpdateNotificationSettings: (settings: NotificationSettings) => void;
  onCredentialsUpdated?: (newUsername: string, newPass: string) => void;
  showToast: (msg: string) => void;
  onLogout?: () => void;
  initialSubTab?: 'perfil' | 'usuarios';
  onSubTabChange?: (tab: 'perfil' | 'usuarios') => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  currentUsername,
  userEmail,
  theme,
  onToggleTheme,
  notificationSettings,
  onUpdateNotificationSettings,
  showToast,
  onLogout,
  initialSubTab = 'perfil',
  onSubTabChange,
  onNavigateTab,
}) => {
  const { role } = useAuth();
  const canManageUsers = role === 'criador' || role === 'dono';

  // Sub-abas dentro de Perfil: 'perfil' (Geral) e 'usuarios' (Gestão de Usuários)
  const [activeSubTab, setActiveSubTab] = useState<'perfil' | 'usuarios'>(() => {
    if (initialSubTab === 'usuarios' && canManageUsers) return 'usuarios';
    return 'perfil';
  });

  useEffect(() => {
    if (initialSubTab) {
      if (initialSubTab === 'usuarios' && !canManageUsers) {
        setActiveSubTab('perfil');
      } else {
        setActiveSubTab(initialSubTab);
      }
    }
  }, [initialSubTab, canManageUsers]);

  const handleSelectSubTab = (tab: 'perfil' | 'usuarios') => {
    setActiveSubTab(tab);
    onSubTabChange?.(tab);
  };

  // Notificações: Inicia RECOLHIDO/FECHADO conforme solicitado pelo usuário
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(notificationSettings);
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);

  // Contagem de alertas ativos
  const activeAlertsCount = [
    settings.mobileNotifications,
    settings.lowStockAlert,
    settings.dueBillsAlert,
    settings.overdueBillsAlert,
  ].filter(Boolean).length;

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

  const isDark = theme !== 'light';

  return (
    <div id="module-profile" className="space-y-5 pb-28 animate-in fade-in duration-200">
      {/* Seletor de Sub-Abas: Meu Perfil vs Gestão de Usuários (se Dono ou Criador) */}
      {canManageUsers && (
        <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-zinc-800/60">
          <div className="flex items-center p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800/90 shadow-sm w-full sm:w-auto">
            <button
              id="subtab-perfil-meu-perfil"
              type="button"
              onClick={() => handleSelectSubTab('perfil')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'perfil'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Meu Perfil</span>
            </button>

            <button
              id="subtab-perfil-usuarios"
              type="button"
              onClick={() => handleSelectSubTab('usuarios')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'usuarios'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gestão de Usuários</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activeSubTab === 'usuarios'
                    ? 'bg-zinc-950/30 text-zinc-950'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {role === 'criador' ? 'Criador' : 'Dono'}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Perfil: <strong className="text-zinc-200 capitalize">{role || 'Administrador'}</strong></span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CONTEÚDO 1: GESTÃO DE USUÁRIOS DENTRO DO PERFIL */}
      {/* ===================================================================== */}
      {activeSubTab === 'usuarios' && canManageUsers && (
        <div className="animate-in fade-in duration-200">
          <Usuarios onNavigateTab={onNavigateTab} />
        </div>
      )}

      {/* ===================================================================== */}
      {/* CONTEÚDO 2: MEU PERFIL & PREFERÊNCIAS */}
      {/* ===================================================================== */}
      {activeSubTab === 'perfil' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Cabeçalho do Perfil / Sessão Autenticada */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isDark
                ? 'bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-950 border-amber-500/30'
                : 'bg-gradient-to-r from-amber-100 via-white to-amber-50 border-amber-300'
            }`}
          >
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
                  {role && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                      {role}
                    </span>
                  )}
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
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              )}
            </div>
          </div>

          {/* 1. SELETOR DE APARÊNCIA & TEMAS (Escuro Clássico, Azul Escuro Premium, Claro Refinado) */}
          <section
            className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-4 ${
              isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  theme === 'midnight'
                    ? 'bg-sky-500/20 text-sky-400'
                    : theme === 'light'
                    ? 'bg-amber-500/20 text-amber-600'
                    : 'bg-zinc-800 text-amber-400'
                }`}>
                  {theme === 'midnight' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : theme === 'light' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Aparência do Aplicativo
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Escolha o estilo visual mais confortável para a sua operação
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Opção 1: Escuro Clássico (Ônix) */}
              <button
                type="button"
                onClick={() => onToggleTheme('dark')}
                id="theme-dark-btn"
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all relative text-left ${
                  theme === 'dark'
                    ? 'bg-zinc-950 border-amber-500 text-amber-400 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Moon className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold block">Escuro Clássico</span>
                  <span className="text-[10px] opacity-75">Ônix & Âmbar, ideal para bar</span>
                </div>
                {theme === 'dark' && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold mt-0.5">
                    Ativo
                  </span>
                )}
              </button>

              {/* Opção 2: Azul Escuro Premium (Midnight Navy) */}
              <button
                type="button"
                onClick={() => onToggleTheme('midnight')}
                id="theme-midnight-btn"
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all relative text-left ${
                  theme === 'midnight'
                    ? 'bg-[#0b1329] border-sky-400 text-sky-300 shadow-lg ring-1 ring-sky-400/40'
                    : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:text-sky-300 hover:bg-zinc-900'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold block">Azul Escuro Premium</span>
                  <span className="text-[10px] opacity-75">Safira sofisticado & elegante</span>
                </div>
                {theme === 'midnight' && (
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2.5 py-0.5 rounded-full font-bold mt-0.5">
                    Ativo
                  </span>
                )}
              </button>

              {/* Opção 3: Modo Claro Refinado (Daylight) */}
              <button
                type="button"
                onClick={() => onToggleTheme('light')}
                id="theme-light-btn"
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all relative text-left ${
                  theme === 'light'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:text-amber-500 hover:bg-zinc-900'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Sun className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold block">Modo Claro Refinado</span>
                  <span className="text-[10px] opacity-75">Contraste limpo para luz do dia</span>
                </div>
                {theme === 'light' && (
                  <span className="text-[10px] bg-amber-500 text-zinc-950 px-2.5 py-0.5 rounded-full font-bold mt-0.5">
                    Ativo
                  </span>
                )}
              </button>
            </div>
          </section>

          {/* 2. CONFIGURAÇÕES DE NOTIFICAÇÕES (REDUZIDO / FECHADO POR PADRÃO) */}
          <section
            id="section-notifications-profile"
            className={`rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden ${
              isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            {/* Cabeçalho Compacto Clicável (Reduzido / Fechado) */}
            <button
              type="button"
              id="btn-toggle-notifications-accordion"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-colors ${
                isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-sm font-bold truncate ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      Configurações de Notificações & Alertas
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {activeAlertsCount} {activeAlertsCount === 1 ? 'ativo' : 'ativos'}
                    </span>
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isNotificationsOpen
                      ? 'Personalize avisos de estoque, contas e notificações push'
                      : 'Toque para abrir e configurar os alertas operacionais do bar'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline text-xs font-semibold text-zinc-400">
                  {isNotificationsOpen ? 'Recolher' : 'Configurar'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                  {isNotificationsOpen ? (
                    <ChevronUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Conteúdo Expandido (Somente visível quando aberto) */}
            {isNotificationsOpen && (
              <div className={`p-4 sm:p-5 pt-0 space-y-4 border-t ${
                isDark ? 'border-zinc-800/80 bg-zinc-950/30' : 'border-zinc-100 bg-zinc-50/50'
              } animate-in fade-in duration-200`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3">
                  <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Disparar teste imediato no navegador ou aparelho:
                  </span>
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    id="btn-test-notification"
                    className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold text-xs inline-flex items-center gap-1.5 border border-zinc-700 self-start sm:self-auto transition-colors"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Toggle 1: Notificação no celular */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-white border-zinc-200'
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
                      type="button"
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
                    isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-white border-zinc-200'
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
                      type="button"
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
                    isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-white border-zinc-200'
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
                      type="button"
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
                    isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-white border-zinc-200'
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
                      type="button"
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
                  isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-white border-zinc-200'
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
                            : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                        }`}
                      >
                        {d} {d === 1 ? 'dia' : 'dias'} {d === 2 && '(padrão)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
