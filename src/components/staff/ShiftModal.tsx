import React, { useState, useEffect } from 'react';
import { X, Users, Save } from 'lucide-react';
import { StaffShift, StaffRole, ShiftStatus, StaffMember } from '../../types';
import { ROLE_LABELS, SHIFT_STATUS_LABELS, getTodayISO } from '../../utils/formatters';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: StaffShift) => void;
  editingShift?: StaffShift | null;
  selectedDate: string;
  staffMembers?: StaffMember[];
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingShift,
  selectedDate,
  staffMembers = [],
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('garcom');
  const [date, setDate] = useState(selectedDate || getTodayISO());
  const [status, setStatus] = useState<ShiftStatus>('confirmado');
  const [dailyPay, setDailyPay] = useState<number | string>(130);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingShift) {
      setName(editingShift.name);
      setRole(editingShift.role);
      setDate(editingShift.date);
      setStatus(editingShift.status);
      setDailyPay(editingShift.dailyPay);
      setNotes(editingShift.notes || '');
    } else {
      setName('');
      setRole('garcom');
      setDate(selectedDate || getTodayISO());
      setStatus('confirmado');
      setDailyPay(130);
      setNotes('');
    }
    setError('');
  }, [editingShift, isOpen, selectedDate]);

  const handleNameChange = (val: string) => {
    setName(val);
    const found = staffMembers.find((m) => m.name.toLowerCase() === val.trim().toLowerCase());
    if (found && !editingShift) {
      setRole(found.role);
      setDailyPay(found.defaultDailyPay);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do funcionário é obrigatório.');
      return;
    }
    if (!date) {
      setError('A data da escala é obrigatória.');
      return;
    }

    const shiftData: StaffShift = {
      id: editingShift ? editingShift.id : `shift-${Date.now()}`,
      name: name.trim(),
      role,
      date,
      status,
      dailyPay: Number(dailyPay) || 0,
      notes: notes.trim() || undefined,
    };

    onSave(shiftData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="modal-staff-shift"
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-100">
              {editingShift ? 'Editar Escala de Funcionário' : 'Escalar Colaborador'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Nome do Funcionário <span className="text-amber-400">*</span>
            </label>
            <input
              id="input-staff-name"
              type="text"
              required
              list="staff-name-suggestions"
              placeholder="Ex: Igor, Jane, Douglas..."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <datalist id="staff-name-suggestions">
              {staffMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {ROLE_LABELS[m.role]}
                </option>
              ))}
            </datalist>
          </div>

          {/* Função e Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Função / Cargo <span className="text-amber-400">*</span>
              </label>
              <select
                id="select-staff-role"
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Status da Presença
              </label>
              <select
                id="select-staff-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ShiftStatus)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {(Object.keys(SHIFT_STATUS_LABELS) as ShiftStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {SHIFT_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data e Diária R$ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Data do Turno <span className="text-amber-400">*</span>
              </label>
              <input
                id="input-staff-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Valor da Diária (R$)
              </label>
              <input
                id="input-staff-pay"
                type="number"
                step="5"
                min="0"
                placeholder="Ex: 150,00"
                value={dailyPay}
                onChange={(e) => setDailyPay(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Observações / Setor
            </label>
            <textarea
              id="input-staff-notes"
              rows={2}
              placeholder="Ex: Responsável pelo Bar da Tenda, conferir insumos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-save-shift"
              type="submit"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Escala</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
