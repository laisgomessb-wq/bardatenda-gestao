import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  DollarSign,
  UserCheck,
  UserX,
  Coffee,
  Edit2,
  Trash2,
  Copy,
  FileText,
  Search,
  CheckCircle2,
  CalendarDays,
  UserPlus,
  Zap,
  Check,
} from 'lucide-react';
import { StaffShift, StaffRole, ShiftStatus, StaffMember } from '../../types';
import {
  formatCurrency,
  formatDateBR,
  formatDayOfWeekBR,
  getTodayISO,
  ROLE_LABELS,
  ROLE_BADGE_STYLE,
  SHIFT_STATUS_LABELS,
  SHIFT_STATUS_CONFIG,
} from '../../utils/formatters';
import { ShiftModal } from './ShiftModal';
import { StaffMemberModal } from './StaffMemberModal';

interface StaffModuleProps {
  shifts: StaffShift[];
  staffMembers: StaffMember[];
  onAddShift: (shift: StaffShift) => void;
  onUpdateShift: (shift: StaffShift) => void;
  onDeleteShift: (shiftId: string) => void;
  onDeleteMultipleShifts?: (shiftIds: string[]) => void;
  onBatchAddShifts: (shifts: StaffShift[]) => void;
  onAddStaffMember: (member: StaffMember) => void;
  onUpdateStaffMember: (member: StaffMember) => void;
  onDeleteStaffMember: (memberId: string) => void;
  onDeleteMultipleStaffMembers?: (memberIds: string[]) => void;
}

