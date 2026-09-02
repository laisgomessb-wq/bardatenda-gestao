import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Package } from 'lucide-react';
import { Product, ProductCategory } from '../../types';
import { CATEGORY_LABELS, getTodayISO } from '../../utils/formatters';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  editingProduct?: Product | null;
}

const COMMON_UNITS = [
  'UN',
  'CX',
  'PCT',
  'UNID',
  'KG',
  'G',
  'garrafa',
  'fardo',
  'L',
  'barril 30L',
  'barril 50L',
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('bebidas');
  const [unit, setUnit] = useState('UN');
  const [currentQuantity, setCurrentQuantity] = useState<number | string>(0);
  const [minQuantity, setMinQuantity] = useState<number | string>(4);
  const [supplier, setSupplier] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | string>('');
  const [lastRestockedDate, setLastRestockedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      setUnit(editingProduct.unit);
      setCurrentQuantity(editingProduct.currentQuantity);
      setMinQuantity(editingProduct.minQuantity);
      setSupplier(editingProduct.supplier);
      setUnitPrice(editingProduct.unitPrice);
      setLastRestockedDate(editingProduct.lastRestockedDate || '');
      setNotes(editingProduct.notes || '');
    } else {
      setName('');
      setCategory('bebidas');
      setUnit('UN');
      setCurrentQuantity('');
      setMinQuantity(4);
      setSupplier('');
      setUnitPrice('');
      setLastRestockedDate('');
      setNotes('');
    }
    setError('');
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do produto é obrigatório.');
      return;
    }
    const currQty = Number(currentQuantity) || 0;
    const minQty = Number(minQuantity) || 0;
    const price = Number(unitPrice) || 0;

    // Preserva ou inicializa o histórico de compras
    let history = editingProduct?.purchaseHistory ? [...editingProduct.purchaseHistory] : [];
    
    if (history.length === 0 && price > 0) {
      history = [
        {
          id: `rec-${Date.now()}`,
          date: lastRestockedDate || getTodayISO(),
          quantity: currQty > 0 ? currQty : 1,
          unitPrice: price,
          totalPrice: (currQty > 0 ? currQty : 1) * price,
          supplier: supplier.trim() || 'Não informado',
          invoiceNumber: 'Entrada Inicial',
          notes: 'Cadastro inicial do produto',
          createdAt: new Date().toISOString(),
        },
      ];
    } else if (editingProduct && price > 0 && price !== editingProduct.unitPrice) {
      // Se o preço foi alterado durante a edição cadastral, adiciona o novo registro
      history.push({
        id: `rec-${Date.now()}`,
        date: lastRestockedDate || getTodayISO(),
        quantity: currQty,
        unitPrice: price,
        totalPrice: currQty * price,
        supplier: supplier.trim() || editingProduct.supplier || 'Não informado',
        invoiceNumber: 'Ajuste Cadastral',
        notes: 'Atualização de preço no cadastro',
        createdAt: new Date().toISOString(),
      });
    }

    const productData: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: name.trim(),
      category,
      unit: unit.trim() || 'un',
      currentQuantity: currQty,
      minQuantity: minQty,
      supplier: supplier.trim() || 'Não informado',
      unitPrice: price,
      lastRestockedDate: lastRestockedDate ? lastRestockedDate : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
      purchaseHistory: history,
    };

    onSave(productData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="modal-product"
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-100">
              {editingProduct ? 'Editar Produto' : 'Novo Produto no Estoque'}
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
              Nome do Produto <span className="text-amber-400">*</span>
            </label>
            <input
              id="input-product-name"
              type="text"
              required
              placeholder="Ex: Chopp Pilsen 50L, Gin Tanqueray..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Categoria <span className="text-amber-400">*</span>
            </label>
            <select
              id="select-product-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Unidade & Quantidades */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Unidade de Medida
              </label>
              <input
                id="input-product-unit"
                type="text"
                list="unit-suggestions"
                placeholder="Ex: un, cx, garrafa..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <datalist id="unit-suggestions">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Preço de Compra Unit. (R$)
              </label>
              <input
                id="input-product-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Quantidade Atual & Estoque Mínimo */}
          <div className="grid grid-cols-2 gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Quantidade Atual <span className="text-amber-400">*</span>
              </label>
              <input
                id="input-product-qty"
                type="number"
                min="0"
                step="any"
                required
                placeholder="0"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1 flex items-center justify-between">
                <span>Estoque Mínimo</span>
                <span className="text-[10px] text-amber-400/90 font-normal">Alerta</span>
              </label>
              <input
                id="input-product-min-qty"
                type="number"
                min="0"
                step="any"
                required
                placeholder="Ex: 5"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Fornecedor & Data Reposição */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Fornecedor / Distribuidora
              </label>
              <input
                id="input-product-supplier"
                type="text"
                placeholder="Ex: Distribuidora Central..."
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Última Reposição
              </label>
              <input
                id="input-product-date"
                type="date"
                value={lastRestockedDate}
                onChange={(e) => setLastRestockedDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Observações
            </label>
            <textarea
              id="input-product-notes"
              rows={2}
              placeholder="Ex: Armazenar no freezer 2, pedir sempre às terças..."
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
              id="btn-save-product"
              type="submit"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Produto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
