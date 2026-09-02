import React from 'react';
import {
  LayoutDashboard,
  Package,
  Music2,
  Receipt,
  TrendingUp,
  Users,
  User,
  UserCheck,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount: number;
  confirmedGigsCount: number;
  overdueBillsCount: number;
  todayStaffCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  confirmedGigsCount,
  overdueBillsCount,
  todayStaffCount,
}) => {
  const { role, canAccessFinance } = useAuth();
  
  // Regra de Acesso: 'administrador' NÃO pode visualizar nem acessar as abas "Contas" e "Caixa"
  // 'criador' e 'dono' têm acesso total
  const showFinanceTabs = canAccessFinance ?? (role === 'criador' || role === 'dono');
  const showUserManagementTab = role === 'criador' || role === 'dono';

  return (
    <nav
      id="bottom-navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 px-1 py-1 safe-area-bottom shadow-2xl"
    >
      <div
        className={`max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto grid ${
          showUserManagementTab ? 'grid-cols-8' : showFinanceTabs ? 'grid-cols-7' : 'grid-cols-5'
        } gap-0.5 sm:gap-1.5 md:gap-2`}
      >
        {/* 1. Início / Dashboard */}
        <button
          id="nav-tab-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 rounded-xl transition-all duration-150 relative min-h-[44px] sm:min-h-[48px] select-none ${
            activeTab === 'dashboard'
              ? 'bg-amber-500/15 text-amber-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 transition-transform ${
              activeTab === 'dashboard' ? 'scale-110' : ''
            }`}
          />
          <span className="text-[9px] sm:text-[10px] tracking-tight leading-none truncate max-w-full">
            Início
          </span>
          {activeTab === 'dashboard' && (
            <span className="w-2.5 sm:w-3 h-0.5 bg-amber-400 rounded-full mt-0.5"></span>
          )}
        </button>

        {/* 2. Estoque */}
        <button
          id="nav-tab-estoque"
          onClick={() => setActiveTab('estoque')}
          className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 rounded-xl transition-all duration-150 relative min-h-[44px] sm:min-h-[48px] select-none ${
            activeTab === 'estoque'
              ? 'bg-amber-500/15 text-amber-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Package
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 transition-transform ${
                activeTab === 'estoque' ? 'scale-110' : ''
              }`}
            />
            {lowStockCount > 0 && (
              <span
                id="badge-low-stock-nav"
                className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[8px] sm:text-[9px] font-bold px-1 rounded-full min-w-[13px] text-center border border-zinc-950 shadow-sm animate-pulse"
                title={`${lowStockCount} itens com estoque baixo`}
              >
                {lowStockCount}
              </span>
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-tight leading-none truncate max-w-full">
            Estoque
          </span>
          {activeTab === 'estoque' && (
            <span className="w-2.5 sm:w-3 h-0.5 bg-amber-400 rounded-full mt-0.5"></span>
          )}
        </button>

        {/* 3. Bandas */}
        <button
          id="nav-tab-bandas"
          onClick={() => setActiveTab('bandas')}
          className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 rounded-xl transition-all duration-150 relative min-h-[44px] sm:min-h-[48px] select-none ${
            activeTab === 'bandas'
              ? 'bg-amber-500/15 text-amber-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Music2
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 transition-transform ${
                activeTab === 'bandas' ? 'scale-110' : ''
              }`}
            />
            {confirmedGigsCount > 0 && (
              <span
                id="badge-gigs-count-nav"
                className="absolute -top-1.5 -right-2 bg-amber-500 text-zinc-950 text-[8px] sm:text-[9px] font-bold px-1 rounded-full min-w-[13px] text-center border border-zinc-950 shadow-sm"
              >
                {confirmedGigsCount}
              </span>
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-tight leading-none truncate max-w-full">
            Bandas
          </span>
          {activeTab === 'bandas' && (
            <span className="w-2.5 sm:w-3 h-0.5 bg-amber-400 rounded-full mt-0.5"></span>
          )}
        </button>

        {/* 4. Contas (Pagar/Receber) - Exibido apenas para 'criador' e 'dono' */}
        {showFinanceTabs && (
          <button
            id="nav-tab-contas"
            onClick={() => setActiveTab('contas')}
            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 rounded-xl transition-all duration-150 relative min-h-[44px] sm:min-h-[48px] select-none ${
              activeTab === 'contas'
                ? 'bg-amber-500/15 text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <Receipt
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 transition-transform ${
                  activeTab === 'contas' ? 'scale-110' : ''
                }`}
              />
              {overdueBillsCount > 0 && (
                <span
                  id="badge-overdue-bills-nav"
                  className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[8px] sm:text-[9px] font-bold px-1 rounded-full min-w-[13px] text-center border border-zinc-950 shadow-sm animate-pulse"
                  title={`${overdueBillsCount} contas vencidas`}
                >
                  {overdueBillsCount}
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight leading-none truncate max-w-full">
              Contas
            </span>
            {activeTab === 'contas' && (
              <span className="w-2.5 sm:w-3 h-0.5 bg-amber-400 rounded-full mt-0.5"></span>
            )}
          </button>
        )}

        {/* 5. Caixa / Vendas & Despesas - Exibido apenas para 'criador' e 'dono' */}
        {showFinanceTabs && (
          <button
            id="nav-tab-financeiro"
            onClick={() => setActiveTab('financeiro')}
            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 rounded-xl transition-all duration-150 relative min-h-[44px] sm:min-h-[48px] select-none ${
              activeTab === 'financeiro'
                ? 'bg-amber-500/15 text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <TrendingUp
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 transition-transform ${
                  activeTab === 'financeiro' ? 'scale-110' : ''
                }`}
              />
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight leading-none truncate max-w-full">
              Caixa
            </span>
            {activeTab === 'financeiro' && (
              <span className="w-2.5 sm:w-3 h-0.5 bg-amber-400 rounded-full mt-0.5"></span>
            )}
          </button>
        )}

        {/* 6. Equipe */}
        <button
          id="nav-tab-equipe"
          onClick={() => setActiveTab('equipe')}
          className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 rounded-xl transition-all duration-150 relative min-h-[44px] sm:min-h-[48px] select-none ${
            activeTab === 'equipe'
              ? 'bg-amber-500/15 text-amber-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Users
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 transition-transform ${
                activeTab === 'equipe' ? 'scale-110' : ''
              }`}
            />
            {todayStaffCount > 0 && (
              <span
                id="badge-staff-count-nav"
                className="absolute -top-1.5 -right-2 bg-blue-500 text-white text-[8px] sm:text-[9px] font-bold px-1 rounded-full min-w-[13px] text-center border border-zinc-950 shadow-sm"
              >
                {todayStaffCount}
              </span>
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-tight leading-none truncate max-w-full">
            Equipe
          </span>
          {activeTab === 'equipe' && (
            <span className="w-2.5 sm:w-3 h-0.5 bg-amber-400 rounded-full mt-0.5"></span>
          )}
        </button>

        {/* 7. Usuários (Gestão de Acesso - Exclusivo Criador e Dono) */}
        {showUserManagementTab && (
          <button
            id="nav-tab-usuarios"
            onClick={() => setActiveTab('usuarios')}
            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 rounded-xl transition-all duration-150 relative min-h-[44px] sm:min-h-[48px] select-none ${
              activeTab === 'usuarios'
                ? 'bg-amber-500/15 text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <UserCheck
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 transition-transform ${
                  activeTab === 'usuarios' ? 'scale-110' : ''
                }`}
              />
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight leading-none truncate max-w-full">
              Usuários
            </span>
            {activeTab === 'usuarios' && (
              <span className="w-2.5 sm:w-3 h-0.5 bg-amber-400 rounded-full mt-0.5"></span>
            )}
          </button>
        )}

        {/* 8. Perfil */}
        <button
          id="nav-tab-perfil"
          onClick={() => setActiveTab('perfil')}
          className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 rounded-xl transition-all duration-150 relative min-h-[44px] sm:min-h-[48px] select-none ${
            activeTab === 'perfil'
              ? 'bg-amber-500/15 text-amber-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <User
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 transition-transform ${
                activeTab === 'perfil' ? 'scale-110' : ''
              }`}
            />
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-tight leading-none truncate max-w-full">
            Perfil
          </span>
          {activeTab === 'perfil' && (
            <span className="w-2.5 sm:w-3 h-0.5 bg-amber-400 rounded-full mt-0.5"></span>
          )}
        </button>
      </div>
    </nav>
  );
};
export default Navigation;
