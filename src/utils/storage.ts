import { Product, BandGig, StaffMember, StaffShift, BillAccount, CashTransaction } from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_GIGS,
  INITIAL_STAFF_MEMBERS,
  INITIAL_SHIFTS,
  INITIAL_BILLS,
  INITIAL_TRANSACTIONS,
} from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'bardatenda_products_v8',
  GIGS: 'bardatenda_gigs_v6',
  STAFF_MEMBERS: 'bardatenda_staff_members_v6',
  SHIFTS: 'bardatenda_shifts_v6',
  BILLS: 'bardatenda_bills_v6',
  TRANSACTIONS: 'bardatenda_transactions_v6',
};

// Helper para remover duplicados e manter histórico de compras
export const cleanAndDeduplicateProducts = (productsList: Product[]): Product[] => {
  const seenNames = new Set<string>();
  const uniqueProducts: Product[] = [];

  for (const prod of productsList) {
    const normName = prod.name.trim().toLowerCase().replace(/\s*\(cópia\)/gi, '');
    if (!seenNames.has(normName)) {
      seenNames.add(normName);
      
      // Garante que o produto tenha seu histórico preservado
      const history = Array.isArray(prod.purchaseHistory) ? prod.purchaseHistory : [];

      uniqueProducts.push({
        ...prod,
        purchaseHistory: history,
      });
    }
  }

  return uniqueProducts;
};

export const loadProducts = (): Product[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return cleanAndDeduplicateProducts(parsed);
      }
    }
  } catch (e) {
    console.error('Erro ao carregar produtos:', e);
  }
  return INITIAL_PRODUCTS;
};

export const saveProducts = (products: Product[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Erro ao salvar produtos:', e);
  }
};

export const loadGigs = (): BandGig[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GIGS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao carregar agenda de bandas:', e);
  }
  return INITIAL_GIGS;
};

export const saveGigs = (gigs: BandGig[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.GIGS, JSON.stringify(gigs));
  } catch (e) {
    console.error('Erro ao salvar agenda de bandas:', e);
  }
};

export const loadStaffMembers = (): StaffMember[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF_MEMBERS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao carregar funcionários cadastrados:', e);
  }
  return INITIAL_STAFF_MEMBERS;
};

export const saveStaffMembers = (members: StaffMember[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STAFF_MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Erro ao salvar funcionários cadastrados:', e);
  }
};

export const loadShifts = (): StaffShift[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao carregar escala de equipe:', e);
  }
  return INITIAL_SHIFTS;
};

export const saveShifts = (shifts: StaffShift[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  } catch (e) {
    console.error('Erro ao salvar escala de equipe:', e);
  }
};

export const loadBills = (): BillAccount[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao carregar contas a pagar/receber:', e);
  }
  return INITIAL_BILLS;
};

export const saveBills = (bills: BillAccount[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  } catch (e) {
    console.error('Erro ao salvar contas a pagar/receber:', e);
  }
};

export const loadTransactions = (): CashTransaction[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao carregar vendas e despesas:', e);
  }
  return INITIAL_TRANSACTIONS;
};

export const saveTransactions = (transactions: CashTransaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Erro ao salvar vendas e despesas:', e);
  }
};

export const clearBills = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
  } catch (e) {
    console.error('Erro ao limpar contas:', e);
  }
};

export const clearTransactions = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  } catch (e) {
    console.error('Erro ao limpar vendas e despesas:', e);
  }
};

export const resetAllData = (): {
  products: Product[];
  gigs: BandGig[];
  staffMembers: StaffMember[];
  shifts: StaffShift[];
  bills: BillAccount[];
  transactions: CashTransaction[];
} => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.GIGS, JSON.stringify(INITIAL_GIGS));
    localStorage.setItem(STORAGE_KEYS.STAFF_MEMBERS, JSON.stringify(INITIAL_STAFF_MEMBERS));
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(INITIAL_SHIFTS));
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(INITIAL_BILLS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
  } catch (e) {
    console.error('Erro ao resetar dados:', e);
  }
  return {
    products: INITIAL_PRODUCTS,
    gigs: INITIAL_GIGS,
    staffMembers: INITIAL_STAFF_MEMBERS,
    shifts: INITIAL_SHIFTS,
    bills: INITIAL_BILLS,
    transactions: INITIAL_TRANSACTIONS,
  };
};

// 7. Configurações de Notificações
export const DEFAULT_NOTIFICATION_SETTINGS: {
  mobileNotifications: boolean;
  lowStockAlert: boolean;
  dueBillsAlert: boolean;
  overdueBillsAlert: boolean;
  advanceDaysWarning: number;
} = {
  mobileNotifications: true,
  lowStockAlert: true,
  dueBillsAlert: true,
  overdueBillsAlert: true,
  advanceDaysWarning: 2,
};

export const loadNotificationSettings = () => {
  try {
    const saved = localStorage.getItem('bardatenda_notification_settings');
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Erro ao carregar configurações de notificações:', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
};

export const saveNotificationSettings = (settings: typeof DEFAULT_NOTIFICATION_SETTINGS) => {
  try {
    localStorage.setItem('bardatenda_notification_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Erro ao salvar configurações de notificações:', e);
  }
};

// 8. Perfil e Identificação de Acesso Aberto
export const DEFAULT_AUTH = {
  username: 'Equipe Bar da Tenda',
  password: '',
};

export const loadAuth = () => {
  try {
    const savedUser = localStorage.getItem('bardatenda_auth_user') || DEFAULT_AUTH.username;
    return {
      username: savedUser,
      password: '',
      isAuthenticated: true,
    };
  } catch (e) {
    console.error('Erro ao carregar perfil:', e);
    return { ...DEFAULT_AUTH, isAuthenticated: true };
  }
};

export const saveAuthSession = (_isAuthenticated: boolean) => {
  try {
    localStorage.setItem('bardatenda_is_authenticated', 'true');
  } catch (e) {
    console.error('Erro ao salvar sessão:', e);
  }
};

export const updateCredentials = (newUsername?: string, _newPassword?: string) => {
  try {
    if (newUsername) localStorage.setItem('bardatenda_auth_user', newUsername);
    return true;
  } catch (e) {
    console.error('Erro ao atualizar usuário:', e);
    return false;
  }
};

// 9. Tema (Modo Escuro / Claro)
export const loadTheme = (): 'dark' | 'light' => {
  try {
    const saved = localStorage.getItem('bardatenda_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (e) {
    console.error('Erro ao carregar tema:', e);
  }
  return 'dark';
};

export const saveTheme = (theme: 'dark' | 'light') => {
  try {
    localStorage.setItem('bardatenda_theme', theme);
  } catch (e) {
    console.error('Erro ao salvar tema:', e);
  }
};

