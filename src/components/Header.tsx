import React, { useState } from 'react';
import {
  AlertCircle,
  RotateCcw,
  HelpCircle,
  Sparkles,
  User,
  Sun,
  Moon,
  Radio,
  Share2,
  Check,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { formatDateBR, getTodayISO } from '../utils/formatters';
import { ActiveTab } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { BarDaTendaLogo } from './common/BarDaTendaLogo';

interface HeaderProps {
  lowStockCount: number;
  onResetData: () => void;
  activeTab?: ActiveTab;
  onNavigateTab?: (tab: ActiveTab) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: (theme: 'dark' | 'light') => void;
  onShareLink?: () => void;
  isLiveSync?: boolean;
  onOpenActivityDrawer?: () => void;
  recentActivityCount?: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lowStockCount,
  onResetData,
  activeTab,
  onNavigateTab,
  theme = 'dark',
  onToggleTheme,
  onShareLink,
  isLiveSync = true,
  onOpenActivityDrawer,
  recentActivityCount = 0,
  onLogout,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { user, role } = useAuth();
  const today = getTodayISO();

  const handleConfirmReset = () => {
    onResetData();
    setShowConfirmReset(false);
    setShowMenu(false);
  };

  const handleCopyLink = () => {
    if (onShareLink) {
      onShareLink();
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
      }
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5 safe-area-top">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <BarDaTendaLogo id="header-bar-da-tenda-logo" size="sm" showGlow />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-base font-bold text-zinc-100 tracking-tight leading-none truncate">
                Gestão Bar da tenda
              </h1>
              <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider bg-amber-500/20 text-amber-300 px-1 sm:px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                PRO
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="hidden xs:inline">Hoje: <strong className="text-zinc-300 font-medium">{formatDateBR(today)}</strong></span>
              
              {/* Botão Interativo de Sincronização ao Vivo */}
              <button
                id="header-live-sync-indicator"
                onClick={onOpenActivityDrawer}
                className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-400 font-medium bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
                title="Sincronização em tempo real ativa. Clique para ver histórico de alterações."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Tempo Real</span>
                {recentActivityCount > 0 && (
                  <span className="bg-emerald-400/20 text-emerald-300 px-1 rounded-full text-[8px] sm:text-[9px] font-bold">
                    {recentActivityCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Botão de Histórico de Alterações */}
          {onOpenActivityDrawer && (
            <button
              id="header-activity-log-btn"
              onClick={onOpenActivityDrawer}
              className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40 flex items-center gap-1.5 text-xs font-semibold transition-colors"
              title="Ver alterações em tempo real feitas por todos os usuários"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Alterações</span>
            </button>
          )}

          {/* Quick theme toggle */}
          {onToggleTheme && (
            <button
              id="header-theme-toggle"
              onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 flex items-center justify-center transition-colors"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          )}

          {/* Quick profile button */}
          {onNavigateTab && (
            <button
              id="header-profile-btn"
              onClick={() => onNavigateTab('perfil')}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'perfil'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-zinc-700'
              }`}
              title="Meu Perfil e Configurações"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Perfil</span>
            </button>
          )}

          {/* Quick Share Link Button */}
          <button
            id="header-share-link-btn"
            onClick={handleCopyLink}
            className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-450 text-zinc-950 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm shadow-amber-500/20"
            title="Copiar link para compartilhar o acesso ao Bar da Tenda"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartilhar</span>
              </>
            )}
          </button>

          {lowStockCount > 0 && (
            <div
              id="header-alert-pill"
              className="flex items-center gap-1 bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs px-2 sm:px-2.5 py-1 rounded-lg font-medium shadow-sm animate-pulse"
              title={`${lowStockCount} itens com estoque baixo`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">{lowStockCount} {lowStockCount === 1 ? 'alerta' : 'alertas'}</span>
              <span className="sm:hidden text-[10px]">{lowStockCount}</span>
            </div>
          )}

          <div className="relative">
            <button
              id="header-menu-button"
              onClick={() => setShowMenu(!showMenu)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
              aria-label="Opções"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {showMenu && (
              <div
                id="header-dropdown-menu"
                className="absolute right-0 mt-2 w-60 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-2 z-50 text-xs"
              >
                {user && (
                  <div className="px-2 py-2 border-b border-zinc-800/80 mb-2">
                    <p className="font-bold text-zinc-100 truncate">{user.name || user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                          role === 'criador'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : role === 'dono'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        }`}
                      >
                        {role === 'criador' ? '👑 Criador' : role === 'dono' ? '⭐ Dono' : '🛡️ Administrador'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {role === 'administrador'
                        ? 'Acesso: Banda, Estoque e Equipe'
                        : 'Acesso total: Caixa, Contas e Operações'}
                    </p>
                  </div>
                )}

                <button
                  id="menu-item-share"
                  onClick={() => {
                    handleCopyLink();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-amber-400 hover:bg-zinc-800 flex items-center gap-2 font-medium"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copiar Link de Compartilhamento</span>
                </button>

                {(role === 'criador' || role === 'dono') && onNavigateTab && (
                  <button
                    id="menu-item-usuarios"
                    onClick={() => {
                      onNavigateTab('usuarios');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-amber-400 hover:bg-zinc-800 flex items-center gap-2 font-bold"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gestão de Usuários (/usuarios)</span>
                  </button>
                )}

                {onNavigateTab && (
                  <button
                    id="menu-item-perfil"
                    onClick={() => {
                      onNavigateTab('perfil');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Meu Perfil & Configurações</span>
                  </button>
                )}

                <button
                  id="menu-item-info"
                  onClick={() => {
                    setShowInfo(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sobre o Gestão Bar da tenda</span>
                </button>

                {onLogout && (
                  <button
                    id="menu-item-logout"
                    onClick={() => {
                      setShowMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 border-t border-zinc-800/60 mt-1 pt-1.5 font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sair da Conta (Logout)</span>
                  </button>
                )}

                <button
                  id="menu-item-reset"
                  onClick={() => {
                    setShowConfirmReset(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 flex items-center gap-2 border-t border-zinc-800/60 mt-1 pt-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Restaurar dados de exemplo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Sobre / Ajuda */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-zinc-200">
            <div className="flex items-center gap-3 mb-3">
              <BarDaTendaLogo id="modal-about-logo" size="md" showGlow />
              <div>
                <h3 className="font-bold text-base text-zinc-100">Gestão Bar da tenda</h3>
                <p className="text-xs text-zinc-400">Versão 2.0 • Gestão Completa Mobile</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-300 leading-relaxed my-4 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/60">
              <p>📱 <strong>Controle de Estoque:</strong> Acompanhe produtos por categoria, receba alertas de estoque baixo e faça reposições rápidas com um toque.</p>
              <p>🎸 <strong>Agenda de Bandas:</strong> Calendário visual mensal para gerenciar atrações musicais, cachês, horários e contatos.</p>
              <p>👥 <strong>Gestão de Equipe:</strong> Controle diário da escala de trabalho, funções (bartenders, garçons, cozinha, segurança, DJ, atendentes, motoqueiros), diárias e presenças.</p>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-450 text-zinc-950 font-bold rounded-xl text-xs transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xs w-full p-5 shadow-2xl text-zinc-200">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-center text-zinc-100 mb-1">
              Restaurar dados de exemplo?
            </h3>
            <p className="text-xs text-zinc-400 text-center mb-4">
              Isso recarregará os produtos, agenda e escalas padrão de demonstração.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReset}
                className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                Sim, restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
