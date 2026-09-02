import React, { useState, useEffect } from 'react';
import { X, Zap, Check, Plus, ArrowUpRight, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../../types';
import { getTodayISO } from '../../utils/formatters';

interface QuickRestockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRestock: (
    productId: string,
    addedQuantity: number,
    newDate: string,
    unitPrice?: number,
    supplier?: string,
    invoiceNumber?: string,
    notes?: string
  ) => void;
}

export const QuickRestockModal: React.FC<QuickRestockModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirmRestock,
}) => {
  const [addQty, setAddQty] = useState<number | string>(12);
  const [customDate, setCustomDate] = useState(getTodayISO());
  const [unitPrice, setUnitPrice] = useState<number | string>('');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (product) {
      setUnitPrice(product.unitPrice > 0 ? product.unitPrice : '');
      setSupplier(product.supplier || '');
      setCustomDate(getTodayISO());
      setInvoiceNumber('');
      setNotes('');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const quickPresets = [1, 6, 12, 24, 48];
  const parsedQty = Number(addQty) || 0;
  const newTotal = product.currentQuantity + parsedQty;
  const parsedPrice = unitPrice !== '' ? Number(unitPrice) : product.unitPrice;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedQty <= 0) return;
    onConfirmRestock(
      product.id,
      parsedQty,
      customDate || getTodayISO(),
      parsedPrice >= 0 ? parsedPrice : undefined,
      supplier.trim() || undefined,
      invoiceNumber.trim() || undefined,
      notes.trim() || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="modal-quick-restock"
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 text-zinc-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 leading-tight">
                Reposição Rápida
              </h3>
              <p className="text-[11px] text-zinc-400">Entrada rápida & registro no histórico</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Details info card */}
        <div className="my-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
          <p className="text-xs font-semibold text-zinc-200 leading-snug">
            {product.name}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2">
            <span>Estoque atual: <strong className="text-zinc-200">{product.currentQuantity} {product.unit}</strong></span>
            <span>Mínimo: <strong className="text-amber-400">{product.minQuantity} {product.unit}</strong></span>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="space-y-3.5 text-xs">
          {/* Quick Presets */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1.5">
              Adicionar quantidade rápida:
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {quickPresets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAddQty(preset)}
                  className={`py-2 rounded-lg font-bold text-xs border transition-colors ${
                    parsedQty === preset
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Ou digite a quantidade a somar ({product.unit}):
            </label>
            <div className="relative">
              <input
                id="input-quick-add-qty"
                type="number"
                min="1"
                step="any"
                required
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-amber-300 focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-3.5 top-3 text-xs text-zinc-500 font-medium">
                {product.unit}
              </span>
            </div>
          </div>

          {/* Preço Unitário desta Compra */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Preço unitário pago nesta compra (R$):
            </label>
            <div className="relative">
              <input
                id="input-quick-add-price"
                type="number"
                min="0"
                step="0.01"
                placeholder={product.unitPrice ? `R$ ${product.unitPrice.toFixed(2)}` : '0,00'}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Data da reposição:
            </label>
            <input
              id="input-quick-add-date"
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Toggle Dados Adicionais (Fornecedor / NF / Notas) */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>{showAdvanced ? 'Menos detalhes' : '+ Adicionar NF / Fornecedor'}</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-2 space-y-2 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 animate-in fade-in">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-0.5">Fornecedor:</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Nome do fornecedor"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-0.5">Nº da Nota / Identificação:</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Ex: NF 1092"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-0.5">Observações:</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Chegou no prazo"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview New Total */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center justify-between text-xs">
            <span className="text-emerald-300 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Novo estoque resultante:
            </span>
            <span className="text-emerald-300 font-bold text-sm">
              {newTotal} {product.unit}
            </span>
          </div>

          {/* Submit */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-quick-restock"
              type="submit"
              disabled={parsedQty <= 0}
              className="py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar (+{parsedQty})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

