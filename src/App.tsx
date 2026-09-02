import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveTab,
  Product,
  PurchaseRecord,
  BandGig,
  StaffMember,
  StaffShift,
  BillAccount,
  CashTransaction,
  NotificationSettings,
  ActivityLog,
} from './types';
import {
  loadProducts,
  saveProducts,
  loadGigs,
  saveGigs,
  loadStaffMembers,
  saveStaffMembers,
  loadShifts,
  saveShifts,
  loadBills,
  saveBills,
  loadTransactions,
  saveTransactions,
  loadTheme,
  saveTheme,
  loadNotificationSettings,
  saveNotificationSettings,
  loadAuth,
  saveAuthSession,
  updateCredentials,
} from './utils/storage';
import {
  ensureDatabaseInitialized,
  subscribeToProducts,
  subscribeToGigs,
  subscribeToStaffMembers,
  subscribeToShifts,
  subscribeToBills,
  subscribeToTransactions,
  subscribeToSettings,
  subscribeToActivities,
  saveProductToFirestore,
  deleteProductFromFirestore,
  deleteMultipleProductsFromFirestore,
  saveGigToFirestore,
  deleteGigFromFirestore,
  deleteMultipleGigsFromFirestore,
  saveStaffMemberToFirestore,
  deleteStaffMemberFromFirestore,
  deleteMultipleStaffMembersFromFirestore,
  saveShiftToFirestore,
  saveMultipleShiftsToFirestore,
  deleteShiftFromFirestore,
  deleteMultipleShiftsFromFirestore,
  saveBillToFirestore,
  deleteBillFromFirestore,
  deleteMultipleBillsFromFirestore,
  clearAllBillsInFirestore,
  saveTransactionToFirestore,
  deleteTransactionFromFirestore,
  deleteMultipleTransactionsFromFirestore,
  clearAllTransactionsInFirestore,
  saveSettingsToFirestore,
  resetAllDataInFirestore,
} from './utils/firestoreSync';
import { getTodayISO, calculateBillEffectiveStatus, formatCurrency } from './utils/formatters';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { BandsModule } from './components/bands/BandsModule';
import { BillsModule } from './components/bills/BillsModule';
import { FinanceModule } from './components/finance/FinanceModule';
import { StaffModule } from './components/staff/StaffModule';
import { ProfileModule } from './components/profile/ProfileModule';
import { LiveActivityDrawer } from './components/common/LiveActivityDrawer';
import { Check } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

