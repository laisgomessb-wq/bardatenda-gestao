import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  X,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  Check,
  Copy,
} from 'lucide-react';
import {
  CashTransaction,
  CashTransactionType,
  CashPaymentMethod,
  CashTransactionStatus,
} from '../../types';
import {
  formatCurrency,
  formatDateBR,
  getTodayISO,
  CASH_TYPE_LABELS,
  CASH_PAYMENT_METHOD_LABELS,
  CASH_STATUS_LABELS,
  SALE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from '../../utils/formatters';

interface FinanceModuleProps {
  transactions: CashTransaction[];
  onAddTransaction: (newTx: CashTransaction) => void;
  onUpdateTransaction: (updatedTx: CashTransaction) => void;
  onDeleteTransaction: (txId: string) => void;
  onDeleteMultipleTransactions?: (txIds: string[]) => void;
  onClearAllTransactions?: () => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onDeleteMultipleTransactions,
  onClearAllTransactions,
}) => {
  const today = getTodayISO();

  // Filter states
  const [typeToggle, setTypeToggle] = useState<'todas' | 'venda' | 'despesa'>('todas');
  const [periodFilter, setPeriodFilter] = useState<'hoje' | 'semana' | 'mes' | 'todas'>('semana');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChart, setShowChart] = useState(true);

  // Selection states
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<CashTransaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Form states
  const [formType, setFormType] = useState<CashTransactionType>('venda');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(today);
  const [formCategory, setFormCategory] = useState<string>('vendas_geral');
  const [formPaymentMethod, setFormPaymentMethod] = useState<CashPaymentMethod>('pix');
  const [formStatus, setFormStatus] = useState<CashTransactionStatus>('concluido');
  const [formNotes, setFormNotes] = useState('');

  // Open add modal
  const handleOpenAddModal = (defaultType?: CashTransactionType) => {
    const typeToSet = defaultType || (typeToggle === 'despesa' ? 'despesa' : 'venda');
    setEditingTx(null);
    setFormType(typeToSet);
    setFormDescription('');
    setFormAmount('');
    setFormDate(today);
    setFormCategory(typeToSet === 'venda' ? 'vendas_geral' : 'fornecedor');
    setFormPaymentMethod('pix');
    setFormStatus('concluido');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (tx: CashTransaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormDescription(tx.description);
    setFormAmount(String(tx.amount));
    setFormDate(tx.date);
    setFormCategory(tx.category);
    setFormPaymentMethod(tx.paymentMethod);
    setFormStatus(tx.status);
    setFormNotes(tx.notes || '');
    setIsModalOpen(true);
  };

  // Save transaction
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim() || !formAmount || !formDate) return;

    const amountNum = parseFloat(formAmount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) return;

    const txData: CashTransaction = {
      id: editingTx ? editingTx.id : `tx-${Date.now()}`,
      type: formType,
      description: formDescription.trim(),
      amount: amountNum,
      date: formDate,
      category: formCategory,
      paymentMethod: formPaymentMethod,
      status: formStatus,
      notes: formNotes.trim() || undefined,
    };

    if (editingTx) {
      onUpdateTransaction(txData);
    } else {
      onAddTransaction(txData);
    }

    setIsModalOpen(false);
  };

  // Week start & end dates calculation (Monday to Sunday)
  const currentWeekDays = useMemo(() => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));

    const weekDays: { iso: string; label: string; dayName: string }[] = [];
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const iso = current.toISOString().split('T')[0];
      const parts = iso.split('-');
      const label = `${parts[2]}/${parts[1]}`;
      weekDays.push({ iso, label, dayName: dayNames[i] });
    }
    return weekDays;
  }, []);

  const weekStartISO = currentWeekDays[0].iso;
  const weekEndISO = currentWeekDays[6].iso;
  const currentMonthPrefix = today.slice(0, 7);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type toggle
      if (typeToggle !== 'todas' && tx.type !== typeToggle) {
        return false;
      }

      // Period filter
      if (periodFilter === 'hoje') {
        if (tx.date !== today) return false;
      } else if (periodFilter === 'semana') {
        if (tx.date < weekStartISO || tx.date > weekEndISO) return false;
      } else if (periodFilter === 'mes') {
        if (!tx.date.startsWith(currentMonthPrefix)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(q);
        const matchesNotes = tx.notes?.toLowerCase().includes(q);
        return matchesDesc || matchesNotes;
      }

      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [transactions, typeToggle, periodFilter, searchQuery, today, weekStartISO, weekEndISO, currentMonthPrefix]);

  // Financial totals for the active filtered period
  const totalVendas = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'venda')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalDespesas = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'despesa')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const resultadoPeriodo = totalVendas - totalDespesas;

  // Weekly bar chart data
  const weekChartData = useMemo(() => {
    return currentWeekDays.map((dayObj) => {
      const dayTxs = transactions.filter((t) => t.date === dayObj.iso);
      const vendas = dayTxs.filter((t) => t.type === 'venda').reduce((s, t) => s + t.amount, 0);
      const despesas = dayTxs.filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
      return {
        ...dayObj,
        vendas,
        despesas,
        isToday: dayObj.iso === today,
      };
    });
  }, [currentWeekDays, transactions, today]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(
      ...weekChartData.flatMap((d) => [d.vendas, d.despesas]),
      1000
    );
    return max;
  }, [weekChartData]);

  // Selection handlers
  const isAllFilteredSelected =
    filteredTransactions.length > 0 &&
    filteredTransactions.every((t) => selectedTxIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredTransactions.map((t) => t.id));
      setSelectedTxIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const allFilteredIds = filteredTransactions.map((t) => t.id);
      setSelectedTxIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleToggleSelectTx = (txId: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(txId) ? prev.filter((id) => id !== txId) : [...prev, txId]
    );
  };

  const handleClearSelection = () => {
    setSelectedTxIds([]);
  };

  const handleDuplicateTransaction = (tx: CashTransaction) => {
    const duplicatedTx: CashTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      description: `${tx.description} (Cópia)`,
    };
    onAddTransaction(duplicatedTx);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedTxIds.length > 0 && onDeleteMultipleTransactions) {
      onDeleteMultipleTransactions(selectedTxIds);
      setSelectedTxIds([]);
      setShowBulkDeleteConfirm(false);
    }
  };

  return (
    <div id="finance-module" className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Header com Título e Botão Adicionar */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
            Vendas e Despesas
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              Fluxo de Caixa
            </span>
          </h2>
          <p className="text-[11px] text-zinc-400">Entradas de bar/cozinha e saídas operacionais</p>
        </div>

        <div className="flex items-center gap-2">
          {onClearAllTransactions && transactions.length > 0 && (
            <button
              id="btn-clear-all-transactions"
              onClick={() => setShowClearAllConfirm(true)}
              className="bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-800/60 font-semibold text-xs px-2.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
              title="Limpar todos os lançamentos do caixa"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar Tudo</span>
            </button>
          )}

          <button
            id="btn-add-transaction"
            onClick={() => handleOpenAddModal()}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Lançamento
          </button>
        </div>
      </div>

      {/* 🔘 Toggle Principal: Vendas | Despesas | Todas */}
      <div className="grid grid-cols-3 gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
        <button
          id="toggle-tx-todas"
          onClick={() => setTypeToggle('todas')}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
            typeToggle === 'todas'
              ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Todas
        </button>
        <button
          id="toggle-tx-vendas"
          onClick={() => setTypeToggle('venda')}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            typeToggle === 'venda'
              ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
              : 'text-emerald-400/80 hover:text-emerald-300'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          Vendas
        </button>
        <button
          id="toggle-tx-despesas"
          onClick={() => setTypeToggle('despesa')}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            typeToggle === 'despesa'
              ? 'bg-rose-500 text-zinc-950 font-bold shadow-sm'
              : 'text-rose-400/80 hover:text-rose-300'
          }`}
        >
          <ArrowDownRight className="w-3.5 h-3.5" />
          Despesas
        </button>
      </div>

      {/* 📊 Gráfico de Barras Simples: Entradas vs Saídas por Dia */}
      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-3.5 space-y-2 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-zinc-200">Fluxo da Semana (Entradas vs Saídas)</h3>
          </div>
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-[10px] text-zinc-400 hover:text-zinc-200 underline"
          >
            {showChart ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {showChart && (
          <div className="pt-2">
            <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-4 pb-1 border-b border-zinc-800/80">
              {weekChartData.map((d, idx) => {
                const heightVendas = Math.min(100, Math.round((d.vendas / maxChartValue) * 100));
                const heightDespesas = Math.min(100, Math.round((d.despesas / maxChartValue) * 100));

                return (
                  <div key={idx} className="flex flex-col items-center justify-end h-full group relative">
                    {/* Tooltip on hover/touch */}
                    <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-950 text-[9px] border border-zinc-700 px-1.5 py-1 rounded shadow-xl whitespace-nowrap z-20 pointer-events-none">
                      <span className="text-emerald-400">+{formatCurrency(d.vendas)}</span> |{' '}
                      <span className="text-rose-400">-{formatCurrency(d.despesas)}</span>
                    </div>

                    <div className="flex items-end gap-1 w-full justify-center h-20">
                      {/* Barra Vendas */}
                      <div
                        style={{ height: `${Math.max(heightVendas, d.vendas > 0 ? 8 : 2)}%` }}
                        className={`w-2.5 rounded-t transition-all ${
                          d.vendas > 0 ? 'bg-emerald-500' : 'bg-zinc-800/40'
                        }`}
                        title={`Vendas: ${formatCurrency(d.vendas)}`}
                      />
                      {/* Barra Despesas */}
                      <div
                        style={{ height: `${Math.max(heightDespesas, d.despesas > 0 ? 8 : 2)}%` }}
                        className={`w-2.5 rounded-t transition-all ${
                          d.despesas > 0 ? 'bg-rose-500' : 'bg-zinc-800/40'
                        }`}
                        title={`Despesas: ${formatCurrency(d.despesas)}`}
                      />
                    </div>

                    <span
                      className={`text-[10px] mt-1.5 font-medium ${
                        d.isToday ? 'text-amber-400 font-bold' : 'text-zinc-400'
                      }`}
                    >
                      {d.dayName}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legenda do Gráfico */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-400 pt-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Entradas (Vendas)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Saídas (Despesas)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filtros de Período e Busca */}
      <div className="space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar lançamentos por descrição ou notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Botoes de Período */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setPeriodFilter('hoje')}
            className={`px-3 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
              periodFilter === 'hoje'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriodFilter('semana')}
            className={`px-3 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
              periodFilter === 'semana'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setPeriodFilter('mes')}
            className={`px-3 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
              periodFilter === 'mes'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriodFilter('todas')}
            className={`px-3 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
              periodFilter === 'todas'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Todas Datas
          </button>
        </div>
      </div>

      {/* 🎛️ Barra de Seleção e Ações em Massa do Caixa */}
      {filteredTransactions.length > 0 && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
          <button
            id="btn-toggle-select-all-transactions"
            onClick={handleToggleSelectAll}
            className="flex items-center gap-2 text-zinc-300 hover:text-amber-400 font-semibold transition-colors"
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                isAllFilteredSelected
                  ? 'bg-amber-500 border-amber-500 text-zinc-950'
                  : selectedTxIds.length > 0
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'border-zinc-700 bg-zinc-950'
              }`}
            >
              {isAllFilteredSelected ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : selectedTxIds.length > 0 ? (
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-sm" />
              ) : null}
            </div>
            <span>
              {isAllFilteredSelected
                ? `Desmarcar todos (${filteredTransactions.length})`
                : `Selecionar todos (${filteredTransactions.length})`}
            </span>
          </button>

          {selectedTxIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                {selectedTxIds.length} selecionado{selectedTxIds.length > 1 ? 's' : ''}
              </span>

              <button
                id="btn-bulk-delete-transactions"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Selecionados</span>
              </button>

              <button
                onClick={handleClearSelection}
                className="text-zinc-400 hover:text-zinc-200 text-xs px-1.5 py-1"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de Transações Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => {
            const isSale = tx.type === 'venda';
            const catLabel = isSale
              ? SALE_CATEGORY_LABELS[tx.category] || tx.category
              : EXPENSE_CATEGORY_LABELS[tx.category] || tx.category;
            const isSelected = selectedTxIds.includes(tx.id);

            return (
              <div
                key={tx.id}
                id={`tx-card-${tx.id}`}
                className={`bg-zinc-900/90 rounded-2xl border p-3.5 transition-all shadow-md flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500 shadow-amber-500/10'
                    : isSale
                    ? 'border-zinc-800 hover:border-emerald-700/50'
                    : 'border-zinc-800 hover:border-rose-700/50'
                }`}
              >
                {/* Linha 1: Checkbox + Tag Venda/Despesa + Categoria + Data */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Checkbox de Seleção Individual */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelectTx(tx.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-zinc-950'
                          : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
                      }`}
                      title={isSelected ? 'Desmarcar' : 'Selecionar'}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isSale
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                      }`}
                    >
                      {isSale ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-rose-400" />
                      )}
                      {CASH_TYPE_LABELS[tx.type]}
                    </span>

                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                      {catLabel}
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    {formatDateBR(tx.date)}
                  </span>
                </div>

                {/* Linha 2: Descrição e Valor */}
                <div className="flex items-start justify-between gap-3 my-1">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-zinc-100 truncate">{tx.description}</h4>
                    {(tx.paymentMethod || tx.status) && (
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                        {tx.paymentMethod && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-zinc-500" />
                            {CASH_PAYMENT_METHOD_LABELS[tx.paymentMethod]}
                          </span>
                        )}
                        {tx.paymentMethod && tx.status && <span>•</span>}
                        {tx.status && <span className="text-zinc-500">{CASH_STATUS_LABELS[tx.status]}</span>}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-black block ${
                        isSale ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isSale ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>

                {/* Linha 3: Observações (se houver) e Ações */}
                <div className="mt-2 pt-2 border-t border-zinc-800/70 flex items-center justify-between text-[11px]">
                  {tx.notes && tx.notes.trim() ? (
                    <p className="text-zinc-400 text-[10px] truncate max-w-[200px]" title={tx.notes}>
                      Obs: {tx.notes}
                    </p>
                  ) : (
                    <span className="text-[10px] text-zinc-600 italic">Sem observações</span>
                  )}

                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <button
                      onClick={() => handleDuplicateTransaction(tx)}
                      className="text-zinc-400 hover:text-amber-400 p-1 transition-colors"
                      title="Duplicar lançamento"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(tx)}
                      className="text-zinc-400 hover:text-amber-400 p-1 transition-colors"
                      title="Editar lançamento"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(tx.id)}
                      className="text-zinc-400 hover:text-rose-400 p-1 transition-colors"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Confirm Delete */}
                {deleteConfirmId === tx.id && (
                  <div className="mt-2 p-2 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-[11px] text-rose-300">Excluir este lançamento?</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300"
                      >
                        Não
                      </button>
                      <button
                        onClick={() => {
                          onDeleteTransaction(tx.id);
                          setDeleteConfirmId(null);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-bold"
                      >
                        Sim, Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-6 text-center space-y-2">
            <DollarSign className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-medium">Nenhum lançamento encontrado para o período.</p>
            <button
              onClick={() => handleOpenAddModal()}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              + Adicionar lançamento
            </button>
          </div>
        )}
      </div>

      {/* 📊 Rodapé Fixo / Resumo Financeiro */}
      <div
        id="finance-summary-footer"
        className="rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-3.5 shadow-xl space-y-2"
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/70">
            <span className="text-[10px] text-emerald-400/80 font-medium block">Total Vendas</span>
            <span className="text-xs font-black text-emerald-400">{formatCurrency(totalVendas)}</span>
          </div>
          <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/70">
            <span className="text-[10px] text-rose-400/80 font-medium block">Total Despesas</span>
            <span className="text-xs font-black text-rose-400">{formatCurrency(totalDespesas)}</span>
          </div>
          <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/70">
            <span className="text-[10px] text-zinc-400 font-medium block">Resultado (Lucro)</span>
            <span
              className={`text-xs font-black ${
                resultadoPeriodo >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(resultadoPeriodo)}
            </span>
          </div>
        </div>
      </div>

      {/* 📝 Modal: Adicionar / Editar Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                {editingTx ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-3">
              {/* Tipo: Venda ou Despesa */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Tipo:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('venda');
                      setFormCategory('bar');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      formType === 'venda'
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Venda (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('despesa');
                      setFormCategory('fornecedor');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      formType === 'despesa'
                        ? 'bg-rose-500 text-zinc-950 border-rose-400 shadow-md'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    Despesa (Saída)
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Descrição do Lançamento:
                </label>
                <input
                  type="text"
                  required
                  placeholder={formType === 'venda' ? 'Ex: Vendas Bar, Couvert Show...' : 'Ex: Compra de Gelo, Diárias, Chopp...'}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Valor e Data */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Valor (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Data:</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Categoria e Forma de Pagamento */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Categoria:</label>
                  {formType === 'venda' ? (
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="vendas_geral">Vendas Geral</option>
                      <option value="bar">Bar (Bebidas)</option>
                      <option value="comida">Cozinha (Comidas)</option>
                      <option value="couvert">Couvert Artístico</option>
                      <option value="outros">Outras Entradas</option>
                    </select>
                  ) : (
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="fornecedor">Fornecedor Bebidas</option>
                      <option value="manutencao">Manutenção</option>
                      <option value="salario">Diárias e Salários</option>
                      <option value="energia">Contas de Consumo</option>
                      <option value="insumos">Insumos e Descartáveis</option>
                      <option value="outros">Outras Despesas</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Forma Pagto:</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as CashPaymentMethod)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão Crédito</option>
                    <option value="cartao_debito">Cartão Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Observações (opcional):</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes adicionais..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg"
                >
                  {editingTx ? 'Salvar Alterações' : 'Salvar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ Modal: Confirmar Limpeza Total de Lançamentos */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-800/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-zinc-100">Limpar Todas as Vendas e Despesas?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tem certeza que deseja apagar todo o histórico de lançamentos do caixa? Essa ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearAllTransactions) onClearAllTransactions();
                  setShowClearAllConfirm(false);
                }}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ⚠️ Modal: Confirmar Exclusão em Massa de Lançamentos Selecionados */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-800/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-zinc-100">
                Excluir {selectedTxIds.length} lançamento{selectedTxIds.length > 1 ? 's' : ''}?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tem certeza que deseja apagar os lançamentos de caixa selecionados? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-bulk-delete-transactions"
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                Sim, Excluir ({selectedTxIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
