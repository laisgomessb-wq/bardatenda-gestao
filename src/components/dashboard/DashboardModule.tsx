import React, { useState, useMemo } from 'react';
import {
  Package,
  Music2,
  Users,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Phone,
  BarChart3,
  User,
} from 'lucide-react';
import {
  Product,
  BandGig,
  StaffShift,
  BillAccount,
  CashTransaction,
  ActiveTab,
} from '../../types';
import {
  formatCurrency,
  formatDateBR,
  getTodayISO,
  formatDayOfWeekBR,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  GIG_STATUS_CONFIG,
  GIG_STATUS_LABELS,
  ROLE_LABELS,
  ROLE_BADGE_STYLE,
  BILL_CATEGORY_LABELS,
  calculateBillEffectiveStatus,
} from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardModuleProps {
  products: Product[];
  gigs: BandGig[];
  shifts: StaffShift[];
  bills: BillAccount[];
  transactions: CashTransaction[];
  onNavigateTab: (tab: ActiveTab) => void;
  onQuickRestock: (productId: string, addedQty: number, date: string) => void;
  onToggleBillPaid: (bill: BillAccount) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  products,
  gigs,
  shifts,
  bills,
  transactions,
  onNavigateTab,
  onQuickRestock,
  onToggleBillPaid,
}) => {
  const { role, canAccessFinance } = useAuth();
  // Regra de Permissões: 'administrador' NÃO pode visualizar nem acessar dados de "Contas" e "Caixa"
  const showFinance = canAccessFinance ?? (role === 'criador' || role === 'dono');

  const today = getTodayISO();
  const [quickRestockModalProduct, setQuickRestockModalProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(5);

  const handleSafeNavigate = (tab: ActiveTab) => {
    if (!showFinance && (tab === 'contas' || tab === 'financeiro')) {
      onNavigateTab('estoque');
      return;
    }
    onNavigateTab(tab);
  };

  // 1. ESTOQUE KPIS & ALERTAS
  const totalProducts = products.length;
  const criticalProducts = useMemo(() => {
    return products.filter((p) => p.currentQuantity <= p.minQuantity);
  }, [products]);

  // 2. BANDAS KPIS & SHOW DE HOJE
  const todayGig = useMemo(() => {
    return gigs.find((g) => g.date === today && g.status !== 'cancelada');
  }, [gigs, today]);

  const nextGig = useMemo(() => {
    const futureOrToday = gigs.filter((g) => g.date >= today && g.status !== 'cancelada');
    if (futureOrToday.length > 0) {
      return futureOrToday.sort(
        (a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || '')
      )[0];
    }
    const allValid = gigs.filter((g) => g.status !== 'cancelada');
    return (
      allValid.sort(
        (a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || '')
      )[0] || null
    );
  }, [gigs, today]);

  const upcomingGigs = useMemo(() => {
    const futureOrToday = gigs.filter((g) => g.date >= today && g.status !== 'cancelada');
    if (futureOrToday.length > 0) {
      return futureOrToday.sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(0, 3);
    }
    return gigs.filter((g) => g.status !== 'cancelada').sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(0, 3);
  }, [gigs, today]);

  const confirmedGigsCount = useMemo(() => {
    return gigs.filter((g) => g.status === 'confirmada').length;
  }, [gigs]);

  // 3. CONTAS KPIS (Pagar / Receber)
  const processedBills = useMemo(() => {
    return bills.map((b) => ({
      ...b,
      effectiveStatus: calculateBillEffectiveStatus(b.dueDate, b.status, today),
    }));
  }, [bills, today]);

  const overdueBills = useMemo(() => {
    return processedBills.filter((b) => b.effectiveStatus === 'atrasado');
  }, [processedBills]);

  const todayBills = useMemo(() => {
    return processedBills.filter((b) => b.dueDate === today && b.effectiveStatus !== 'pago');
  }, [processedBills, today]);

  const totalPendingAPagar = useMemo(() => {
    return processedBills
      .filter((b) => b.type === 'a_pagar' && b.effectiveStatus !== 'pago')
      .reduce((sum, b) => sum + b.amount, 0);
  }, [processedBills]);

  const totalPendingAReceber = useMemo(() => {
    return processedBills
      .filter((b) => b.type === 'a_receber' && b.effectiveStatus !== 'pago')
      .reduce((sum, b) => sum + b.amount, 0);
  }, [processedBills]);

  // 4. VENDAS & DESPESAS KPIS (Hoje e Geral)
  const todayTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === today);
  }, [transactions, today]);

  const todayVendas = useMemo(() => {
    return todayTransactions
      .filter((t) => t.type === 'venda')
      .reduce((s, t) => s + t.amount, 0);
  }, [todayTransactions]);

  const todayDespesas = useMemo(() => {
    return todayTransactions
      .filter((t) => t.type === 'despesa')
      .reduce((s, t) => s + t.amount, 0);
  }, [todayTransactions]);

  const todayLucro = todayVendas - todayDespesas;

  // 5. EQUIPE KPIS (Hoje ou Próxima Escala)
  const todayShifts = useMemo(() => {
    return shifts.filter((s) => s.date === today && s.status === 'confirmado');
  }, [shifts, today]);

  const nearestShiftsDate = useMemo(() => {
    if (todayShifts.length > 0) return today;
    const futureDates = Array.from(new Set(shifts.map((s) => s.date)))
      .filter((d) => d >= today)
      .sort();
    if (futureDates.length > 0) return futureDates[0];
    const allDates = Array.from(new Set(shifts.map((s) => s.date))).sort();
    return allDates[allDates.length - 1] || today;
  }, [shifts, today, todayShifts]);

  const featuredShifts = useMemo(() => {
    return shifts.filter((s) => s.date === nearestShiftsDate && s.status === 'confirmado');
  }, [shifts, nearestShiftsDate]);

  const todayStaffCost = useMemo(() => {
    return featuredShifts.reduce((acc, s) => acc + s.dailyPay, 0);
  }, [featuredShifts]);

  // Executar reposição rápida direto pelo card do dashboard
  const handleConfirmRestock = () => {
    if (quickRestockModalProduct && restockQty > 0) {
      onQuickRestock(quickRestockModalProduct.id, restockQty, today);
      setQuickRestockModalProduct(null);
    }
  };

  return (
    <div id="dashboard-view" className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 🌟 Banner Superior de Boas-Vindas & Painel de Gestão Integrada */}
      <div className="bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-3xl p-4 shadow-xl relative overflow-hidden space-y-3.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Painel de Gestão Integrada
            </div>
            <h2 className="text-lg font-black text-zinc-100">
              Hoje no Bar & Restaurante
            </h2>
            <p className="text-xs text-zinc-400 capitalize mt-0.5">
              {formatDayOfWeekBR(today)}, {formatDateBR(today)}
            </p>
          </div>

          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Operação Aberta
          </span>
        </div>

        {/* Indicadores Principais */}
        <div className={`grid grid-cols-2 ${showFinance ? 'sm:grid-cols-3 md:grid-cols-5' : 'sm:grid-cols-3 md:grid-cols-4'} gap-2 pt-1 border-t border-zinc-800/80`}>
          {/* 1. Próxima Banda */}
          <div
            onClick={() => handleSafeNavigate('bandas')}
            className="bg-zinc-900/90 hover:bg-zinc-800/90 cursor-pointer rounded-xl p-2.5 border border-purple-500/20 text-left transition-all col-span-2 sm:col-span-1"
          >
            <div className="flex items-center gap-1 text-[10px] text-purple-300 font-medium">
              <Music2 className="w-3 h-3 text-purple-400" />
              <span>Próxima Banda</span>
            </div>
            <div className="text-xs font-black text-zinc-100 truncate mt-1">
              {nextGig ? nextGig.bandName : 'Nenhum show'}
            </div>
            <span className="text-[10px] text-zinc-400 block truncate">
              {nextGig ? `${formatDateBR(nextGig.date)}${nextGig.startTime ? ` às ${nextGig.startTime}` : ''}` : 'Sem agenda'}
            </span>
          </div>

          {/* 2. Equipe de Hoje */}
          <div
            onClick={() => handleSafeNavigate('equipe')}
            className="bg-zinc-900/90 hover:bg-zinc-800/90 cursor-pointer rounded-xl p-2.5 border border-blue-500/20 text-left transition-all"
          >
            <div className="flex items-center gap-1 text-[10px] text-blue-300 font-medium">
              <Users className="w-3 h-3 text-blue-400" />
              <span>Equipe de Hoje</span>
            </div>
            <div className="text-xs font-black text-blue-400 mt-1">
              {todayShifts.length} pessoas
            </div>
            <span className="text-[10px] text-zinc-400 block truncate">
              {todayShifts.length > 0 ? 'Turno escalado' : 'Sem escala hoje'}
            </span>
          </div>

          {/* 3. Produtos Abaixo do Estoque Mínimo */}
          <div
            onClick={() => handleSafeNavigate('estoque')}
            className={`rounded-xl p-2.5 border text-left transition-all cursor-pointer ${
              criticalProducts.length > 0
                ? 'bg-rose-950/30 border-rose-700/50 hover:bg-rose-950/50'
                : 'bg-zinc-900/90 border-zinc-800/60 hover:bg-zinc-800/90'
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Estoque Crítico</span>
            </div>
            <div className={`text-xs font-black mt-1 ${criticalProducts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {criticalProducts.length} {criticalProducts.length === 1 ? 'produto' : 'produtos'}
            </div>
            <span className="text-[10px] text-zinc-400 block truncate">
              {criticalProducts.length > 0 ? 'Abaixo do mínimo' : 'Estoque regular'}
            </span>
          </div>

          {/* 4. Total de Produtos no Estoque (Exibido para perfil sem acesso financeiro) */}
          {!showFinance && (
            <div
              onClick={() => handleSafeNavigate('estoque')}
              className="bg-zinc-900/90 hover:bg-zinc-800/90 cursor-pointer rounded-xl p-2.5 border border-amber-500/20 text-left transition-all"
            >
              <div className="flex items-center gap-1 text-[10px] text-amber-300 font-medium">
                <Package className="w-3 h-3 text-amber-400" />
                <span>Total Estoque</span>
              </div>
              <div className="text-xs font-black text-amber-400 mt-1">
                {totalProducts} produtos
              </div>
              <span className="text-[10px] text-zinc-400 block truncate">
                Itens cadastrados
              </span>
            </div>
          )}

          {/* 4. Vendas Hoje - Exibido apenas para 'criador' e 'dono' */}
          {showFinance && (
            <div
              onClick={() => handleSafeNavigate('financeiro')}
              className="bg-zinc-900/90 hover:bg-zinc-800/90 cursor-pointer rounded-xl p-2.5 border border-emerald-500/20 text-left transition-all"
            >
              <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-medium">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Vendas Hoje</span>
              </div>
              <div className="text-xs font-black text-emerald-400 mt-1">
                {formatCurrency(todayVendas)}
              </div>
              <span className="text-[10px] text-zinc-400 block truncate">
                {todayTransactions.filter((t) => t.type === 'venda').length} lançamentos
              </span>
            </div>
          )}

          {/* 5. A Pagar Pend. - Exibido apenas para 'criador' e 'dono' */}
          {showFinance && (
            <div
              onClick={() => handleSafeNavigate('contas')}
              className="bg-zinc-900/90 hover:bg-zinc-800/90 cursor-pointer rounded-xl p-2.5 border border-rose-500/20 text-left transition-all"
            >
              <div className="flex items-center gap-1 text-[10px] text-rose-300 font-medium">
                <DollarSign className="w-3 h-3 text-rose-400" />
                <span>A Pagar Pend.</span>
              </div>
              <div className="text-xs font-black text-rose-400 mt-1">
                {formatCurrency(totalPendingAPagar)}
              </div>
              <span className="text-[10px] text-zinc-400 block truncate">
                {processedBills.filter((b) => b.type === 'a_pagar' && b.effectiveStatus !== 'pago').length} pendências
              </span>
            </div>
          )}
        </div>

        {/* ⚠️ Alertas Críticos Junto ao Painel */}
        {((showFinance && overdueBills.length > 0) || criticalProducts.length > 0) && (
          <div className="space-y-2 pt-1 border-t border-zinc-800/60">
            {/* Alerta de Contas Vencidas - Oculto para Administrador */}
            {showFinance && overdueBills.length > 0 && (
              <div
                onClick={() => handleSafeNavigate('contas')}
                className="bg-rose-950/60 border border-rose-700 rounded-xl p-2.5 flex items-center justify-between cursor-pointer hover:bg-rose-950/80 transition-colors shadow-lg shadow-rose-950/40"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-100 flex items-center gap-1.5">
                      <span>Alerta: Conta a pagar vencida!</span>
                      <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        {overdueBills.length}
                      </span>
                    </h4>
                    <p className="text-[10px] text-rose-200/90">
                      Total em atraso: <strong>{formatCurrency(overdueBills.reduce((s, b) => s + b.amount, 0))}</strong>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-300 flex items-center gap-0.5 shrink-0 bg-rose-900/50 px-2 py-1 rounded-lg border border-rose-700/50">
                  Ver Contas <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            )}

            {/* Alerta de Produtos Abaixo do Mínimo */}
            {criticalProducts.length > 0 && (
              <div
                onClick={() => handleSafeNavigate('estoque')}
                className="bg-amber-950/50 border border-amber-600/70 rounded-xl p-2.5 flex items-center justify-between cursor-pointer hover:bg-amber-950/70 transition-colors shadow-md shadow-amber-950/30"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-100 flex items-center gap-1.5">
                      <span>Alerta: {criticalProducts.length} produto{criticalProducts.length > 1 ? 's' : ''} abaixo do estoque mínimo!</span>
                    </h4>
                    <p className="text-[10px] text-amber-200/80">
                      Itens com 4 ou menos unidades precisam de reposição imediata
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-0.5 shrink-0 bg-amber-900/40 px-2 py-1 rounded-lg border border-amber-600/50">
                  Repor <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📦 GRID PRINCIPAL DE MÓDULOS (1 COL EM MOBILE, 2 COLS EM TABLET/DESKTOP)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 📦 SEÇÃO 1: CONTROLE DE ESTOQUE & REPOSIÇÃO RÁPIDA */}
        <section id="dash-section-inventory" className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-4 space-y-3 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    1. Controle de Estoque
                    <span className="bg-zinc-800 text-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-zinc-700">
                      {totalProducts} produtos
                    </span>
                  </h3>
                  <p className="text-[10px] text-zinc-400">Bebidas, destilados e descartáveis cadastrados</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('estoque')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
              >
                Ver Todos <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lista dos mais críticos ou destaques para reposição de 1 toque */}
            <div className="space-y-2">
              {criticalProducts.length > 0 ? (
                criticalProducts.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-950/70 rounded-xl p-2.5 border border-rose-900/40 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-100 truncate">{item.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                          Crítico
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        <span>
                          Qtd: <strong className="text-rose-400">{item.currentQuantity} {item.unit}</strong> (mín: {item.minQuantity})
                        </span>
                      </div>
                    </div>

                    {/* Botão Reposição Rápida */}
                    <button
                      onClick={() => {
                        setQuickRestockModalProduct(item);
                        setRestockQty(5);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      Repor
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-zinc-950/50 rounded-xl p-3 text-center border border-zinc-800/80">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs text-zinc-300 font-semibold">Estoque Saudável!</p>
                  <p className="text-[10px] text-zinc-500">Nenhum produto abaixo do limite mínimo.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 🎸 SEÇÃO 2: AGENDA DE BANDAS */}
        <section id="dash-section-bands" className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-4 space-y-3 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Music2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    2. Agenda de Bandas
                    <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                      {confirmedGigsCount} confirmadas
                    </span>
                  </h3>
                  <p className="text-[10px] text-zinc-400">Shows ao vivo, horários e cachês</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('bandas')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
              >
                Ver Agenda <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card Destaque: Show de Hoje ou Próxima Apresentação */}
            {todayGig ? (
              <div className="bg-gradient-to-r from-purple-950/40 via-zinc-950 to-zinc-900 rounded-xl p-3 border border-purple-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/40 animate-pulse">
                    AO VIVO HOJE
                  </span>
                  {todayGig.cacheValue && todayGig.cacheValue > 0 ? (
                    <span className="text-xs font-extrabold text-amber-400">{formatCurrency(todayGig.cacheValue)}</span>
                  ) : null}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">{todayGig.bandName}</h4>
                </div>
                {(todayGig.startTime || (todayGig.contact && todayGig.contact !== 'Não informado')) && (
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                    {todayGig.startTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {todayGig.startTime} {todayGig.endTime ? `às ${todayGig.endTime}` : ''}
                      </span>
                    )}
                    {todayGig.startTime && todayGig.contact && todayGig.contact !== 'Não informado' && <span>•</span>}
                    {todayGig.contact && todayGig.contact !== 'Não informado' && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        {todayGig.contact}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : upcomingGigs.length > 0 ? (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-zinc-400">Próxima apresentação agendada:</div>
                <div className="bg-zinc-950/70 rounded-xl p-3 border border-zinc-800 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-100 truncate">{upcomingGigs[0].bandName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-amber-300 font-medium">
                        <Calendar className="w-3 h-3" />
                        {formatDateBR(upcomingGigs[0].date)} {upcomingGigs[0].startTime ? `(${upcomingGigs[0].startTime})` : ''}
                      </span>
                      {upcomingGigs[0].cacheValue && upcomingGigs[0].cacheValue > 0 ? (
                        <>
                          <span>•</span>
                          <span>Cachê: {formatCurrency(upcomingGigs[0].cacheValue)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950/50 rounded-xl p-3 text-center border border-zinc-800/80">
                <p className="text-xs text-zinc-400">Nenhum show agendado para os próximos dias.</p>
              </div>
            )}
          </div>
        </section>

        {/* 🧾 SEÇÃO 3: CONTAS A PAGAR / RECEBER - Visível apenas para 'criador' e 'dono' */}
        {showFinance && (
        <section id="dash-section-bills" className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-4 space-y-3 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    3. Contas a Pagar / Receber
                  </h3>
                  <p className="text-[10px] text-zinc-400">Vencimentos e compromissos do negócio</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('contas')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
              >
                Ver Todas <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Resumo Financeiro de Contas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-rose-900/30">
                <span className="text-[10px] text-rose-400 font-medium block">Total Pendente a Pagar</span>
                <span className="text-sm font-black text-rose-400">{formatCurrency(totalPendingAPagar)}</span>
              </div>
              <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-emerald-900/30">
                <span className="text-[10px] text-emerald-400 font-medium block">Total a Receber</span>
                <span className="text-sm font-black text-emerald-400">{formatCurrency(totalPendingAReceber)}</span>
              </div>
            </div>

            {/* Lista de Contas que vencem hoje ou atrasadas */}
            <div className="space-y-1.5">
              {todayBills.length > 0 || overdueBills.length > 0 ? (
                [...overdueBills, ...todayBills].slice(0, 3).map((bill) => {
                  const isOverdue = bill.effectiveStatus === 'atrasado';
                  return (
                    <div
                      key={bill.id}
                      className={`bg-zinc-950/80 rounded-xl p-2.5 border flex items-center justify-between gap-2 ${
                        isOverdue ? 'border-rose-800/60 bg-rose-950/10' : 'border-zinc-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-100 truncate">{bill.description}</span>
                          {isOverdue && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                              Atrasada
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Venc: <strong>{formatDateBR(bill.dueDate)}</strong> • {BILL_CATEGORY_LABELS[bill.category]}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <span className="text-xs font-black text-rose-400">{formatCurrency(bill.amount)}</span>
                        <button
                          onClick={() => onToggleBillPaid(bill)}
                          className="bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-zinc-700 transition-colors"
                          title="Dar baixa"
                        >
                          Pagar
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-zinc-950/50 rounded-xl p-2.5 text-center border border-zinc-800/80">
                  <p className="text-xs text-zinc-400">Nenhuma conta com vencimento para hoje.</p>
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        {/* 💰 SEÇÃO 4: VENDAS E DESPESAS (FLUXO DO CAIXA) - Visível apenas para 'criador' e 'dono' */}
        {showFinance && (
        <section id="dash-section-finance" className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-4 space-y-3 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    4. Vendas e Despesas
                  </h3>
                  <p className="text-[10px] text-zinc-400">Movimentação diária e resultado financeiro</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('financeiro')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
              >
                Abrir Caixa <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Balanço de Hoje */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-zinc-950/70 p-2 rounded-xl border border-emerald-900/30">
                <span className="text-[10px] text-emerald-400 block font-medium">Vendas Hoje</span>
                <span className="text-xs font-black text-emerald-400">+{formatCurrency(todayVendas)}</span>
              </div>
              <div className="bg-zinc-950/70 p-2 rounded-xl border border-rose-900/30">
                <span className="text-[10px] text-rose-400 block font-medium">Despesas Hoje</span>
                <span className="text-xs font-black text-rose-400">-{formatCurrency(todayDespesas)}</span>
              </div>
              <div className="bg-zinc-950/70 p-2 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-medium">Resultado</span>
                <span
                  className={`text-xs font-black ${
                    todayLucro >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(todayLucro)}
                </span>
              </div>
            </div>
          </div>
        </section>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 👥 SEÇÃO 5: GESTÃO DE FUNCIONÁRIOS (EQUIPE E ESCALA)                      */}
      {/* ========================================================================= */}
      <section id="dash-section-staff" className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                5. Equipe Escalada ({nearestShiftsDate === today ? 'Hoje' : formatDateBR(nearestShiftsDate)})
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                  {featuredShifts.length} pessoas
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400">Escala de trabalho e total de diárias</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('equipe')}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
          >
            Ver Planner <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Resumo de Diárias */}
        <div className="flex items-center justify-between bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800 text-xs">
          <span className="text-zinc-400 font-medium">
            Custo Diárias ({nearestShiftsDate === today ? 'Hoje' : formatDateBR(nearestShiftsDate)}):
          </span>
          <span className="font-extrabold text-amber-400">{formatCurrency(todayStaffCost)}</span>
        </div>

        {/* Lista dos Funcionários da Escala em Destaque (Grid responsivo) */}
        <div>
          {featuredShifts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {featuredShifts.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="bg-zinc-950/70 rounded-xl p-2.5 border border-zinc-800/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-100 truncate">{s.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border ${ROLE_BADGE_STYLE[s.role]}`}>
                        {ROLE_LABELS[s.role]}
                      </span>
                    </div>
                    {s.startTime && s.endTime ? (
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {s.startTime} às {s.endTime}
                      </div>
                    ) : s.startTime ? (
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Entrada: {s.startTime}
                      </div>
                    ) : null}
                  </div>

                  <span className="text-xs font-bold text-zinc-300 shrink-0">
                    {formatCurrency(s.dailyPay)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-950/50 rounded-xl p-3 text-center border border-zinc-800/80">
              <p className="text-xs text-zinc-400">Nenhum funcionário escalado.</p>
            </div>
          )}
        </div>
      </section>

      {/* ⚡ AÇÕES RÁPIDAS DO GERENTE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <button
          onClick={() => handleSafeNavigate('estoque')}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all active:scale-95 shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-200 block">Estoque Geral</span>
            <span className="text-[10px] text-zinc-500">{totalProducts} produtos</span>
          </div>
        </button>

        {showFinance ? (
          <button
            onClick={() => handleSafeNavigate('financeiro')}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all active:scale-95 shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Novo Lançamento</span>
              <span className="text-[10px] text-zinc-500">Venda / Despesa</span>
            </div>
          </button>
        ) : (
          <button
            onClick={() => handleSafeNavigate('bandas')}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all active:scale-95 shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Music2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Agenda Shows</span>
              <span className="text-[10px] text-zinc-500">Bandas do Bar</span>
            </div>
          </button>
        )}

        {showFinance ? (
          <button
            onClick={() => handleSafeNavigate('contas')}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all active:scale-95 shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Contas & Boletos</span>
              <span className="text-[10px] text-zinc-500">Pagar e Receber</span>
            </div>
          </button>
        ) : (
          <button
            onClick={() => handleSafeNavigate('equipe')}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all active:scale-95 shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Escala Equipe</span>
              <span className="text-[10px] text-zinc-500">Planner Diário</span>
            </div>
          </button>
        )}

        <button
          onClick={() => handleSafeNavigate('perfil')}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all active:scale-95 shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-200 block">Meu Perfil & Acesso</span>
            <span className="text-[10px] text-zinc-500">Login, senha e perfil</span>
          </div>
        </button>
      </div>

      {/* 📦 Modal de Reposição Rápida Acionado do Dashboard */}
      {quickRestockModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xs w-full p-4 space-y-4 shadow-2xl">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Reposição Rápida de Estoque
              </span>
              <h3 className="font-bold text-sm text-zinc-100 mt-0.5">
                {quickRestockModalProduct.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Estoque atual: <strong>{quickRestockModalProduct.currentQuantity} {quickRestockModalProduct.unit}</strong> (Mínimo: {quickRestockModalProduct.minQuantity})
              </p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                Quantidade a adicionar ({quickRestockModalProduct.unit}):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Botões de atalho de quantidade */}
              <div className="flex gap-1.5 mt-2">
                {[1, 5, 10, 20].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRestockQty(val)}
                    className="flex-1 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickRestockModalProduct(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg"
              >
                Confirmar (+{restockQty})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
