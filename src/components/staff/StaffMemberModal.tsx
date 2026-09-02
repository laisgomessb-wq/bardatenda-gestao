import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, DollarSign, FileText, Briefcase } from 'lucide-react';
import { StaffMember, StaffRole } from '../../types';
import { ROLE_LABELS } from '../../utils/formatters';

interface StaffMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: StaffMember) => void;
  editingMember?: StaffMember | null;
}

export const StaffMemberModal: React.FC<StaffMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMember,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('garcom');
  const [defaultDailyPay, setDefaultDailyPay] = useState<number | string>(130);
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name);
      setRole(editingMember.role);
      setDefaultDailyPay(editingMember.defaultDailyPay);
      setActive(editingMember.active);
      setNotes(editingMember.notes || '');
    } else {
      setName('');
      setRole('garcom');
      setDefaultDailyPay(130);
      setActive(true);
      setNotes('');
    }
    setError('');
  }, [editingMember, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do funcionário é obrigatório.');
      return;
    }

    const pay = Number(defaultDailyPay) || 0;

    const memberData: StaffMember = {
      id: editingMember ? editingMember.id : `staff-${Date.now()}`,
      name: name.trim(),
      role,
      defaultDailyPay: pay,
      active,
      notes: notes.trim() || undefined,
    };

    onSave(memberData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="modal-staff-member"
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-100">
              {editingMember ? 'Editar Funcionário' : 'Novo Cadastro de Funcionário'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Nome do Colaborador <span className="text-amber-400">*</span>
            </label>
            <input
              id="input-staff-member-name"
              type="text"
              required
              placeholder="Ex: Igor, Jane, Douglas..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          {/* Função */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Função Principal <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <select
                id="select-staff-member-role"
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500 text-xs"
              >
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Diária Padrão */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Diária Padrão (R$)
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                id="input-staff-member-pay"
                type="number"
                step="5"
                min="0"
                placeholder="130.00"
                value={defaultDailyPay}
                onChange={(e) => setDefaultDailyPay(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          {/* Status Ativo */}
          <div className="flex items-center gap-2 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
            <input
              id="checkbox-staff-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-zinc-700 bg-zinc-900"
            />
            <label htmlFor="checkbox-staff-active" className="text-zinc-300 text-xs font-medium cursor-pointer">
              Colaborador Ativo na equipe (disponível para escalas)
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Observações / Especialidades
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <textarea
                id="input-staff-member-notes"
                rows={2}
                placeholder="Ex: Disponível apenas fins de semana, chapa e fritadeira..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 border-t border-zinc-800 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-save-staff-member"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-450 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{editingMember ? 'Salvar Alterações' : 'Cadastrar Colaborador'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