function DashboardApp() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [gigs, setGigs] = useState<BandGig[]>(() => loadGigs());
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => loadStaffMembers());
  const [shifts, setShifts] = useState<StaffShift[]>(() => loadShifts());
  const [bills, setBills] = useState<BillAccount[]>(() => loadBills());
  const [transactions, setTransactions] = useState<CashTransaction[]>(() => loadTransactions());
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile, Theme and Notifications
  const [authData, setAuthData] = useState(() => loadAuth());
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    loadNotificationSettings()
  );

  // Sincronização em Tempo Real (Full Time) com Firestore
  useEffect(() => {
    setTheme(loadTheme());

    // Garante inicialização no Firestore se o banco estiver vazio
    ensureDatabaseInitialized().catch(console.error);

    // 1. Ouvinte em tempo real de Produtos (Estoque)
    const unsubProducts = subscribeToProducts(
      (cloudProducts) => {
        setIsConnected(true);
        setProducts(cloudProducts);
        saveProducts(cloudProducts);
      },
      () => setIsConnected(false)
    );

    // 2. Ouvinte em tempo real de Bandas (Agenda de Shows)
    const unsubGigs = subscribeToGigs(
      (cloudGigs) => {
        setIsConnected(true);
        setGigs(cloudGigs);
        saveGigs(cloudGigs);
      },
      () => setIsConnected(false)
    );

    // 3. Ouvinte em tempo real de Colaboradores (Equipe)
    const unsubStaff = subscribeToStaffMembers(
      (cloudStaff) => {
        setIsConnected(true);
        setStaffMembers(cloudStaff);
        saveStaffMembers(cloudStaff);
      },
      () => setIsConnected(false)
    );

    // 4. Ouvinte em tempo real de Escalas (Planner)
    const unsubShifts = subscribeToShifts(
      (cloudShifts) => {
        setIsConnected(true);
        setShifts(cloudShifts);
        saveShifts(cloudShifts);
      },
      () => setIsConnected(false)
    );

    // 5. Ouvinte em tempo real de Contas
    const unsubBills = subscribeToBills(
      (cloudBills) => {
        setIsConnected(true);
        setBills(cloudBills);
        saveBills(cloudBills);
      },
      () => setIsConnected(false)
    );

    // 6. Ouvinte em tempo real de Transações de Caixa
    const unsubTransactions = subscribeToTransactions(
      (cloudTxs) => {
        setIsConnected(true);
        setTransactions(cloudTxs);
        saveTransactions(cloudTxs);
      },
      () => setIsConnected(false)
    );

    // 7. Ouvinte em tempo real de Atividades e Logs de Modificações
    const unsubActivities = subscribeToActivities((cloudActivities) => {
      setActivities(cloudActivities);
    });

    // 8. Ouvinte em tempo real de Configurações e Credenciais compartilhadas
    const unsubSettings = subscribeToSettings((cloudSettings) => {
      if (cloudSettings.notifications) {
        setNotificationSettings(cloudSettings.notifications);
        saveNotificationSettings(cloudSettings.notifications);
      }
      if (cloudSettings.authUser || cloudSettings.authPass) {
        setAuthData((prev) => ({
          ...prev,
          username: cloudSettings.authUser || prev.username,
          password: cloudSettings.authPass || prev.password,
        }));
      }
    });

    return () => {
      unsubProducts();
      unsubGigs();
      unsubStaff();
      unsubShifts();
      unsubBills();
      unsubTransactions();
      unsubActivities();
      unsubSettings();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast('Link copiado! Qualquer pessoa pode acessar.');
  };

  const handleCredentialsUpdated = (newUsername: string, _newPass: string) => {
    updateCredentials(newUsername, '');
    setAuthData((prev) => ({
      ...prev,
      username: newUsername,
    }));
    saveSettingsToFirestore({ authUser: newUsername }).catch(console.error);
    showToast('Nome de identificação salvo!');
  };

  // Theme handler
  const handleToggleTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    saveTheme(newTheme);
    showToast(newTheme === 'dark' ? 'Modo Escuro ativado.' : 'Modo Claro ativado.');
  };

  // Notification settings handler
  const handleUpdateNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
    saveSettingsToFirestore({ notifications: newSettings }).catch(console.error);
    showToast('Configurações de notificações sincronizadas!');
  };

  // 1. Handlers de Estoque
  const handleAddProduct = (newProduct: Product) => {
    let finalProduct = { ...newProduct };
    if ((!finalProduct.purchaseHistory || finalProduct.purchaseHistory.length === 0) && finalProduct.unitPrice > 0) {
      finalProduct.purchaseHistory = [
        {
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          date: finalProduct.lastRestockedDate || getTodayISO(),
          quantity: finalProduct.currentQuantity || 1,
          unitPrice: finalProduct.unitPrice,
          totalPrice: (finalProduct.currentQuantity || 1) * finalProduct.unitPrice,
          supplier: finalProduct.supplier || 'Cadastro Inicial',
          invoiceNumber: 'Entrada Inicial',
          notes: 'Cadastro inicial do produto',
          createdAt: new Date().toISOString(),
        },
      ];
    }
    const updated = [finalProduct, ...products];
    setProducts(updated);
    saveProducts(updated);
    saveProductToFirestore(finalProduct, authData.username).catch(console.error);
    showToast(`Produto "${finalProduct.name}" cadastrado com sucesso!`);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const existing = products.find((p) => p.id === updatedProduct.id);
    let finalProduct = { ...updatedProduct };

    // Se o custo unitário foi modificado e difere do cadastro anterior:
    if (
      existing &&
      updatedProduct.unitPrice > 0 &&
      existing.unitPrice !== updatedProduct.unitPrice
    ) {
      const currentHistory = updatedProduct.purchaseHistory || existing.purchaseHistory || [];
      const newRecord: PurchaseRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        date: updatedProduct.lastRestockedDate || getTodayISO(),
        quantity: updatedProduct.currentQuantity || 1,
        unitPrice: updatedProduct.unitPrice,
        totalPrice: (updatedProduct.currentQuantity || 1) * updatedProduct.unitPrice,
        supplier: updatedProduct.supplier || existing.supplier || 'Atualização Cadastral',
        invoiceNumber: 'Reajuste Cadastral',
        notes: `Custo alterado de ${formatCurrency(existing.unitPrice)} para ${formatCurrency(updatedProduct.unitPrice)}`,
        createdAt: new Date().toISOString(),
      };
      finalProduct.purchaseHistory = [...currentHistory, newRecord];
    }

    const updated = products.map((p) => (p.id === finalProduct.id ? finalProduct : p));
    setProducts(updated);
    saveProducts(updated);
    saveProductToFirestore(finalProduct, authData.username).catch(console.error);
    showToast(`Produto "${finalProduct.name}" atualizado!`);
  };

  const handleDeleteProduct = (productId: string) => {
    const productToDelete = products.find((p) => p.id === productId);
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);
    deleteProductFromFirestore(productId, productToDelete?.name, authData.username).catch(console.error);
    showToast(productToDelete ? `"${productToDelete.name}" removido do estoque.` : 'Produto removido.');
  };

  const handleDeleteMultipleProducts = (productIds: string[]) => {
    const updated = products.filter((p) => !productIds.includes(p.id));
    setProducts(updated);
    saveProducts(updated);
    deleteMultipleProductsFromFirestore(productIds, productIds.length, authData.username).catch(console.error);
    showToast(`${productIds.length} produto(s) excluído(s) do estoque!`);
  };

  const handleQuickRestock = (
    productId: string,
    addedQty: number,
    date: string,
    unitPrice?: number,
    supplier?: string,
    invoiceNumber?: string,
    notes?: string
  ) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const finalPrice = unitPrice !== undefined && unitPrice >= 0 ? unitPrice : targetProduct.unitPrice;
    const finalSupplier = supplier || targetProduct.supplier;

    const newRecord: PurchaseRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: date,
      quantity: addedQty,
      unitPrice: finalPrice,
      totalPrice: addedQty * finalPrice,
      supplier: finalSupplier,
      invoiceNumber: invoiceNumber || 'Reposição Rápida',
      notes: notes,
      createdAt: new Date().toISOString(),
    };

    const currentHistory = targetProduct.purchaseHistory || [];
    const updatedHistory = [...currentHistory, newRecord];

    const updatedProduct: Product = {
      ...targetProduct,
      currentQuantity: targetProduct.currentQuantity + addedQty,
      unitPrice: finalPrice,
      supplier: finalSupplier,
      lastRestockedDate: date,
      purchaseHistory: updatedHistory,
    };

    const updated = products.map((p) => (p.id === productId ? updatedProduct : p));
    setProducts(updated);
    saveProducts(updated);
    saveProductToFirestore(updatedProduct, authData.username).catch(console.error);
    showToast(`+${addedQty} ${targetProduct.unit} somados a "${targetProduct.name}" com entrada registrada no histórico!`);
  };

  const handleAddPurchaseRecord = (productId: string, newRecord: Omit<PurchaseRecord, 'id' | 'createdAt'>) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const record: PurchaseRecord = {
      ...newRecord,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };

    const currentHistory = target.purchaseHistory || [];
    const updatedHistory = [...currentHistory, record];

    const updatedProduct: Product = {
      ...target,
      currentQuantity: target.currentQuantity + (newRecord.quantity || 0),
      unitPrice: newRecord.unitPrice,
      supplier: newRecord.supplier || target.supplier,
      lastRestockedDate: newRecord.date || target.lastRestockedDate,
      purchaseHistory: updatedHistory,
    };

    const updatedProducts = products.map((p) => (p.id === productId ? updatedProduct : p));
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    saveProductToFirestore(updatedProduct, authData.username).catch(console.error);
    showToast(`Nova compra de ${newRecord.quantity} ${target.unit} registrada no histórico!`);
  };

  const handleDeletePurchaseRecord = (productId: string, recordId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target || !target.purchaseHistory) return;

    const updatedHistory = target.purchaseHistory.filter((r) => r.id !== recordId);
    const updatedProduct: Product = {
      ...target,
      purchaseHistory: updatedHistory,
    };

    const updatedProducts = products.map((p) => (p.id === productId ? updatedProduct : p));
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    saveProductToFirestore(updatedProduct, authData.username).catch(console.error);
    showToast('Registro de compra excluído do histórico.');
  };

  // 2. Handlers de Bandas
  const handleAddGig = (newGig: BandGig) => {
    const updated = [newGig, ...gigs];
    setGigs(updated);
    saveGigs(updated);
    saveGigToFirestore(newGig, authData.username).catch(console.error);
    showToast(`Show de "${newGig.bandName}" agendado!`);
  };

  const handleUpdateGig = (updatedGig: BandGig) => {
    const updated = gigs.map((g) => (g.id === updatedGig.id ? updatedGig : g));
    setGigs(updated);
    saveGigs(updated);
    saveGigToFirestore(updatedGig, authData.username).catch(console.error);
    showToast(`Apresentação de "${updatedGig.bandName}" atualizada!`);
  };

  const handleDeleteGig = (gigId: string) => {
    const gigToDelete = gigs.find((g) => g.id === gigId);
    const updated = gigs.filter((g) => g.id !== gigId);
    setGigs(updated);
    saveGigs(updated);
    deleteGigFromFirestore(gigId, gigToDelete?.bandName, authData.username).catch(console.error);
    showToast(gigToDelete ? `Show de "${gigToDelete.bandName}" removido.` : 'Apresentação removida.');
  };

  const handleDeleteMultipleGigs = (gigIds: string[]) => {
    const updated = gigs.filter((g) => !gigIds.includes(g.id));
    setGigs(updated);
    saveGigs(updated);
    deleteMultipleGigsFromFirestore(gigIds, gigIds.length, authData.username).catch(console.error);
    showToast(`${gigIds.length} show(s) removido(s) da agenda!`);
  };

  // 3. Handlers de Contas a Pagar / Receber
  const handleAddBill = (newBill: BillAccount) => {
    const updated = [newBill, ...bills];
    setBills(updated);
    saveBills(updated);
    saveBillToFirestore(newBill, authData.username).catch(console.error);
    showToast(`Conta "${newBill.description}" cadastrada!`);
  };

  const handleUpdateBill = (updatedBill: BillAccount) => {
    const updated = bills.map((b) => (b.id === updatedBill.id ? updatedBill : b));
    setBills(updated);
    saveBills(updated);
    saveBillToFirestore(updatedBill, authData.username).catch(console.error);
    showToast(`Conta "${updatedBill.description}" atualizada!`);
  };

  const handleDeleteBill = (billId: string) => {
    const billToDelete = bills.find((b) => b.id === billId);
    const updated = bills.filter((b) => b.id !== billId);
    setBills(updated);
    saveBills(updated);
    deleteBillFromFirestore(billId, billToDelete?.description, authData.username).catch(console.error);
    showToast(billToDelete ? `Conta "${billToDelete.description}" removida.` : 'Conta removida.');
  };

  const handleDeleteMultipleBills = (billIds: string[]) => {
    const updated = bills.filter((b) => !billIds.includes(b.id));
    setBills(updated);
    saveBills(updated);
    deleteMultipleBillsFromFirestore(billIds, billIds.length, authData.username).catch(console.error);
    showToast(`${billIds.length} conta(s) excluída(s)!`);
  };

  const handleToggleBillPaid = (bill: BillAccount) => {
    const today = getTodayISO();
    const isPaid = bill.status === 'pago';
    const updated: BillAccount = {
      ...bill,
      status: isPaid ? 'pendente' : 'pago',
      paymentDate: isPaid ? undefined : today,
    };
    handleUpdateBill(updated);
  };

  const handleClearAllBills = () => {
    setBills([]);
    saveBills([]);
    clearAllBillsInFirestore(authData.username).catch(console.error);
    showToast('Todas as contas foram limpas com sucesso!');
  };

  // 4. Handlers de Vendas e Despesas (Fluxo de Caixa)
  const handleAddTransaction = (newTx: CashTransaction) => {
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
    saveTransactionToFirestore(newTx, authData.username).catch(console.error);
    showToast(`Lançamento "${newTx.description}" registrado!`);
  };

  const handleUpdateTransaction = (updatedTx: CashTransaction) => {
    const updated = transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t));
    setTransactions(updated);
    saveTransactions(updated);
    saveTransactionToFirestore(updatedTx, authData.username).catch(console.error);
    showToast(`Lançamento "${updatedTx.description}" atualizado!`);
  };

  const handleDeleteTransaction = (txId: string) => {
    const txToDelete = transactions.find((t) => t.id === txId);
    const updated = transactions.filter((t) => t.id !== txId);
    setTransactions(updated);
    saveTransactions(updated);
    deleteTransactionFromFirestore(txId, txToDelete?.description, authData.username).catch(console.error);
    showToast(txToDelete ? `"${txToDelete.description}" removido.` : 'Lançamento removido.');
  };

  const handleDeleteMultipleTransactions = (txIds: string[]) => {
    const updated = transactions.filter((t) => !txIds.includes(t.id));
    setTransactions(updated);
    saveTransactions(updated);
    deleteMultipleTransactionsFromFirestore(txIds, txIds.length, authData.username).catch(console.error);
    showToast(`${txIds.length} lançamento(s) excluído(s) do caixa!`);
  };

  const handleClearAllTransactions = () => {
    setTransactions([]);
    saveTransactions([]);
    clearAllTransactionsInFirestore(authData.username).catch(console.error);
    showToast('Todas as atividades do caixa foram limpas!');
  };

  // 5. Handlers de Equipe (Escalas e Funcionários Cadastrados)
  const handleAddShift = (newShift: StaffShift) => {
    const updated = [newShift, ...shifts];
    setShifts(updated);
    saveShifts(updated);
    saveShiftToFirestore(newShift, authData.username).catch(console.error);
    showToast(`${newShift.name} adicionado(a) à escala!`);
  };

  const handleUpdateShift = (updatedShift: StaffShift) => {
    const updated = shifts.map((s) => (s.id === updatedShift.id ? updatedShift : s));
    setShifts(updated);
    saveShifts(updated);
    saveShiftToFirestore(updatedShift, authData.username).catch(console.error);
    showToast(`Escala de ${updatedShift.name} atualizada!`);
  };

  const handleDeleteShift = (shiftId: string) => {
    const shiftToDelete = shifts.find((s) => s.id === shiftId);
    const updated = shifts.filter((s) => s.id !== shiftId);
    setShifts(updated);
    saveShifts(updated);
    deleteShiftFromFirestore(shiftId, shiftToDelete?.name, authData.username).catch(console.error);
    showToast(shiftToDelete ? `${shiftToDelete.name} removido(a) da escala.` : 'Item removido da escala.');
  };

  const handleDeleteMultipleShifts = (shiftIds: string[]) => {
    const updated = shifts.filter((s) => !shiftIds.includes(s.id));
    setShifts(updated);
    saveShifts(updated);
    deleteMultipleShiftsFromFirestore(shiftIds, shiftIds.length, authData.username).catch(console.error);
    showToast(`${shiftIds.length} item(ns) removido(s) da escala!`);
  };

  const handleBatchAddShifts = (newShifts: StaffShift[]) => {
    const updated = [...newShifts, ...shifts];
    setShifts(updated);
    saveShifts(updated);
    saveMultipleShiftsToFirestore(newShifts, authData.username).catch(console.error);
    showToast(`${newShifts.length} funcionários sincronizados na escala!`);
  };

  const handleAddStaffMember = (newMember: StaffMember) => {
    const updated = [newMember, ...staffMembers];
    setStaffMembers(updated);
    saveStaffMembers(updated);
    saveStaffMemberToFirestore(newMember, authData.username).catch(console.error);
    showToast(`Colaborador(a) "${newMember.name}" cadastrado(a)!`);
  };

  const handleUpdateStaffMember = (updatedMember: StaffMember) => {
    const updated = staffMembers.map((m) => (m.id === updatedMember.id ? updatedMember : m));
    setStaffMembers(updated);
    saveStaffMembers(updated);
    saveStaffMemberToFirestore(updatedMember, authData.username).catch(console.error);
    showToast(`Cadastro de "${updatedMember.name}" atualizado!`);
  };

  const handleDeleteStaffMember = (memberId: string) => {
    const memberToDelete = staffMembers.find((m) => m.id === memberId);
    const updated = staffMembers.filter((m) => m.id !== memberId);
    setStaffMembers(updated);
    saveStaffMembers(updated);
    deleteStaffMemberFromFirestore(memberId, memberToDelete?.name, authData.username).catch(console.error);
    showToast(memberToDelete ? `"${memberToDelete.name}" removido(a) do cadastro.` : 'Colaborador removido.');
  };

  const handleDeleteMultipleStaffMembers = (memberIds: string[]) => {
    const updated = staffMembers.filter((m) => !memberIds.includes(m.id));
    setStaffMembers(updated);
    saveStaffMembers(updated);
    deleteMultipleStaffMembersFromFirestore(memberIds, memberIds.length, authData.username).catch(console.error);
    showToast(`${memberIds.length} colaborador(es) excluído(s)!`);
  };

  const handleResetData = () => {
    resetAllDataInFirestore(authData.username).catch(console.error);
    showToast('Sincronizando restauração de dados para todos os logins...');
  };

  // Contagem total de itens sincronizados
  const totalSyncedCount =
    products.length +
    gigs.length +
    staffMembers.length +
    shifts.length +
    bills.length +
    transactions.length;

  // Cálculos de badges e notificações
  const lowStockCount = useMemo(
    () => products.filter((p) => p.currentQuantity <= p.minQuantity).length,
    [products]
  );

  const confirmedGigsCount = useMemo(
    () => gigs.filter((g) => g.status === 'confirmada').length,
    [gigs]
  );

  const today = getTodayISO();
  const todayStaffCount = useMemo(
    () => shifts.filter((s) => s.date === today && s.status === 'confirmado').length,
    [shifts, today]
  );

  const overdueBillsCount = useMemo(
    () => bills.filter((b) => calculateBillEffectiveStatus(b.dueDate, b.status, today) === 'atrasado').length,
    [bills, today]
  );

  return (
    <div
      id="app-root"
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 pb-20 ${
        theme === 'light'
          ? 'bg-zinc-100 text-zinc-900 selection:bg-amber-500 selection:text-zinc-950'
          : 'bg-[#0d0f14] text-zinc-100 selection:bg-amber-500 selection:text-zinc-950'
      }`}
    >
      {/* Top Header */}
      <Header
        lowStockCount={lowStockCount}
        onResetData={handleResetData}
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onShareLink={handleShareLink}
        isLiveSync={isConnected}
        onOpenActivityDrawer={() => setIsActivityDrawerOpen(true)}
        recentActivityCount={activities.length}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <main id="app-main-content" className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
        {activeTab === 'dashboard' && (
          <DashboardModule
            products={products}
            gigs={gigs}
            shifts={shifts}
            bills={bills}
            transactions={transactions}
            onNavigateTab={setActiveTab}
            onQuickRestock={handleQuickRestock}
            onToggleBillPaid={handleToggleBillPaid}
          />
        )}

        {activeTab === 'estoque' && (
          <InventoryModule
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onDeleteMultipleProducts={handleDeleteMultipleProducts}
            onQuickRestock={handleQuickRestock}
            onAddPurchaseRecord={handleAddPurchaseRecord}
            onDeletePurchaseRecord={handleDeletePurchaseRecord}
          />
        )}

        {activeTab === 'bandas' && (
          <BandsModule
            gigs={gigs}
            onAddGig={handleAddGig}
            onUpdateGig={handleUpdateGig}
            onDeleteGig={handleDeleteGig}
            onDeleteMultipleGigs={handleDeleteMultipleGigs}
          />
        )}

        {activeTab === 'contas' && (
          <BillsModule
            bills={bills}
            onAddBill={handleAddBill}
            onUpdateBill={handleUpdateBill}
            onDeleteBill={handleDeleteBill}
            onDeleteMultipleBills={handleDeleteMultipleBills}
            onClearAllBills={handleClearAllBills}
          />
        )}

        {activeTab === 'financeiro' && (
          <FinanceModule
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onDeleteMultipleTransactions={handleDeleteMultipleTransactions}
            onClearAllTransactions={handleClearAllTransactions}
          />
        )}

        {activeTab === 'equipe' && (
          <StaffModule
            shifts={shifts}
            staffMembers={staffMembers}
            onAddShift={handleAddShift}
            onUpdateShift={handleUpdateShift}
            onDeleteShift={handleDeleteShift}
            onDeleteMultipleShifts={handleDeleteMultipleShifts}
            onBatchAddShifts={handleBatchAddShifts}
            onAddStaffMember={handleAddStaffMember}
            onUpdateStaffMember={handleUpdateStaffMember}
            onDeleteStaffMember={handleDeleteStaffMember}
            onDeleteMultipleStaffMembers={handleDeleteMultipleStaffMembers}
          />
        )}

        {activeTab === 'perfil' && (
          <ProfileModule
            currentUsername={user?.name || authData.username}
            userEmail={user?.email}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            notificationSettings={notificationSettings}
            onUpdateNotificationSettings={handleUpdateNotificationSettings}
            onCredentialsUpdated={handleCredentialsUpdated}
            showToast={showToast}
            onLogout={logout}
          />
        )}
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          id="app-toast-feedback"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 border border-amber-500/50 text-zinc-100 text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl shadow-black/50 flex items-center gap-2 max-w-xs animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0 font-bold">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
        confirmedGigsCount={confirmedGigsCount}
        overdueBillsCount={overdueBillsCount}
        todayStaffCount={todayStaffCount}
      />

      {/* Drawer de Alterações em Tempo Real */}
      <LiveActivityDrawer
        isOpen={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
        activities={activities}
        isConnected={isConnected}
        totalSyncedCount={totalSyncedCount}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}
