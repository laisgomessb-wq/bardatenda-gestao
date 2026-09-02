import React, { useState, useEffect } from 'react';
import { X, Music, Save } from 'lucide-react';
import { BandGig, GigStatus } from '../../types';
import { GIG_STATUS_LABELS, getTodayISO } from '../../utils/formatters';

interface BandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gig: BandGig) => void;
  editingGig?: BandGig | null;
  defaultDate?: string;
}

export const BandModal: React.FC<BandModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingGig,
  defaultDate,
}) => {
  const [bandName, setBandName] = useState('');
  const [date, setDate] = useState(defaultDate || getTodayISO());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [cacheValue, setCacheValue] = useState<number | string>('');
  const [status, setStatus] = useState<GigStatus>('confirmada');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingGig) {
      setBandName(editingGig.bandName);
      setDate(editingGig.date);
      setStartTime(editingGig.startTime || '');
      setEndTime(editingGig.endTime || '');
      setCacheValue(editingGig.cacheValue !== undefined ? editingGig.cacheValue : '');
      setStatus(editingGig.status);
    } else {
      setBandName('');
      setDate(defaultDate || getTodayISO());
      setStartTime('');
      setEndTime('');
      setCacheValue('');
      setStatus('confirmada');
    }
    setError('');
  }, [editingGig, isOpen, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bandName.trim()) {
      setError('O nome da banda é obrigatório.');
      return;
    }
    if (!date) {
      setError('A data da apresentação é obrigatória.');
      return;
    }

    const gigData: BandGig = {
      id: editingGig ? editingGig.id : `gig-${Date.now()}`,
      bandName: bandName.trim(),
      date,
      startTime: startTime.trim() ? startTime.trim() : undefined,
      endTime: endTime.trim() ? endTime.trim() : undefined,
      cacheValue: cacheValue !== '' ? Number(cacheValue) : undefined,
      status,
    };

    onSave(gigData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="modal-band-gig"
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Music className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-100">
              {editingGig ? 'Editar Apresentação' : 'Agendar Nova Banda / Show'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Nome da Banda / Artista */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Nome da Banda / Artista <span className="text-amber-400">*</span>
            </label>
            <input
              id="input-band-name"
              type="text"
              required
              placeholder="Ex: Valdir, Samba 6, Thiaginho..."
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Data e Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Data do Show <span className="text-amber-400">*</span>
              </label>
              <input
                id="input-band-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Status da Apresentação
              </label>
              <select
                id="select-band-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as GigStatus)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {(Object.keys(GIG_STATUS_LABELS) as GigStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {GIG_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Horários Início e Fim (Opcionais - não preenchidos automaticamente) */}
          <div className="grid grid-cols-2 gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Horário de Início (opcional)
              </label>
              <input
                id="input-band-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Horário de Término (opcional)
              </label>
              <input
                id="input-band-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Cachê / Valor */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Cachê / Valor (R$) (opcional)
            </label>
            <input
              id="input-band-cache"
              type="number"
              step="50"
              min="0"
              placeholder="Ex: 1200,00"
              value={cacheValue}
              onChange={(e) => setCacheValue(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-semibold"
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
              id="btn-save-gig"
              type="submit"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Show</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