export const StaffModule: React.FC<StaffModuleProps> = ({
  shifts,
  staffMembers,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  onDeleteMultipleShifts,
  onBatchAddShifts,
  onAddStaffMember,
  onUpdateStaffMember,
  onDeleteStaffMember,
  onDeleteMultipleStaffMembers,
}) => {
  // All dates that have shifts
  const allDatesWithShifts = useMemo(() => {
    const dates: string[] = Array.from(new Set(shifts.map((s) => s.date))).filter(
      (d): d is string => Boolean(d)
    );
    return dates.sort((a, b) => (a || '').localeCompare(b || ''));
  }, [shifts]);

  // Subtab: 'planner' | 'cadastrados'
  const [activeTab, setActiveTab] = useState<'planner' | 'cadastrados'>('planner');

  // Selection states
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [showBulkDeleteShiftsConfirm, setShowBulkDeleteShiftsConfirm] = useState(false);

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [showBulkDeleteMembersConfirm, setShowBulkDeleteMembersConfirm] = useState(false);
  
  // Default to today if it has shifts, otherwise default to the next upcoming scheduled date with data
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = getTodayISO();
    const hasToday = shifts.some((s) => s.date === today);
    if (hasToday) return today;
    const upcomingDates = Array.from(
      new Set(shifts.map((s) => s.date).filter((d): d is string => Boolean(d) && d >= today))
    ).sort();
    if (upcomingDates.length > 0) return upcomingDates[0];
    const dates: string[] = Array.from(new Set(shifts.map((s) => s.date))).filter(
      (d): d is string => Boolean(d)
    ).sort();
    return dates.length > 0 ? dates[dates.length - 1] : today;
  });
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [staffSearchTerm, setStaffSearchTerm] = useState('');

  // Modals state
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<StaffShift | null>(null);
  const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [sourceDateToCopy, setSourceDateToCopy] = useState<string>('');

  // Date Navigation - Only navigate between dates that have people scheduled
  const prevDateWithShifts = useMemo(() => {
    const prevs = allDatesWithShifts.filter((d) => d < selectedDate);
    return prevs.length > 0 ? prevs[prevs.length - 1] : null;
  }, [allDatesWithShifts, selectedDate]);

  const nextDateWithShifts = useMemo(() => {
    return allDatesWithShifts.find((d) => d > selectedDate) || null;
  }, [allDatesWithShifts, selectedDate]);

  const goToPrevDate = () => {
    if (prevDateWithShifts) {
      setSelectedDate(prevDateWithShifts);
    } else if (allDatesWithShifts.length > 0 && !allDatesWithShifts.includes(selectedDate)) {
      const prevs = allDatesWithShifts.filter((d) => d < selectedDate);
      if (prevs.length > 0) setSelectedDate(prevs[prevs.length - 1]);
      else setSelectedDate(allDatesWithShifts[0]);
    }
  };

  const goToNextDate = () => {
    if (nextDateWithShifts) {
      setSelectedDate(nextDateWithShifts);
    } else if (allDatesWithShifts.length > 0 && !allDatesWithShifts.includes(selectedDate)) {
      const nexts = allDatesWithShifts.filter((d) => d > selectedDate);
      if (nexts.length > 0) setSelectedDate(nexts[0]);
      else setSelectedDate(allDatesWithShifts[allDatesWithShifts.length - 1]);
    }
  };

  const isToday = selectedDate === getTodayISO();

  // Shifts for selected date
  const dayShifts = useMemo(() => {
    return shifts.filter((s) => s.date === selectedDate);
  }, [shifts, selectedDate]);

  // Statistics for selected date
  const totalScheduled = dayShifts.length;
  const confirmedShifts = useMemo(
    () => dayShifts.filter((s) => s.status === 'confirmado'),
    [dayShifts]
  );
  const absentCount = useMemo(
    () => dayShifts.filter((s) => s.status === 'faltou').length,
    [dayShifts]
  );
  const totalDailyPay = useMemo(
    () =>
      dayShifts
        .filter((s) => s.status === 'confirmado')
        .reduce((sum, s) => sum + (s.dailyPay || 0), 0),
    [dayShifts]
  );

  // Filtered shifts by role
  const displayShifts = useMemo(() => {
    let result = dayShifts;
    if (roleFilter !== 'todos') {
      result = result.filter((s) => s.role === roleFilter);
    }
    // Sort by name
    return [...result].sort((a, b) => {
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [dayShifts, roleFilter]);

  // Filtered registered staff members
  const filteredStaffMembers = useMemo(() => {
    return staffMembers.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(staffSearchTerm.toLowerCase()));

      const matchesRole = roleFilter === 'todos' || m.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staffMembers, staffSearchTerm, roleFilter]);

  // Handlers for Shifts
  const handleOpenAddShift = () => {
    setEditingShift(null);
    setIsShiftModalOpen(true);
  };

  const handleOpenEditShift = (shift: StaffShift) => {
    setEditingShift(shift);
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = (shift: StaffShift) => {
    if (editingShift) {
      onUpdateShift(shift);
    } else {
      onAddShift(shift);
    }
  };

  const handleQuickToggleStatus = (shift: StaffShift) => {
    const nextStatusMap: Record<ShiftStatus, ShiftStatus> = {
      confirmado: 'faltou',
      faltou: 'folga',
      folga: 'confirmado',
    };
    onUpdateShift({
      ...shift,
      status: nextStatusMap[shift.status] || 'confirmado',
    });
  };

  const handleDuplicateShift = (shift: StaffShift) => {
    const duplicated: StaffShift = {
      ...shift,
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      notes: shift.notes ? `${shift.notes} (Cópia)` : undefined,
    };
    onAddShift(duplicated);
  };

  const handleConfirmDeleteShift = () => {
    if (deletingShiftId) {
      onDeleteShift(deletingShiftId);
      setDeletingShiftId(null);
    }
  };

  // Quick schedule member to selected date
  const handleQuickScheduleMember = (member: StaffMember) => {
    const alreadyScheduled = dayShifts.some(
      (s) => s.name.toLowerCase() === member.name.toLowerCase()
    );

    if (alreadyScheduled) {
      alert(`${member.name} já está na escala de ${formatDateBR(selectedDate)}!`);
      return;
    }

    const newShift: StaffShift = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      staffMemberId: member.id,
      name: member.name,
      role: member.role,
      date: selectedDate,
      status: 'confirmado',
      dailyPay: member.defaultDailyPay,
      notes: member.notes,
    };

    onAddShift(newShift);
    setActiveTab('planner');
  };

  // Handlers for Staff Members
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: StaffMember) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (member: StaffMember) => {
    if (editingMember) {
      onUpdateStaffMember(member);
    } else {
      onAddStaffMember(member);
    }
  };

  const handleDuplicateMember = (member: StaffMember) => {
    const duplicated: StaffMember = {
      ...member,
      id: `staff-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: `${member.name} (Cópia)`,
    };
    onAddStaffMember(duplicated);
  };

  const handleConfirmDeleteMember = () => {
    if (deletingMemberId) {
      onDeleteStaffMember(deletingMemberId);
      setDeletingMemberId(null);
    }
  };

  // Copy scale
  const availableDatesWithShifts = useMemo(() => {
    const dates: string[] = Array.from(new Set(shifts.map((s) => s.date))).filter(
      (d): d is string => Boolean(d) && d !== selectedDate
    );
    return dates.sort((a, b) => (b || '').localeCompare(a || ''));
  }, [shifts, selectedDate]);

  const handleExecuteCopy = () => {
    if (!sourceDateToCopy) return;
    const sourceShifts = shifts.filter((s) => s.date === sourceDateToCopy);
    if (sourceShifts.length === 0) return;

    const newShifts: StaffShift[] = sourceShifts.map((s) => ({
      ...s,
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      date: selectedDate,
      status: 'confirmado',
    }));

    onBatchAddShifts(newShifts);
    setShowCopyModal(false);
  };

  // Selection handlers for Shifts (Planner)
  const isAllShiftsSelected =
    displayShifts.length > 0 &&
    displayShifts.every((s) => selectedShiftIds.includes(s.id));

  const handleToggleSelectAllShifts = () => {
    if (isAllShiftsSelected) {
      const displayIds = new Set(displayShifts.map((s) => s.id));
      setSelectedShiftIds((prev) => prev.filter((id) => !displayIds.has(id)));
    } else {
      const allDisplayIds = displayShifts.map((s) => s.id);
      setSelectedShiftIds((prev) => Array.from(new Set([...prev, ...allDisplayIds])));
    }
  };

  const handleToggleSelectShift = (shiftId: string) => {
    setSelectedShiftIds((prev) =>
      prev.includes(shiftId) ? prev.filter((id) => id !== shiftId) : [...prev, shiftId]
    );
  };

  const handleClearShiftsSelection = () => {
    setSelectedShiftIds([]);
  };

  const handleConfirmBulkDeleteShifts = () => {
    if (selectedShiftIds.length > 0 && onDeleteMultipleShifts) {
      onDeleteMultipleShifts(selectedShiftIds);
      setSelectedShiftIds([]);
      setShowBulkDeleteShiftsConfirm(false);
    }
  };

  // Selection handlers for Members (Cadastrados)
  const isAllMembersSelected =
    filteredStaffMembers.length > 0 &&
    filteredStaffMembers.every((m) => selectedMemberIds.includes(m.id));

  const handleToggleSelectAllMembers = () => {
    if (isAllMembersSelected) {
      const filteredIds = new Set(filteredStaffMembers.map((m) => m.id));
      setSelectedMemberIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const allFilteredIds = filteredStaffMembers.map((m) => m.id);
      setSelectedMemberIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleToggleSelectMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleClearMembersSelection = () => {
    setSelectedMemberIds([]);
  };

  const handleConfirmBulkDeleteMembers = () => {
    if (selectedMemberIds.length > 0 && onDeleteMultipleStaffMembers) {
      onDeleteMultipleStaffMembers(selectedMemberIds);
      setSelectedMemberIds([]);
      setShowBulkDeleteMembersConfirm(false);
    }
  };

  return (
    <div id="module-staff" className="space-y-4 pb-24">
      {/* Top Module Subtabs */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 p-1 rounded-2xl flex gap-1 shadow-sm">
        <button
          id="tab-planner"
          onClick={() => setActiveTab('planner')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'planner'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Planner / Escala do Dia</span>
        </button>

        <button
          id="tab-cadastrados"
          onClick={() => setActiveTab('cadastrados')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'cadastrados'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Funcionários Cadastrados ({staffMembers.length})</span>
        </button>
      </div>

      {activeTab === 'planner' ? (
        /* ================= PLANNER / ESCALA DIÁRIA ================= */
        <div className="space-y-4">
          {/* Day Selector Header */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={goToPrevDate}
                disabled={!prevDateWithShifts && !(allDatesWithShifts.length > 0 && !allDatesWithShifts.includes(selectedDate))}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  prevDateWithShifts || (allDatesWithShifts.length > 0 && !allDatesWithShifts.includes(selectedDate))
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed'
                }`}
                title={prevDateWithShifts ? `Data anterior com escala: ${formatDateBR(prevDateWithShifts)}` : 'Sem data anterior com pessoas'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center flex-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm font-bold text-zinc-100 capitalize">
                    {formatDayOfWeekBR(selectedDate)}
                  </span>
                  {isToday && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                      Hoje
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-medium">
                  {formatDateBR(selectedDate)}
                </p>
              </div>

              <button
                onClick={goToNextDate}
                disabled={!nextDateWithShifts && !(allDatesWithShifts.length > 0 && !allDatesWithShifts.includes(selectedDate))}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  nextDateWithShifts || (allDatesWithShifts.length > 0 && !allDatesWithShifts.includes(selectedDate))
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed'
                }`}
                title={nextDateWithShifts ? `Próxima data com escala: ${formatDateBR(nextDateWithShifts)}` : 'Sem data seguinte com pessoas'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Date picker & Today Jump */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
              <div className="relative flex-1">
                <CalendarIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  id="input-select-staff-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {!isToday && (
                <button
                  onClick={() => setSelectedDate(getTodayISO())}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  Ir para Hoje
                </button>
              )}

              {dayShifts.length === 0 && availableDatesWithShifts.length > 0 && (
                <button
                  onClick={() => {
                    setSourceDateToCopy(availableDatesWithShifts[0]);
                    setShowCopyModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-colors flex items-center gap-1 whitespace-nowrap"
                  title="Copiar escala de outro dia"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar Escala</span>
                </button>
              )}
            </div>

            {/* Chips dos dias que possuem dados na escala */}
            {allDatesWithShifts.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider shrink-0 mr-0.5">
                  Escalas:
                </span>
                {allDatesWithShifts.map((dateStr) => {
                  const isSelected = selectedDate === dateStr;
                  const count = shifts.filter((s) => s.date === dateStr).length;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 shadow-sm'
                          : 'bg-zinc-950/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                      }`}
                    >
                      <span>{formatDateBR(dateStr)}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded ${isSelected ? 'bg-zinc-950/20 text-zinc-950 font-black' : 'bg-zinc-800 text-amber-400'}`}>
                        {count}p
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Se o dia tiver dados, exibe os cards de métricas e os filtros */}
          {dayShifts.length > 0 && (
            <>
              {/* Day Overview Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">Escalados</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-extrabold text-zinc-100">{totalScheduled}</span>
                    <span className="text-[10px] text-zinc-500">pessoas</span>
                  </div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Confirmados</span>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-300 mt-1">
                    {confirmedShifts.length}
                    {absentCount > 0 && (
                      <span className="text-xs text-rose-400 font-normal ml-1">
                        ({absentCount} {absentCount === 1 ? 'falta' : 'faltas'})
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">Total Diárias</span>
                  <div className="text-xs font-bold text-amber-400 truncate mt-1">
                    {formatCurrency(totalDailyPay)}
                  </div>
                </div>
              </div>

              {/* Actions & Role Filters */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none text-xs flex-1">
                  <button
                    onClick={() => setRoleFilter('todos')}
                    className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                      roleFilter === 'todos'
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Todos ({dayShifts.length})
                  </button>

                  {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => {
                    const count = dayShifts.filter((s) => s.role === r).length;
                    if (count === 0 && roleFilter !== r) return null;
                    const isSelected = roleFilter === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span>{ROLE_LABELS[r]}</span>
                        <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-zinc-950/20 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  id="btn-add-shift"
                  onClick={handleOpenAddShift}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-md shadow-amber-500/20 whitespace-nowrap min-h-[38px]"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Escalar</span>
                </button>
              </div>

              {/* 🎛️ Barra de Seleção e Ações em Massa da Escala do Dia */}
              {displayShifts.length > 0 && (
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
                  <button
                    id="btn-toggle-select-all-shifts"
                    onClick={handleToggleSelectAllShifts}
                    className="flex items-center gap-2 text-zinc-300 hover:text-amber-400 font-semibold transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isAllShiftsSelected
                          ? 'bg-amber-500 border-amber-500 text-zinc-950'
                          : selectedShiftIds.length > 0
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                          : 'border-zinc-700 bg-zinc-950'
                      }`}
                    >
                      {isAllShiftsSelected ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : selectedShiftIds.length > 0 ? (
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-sm" />
                      ) : null}
                    </div>
                    <span>
                      {isAllShiftsSelected
                        ? `Desmarcar todos (${displayShifts.length})`
                        : `Selecionar todos (${displayShifts.length})`}
                    </span>
                  </button>

                  {selectedShiftIds.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in duration-150">
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                        {selectedShiftIds.length} selecionado{selectedShiftIds.length > 1 ? 's' : ''}
                      </span>

                      <button
                        id="btn-bulk-delete-shifts"
                        onClick={() => setShowBulkDeleteShiftsConfirm(true)}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir Selecionados</span>
                      </button>

                      <button
                        onClick={handleClearShiftsSelection}
                        className="text-zinc-400 hover:text-zinc-200 text-xs px-1.5 py-1"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Staff Shifts List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" id="staff-list-container">
            {displayShifts.length === 0 ? (
              <div className="col-span-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 text-center space-y-3">
                <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-zinc-300">Sem escala registrada para {formatDateBR(selectedDate)}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {allDatesWithShifts.length > 0 
                      ? 'Selecione uma data com dados acima ou adicione novos membros a este dia.' 
                      : 'Cadastre ou adicione funcionários para montar a primeira escala.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  {nextDateWithShifts && (
                    <button
                      onClick={goToNextDate}
                      className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span>Ir para próxima data ({formatDateBR(nextDateWithShifts)})</span>
                    </button>
                  )}

                  <button
                    onClick={handleOpenAddShift}
                    className="py-2 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs inline-flex items-center gap-1.5 border border-zinc-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Escalar Funcionário</span>
                  </button>

                  {availableDatesWithShifts.length > 0 && (
                    <button
                      onClick={() => {
                        setSourceDateToCopy(availableDatesWithShifts[0]);
                        setShowCopyModal(true);
                      }}
                      className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar de outro dia</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              displayShifts.map((shift) => {
                const roleStyle = ROLE_BADGE_STYLE[shift.role] || ROLE_BADGE_STYLE.outros;
                const statusConfig = SHIFT_STATUS_CONFIG[shift.status] || SHIFT_STATUS_CONFIG.confirmado;
                const isSelected = selectedShiftIds.includes(shift.id);

                return (
                  <div
                    key={shift.id}
                    id={`shift-card-${shift.id}`}
                    className={`bg-zinc-900/90 border rounded-2xl p-4 transition-all space-y-3 shadow-sm relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500 shadow-amber-500/10'
                        : shift.status === 'faltou'
                        ? 'border-rose-800/60 bg-rose-950/20'
                        : 'border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Checkbox de Seleção Individual */}
                          <button
                            type="button"
                            onClick={() => handleToggleSelectShift(shift.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-zinc-950'
                                : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
                            }`}
                            title={isSelected ? 'Desmarcar' : 'Selecionar'}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          {/* Role badge */}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${roleStyle}`}
                          >
                            {ROLE_LABELS[shift.role]}
                          </span>

                          {/* Status toggle button */}
                          <button
                            onClick={() => handleQuickToggleStatus(shift)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-transform active:scale-95 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                            title="Clique para alternar presença (Confirmado / Faltou / Folga)"
                          >
                            {shift.status === 'confirmado' ? (
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                            ) : shift.status === 'faltou' ? (
                              <UserX className="w-3 h-3 text-rose-400" />
                            ) : (
                              <Coffee className="w-3 h-3 text-zinc-400" />
                            )}
                            <span>{SHIFT_STATUS_LABELS[shift.status]}</span>
                          </button>
                        </div>

                        <h3 className="font-bold text-base text-zinc-100 leading-snug">
                          {shift.name}
                        </h3>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicateShift(shift)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-400 text-zinc-300 flex items-center justify-center transition-colors"
                          title="Duplicar card desta escala"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditShift(shift)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors"
                          title="Editar escala"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingShiftId(shift.id)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 flex items-center justify-center transition-colors"
                          title="Remover da escala"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Details: Diária R$ */}
                    <div className="flex items-center justify-between bg-zinc-950/70 p-2.5 px-3 rounded-xl border border-zinc-800/60 text-xs">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Valor da Diária</span>
                      <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                        <DollarSign className="w-4 h-4 shrink-0" />
                        <span>{formatCurrency(shift.dailyPay)}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {shift.notes && (
                      <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/40 text-zinc-400 flex items-start gap-2 text-xs">
                        <FileText className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-relaxed">
                          <span className="italic">{shift.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ================= FUNCIONÁRIOS CADASTRADOS ================= */
        <div className="space-y-4">
          {/* Header & Search */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  id="search-staff-members-input"
                  type="text"
                  placeholder="Buscar colaborador cadastrado..."
                  value={staffSearchTerm}
                  onChange={(e) => setStaffSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                {staffSearchTerm && (
                  <button
                    onClick={() => setStaffSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300 text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                id="btn-add-staff-member"
                onClick={handleOpenAddMember}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-md shadow-amber-500/20 whitespace-nowrap min-h-[38px]"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Cadastrar</span>
              </button>
            </div>

            {/* Role filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setRoleFilter('todos')}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  roleFilter === 'todos'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todos ({staffMembers.length})
              </button>

              {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => {
                const count = staffMembers.filter((m) => m.role === r).length;
                const isSelected = roleFilter === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>{ROLE_LABELS[r]}</span>
                    <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-zinc-950/20 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 🎛️ Barra de Seleção e Ações em Massa de Funcionários Cadastrados */}
            {filteredStaffMembers.length > 0 && (
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
                <button
                  id="btn-toggle-select-all-members"
                  onClick={handleToggleSelectAllMembers}
                  className="flex items-center gap-2 text-zinc-300 hover:text-amber-400 font-semibold transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isAllMembersSelected
                        ? 'bg-amber-500 border-amber-500 text-zinc-950'
                        : selectedMemberIds.length > 0
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'border-zinc-700 bg-zinc-950'
                    }`}
                  >
                    {isAllMembersSelected ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : selectedMemberIds.length > 0 ? (
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-sm" />
                    ) : null}
                  </div>
                  <span>
                    {isAllMembersSelected
                      ? `Desmarcar todos (${filteredStaffMembers.length})`
                      : `Selecionar todos (${filteredStaffMembers.length})`}
                  </span>
                </button>

                {selectedMemberIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in duration-150">
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                      {selectedMemberIds.length} selecionado{selectedMemberIds.length > 1 ? 's' : ''}
                    </span>

                    <button
                      id="btn-bulk-delete-members"
                      onClick={() => setShowBulkDeleteMembersConfirm(true)}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Selecionados</span>
                    </button>

                    <button
                      onClick={handleClearMembersSelection}
                      className="text-zinc-400 hover:text-zinc-200 text-xs px-1.5 py-1"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Members List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" id="staff-members-list-container">
            {filteredStaffMembers.length === 0 ? (
              <div className="col-span-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-3">
                <Users className="w-10 h-10 text-zinc-600 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-zinc-300">Nenhum funcionário encontrado</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {staffSearchTerm || roleFilter !== 'todos'
                      ? 'Tente ajustar os filtros ou termo de busca.'
                      : 'Cadastre os membros da equipe do Bar da Tenda.'}
                  </p>
                </div>
                <button
                  onClick={handleOpenAddMember}
                  className="py-2 px-4 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Funcionário</span>
                </button>
              </div>
            ) : (
              filteredStaffMembers.map((member) => {
                const roleStyle = ROLE_BADGE_STYLE[member.role] || ROLE_BADGE_STYLE.outros;
                const isScheduledForSelectedDate = dayShifts.some(
                  (s) => s.name.toLowerCase() === member.name.toLowerCase()
                );
                const isSelected = selectedMemberIds.includes(member.id);

                return (
                  <div
                    key={member.id}
                    id={`staff-member-card-${member.id}`}
                    className={`bg-zinc-900/90 border rounded-2xl p-4 transition-all space-y-3 shadow-sm relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500 shadow-amber-500/10'
                        : 'border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {/* Checkbox de Seleção Individual */}
                        <button
                          type="button"
                          onClick={() => handleToggleSelectMember(member.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500 text-zinc-950'
                              : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
                          }`}
                          title={isSelected ? 'Desmarcar' : 'Selecionar'}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-amber-400 text-xs">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-zinc-100 leading-snug">
                              {member.name}
                            </h3>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${roleStyle}`}
                            >
                              {ROLE_LABELS[member.role]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicateMember(member)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-400 text-zinc-300 flex items-center justify-center transition-colors"
                          title="Duplicar cadastro de funcionário"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditMember(member)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors"
                          title="Editar cadastro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingMemberId(member.id)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 flex items-center justify-center transition-colors"
                          title="Remover cadastro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span>Diária Padrão:</span>
                        <strong className="text-amber-400 font-bold">{formatCurrency(member.defaultDailyPay)}</strong>
                      </div>

                      {isScheduledForSelectedDate ? (
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Escalado Hoje</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleQuickScheduleMember(member)}
                          className="text-[11px] font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                          title={`Escalar para ${formatDateBR(selectedDate)}`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>Escalar ({formatDateBR(selectedDate)})</span>
                        </button>
                      )}
                    </div>

                    {member.notes && (
                      <p className="text-[11px] text-zinc-400 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/40 italic">
                        {member.notes}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Shift Modal (Add/Edit) */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onSave={handleSaveShift}
        editingShift={editingShift}
        selectedDate={selectedDate}
        staffMembers={staffMembers}
      />

      {/* Staff Member Modal (Add/Edit) */}
      <StaffMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
        editingMember={editingMember}
      />

      {/* Copy Scale Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-zinc-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Copy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-100">Copiar Escala de Equipe</h3>
                <p className="text-[11px] text-zinc-400">Importar lista de outro dia</p>
              </div>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Selecione a data de origem:
                </label>
                <select
                  value={sourceDateToCopy}
                  onChange={(e) => setSourceDateToCopy(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  {availableDatesWithShifts.map((d) => {
                    const count = shifts.filter((s) => s.date === d).length;
                    return (
                      <option key={d} value={d}>
                        {formatDateBR(d)} ({formatDayOfWeekBR(d)}) - {count} funcionários
                      </option>
                    );
                  })}
                </select>
              </div>

              <p className="text-[11px] text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                Todos os colaboradores deste dia serão copiados para{' '}
                <strong className="text-amber-400">{formatDateBR(selectedDate)}</strong> com o status "Confirmado".
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowCopyModal(false)}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-copy-scale"
                onClick={handleExecuteCopy}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
              >
                Copiar Escala
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Shift Confirmation Modal */}
      {deletingShiftId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xs w-full p-5 shadow-2xl text-zinc-200">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-center text-zinc-100 mb-1">
              Remover da escala?
            </h3>
            <p className="text-xs text-zinc-400 text-center mb-4">
              O colaborador será removido da escala do dia selecionado.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeletingShiftId(null)}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-shift"
                onClick={handleConfirmDeleteShift}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {deletingMemberId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xs w-full p-5 shadow-2xl text-zinc-200">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-center text-zinc-100 mb-1">
              Excluir cadastro?
            </h3>
            <p className="text-xs text-zinc-400 text-center mb-4">
              O colaborador será removido da lista de funcionários cadastrados.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeletingMemberId(null)}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-member"
                onClick={handleConfirmDeleteMember}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Delete Shifts Confirmation Modal */}
      {showBulkDeleteShiftsConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-800/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-zinc-100">
                Remover {selectedShiftIds.length} escala{selectedShiftIds.length > 1 ? 's' : ''}?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tem certeza que deseja remover os funcionários selecionados da escala deste dia? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteShiftsConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-bulk-delete-shifts"
                onClick={handleConfirmBulkDeleteShifts}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                Sim, Remover ({selectedShiftIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Members Confirmation Modal */}
      {showBulkDeleteMembersConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-800/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-zinc-100">
                Excluir {selectedMemberIds.length} colaborador{selectedMemberIds.length > 1 ? 'es' : ''}?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tem certeza que deseja apagar o cadastro dos colaboradores selecionados da equipe? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteMembersConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-bulk-delete-members"
                onClick={handleConfirmBulkDeleteMembers}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                Sim, Excluir ({selectedMemberIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
