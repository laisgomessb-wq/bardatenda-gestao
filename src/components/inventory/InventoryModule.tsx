import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Zap,
  Edit2,
  Trash2,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Calendar,
  Building2,
  FileText,
  CheckSquare,
  Square,
  Check,
  Copy,
  BarChart3,
  ChevronRight,
  History,
} from 'lucide-react';
import { Product, ProductCategory, PurchaseRecord } from '../../types';
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  formatCurrency,
  formatDateBR,
} from '../../utils/formatters';
import { ProductModal } from './ProductModal';
import { QuickRestockModal } from './QuickRestockModal';
import { ProductDetailModal } from './ProductDetailModal';

interface InventoryModuleProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteMultipleProducts?: (productIds: string[]) => void;
  onQuickRestock: (
    productId: string,
    addedQty: number,
    date: string,
    unitPrice?: number,
    supplier?: string,
    invoiceNumber?: string,
    notes?: string
  ) => void;
  onAddPurchaseRecord?: (productId: string, record: Omit<PurchaseRecord, 'id' | 'createdAt'>) => void;
  onDeletePurchaseRecord?: (productId: string, recordId: string) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onDeleteMultipleProducts,
  onQuickRestock,
  onAddPurchaseRecord,
  onDeletePurchaseRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [filterOnlyLowStock, setFilterOnlyLowStock] = useState(false);

  // Selection state for multiple delete
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [viewingDetailProduct, setViewingDetailProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Sincroniza o produto em visualização de detalhe quando os produtos mudam
  const liveDetailProduct = useMemo(() => {
    if (!viewingDetailProduct) return null;
    return products.find((p) => p.id === viewingDetailProduct.id) || viewingDetailProduct;
  }, [products, viewingDetailProduct]);

  // Statistics
  const totalProducts = products.length;
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.currentQuantity <= p.minQuantity),
    [products]
  );
  const totalStockValue = useMemo(
    () => products.reduce((acc, p) => acc + (p.currentQuantity * p.unitPrice || 0), 0),
    [products]
  );

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'todos' || item.category === selectedCategory;

      const matchesLowStock = !filterOnlyLowStock || item.currentQuantity <= item.minQuantity;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchTerm, selectedCategory, filterOnlyLowStock]);

  // Selection handlers
  const isAllFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Unselect filtered products
      const filteredIds = new Set(filteredProducts.map((p) => p.id));
      setSelectedProductIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all filtered products
      const allFilteredIds = filteredProducts.map((p) => p.id);
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleClearSelection = () => {
    setSelectedProductIds([]);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedProductIds.length > 0 && onDeleteMultipleProducts) {
      onDeleteMultipleProducts(selectedProductIds);
      setSelectedProductIds([]);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      onUpdateProduct(product);
    } else {
      onAddProduct(product);
    }
  };

  const handleDuplicateProduct = (product: Product) => {
    const duplicatedProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: `${product.name} (Cópia)`,
    };
    onAddProduct(duplicatedProduct);
  };

  const handleConfirmDelete = () => {
    if (deletingProductId) {
      onDeleteProduct(deletingProductId);
      setSelectedProductIds((prev) => prev.filter((id) => id !== deletingProductId));
      setDeletingProductId(null);
    }
  };

  return (
    <div id="module-inventory" className="space-y-4 pb-24">
      {/* Top summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400">Total Itens</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-zinc-100">{totalProducts}</span>
            <span className="text-[10px] text-zinc-500">cadastros</span>
          </div>
        </div>

        <button
          onClick={() => setFilterOnlyLowStock(!filterOnlyLowStock)}
          className={`rounded-2xl p-3 flex flex-col justify-between text-left transition-all border ${
            lowStockProducts.length > 0
              ? filterOnlyLowStock
                ? 'bg-rose-950/70 border-rose-600 shadow-md ring-1 ring-rose-500'
                : 'bg-rose-950/30 border-rose-800/60 hover:bg-rose-950/50'
              : 'bg-zinc-900/90 border-zinc-800/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-300">Estoque Baixo</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${lowStockProducts.length > 0 ? 'text-rose-400' : 'text-zinc-600'}`} />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-extrabold ${lowStockProducts.length > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
              {lowStockProducts.length}
            </span>
            <span className="text-[10px] text-rose-300/70 font-medium">críticos</span>
          </div>
        </button>

        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400">Valor Estimado</span>
          <div className="mt-1">
            <span className="text-sm font-extrabold text-amber-400 leading-tight truncate block">
              {formatCurrency(totalStockValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              id="search-products-input"
              type="text"
              placeholder="Buscar produto, fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          <button
            id="btn-add-product"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-md shadow-amber-500/20 whitespace-nowrap min-h-[38px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo</span>
          </button>
        </div>

        {/* Category Pills & Bulk Selection Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs flex-1">
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'todos'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos ({products.length})
            </button>

            {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-zinc-950/20 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🎛️ Barra de Seleção e Ações em Massa */}
        {filteredProducts.length > 0 && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <button
              id="btn-toggle-select-all-products"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-zinc-300 hover:text-amber-400 font-semibold transition-colors"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isAllFilteredSelected
                    ? 'bg-amber-500 border-amber-500 text-zinc-950'
                    : selectedProductIds.length > 0
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'border-zinc-700 bg-zinc-950'
                }`}
              >
                {isAllFilteredSelected ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : selectedProductIds.length > 0 ? (
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-sm" />
                ) : null}
              </div>
              <span>
                {isAllFilteredSelected
                  ? `Desmarcar todos (${filteredProducts.length})`
                  : `Selecionar todos (${filteredProducts.length})`}
              </span>
            </button>

            {selectedProductIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                  {selectedProductIds.length} selecionado{selectedProductIds.length > 1 ? 's' : ''}
                </span>

                <button
                  id="btn-bulk-delete-products"
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
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4" id="products-list-container">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-3">
            <Package className="w-10 h-10 text-zinc-600 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-zinc-300">Nenhum produto encontrado</p>
              <p className="text-xs text-zinc-500 mt-1">
                {searchTerm || filterOnlyLowStock || selectedCategory !== 'todos'
                  ? 'Tente ajustar os filtros ou termo de busca.'
                  : 'Comece adicionando seu primeiro item de estoque.'}
              </p>
            </div>
            {(searchTerm || filterOnlyLowStock || selectedCategory !== 'todos') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('todos');
                  setFilterOnlyLowStock(false);
                }}
                className="text-xs font-semibold text-amber-400 hover:underline inline-block"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isLowStock = product.currentQuantity <= product.minQuantity;
            const isSelected = selectedProductIds.includes(product.id);
            const catStyle = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.descartaveis;
            const stockPct = product.minQuantity > 0 
              ? Math.min(Math.round((product.currentQuantity / (product.minQuantity * 2)) * 100), 100) 
              : 100;

            const hasMeta = (product.unitPrice && product.unitPrice > 0) || product.lastRestockedDate || (product.notes && product.notes.trim().length > 0);

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                onClick={() => setViewingDetailProduct(product)}
                className={`bg-zinc-900/90 border rounded-2xl p-3.5 transition-all flex flex-col justify-between space-y-3 relative cursor-pointer group hover:bg-zinc-850 hover:shadow-lg ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500 shadow-md shadow-amber-500/10'
                    : isLowStock
                    ? 'border-rose-700/60 shadow-md shadow-rose-950/20 ring-1 ring-rose-500/20 hover:border-rose-500/80'
                    : 'border-zinc-800/80 hover:border-amber-500/50'
                }`}
              >
                {/* 1. Header do Card: Checkbox + Tags na Esquerda | Ações Rápidas na Direita */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {/* Checkbox e Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectProduct(product.id);
                        }}
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
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                      >
                        {CATEGORY_LABELS[product.category]}
                      </span>

                      {isLowStock && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse shrink-0"
                        >
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                          Estoque Baixo
                        </span>
                      )}
                    </div>

                    {/* Botões de Ações Rápidas */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateProduct(product);
                        }}
                        className="w-6 h-6 rounded-lg bg-zinc-800/90 hover:bg-amber-500/20 hover:text-amber-400 text-zinc-400 flex items-center justify-center transition-colors"
                        title="Duplicar produto"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(product);
                        }}
                        className="w-6 h-6 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 hover:text-zinc-200 text-zinc-400 flex items-center justify-center transition-colors"
                        title="Editar produto"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingProductId(product.id);
                        }}
                        className="w-6 h-6 rounded-lg bg-zinc-800/90 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 flex items-center justify-center transition-colors"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* 2. Nome do Produto (com quebra limpa e espaço total) */}
                  <h3
                    className="font-bold text-sm text-zinc-100 leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors"
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                </div>

                {/* 3. Barra de Nível de Estoque e Valores */}
                <div className="space-y-2">
                  <div className="bg-zinc-950/70 px-2.5 py-2 rounded-xl border border-zinc-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] text-zinc-400">Estoque:</span>
                        <span
                          className={`text-sm font-black ${
                            isLowStock ? 'text-rose-400' : 'text-zinc-100'
                          }`}
                        >
                          {product.currentQuantity}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">{product.unit}</span>
                      </div>

                      <div className="text-right flex items-baseline gap-1">
                        <span className="text-[10px] text-zinc-400">Mín:</span>
                        <span className="text-[11px] font-bold text-amber-400">
                          {product.minQuantity} {product.unit}
                        </span>
                      </div>
                    </div>

                    {/* Barra visual de progresso */}
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isLowStock
                            ? 'bg-rose-500'
                            : product.currentQuantity <= product.minQuantity * 1.5
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.max(stockPct, 8)}%` }}
                      />
                    </div>
                  </div>

                  {/* 4. Metadados (Custo / Reposição / Observações) */}
                  {hasMeta && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400 px-0.5">
                      {product.unitPrice !== undefined && product.unitPrice > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Custo: <strong className="text-zinc-200">{formatCurrency(product.unitPrice)}</strong></span>
                        </div>
                      )}

                      {product.lastRestockedDate && (
                        <div className="flex items-center gap-1 text-zinc-400">
                          <Calendar className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span>Reposição: <strong className="text-zinc-300">{formatDateBR(product.lastRestockedDate)}</strong></span>
                        </div>
                      )}

                      {product.notes && product.notes.trim().length > 0 && (
                        <div className="w-full bg-zinc-950/40 px-2 py-1 rounded-lg border border-zinc-800/40 text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <FileText className="w-3 h-3 text-amber-400/80 shrink-0" />
                          <span className="text-[10px] leading-tight italic truncate">{product.notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Botão de Evolução & Histórico de Preços (100% largura e responsivo) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingDetailProduct(product);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 flex items-center justify-between text-[11px] font-semibold transition-all group/btn"
                    title="Ver Histórico e Gráfico de Evolução de Preços de Compra"
                  >
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Evolução / Compras</span>
                    </span>
                    <span className="text-[10px] text-amber-400/70 group-hover/btn:text-amber-300 font-medium flex items-center gap-0.5">
                      Gráfico <span className="text-xs transition-transform group-hover/btn:translate-x-0.5">→</span>
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 📈 Product Detail & Price History Modal */}
      {liveDetailProduct && (
        <ProductDetailModal
          isOpen={!!liveDetailProduct}
          product={liveDetailProduct}
          onClose={() => setViewingDetailProduct(null)}
          onAddPurchaseRecord={(productId, record) => {
            if (onAddPurchaseRecord) {
              onAddPurchaseRecord(productId, record);
            }
          }}
          onDeletePurchaseRecord={onDeletePurchaseRecord}
          onOpenEditProduct={(prod) => {
            setViewingDetailProduct(null);
            handleOpenEditModal(prod);
          }}
        />
      )}

      {/* Product Modal (Add/Edit) */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
      />

      {/* Quick Restock Modal */}
      <QuickRestockModal
        isOpen={!!restockProduct}
        product={restockProduct}
        onClose={() => setRestockProduct(null)}
        onConfirmRestock={onQuickRestock}
      />

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xs w-full p-5 shadow-2xl text-zinc-200">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-center text-zinc-100 mb-1">
              Excluir produto do estoque?
            </h3>
            <p className="text-xs text-zinc-400 text-center mb-4">
              Esta ação removerá o produto e seu histórico de reposição.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-product"
                onClick={handleConfirmDelete}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Modal: Confirmar Exclusão em Massa de Produtos */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-800/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-zinc-100">
                Excluir {selectedProductIds.length} produto{selectedProductIds.length > 1 ? 's' : ''}?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tem certeza que deseja apagar os itens selecionados do estoque? Esta ação não pode ser desfeita.
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
                id="btn-confirm-bulk-delete-products"
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                Sim, Excluir ({selectedProductIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
