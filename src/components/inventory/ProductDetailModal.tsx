import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  DollarSign,
  Package,
  Plus,
  Building2,
  FileText,
  CheckCircle2,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  BarChart3,
  Trash2,
  Zap,
  Edit2,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Product, PurchaseRecord } from '../../types';
import { PurchasePriceEvolutionChart } from './PurchasePriceEvolutionChart';
import {
  formatCurrency,
  formatDateBR,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  getTodayISO,
} from '../../utils/formatters';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddPurchaseRecord: (productId: string, record: Omit<PurchaseRecord, 'id' | 'createdAt'>) => void;
  onDeletePurchaseRecord?: (productId: string, recordId: string) => void;
  onOpenEditProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddPurchaseRecord,
  onDeletePurchaseRecord,
  onOpenEditProduct,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'grafico' | 'tabela'>('grafico');

  // Form states for new purchase entry
  const [buyDate, setBuyDate] = useState(getTodayISO());
  const [buyQuantity, setBuyQuantity] = useState<number | string>('');
  const [buyUnitPrice, setBuyUnitPrice] = useState<number | string>('');
  const [buySupplier, setBuySupplier] = useState('');
  const [buyInvoice, setBuyInvoice] = useState('');
  const [buyNotes, setBuyNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Sincroniza dados iniciais do formulário com o produto
  React.useEffect(() => {
    if (product) {
      setBuySupplier(product.supplier || '');
      setBuyUnitPrice(product.unitPrice > 0 ? product.unitPrice : '');
      setBuyDate(getTodayISO());
      setBuyQuantity('');
      setBuyInvoice('');
      setBuyNotes('');
      setFormError('');
      setFormSuccess('');
    }
  }, [product, isOpen]);

  // Histórico ordenado cronologicamente
  const sortedHistory: PurchaseRecord[] = useMemo(() => {
    if (!product) return [];
    
    // Se o produto não possui array de histórico, mas possui unitPrice > 0, cria o ponto de referência real
    let history = product.purchaseHistory && product.purchaseHistory.length > 0
      ? [...product.purchaseHistory]
      : [];

    if (history.length === 0 && product.unitPrice > 0) {
      history = [
        {
          id: `rec-init-${product.id}`,
          date: product.lastRestockedDate || getTodayISO(),
          quantity: product.currentQuantity || 1,
          unitPrice: product.unitPrice,
          totalPrice: (product.currentQuantity || 1) * product.unitPrice,
          supplier: product.supplier || 'Não informado',
          invoiceNumber: 'Entrada Inicial',
          notes: 'Cadastro inicial do produto',
        },
      ];
    }

    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [product]);

  // Cálculos de comparação e métricas
  const metrics = useMemo(() => {
    if (sortedHistory.length === 0) {
      const currentPrice = product?.unitPrice || 0;
      return {
        hasHistory: false,
        latestPrice: currentPrice,
        latestDate: product?.lastRestockedDate || 'Não informado',
        previousPrice: null,
        diffPrice: 0,
        diffPercent: 0,
        maxPrice: currentPrice,
        minPrice: currentPrice,
        avgPrice: currentPrice,
        totalQuantityPurchased: product?.currentQuantity || 0,
        totalAmountSpent: (product?.currentQuantity || 0) * currentPrice,
        count: 0,
      };
    }

    const count = sortedHistory.length;
    const latestRecord = sortedHistory[count - 1];
    const previousRecord = count >= 2 ? sortedHistory[count - 2] : null;

    const latestPrice = latestRecord.unitPrice;
    const previousPrice = previousRecord ? previousRecord.unitPrice : null;

    const diffPrice = previousPrice !== null ? latestPrice - previousPrice : 0;
    const diffPercent = previousPrice !== null && previousPrice > 0
      ? ((latestPrice - previousPrice) / previousPrice) * 100
      : 0;

    let maxPrice = -Infinity;
    let minPrice = Infinity;
    let sumWeightedPrice = 0;
    let totalQty = 0;
    let sumSimplePrice = 0;

    sortedHistory.forEach((rec) => {
      if (rec.unitPrice > maxPrice) maxPrice = rec.unitPrice;
      if (rec.unitPrice < minPrice) minPrice = rec.unitPrice;
      const qty = rec.quantity || 1;
      sumWeightedPrice += rec.unitPrice * qty;
      totalQty += qty;
      sumSimplePrice += rec.unitPrice;
    });

    const avgWeightedPrice = totalQty > 0 ? sumWeightedPrice / totalQty : sumSimplePrice / count;
    const avgSimplePrice = count > 0 ? sumSimplePrice / count : avgWeightedPrice;

    return {
      hasHistory: true,
      latestPrice,
      latestDate: latestRecord.date,
      latestSupplier: latestRecord.supplier || product?.supplier,
      previousPrice,
      diffPrice,
      diffPercent,
      maxPrice: maxPrice === -Infinity ? latestPrice : maxPrice,
      minPrice: minPrice === Infinity ? latestPrice : minPrice,
      avgPrice: avgWeightedPrice,
      avgWeightedPrice,
      avgSimplePrice,
      totalQuantityPurchased: totalQty,
      totalAmountSpent: sumWeightedPrice,
      count,
    };
  }, [sortedHistory, product]);

  // Dados formatados para o Recharts
  const chartData = useMemo(() => {
    return sortedHistory.map((item, index) => {
      // Comparação com o item imediatamente anterior para tooltip
      const prev = index > 0 ? sortedHistory[index - 1] : null;
      const diff = prev ? item.unitPrice - prev.unitPrice : 0;
      const diffPct = prev && prev.unitPrice > 0 ? (diff / prev.unitPrice) * 100 : 0;

      return {
        id: item.id,
        index: index + 1,
        date: item.date,
        formattedDate: formatDateBR(item.date),
        shortDate: formatDateBR(item.date).slice(0, 5), // DD/MM
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice || item.quantity * item.unitPrice,
        supplier: item.supplier || product?.supplier || 'Não informado',
        invoiceNumber: item.invoiceNumber || `Reg #${index + 1}`,
        notes: item.notes || '',
        diff,
        diffPct,
      };
    });
  }, [sortedHistory, product]);

  // Domínio dinâmico do Eixo Y para dar amplitude visual clara ao gráfico
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 10];
    const prices = chartData.map((d) => d.unitPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    if (min === max) {
      return [Math.max(0, min * 0.8), max * 1.2 || 10];
    }
    
    const margin = (max - min) * 0.2;
    return [Math.max(0, Number((min - margin).toFixed(2))), Number((max + margin).toFixed(2))];
  }, [chartData]);

  if (!isOpen || !product) return null;

  const isLowStock = product.currentQuantity <= product.minQuantity;
  const catStyle = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.bebidas;

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const qty = Number(buyQuantity);
    const price = Number(buyUnitPrice);

    if (isNaN(qty) || qty <= 0) {
      setFormError('Informe uma quantidade válida maior que zero.');
      return;
    }
    if (isNaN(price) || price < 0) {
      setFormError('Informe um preço unitário válido.');
      return;
    }
    if (!buyDate) {
      setFormError('Selecione a data da compra.');
      return;
    }

    onAddPurchaseRecord(product.id, {
      date: buyDate,
      quantity: qty,
      unitPrice: price,
      totalPrice: qty * price,
      supplier: buySupplier.trim() || product.supplier,
      invoiceNumber: buyInvoice.trim() || undefined,
      notes: buyNotes.trim() || undefined,
    });

    setFormSuccess('Registro de compra adicionado e estoque atualizado com sucesso!');
    setShowAddForm(false);
    setBuyQuantity('');
    setBuyInvoice('');
    setBuyNotes('');
    setTimeout(() => setFormSuccess(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div
        id="modal-product-detail"
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 text-zinc-100 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-950/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                >
                  {CATEGORY_LABELS[product.category]}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                  Unidade: {product.unit}
                </span>
                {isLowStock && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Estoque Baixo ({product.currentQuantity} {product.unit})
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-zinc-100 truncate mt-0.5">
                {product.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenEditProduct && (
              <button
                id="btn-edit-from-detail"
                onClick={() => {
                  onClose();
                  onOpenEditProduct(product);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 text-xs font-semibold border border-zinc-700 transition-colors"
                title="Editar dados cadastrais"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Produto</span>
              </button>
            )}

            <button
              id="btn-close-product-detail"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {formSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* 📊 RESUMO DE COMPARAÇÃO NO TOPO (Como solicitado) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* 1. Última Compra */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-amber-400" />
                Última Compra
              </span>
              <div className="mt-1">
                <span className="text-lg sm:text-xl font-black text-amber-400">
                  {formatCurrency(metrics.latestPrice)}
                </span>
                <span className="block text-[10px] text-zinc-500 truncate mt-0.5">
                  {formatDateBR(metrics.latestDate)}
                </span>
              </div>
            </div>

            {/* 2. Compra Anterior & Variação */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                <History className="w-3 h-3 text-zinc-400" />
                Compra Anterior
              </span>
              <div className="mt-1">
                <span className="text-sm sm:text-base font-bold text-zinc-200">
                  {metrics.previousPrice !== null
                    ? formatCurrency(metrics.previousPrice)
                    : '1º registro'}
                </span>
                {metrics.previousPrice !== null ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                        metrics.diffPrice > 0
                          ? 'bg-rose-500/20 text-rose-400'
                          : metrics.diffPrice < 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {metrics.diffPrice > 0 ? (
                        <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                      ) : metrics.diffPrice < 0 ? (
                        <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      {metrics.diffPrice > 0 ? '+' : ''}
                      {formatCurrency(metrics.diffPrice)} ({metrics.diffPercent > 0 ? '+' : ''}
                      {metrics.diffPercent.toFixed(1)}%)
                    </span>
                  </div>
                ) : (
                  <span className="block text-[10px] text-zinc-500">Sem anterior</span>
                )}
              </div>
            </div>

            {/* 3. Maior Preço Já Pago */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-rose-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Maior Preço Pago
              </span>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-black text-rose-400">
                  {formatCurrency(metrics.maxPrice)}
                </span>
                <span className="block text-[10px] text-zinc-500">Pico histórico</span>
              </div>
            </div>

            {/* 4. Menor Preço Já Pago */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Menor Preço Pago
              </span>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  {formatCurrency(metrics.minPrice)}
                </span>
                <span className="block text-[10px] text-zinc-500">Melhor cotação</span>
              </div>
            </div>

            {/* 5. Preço Médio de Compra */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[10px] font-semibold text-blue-400 flex items-center gap-1">
                <Percent className="w-3 h-3" />
                Preço Médio
              </span>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-black text-blue-300">
                  {formatCurrency(metrics.avgWeightedPrice || metrics.avgPrice)}
                </span>
                <span className="block text-[10px] text-zinc-400 mt-0.5 truncate" title={`Ponderada: ${formatCurrency(metrics.avgWeightedPrice || metrics.avgPrice)} | Simples: ${formatCurrency(metrics.avgSimplePrice || metrics.avgPrice)}`}>
                  Pond: <strong className="text-zinc-200">{formatCurrency(metrics.avgWeightedPrice || metrics.avgPrice)}</strong> · Simp: <strong className="text-zinc-300">{formatCurrency(metrics.avgSimplePrice || metrics.avgPrice)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar: Botão Nova Entrada e Seletor de Visão */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start">
              <button
                type="button"
                onClick={() => setActiveTab('grafico')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'grafico'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Gráfico de Evolução</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tabela')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'tabela'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Registros de Compras ({chartData.length})</span>
              </button>
            </div>

            <button
              id="btn-toggle-add-purchase-form"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-450 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{showAddForm ? 'Ocultar Formulário' : 'Registrar Nova Entrada / Compra'}</span>
            </button>
          </div>

          {/* 📝 FORMULÁRIO DE NOVA ENTRADA / COMPRA */}
          {showAddForm && (
            <form
              onSubmit={handleSavePurchase}
              className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-amber-500/40 shadow-xl space-y-3.5 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-100">
                      Adicionar Nova Entrada ao Histórico
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Soma ao estoque atual ({product.currentQuantity} {product.unit}) e grava no gráfico
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Data da Compra / Entrada <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={buyDate}
                    onChange={(e) => setBuyDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Quantidade Comprada ({product.unit}) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="Ex: 100"
                    value={buyQuantity}
                    onChange={(e) => setBuyQuantity(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 font-bold text-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Preço Unitário Pago (R$) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="Ex: 4.00"
                    value={buyUnitPrice}
                    onChange={(e) => setBuyUnitPrice(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 font-bold text-emerald-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Solar Coca-Cola, Distribuidora Central..."
                    value={buySupplier}
                    onChange={(e) => setBuySupplier(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Nº da Nota Fiscal / Identificação
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NF #1045, Pedido #88..."
                    value={buyInvoice}
                    onChange={(e) => setBuyInvoice(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1 text-xs">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reposição para evento de sábado, ajuste de frete..."
                  value={buyNotes}
                  onChange={(e) => setBuyNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Total preview */}
              {Number(buyQuantity) > 0 && Number(buyUnitPrice) > 0 && (
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    Valor total da compra ({buyQuantity} {product.unit} × {formatCurrency(Number(buyUnitPrice))}):
                  </span>
                  <span className="font-black text-amber-400 text-sm">
                    {formatCurrency(Number(buyQuantity) * Number(buyUnitPrice))}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Salvar Entrada & Atualizar Histórico</span>
                </button>
              </div>
            </form>
          )}

          {/* 📈 ABA 1: GRÁFICO DE HISTÓRICO DE PREÇO */}
          {activeTab === 'grafico' && (
            <div className="space-y-3">
              <PurchasePriceEvolutionChart
                history={sortedHistory}
                productName={product.name}
                unit={product.unit}
                defaultUnitPrice={product.unitPrice}
              />
            </div>
          )}

          {/* 📋 TABELA DETALHADA DE REGISTROS DE COMPRA */}
          {activeTab === 'tabela' && (
            <div className="space-y-3">
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-inner">
                {chartData.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    <p className="text-xs">Nenhum registro no histórico.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-300">
                      <thead className="bg-zinc-900/90 text-[11px] font-bold text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-3.5">#</th>
                          <th className="py-3 px-3.5">Data</th>
                          <th className="py-3 px-3.5">Preço Unitário</th>
                          <th className="py-3 px-3.5">Variação</th>
                          <th className="py-3 px-3.5">Quantidade</th>
                          <th className="py-3 px-3.5">Valor Total</th>
                          <th className="py-3 px-3.5">Fornecedor</th>
                          <th className="py-3 px-3.5">Identificação / NF</th>
                          {onDeletePurchaseRecord && (
                            <th className="py-3 px-3.5 text-center">Ações</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/80 font-medium">
                        {chartData.map((item, idx) => (
                          <tr
                            key={item.id || idx}
                            className="hover:bg-zinc-900/50 transition-colors"
                          >
                            <td className="py-2.5 px-3.5 text-zinc-500 font-mono text-[10px]">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3.5 whitespace-nowrap font-bold text-zinc-200">
                              {item.formattedDate}
                            </td>
                            <td className="py-2.5 px-3.5 whitespace-nowrap font-black text-amber-400">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                              {item.diff === 0 && idx === 0 ? (
                                <span className="text-[10px] text-zinc-500">1º registro</span>
                              ) : item.diff === 0 ? (
                                <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                                  <Minus className="w-3 h-3" /> Mantido
                                </span>
                              ) : (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 ${
                                    item.diff > 0
                                      ? 'bg-rose-500/20 text-rose-400'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                  }`}
                                >
                                  {item.diff > 0 ? '+' : ''}
                                  {formatCurrency(item.diff)} ({item.diffPct > 0 ? '+' : ''}
                                  {item.diffPct.toFixed(1)}%)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 whitespace-nowrap text-zinc-200 font-semibold">
                              {item.quantity} {product.unit}
                            </td>
                            <td className="py-2.5 px-3.5 whitespace-nowrap font-extrabold text-emerald-400">
                              {formatCurrency(item.totalPrice)}
                            </td>
                            <td className="py-2.5 px-3.5 text-zinc-300 max-w-[150px] truncate" title={item.supplier}>
                              {item.supplier}
                            </td>
                            <td className="py-2.5 px-3.5 text-zinc-400 font-mono text-[11px]">
                              {item.invoiceNumber}
                            </td>
                            {onDeletePurchaseRecord && (
                              <td className="py-2.5 px-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => onDeletePurchaseRecord(product.id, item.id)}
                                  className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                  title="Excluir este registro de compra"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dados Gerais do Estoque Atual */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[10px] text-zinc-500 block">Estoque Atual</span>
                <span className="font-extrabold text-zinc-100 text-sm">
                  {product.currentQuantity} {product.unit}
                </span>
              </div>
              <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
              <div>
                <span className="text-[10px] text-zinc-500 block">Estoque Mínimo</span>
                <span className="font-bold text-amber-400">
                  {product.minQuantity} {product.unit}
                </span>
              </div>
              <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
              <div>
                <span className="text-[10px] text-zinc-500 block">Fornecedor Padrão</span>
                <span className="font-semibold text-zinc-300">
                  {product.supplier || 'Não informado'}
                </span>
              </div>
            </div>

            <div className="text-right self-end sm:self-auto">
              <span className="text-[10px] text-zinc-500 block">Valor Imobilizado em Estoque</span>
              <span className="font-black text-amber-400 text-sm">
                {formatCurrency(product.currentQuantity * (product.unitPrice || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-zinc-800 flex items-center justify-between bg-zinc-950">
          <span className="text-[11px] text-zinc-500">
            {chartData.length} compra{chartData.length === 1 ? '' : 's'} registrada{chartData.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition-colors"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
