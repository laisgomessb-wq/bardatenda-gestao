import React, { useState, useMemo } from 'react';
import {
  Music,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  Check,
  Copy,
} from 'lucide-react';
import { BandGig, GigStatus } from '../../types';
import {
  formatCurrency,
  formatDateBR,
  formatMonthYearBR,
  GIG_STATUS_LABELS,
  GIG_STATUS_CONFIG,
  getTodayISO,
} from '../../utils/formatters';
import { BandModal } from './BandModal';

interface BandsModuleProps {
  gigs: BandGig[];
  onAddGig: (gig: BandGig) => void;
  onUpdateGig: (gig: BandGig) => void;
  onDeleteGig: (gigId: string) => void;
  onDeleteMultipleGigs?: (gigIds: string[]) => void;
}

export const BandsModule: React.FC<BandsModuleProps> = ({
  gigs,
  onAddGig,
  onUpdateGig,
  onDeleteGig,
  onDeleteMultipleGigs,
}) => {
  // Calendar month state
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Multi-selection state
  const [selectedGigIds, setSelectedGigIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGig, setEditingGig] = useState<BandGig | null>(null);
  const [deletingGigId, setDeletingGigId] = useState<string | null>(null);
  const [defaultModalDate, setDefaultModalDate] = useState<string>(getTodayISO());

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDayFilter(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDayFilter(null);
  };

  const handleGoToCurrentMonth = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDayFilter(null);
  };

  // Month prefix string YYYY-MM
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Month Gigs
  const monthGigs = useMemo(() => {
    return gigs.filter((g) => g.date.startsWith(currentMonthStr));
  }, [gigs, currentMonthStr]);

  // Statistics for this month
  const confirmedCount = useMemo(
    () => monthGigs.filter((g) => g.status === 'confirmada').length,
    [monthGigs]
  );
  const negotiatingCount = useMemo(
    () => monthGigs.filter((g) => g.status === 'em_negociacao').length,
    [monthGigs]
  );
  const totalCacheConfirmed = useMemo(
    () =>
      monthGigs
        .filter((g) => g.status === 'confirmada')
        .reduce((sum, g) => sum + (g.cacheValue || 0), 0),
    [monthGigs]
  );

  // Filtered gigs for display
  const displayGigs = useMemo(() => {
    let result = monthGigs;
    if (selectedDayFilter) {
      result = result.filter((g) => g.date === selectedDayFilter);
    }
    if (statusFilter !== 'todos') {
      result = result.filter((g) => g.status === statusFilter);
    }
    // Sort by date then start time
    return [...result].sort((a, b) => {
      const cmpDate = (a.date || '').localeCompare(b.date || '');
      if (cmpDate !== 0) return cmpDate;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }, [monthGigs, selectedDayFilter, statusFilter]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: Array<{
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      gigsOnDay: BandGig[];
    }> = [];

    // Days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayGigs = gigs.filter((g) => g.date === dateStr);
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        gigsOnDay: dayGigs,
      });
    }

    return { firstDayIndex, days };
  }, [currentYear, currentMonth, gigs]);

  const handleOpenAddModal = (dateToUse?: string) => {
    setEditingGig(null);
    setDefaultModalDate(dateToUse || selectedDayFilter || getTodayISO());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (gig: BandGig) => {
    setEditingGig(gig);
    setIsModalOpen(true);
  };

  const handleSaveGig = (gig: BandGig) => {
    if (editingGig) {
      onUpdateGig(gig);
    } else {
      onAddGig(gig);
    }
  };

  const handleQuickToggleStatus = (gig: BandGig) => {
    const nextStatus: Record<GigStatus, GigStatus> = {
      em_negociacao: 'confirmada',
      confirmada: 'cancelada',
      cancelada: 'em_negociacao',
    };
    onUpdateGig({
      ...gig,
      status: nextStatus[gig.status] || 'confirmada',
    });
  };

  const handleDuplicateGig = (gig: BandGig) => {
    const duplicatedGig: BandGig = {
      ...gig,
      id: `gig-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      bandName: `${gig.bandName} (Cópia)`,
    };
    onAddGig(duplicatedGig);
  };

  const handleConfirmDelete = () => {
    if (deletingGigId) {
      onDeleteGig(deletingGigId);
      setSelectedGigIds((prev) => prev.filter((id) => id !== deletingGigId));
      setDeletingGigId(null);
    }
  };

  // Selection handlers
  const isAllFilteredSelected =
    displayGigs.length > 0 &&
    displayGigs.every((g) => selectedGigIds.includes(g.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const displayedIds = new Set(displayGigs.map((g) => g.id));
      setSelectedGigIds((prev) => prev.filter((id) => !displayedIds.has(id)));
    } else {
      const allDisplayedIds = displayGigs.map((g) => g.id);
      setSelectedGigIds((prev) => Array.from(new Set([...prev, ...allDisplayedIds])));
    }
  };

  const handleToggleSelectGig = (gigId: string) => {
    setSelectedGigIds((prev) =>
      prev.includes(gigId) ? prev.filter((id) => id !== gigId) : [...prev, gigId]
    );
  };

  const handleClearSelection = () => {
    setSelectedGigIds([]);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedGigIds.length > 0 && onDeleteMultipleGigs) {
      onDeleteMultipleGigs(selectedGigIds);
      setSelectedGigIds([]);
      setShowBulkDeleteConfirm(false);
    }
  };

  const weekDayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Total de cachês em negociação (estimado)
  const totalCacheNegotiating = useMemo(
    () =>
      monthGigs
        .filter((g) => g.status === 'em_negociacao')
        .reduce((sum, g) => sum + (g.cacheValue || 0), 0),
    [monthGigs]
  );

  return (
    <div id="module-bands" className="space-y-4 pb-24">
      {/* 🧭 Navegador de Mês */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3 flex items-center justify-between shadow-sm">
        <button
          id="btn-prev-month"
          onClick={handlePrevMonth}
          className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors active:scale-95"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <button
            onClick={handleGoToCurrentMonth}
            className="text-sm font-bold text-zinc-100 capitalize hover:text-amber-400 transition-colors flex items-center gap-1.5 justify-center"
            title="Ir para o mês atual"
          >
            <CalendarIcon className="w-4 h-4 text-amber-400" />
            <span>{formatMonthYearBR(currentYear, currentMonth)}</span>
          </button>
          <p className="text-[11px] text-zinc-400">
            {monthGigs.length} {monthGigs.length === 1 ? 'show cadastrado' : 'shows cadastrados'} na agenda
          </p>
        </div>

        <button
          id="btn-next-month"
          onClick={handleNextMonth}
          className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors active:scale-95"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 💰 1. CARD DE RESUMO COM TOTAL DE CACHÊS NO TOPO */}
      <div
        id="card-summary-caches-top"
        className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shadow-inner">
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider block">
                Total de Cachês • {formatMonthYearBR(currentYear, currentMonth)}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
                {formatCurrency(totalCacheConfirmed)}
              </h2>
              <span className="text-xs text-zinc-400">
                Valor total confirmado para pagamento de apresentações
              </span>
            </div>
          </div>

          {/* Mini Estatísticas Rápidas do Mês */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0">
            <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-xl px-3 py-2 text-center min-w-[85px] sm:min-w-[95px]">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Confirmados</span>
              <span className="text-base font-black text-zinc-100">{confirmedCount}</span>
            </div>

            <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl px-3 py-2 text-center min-w-[85px] sm:min-w-[95px]">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Em Negociação</span>
              <span className="text-base font-black text-zinc-100">{negotiatingCount}</span>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-center min-w-[85px] sm:min-w-[95px]">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Shows</span>
              <span className="text-base font-black text-zinc-100">{monthGigs.length}</span>
            </div>
          </div>
        </div>

        {totalCacheNegotiating > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Estimativa adicional em negociação:{' '}
              <strong className="text-amber-300 font-semibold">{formatCurrency(totalCacheNegotiating)}</strong>
            </span>
            <span className="text-[11px] text-zinc-500">
              Total potencial:{' '}
              <strong className="text-zinc-300">{formatCurrency(totalCacheConfirmed + totalCacheNegotiating)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* 🏛️ 2. ÁREA PRINCIPAL DIVIDIDA EM DUAS COLUNAS LADO A LADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ⬅️ COLUNA ESQUERDA (~60% da largura no desktop - lg:col-span-7): CALENDÁRIO */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-md">
            {/* Header do Calendário */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">
                    Calendário de Shows
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Clique em qualquer dia para filtrar ou planejar
                  </p>
                </div>
              </div>

              {selectedDayFilter ? (
                <button
                  onClick={() => setSelectedDayFilter(null)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Ver todo o mês
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-zinc-500 capitalize">
                  {formatMonthYearBR(currentYear, currentMonth)}
                </span>
              )}
            </div>

            {/* Cabeçalho dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-zinc-400 py-1">
              {weekDayHeaders.map((dh) => (
                <div key={dh} className="tracking-wider uppercase">
                  {dh}
                </div>
              ))}
            </div>

            {/* Grid dos Dias do Mês */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Células vazias antes do primeiro dia */}
              {Array.from({ length: calendarDays.firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[52px] sm:min-h-[62px] rounded-xl opacity-10 bg-zinc-950/30" />
              ))}

              {/* Dias do Mês */}
              {calendarDays.days.map((day) => {
                const hasGigs = day.gigsOnDay.length > 0;
                const isSelected = selectedDayFilter === day.dateStr;
                const isToday = day.dateStr === getTodayISO();

                return (
                  <button
                    key={day.dateStr}
                    id={`cal-day-${day.dateStr}`}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDayFilter(null);
                      } else {
                        setSelectedDayFilter(day.dateStr);
                      }
                    }}
                    className={`min-h-[54px] sm:min-h-[64px] rounded-xl flex flex-col justify-between p-1.5 transition-all border text-left relative group ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20 ring-2 ring-amber-400'
                        : hasGigs
                        ? 'bg-zinc-850 border-zinc-700/80 text-zinc-100 hover:border-amber-500/60 hover:bg-zinc-800'
                        : 'bg-zinc-950/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-900/80 hover:border-zinc-700'
                    } ${isToday && !isSelected ? 'ring-2 ring-amber-400/80 border-amber-500/40' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[11px] sm:text-xs leading-none font-bold ${isSelected ? 'text-zinc-950' : isToday ? 'text-amber-400 font-black' : 'text-zinc-200'}`}>
                        {day.dayNum}
                      </span>
                      {hasGigs && (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded-full font-bold leading-none ${
                            isSelected
                              ? 'bg-zinc-950 text-amber-400'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {day.gigsOnDay.length}
                        </span>
                      )}
                    </div>

                    {/* Bandas / Indicadores de Show no dia */}
                    {hasGigs ? (
                      <div className="space-y-0.5 w-full mt-1">
                        {day.gigsOnDay.slice(0, 2).map((g) => (
                          <div
                            key={g.id}
                            className={`text-[9px] sm:text-[10px] truncate px-1 py-0.5 rounded leading-tight font-medium flex items-center gap-1 ${
                              isSelected
                                ? 'bg-zinc-950/20 text-zinc-950'
                                : g.status === 'confirmada'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : g.status === 'em_negociacao'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                            title={`${g.bandName} - ${g.startTime || ''}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isSelected
                                  ? 'bg-zinc-950'
                                  : g.status === 'confirmada'
                                  ? 'bg-emerald-400'
                                  : g.status === 'em_negociacao'
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                              }`}
                            />
                            <span className="truncate">{g.bandName}</span>
                          </div>
                        ))}
                        {day.gigsOnDay.length > 2 && (
                          <span className={`text-[8px] font-bold block text-right ${isSelected ? 'text-zinc-900' : 'text-zinc-400'}`}>
                            +{day.gigsOnDay.length - 2} mais
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-4" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda do Calendário */}
            <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-zinc-400 border-t border-zinc-800/50">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Confirmado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Em Negociação</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Cancelado</span>
              </div>
            </div>
          </div>
        </div>

        {/* ➡️ COLUNA DIREITA (~40% da largura no desktop - lg:col-span-5): CARDS DE SHOWS DO MÊS */}
        <div className="lg:col-span-5 space-y-3" id="bands-month-column">
          {/* Container Principal dos Shows do Mês */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-md">
            {/* Header da Coluna com Botão Novo Show */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-800/70">
              <div>
                <div className="flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-zinc-100">
                    Shows do Mês
                  </h3>
                </div>
                <p className="text-[10px] text-zinc-400">
                  {selectedDayFilter
                    ? `Filtrando por ${formatDateBR(selectedDayFilter)}`
                    : `${displayGigs.length} ${displayGigs.length === 1 ? 'apresentação' : 'apresentações'} listadas`}
                </p>
              </div>

              <button
                id="btn-add-gig"
                onClick={() => handleOpenAddModal(selectedDayFilter || undefined)}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Novo Show</span>
              </button>
            </div>

            {/* Filtros Rápidos de Status */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5 text-xs">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === 'todos'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todos ({monthGigs.length})
              </button>

              {(['confirmada', 'em_negociacao', 'cancelada'] as GigStatus[]).map((st) => {
                const count = monthGigs.filter((g) => g.status === st).length;
                const isSelected = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>{GIG_STATUS_LABELS[st]}</span>
                    <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-zinc-950/20 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Banner de Dia Selecionado */}
            {selectedDayFilter && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs animate-in fade-in duration-150">
                <span className="text-amber-300 font-medium text-[11px]">
                  Dia: <strong>{formatDateBR(selectedDayFilter)}</strong>
                </span>
                <button
                  onClick={() => setSelectedDayFilter(null)}
                  className="text-[10px] text-amber-400 hover:underline font-bold"
                >
                  Ver todos do mês
                </button>
              </div>
            )}

            {/* 🎛️ Barra de Seleção e Exclusão em Massa */}
            {displayGigs.length > 0 && (
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                <button
                  id="btn-toggle-select-all-gigs"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 font-semibold transition-colors"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      isAllFilteredSelected
                        ? 'bg-amber-500 border-amber-500 text-zinc-950'
                        : selectedGigIds.length > 0
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    {isAllFilteredSelected ? (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    ) : selectedGigIds.length > 0 ? (
                      <div className="w-1 h-1 bg-amber-400 rounded-sm" />
                    ) : null}
                  </div>
                  <span>
                    {isAllFilteredSelected ? 'Desmarcar' : 'Selecionar todos'}
                  </span>
                </button>

                {selectedGigIds.length > 0 && (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <button
                      id="btn-bulk-delete-gigs"
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir ({selectedGigIds.length})</span>
                    </button>
                    <button
                      onClick={handleClearSelection}
                      className="text-zinc-400 hover:text-zinc-200 text-[10px]"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 📋 LISTA DE CARDS MENORES DE SHOWS DO MÊS */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-zinc-800" id="bands-list-container">
              {displayGigs.length === 0 ? (
                <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-6 text-center space-y-2">
                  <Music className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-300">Nenhum show encontrado</p>
                  <p className="text-[11px] text-zinc-500">
                    {selectedDayFilter
                      ? `Nenhum evento agendado para ${formatDateBR(selectedDayFilter)}.`
                      : 'Nenhuma banda cadastrada neste mês.'}
                  </p>
                  <button
                    onClick={() => handleOpenAddModal(selectedDayFilter || undefined)}
                    className="py-1.5 px-3 rounded-lg bg-amber-500 text-zinc-950 font-bold text-[11px] inline-flex items-center gap-1 shadow-sm mt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Show</span>
                  </button>
                </div>
              ) : (
                displayGigs.map((gig) => {
                  const isSelected = selectedGigIds.includes(gig.id);
                  const statusConfig = GIG_STATUS_CONFIG[gig.status] || GIG_STATUS_CONFIG.confirmada;
                  const hasTime = !!(gig.startTime || gig.endTime);
                  const hasDate = !!gig.date;
                  const hasCache = gig.cacheValue !== undefined && gig.cacheValue !== null && gig.cacheValue > 0;

                  return (
                    <div
                      key={gig.id}
                      id={`gig-card-${gig.id}`}
                      className={`bg-zinc-950/80 border rounded-xl p-3 transition-all space-y-2 relative shadow-sm hover:border-zinc-700 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500'
                          : 'border-zinc-800/90'
                      }`}
                    >
                      {/* Topo do Card Menor: Checkbox, Nome e Ações */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {/* Checkbox de Seleção */}
                          <button
                            type="button"
                            onClick={() => handleToggleSelectGig(gig.id)}
                            className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-zinc-950'
                                : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                            }`}
                            title={isSelected ? 'Desmarcar' : 'Selecionar'}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Status Switcher de 1 Clique */}
                              <button
                                onClick={() => handleQuickToggleStatus(gig)}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 transition-transform active:scale-95 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                                title="Clique para alternar o status"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                <span>{GIG_STATUS_LABELS[gig.status]}</span>
                              </button>
                            </div>

                            <h4 className="font-bold text-xs sm:text-sm text-zinc-100 leading-snug truncate">
                              {gig.bandName}
                            </h4>
                          </div>
                        </div>

                        {/* Ações Rápidas: Duplicar, Editar, Excluir */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => handleDuplicateGig(gig)}
                            className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-amber-500/20 hover:text-amber-400 text-zinc-400 flex items-center justify-center transition-colors"
                            title="Duplicar"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(gig)}
                            className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeletingGigId(gig.id)}
                            className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 flex items-center justify-center transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Informações Compactas: Data, Horário e Cachê */}
                      <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50 text-[11px]">
                        {/* Data e Horário */}
                        <div className="space-y-0.5 min-w-0">
                          {hasDate && (
                            <div className="flex items-center gap-1 text-zinc-200 font-semibold truncate">
                              <CalendarIcon className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{formatDateBR(gig.date)}</span>
                            </div>
                          )}
                          {hasTime && (
                            <div className="flex items-center gap-1 text-zinc-400 text-[10px] truncate">
                              <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="truncate">
                                {gig.startTime && gig.endTime
                                  ? `${gig.startTime} - ${gig.endTime}`
                                  : gig.startTime || gig.endTime}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Cachê */}
                        <div className="text-right flex flex-col justify-center border-l border-zinc-800/80 pl-2">
                          <span className="text-[9px] uppercase font-semibold text-zinc-500">Cachê</span>
                          <span className="text-xs font-black text-amber-400">
                            {hasCache ? formatCurrency(gig.cacheValue || 0) : 'A combinar'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Band Modal (Add/Edit) */}
      <BandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGig}
        editingGig={editingGig}
        defaultDate={defaultModalDate}
      />

      {/* Delete Confirmation Modal */}
      {deletingGigId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xs w-full p-5 shadow-2xl text-zinc-200">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-center text-zinc-100 mb-1">
              Excluir apresentação?
            </h3>
            <p className="text-xs text-zinc-400 text-center mb-4">
              Esta ação removerá a banda da agenda do bar.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeletingGigId(null)}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-gig"
                onClick={handleConfirmDelete}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Modal: Confirmar Exclusão em Massa de Shows */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-800/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-zinc-100">
                Excluir {selectedGigIds.length} show{selectedGigIds.length > 1 ? 's' : ''}?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tem certeza que deseja apagar as apresentações selecionadas da agenda? Esta ação não pode ser desfeita.
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
                id="btn-confirm-bulk-delete-gigs"
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                Sim, Excluir ({selectedGigIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
