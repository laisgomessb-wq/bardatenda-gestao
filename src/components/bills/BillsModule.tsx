import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  X,
  FileText,
  Filter,
  Check,
  Copy,
} from 'lucide-react';
import {
  BillAccount,
  BillType,
  BillStatus,
  BillCategory,
  BillPaymentMethod,
} from '../../types';
import {
  formatCurrency,
  formatDateBR,
  getTodayISO,
  BILL_TYPE_LABELS,
  BILL_STATUS_LABELS,
  BILL_STATUS_CONFIG,
  BILL_CATEGORY_LABELS,
  BILL_CATEGORY_COLORS,
  BILL_PAYMENT_METHOD_LABELS,
  calculateBillEffectiveStatus,
} from '../../utils/formatters';

interface BillsModuleProps {
  bills: BillAccount[];
  onAddBill: (newBill: BillAccount) => void;
  onUpdateBill: (updatedBill: BillAccount) => void;
  onDeleteBill: (billId: string) => void;
  onDeleteMultipleBills?: (billIds: string[]) => void;
  onClearAllBills?: () => void;
}

export const BillsModule: React.FC<BillsModuleProps> = ({
  bills,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
  onDeleteMultipleBills,
  onClearAllBills,
}) => {
  const today = getTodayISO();

  // Filters state
  const [typeToggle, setTypeToggle] = useState<'todas' | 'a_pagar' | 'a_receber'>('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'atrasado' | 'pago'>('todos');
  const [periodFilter, setPeriodFilter] = useState<'mes_atual' | 'proximos_7' | 'vencidas' | 'todas'>('mes_atual');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection states
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<BillAccount | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Form states
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<BillType>('a_pagar');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState(today);
  const [formStatus, setFormStatus] = useState<BillStatus>('pendente');
  const [formCategory, setFormCategory] = useState<BillCategory>('fornecedor');
  const [formPaymentMethod, setFormPaymentMethod] = useState<BillPaymentMethod>('pix');
  const [formPaymentDate, setFormPaymentDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Open modal for new bill
  const handleOpenAddModal = (defaultType?: BillType) => {
    setEditingBill(null);
    setFormDescription('');
    setFormType(defaultType || (typeToggle === 'a_receber' ? 'a_receber' : 'a_pagar'));
    setFormAmount('');
    setFormDueDate(today);
    setFormStatus('pendente');
    setFormCategory(defaultType === 'a_receber' ? 'patrocinio' : 'fornecedor');
    setFormPaymentMethod('pix');
    setFormPaymentDate('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (bill: BillAccount) => {
    setEditingBill(bill);
    setFormDescription(bill.description);
    setFormType(bill.type);
    setFormAmount(String(bill.amount));
    setFormDueDate(bill.dueDate);
    setFormStatus(bill.status);
    setFormCategory(bill.category);
    setFormPaymentMethod(bill.paymentMethod);
    setFormPaymentDate(bill.paymentDate || '');
    setFormNotes(bill.notes || '');
    setIsModalOpen(true);
  };

  // Save bill (Add or Update)
  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim() || !formAmount || !formDueDate) return;

    const amountNum = parseFloat(formAmount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) return;

    const billData: BillAccount = {
      id: editingBill ? editingBill.id : `bill-${Date.now()}`,
      description: formDescription.trim(),
      type: formType,
      amount: amountNum,
      dueDate: formDueDate,
      status: formStatus,
      category: formCategory,
      paymentMethod: formPaymentMethod,
      paymentDate: formStatus === 'pago' ? (formPaymentDate || today) : undefined,
      notes: formNotes.trim() || undefined,
    };

    if (editingBill) {
      onUpdateBill(billData);
    } else {
      onAddBill(billData);
    }

    setIsModalOpen(false);
  };

  // Quick toggle paid/pending in 1 touch
  const handleTogglePaid = (bill: BillAccount) => {
    const isPaid = bill.status === 'pago';
    const updated: BillAccount = {
      ...bill,
      status: isPaid ? 'pendente' : 'pago',
      paymentDate: isPaid ? undefined : today,
    };
    onUpdateBill(updated);
  };

  // Process and filter bills
  const processedBills = useMemo(() => {
    return bills.map((b) => ({
      ...b,
      effectiveStatus: calculateBillEffectiveStatus(b.dueDate, b.status, today),
    }));
  }, [bills, today]);

  // Current month reference
  const currentMonthPrefix = today.slice(0, 7); // "YYYY-MM"

  // Date 7 days ahead
  const sevenDaysAhead = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  const filteredBills = useMemo(() => {
    return processedBills.filter((bill) => {
      // Type toggle
      if (typeToggle !== 'todas' && bill.type !== typeToggle) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'todos' && bill.effectiveStatus !== statusFilter) {
        return false;
      }

      // Period filter
      if (periodFilter === 'mes_atual') {
        if (!bill.dueDate.startsWith(currentMonthPrefix)) return false;
      } else if (periodFilter === 'proximos_7') {
        if (bill.dueDate < today || bill.dueDate > sevenDaysAhead) return false;
      } else if (periodFilter === 'vencidas') {
        if (bill.effectiveStatus !== 'atrasado') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = bill.description.toLowerCase().includes(query);
        const matchesCat = BILL_CATEGORY_LABELS[bill.category]?.toLowerCase().includes(query);
        const matchesNotes = bill.notes?.toLowerCase().includes(query);
        return matchesDesc || matchesCat || matchesNotes;
      }

      return true;
    }).sort((a, b) => {
      // Sort by status priority (atrasado first, then pendente, then pago), then dueDate
      if (a.effectiveStatus === 'atrasado' && b.effectiveStatus !== 'atrasado') return -1;
      if (b.effectiveStatus === 'atrasado' && a.effectiveStatus !== 'atrasado') return 1;
      if (a.effectiveStatus === 'pendente' && b.effectiveStatus === 'pago') return -1;
      if (b.effectiveStatus === 'pendente' && a.effectiveStatus === 'pago') return 1;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });
  }, [processedBills, typeToggle, statusFilter, periodFilter, searchQuery, currentMonthPrefix, today, sevenDaysAhead]);

  // Financial totals of the filtered list
  const totalAPagar = useMemo(() => {
    return filteredBills
      .filter((b) => b.type === 'a_pagar')
      .reduce((acc, b) => acc + b.amount, 0);
  }, [filteredBills]);

  const totalAReceber = useMemo(() => {
    return filteredBills
      .filter((b) => b.type === 'a_receber')
      .reduce((acc, b) => acc + b.amount, 0);
  }, [filteredBills]);

  const saldoPeriodo = totalAReceber - totalAPagar;

  // Pending vs overdue counts for badges
  const overdueCount = useMemo(
    () => processedBills.filter((b) => b.effectiveStatus === 'atrasado').length,
    [processedBills]
  );

  // Selection handlers
  const isAllFilteredSelected =
    filteredBills.length > 0 &&
    filteredBills.every((b) => selectedBillIds.includes(b.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredBills.map((b) => b.id));
      setSelectedBillIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const allFilteredIds = filteredBills.map((b) => b.id);
      setSelectedBillIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleToggleSelectBill = (billId: string) => {
    setSelectedBillIds((prev) =>
      prev.includes(billId) ? prev.filter((id) => id !== billId) : [...prev, billId]
    );
  };

  const handleClearSelection = () => {
    setSelectedBillIds([]);
  };

  const handleDuplicateBill = (bill: BillAccount) => {
    const duplicatedBill: BillAccount = {
      ...bill,
      id: `bill-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      description: `${bill.description} (Cópia)`,
      status: 'pendente',
      paymentDate: undefined,
    };
    onAddBill(duplicatedBill);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedBillIds.length > 0 && onDeleteMultipleBills) {
      onDeleteMultipleBills(selectedBillIds);
      setSelectedBillIds([]);
      setShowBulkDeleteConfirm(false);
    }
  };

  return (
    <div id="bills-module" className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Top Header & Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
            Contas a Pagar / Receber
            {overdueCount > 0 && (
              <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/40 animate-pulse">
                {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <p className="text-[11px] text-zinc-400">Controle financeiro de vencimentos e compromissos</p>
        </div>

        <div className="flex items-center gap-2">
          {onClearAllBills && bills.length > 0 && (
            <button
              id="btn-clear-all-bills"
              onClick={() => setShowClearAllConfirm(true)}
              className="bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-800/60 font-semibold text-xs px-2.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
              title="Limpar todas as contas cadastradas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar Tudo</span>
            </button>
          )}

          <button
            id="btn-add-bill"
            onClick={() => handleOpenAddModal()}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Nova Conta
          </button>
        </div>
      </div>

      {/* 🔘 Toggle Principal: A Pagar | A Receber | Todas */}
      <div className="grid grid-cols-3 gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
        <button
          id="toggle-bill-todas"
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
          id="toggle-bill-a-pagar"
          onClick={() => setTypeToggle('a_pagar')}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            typeToggle === 'a_pagar'
              ? 'bg-rose-500 text-zinc-950 font-bold shadow-sm'
              : 'text-rose-400/80 hover:text-rose-300'
          }`}
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          A Pagar
        </button>
        <button
          id="toggle-bill-a-receber"
          onClick={() => setTypeToggle('a_receber')}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            typeToggle === 'a_receber'
              ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
              : 'text-emerald-400/80 hover:text-emerald-300'
          }`}
        >
          <ArrowUpCircle className="w-3.5 h-3.5" />
          A Receber
        </button>
      </div>

      {/* Filtros de Período e Status */}
      <div className="space-y-2">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por descrição, fornecedor, notas..."
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

        {/* Sub-filtros em Linha: Período e Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {/* Período */}
          <button
            onClick={() => setPeriodFilter('mes_atual')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
              periodFilter === 'mes_atual'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Mês Atual
          </button>
          <button
            onClick={() => setPeriodFilter('proximos_7')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
              periodFilter === 'proximos_7'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Próximos 7 Dias
          </button>
          <button
            onClick={() => setPeriodFilter('vencidas')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
              periodFilter === 'vencidas'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Atrasadas ({overdueCount})
          </button>
          <button
            onClick={() => setPeriodFilter('todas')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
              periodFilter === 'todas'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Todas Datas
          </button>

          <span className="text-zinc-700">|</span>

          {/* Status */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'pendente' ? 'todos' : 'pendente')}
            className={`px-2 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
              statusFilter === 'pendente'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'pago' ? 'todos' : 'pago')}
            className={`px-2 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
              statusFilter === 'pago'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Pagas
          </button>
        </div>
      </div>

      {/* 🎛️ Barra de Seleção e Ações em Massa de Contas */}
      {filteredBills.length > 0 && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
          <button
            id="btn-toggle-select-all-bills"
            onClick={handleToggleSelectAll}
            className="flex items-center gap-2 text-zinc-300 hover:text-amber-400 font-semibold transition-colors"
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                isAllFilteredSelected
                  ? 'bg-amber-500 border-amber-500 text-zinc-950'
                  : selectedBillIds.length > 0
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'border-zinc-700 bg-zinc-950'
              }`}
            >
              {isAllFilteredSelected ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : selectedBillIds.length > 0 ? (
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-sm" />
              ) : null}
            </div>
            <span>
              {isAllFilteredSelected
                ? `Desmarcar todas (${filteredBills.length})`
                : `Selecionar todas (${filteredBills.length})`}
            </span>
          </button>

          {selectedBillIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                {selectedBillIds.length} selecionada{selectedBillIds.length > 1 ? 's' : ''}
              </span>

              <button
                id="btn-bulk-delete-bills"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Selecionadas</span>
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

      {/* Lista de Contas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredBills.length > 0 ? (
          filteredBills.map((bill) => {
            const isPayable = bill.type === 'a_pagar';
            const isPaid = bill.status === 'pago';
            const isOverdue = bill.effectiveStatus === 'atrasado';
            const isSelected = selectedBillIds.includes(bill.id);

            return (
              <div
                key={bill.id}
                id={`bill-card-${bill.id}`}
                className={`bg-zinc-900/90 rounded-2xl border p-3.5 transition-all shadow-md flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500 shadow-amber-500/10'
                    : isOverdue
                    ? 'border-rose-800/60 bg-rose-950/10'
                    : isPaid
                    ? 'border-zinc-800/60 opacity-90'
                    : isPayable
                    ? 'border-zinc-800 hover:border-zinc-700'
                    : 'border-emerald-900/40 hover:border-emerald-700/40'
                }`}
              >
                <div>
                  {/* Linha 1: Tipo & Categoria + Botão Rápido de Pagar */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Checkbox de Seleção Individual */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelectBill(bill.id)}
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
                          isPayable
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                        }`}
                      >
                        {isPayable ? (
                          <ArrowDownCircle className="w-3 h-3 text-rose-400" />
                        ) : (
                          <ArrowUpCircle className="w-3 h-3 text-emerald-400" />
                        )}
                        {BILL_TYPE_LABELS[bill.type]}
                      </span>

                      <span
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${
                          BILL_CATEGORY_COLORS[bill.category] || 'text-zinc-400 bg-zinc-800'
                        }`}
                      >
                        {BILL_CATEGORY_LABELS[bill.category]}
                      </span>

                      {isOverdue && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          Vencida!
                        </span>
                      )}
                    </div>

                    {/* Botão de 1 Toque: Alternar Pago / Pendente */}
                    <button
                      id={`btn-toggle-paid-${bill.id}`}
                      onClick={() => handleTogglePaid(bill)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-zinc-800 hover:bg-emerald-500 text-zinc-300 hover:text-zinc-950 border-zinc-700 hover:border-emerald-400'
                      }`}
                      title={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isPaid ? 'text-emerald-400' : ''}`} />
                      {isPaid ? 'Pago' : 'Dar Baixa'}
                    </button>
                  </div>

                  {/* Linha 2: Descrição e Valor */}
                  <div className="flex items-start justify-between gap-3 my-1">
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isPaid ? 'line-through text-zinc-400' : 'text-zinc-100'
                        }`}
                      >
                        {bill.description}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          Venc: <strong className={isOverdue ? 'text-rose-400' : 'text-zinc-200'}>{formatDateBR(bill.dueDate)}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-zinc-500" />
                          {BILL_PAYMENT_METHOD_LABELS[bill.paymentMethod]}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-black block ${
                          isPayable ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {formatCurrency(bill.amount)}
                      </span>
                      {bill.paymentDate && isPaid && (
                        <span className="text-[9px] text-zinc-500 block">
                          Pago em {formatDateBR(bill.paymentDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Linha 3: Observações (se houver) e Ações de Edição/Exclusão */}
                <div className="mt-2 pt-2 border-t border-zinc-800/70 flex items-center justify-between text-[11px]">
                  <p className="text-zinc-400 text-[10px] truncate max-w-[200px]">
                    {bill.notes ? `Obs: ${bill.notes}` : `Status: ${BILL_STATUS_LABELS[bill.effectiveStatus]}`}
                  </p>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDuplicateBill(bill)}
                      className="text-zinc-400 hover:text-amber-400 p-1 transition-colors"
                      title="Duplicar esta conta"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(bill)}
                      className="text-zinc-400 hover:text-amber-400 p-1 transition-colors"
                      title="Editar conta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(bill.id)}
                      className="text-zinc-400 hover:text-rose-400 p-1 transition-colors"
                      title="Excluir conta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Confirmação de exclusão */}
                {deleteConfirmId === bill.id && (
                  <div className="mt-2 p-2 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-[11px] text-rose-300">Excluir esta conta?</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300"
                      >
                        Não
                      </button>
                      <button
                        onClick={() => {
                          onDeleteBill(bill.id);
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
            <p className="text-xs text-zinc-400 font-medium">Nenhuma conta encontrada com os filtros selecionados.</p>
            <button
              onClick={() => handleOpenAddModal()}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              + Adicionar primeira conta
            </button>
          </div>
        )}
      </div>

      {/* 📊 Rodapé Fixo / Resumo Financeiro do Período Filtrado */}
      <div
        id="bills-summary-footer"
        className="rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-3.5 shadow-xl space-y-2"
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/70">
            <span className="text-[10px] text-rose-400/80 font-medium block">Total a Pagar</span>
            <span className="text-xs font-black text-rose-400">{formatCurrency(totalAPagar)}</span>
          </div>
          <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/70">
            <span className="text-[10px] text-emerald-400/80 font-medium block">Total a Receber</span>
            <span className="text-xs font-black text-emerald-400">{formatCurrency(totalAReceber)}</span>
          </div>
          <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/70">
            <span className="text-[10px] text-zinc-400 font-medium block">Saldo Período</span>
            <span
              className={`text-xs font-black ${
                saldoPeriodo >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(saldoPeriodo)}
            </span>
          </div>
        </div>
      </div>

      {/* 📝 Modal: Adicionar / Editar Conta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                {editingBill ? 'Editar Conta' : 'Nova Conta Financeira'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="space-y-3">
              {/* Tipo: A Pagar ou A Receber */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Tipo de Lançamento:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('a_pagar')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      formType === 'a_pagar'
                        ? 'bg-rose-500 text-zinc-950 border-rose-400 shadow-md'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    A Pagar (Saída)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('a_receber')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      formType === 'a_receber'
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    A Receber (Entrada)
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Descrição / Fornecedor / Título:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fornecedor Ambev, Conta de Luz, Aluguel..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Valor e Data de Vencimento */}
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
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Vencimento:</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Categoria e Forma de Pagamento */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Categoria:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as BillCategory)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="fornecedor">Fornecedor</option>
                    <option value="aluguel">Aluguel</option>
                    <option value="energia">Energia Elétrica</option>
                    <option value="agua">Água</option>
                    <option value="internet">Internet</option>
                    <option value="impostos">Impostos</option>
                    <option value="patrocinio">Patrocínio/Entrada</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Forma Prevista:</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as BillPaymentMethod)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>

              {/* Status do Pagamento */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Status:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('pendente')}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      formStatus === 'pendente'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Pendente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormStatus('pago');
                      if (!formPaymentDate) setFormPaymentDate(today);
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      formStatus === 'pago'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Pago / Liquidado
                  </button>
                </div>
              </div>

              {/* Se Pago, Data do Pagamento */}
              {formStatus === 'pago' && (
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Data da Baixa/Pagamento:</label>
                  <input
                    type="date"
                    value={formPaymentDate || today}
                    onChange={(e) => setFormPaymentDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Observações (opcional):</label>
                <textarea
                  rows={2}
                  placeholder="Código de barras, chave Pix, detalhes do acordo..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Botoes de Ação */}
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
                  {editingBill ? 'Salvar Alterações' : 'Cadastrar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ Modal: Confirmar Limpeza Total de Contas */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-800/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-zinc-100">Limpar Todas as Contas?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tem certeza que deseja apagar todos os registros de contas a pagar e receber? Essa ação não pode ser desfeita.
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
                  if (onClearAllBills) onClearAllBills();
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
      {/* ⚠️ Modal: Confirmar Exclusão em Massa de Contas Selecionadas */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-800/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-zinc-100">
                Excluir {selectedBillIds.length} conta{selectedBillIds.length > 1 ? 's' : ''}?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tem certeza que deseja apagar as contas selecionadas? Esta ação não pode ser desfeita.
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
                id="btn-confirm-bulk-delete-bills"
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                Sim, Excluir ({selectedBillIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
