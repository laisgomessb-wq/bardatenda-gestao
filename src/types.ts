export type ProductCategory = 
  | 'bebidas' 
  | 'descartaveis' 
  | 'comida';

export interface PurchaseRecord {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  quantity: number; // Quantidade comprada / reposta
  unitPrice: number; // Preço unitário em R$
  totalPrice?: number; // Valor total da compra em R$
  supplier?: string; // Fornecedor da compra
  invoiceNumber?: string; // Número da NF ou identificação do registro
  notes?: string; // Observações da compra
  createdAt?: string; // Timestamp de criação
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string; // UN, CX, PCT, UNID, KG, G, garrafa, etc.
  currentQuantity: number;
  minQuantity: number;
  supplier: string;
  unitPrice: number; // Preço de compra em R$
  lastRestockedDate?: string; // ISO date string (YYYY-MM-DD)
  notes?: string;
  purchaseHistory?: PurchaseRecord[]; // Histórico real de preços e compras
}

export type GigStatus = 'confirmada' | 'em_negociacao' | 'cancelada';

export interface BandGig {
  id: string;
  bandName: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  cacheValue?: number; // R$
  contact?: string; // Telefone / WhatsApp / Nome do produtor
  status: GigStatus;
  musicalStyle?: string; // Opcional / Legado
  notes?: string;
}

export type StaffRole = 
  | 'cozinha' 
  | 'gerente' 
  | 'garcom' 
  | 'atendente' 
  | 'motoqueiro' 
  | 'outros';

export type ShiftStatus = 'confirmado' | 'faltou' | 'folga';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone?: string;
  defaultDailyPay: number;
  active: boolean;
  notes?: string;
}

export interface StaffShift {
  id: string;
  staffMemberId?: string;
  name: string;
  role: StaffRole;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (opcional)
  endTime?: string; // HH:mm (opcional)
  status: ShiftStatus;
  dailyPay: number; // R$
  notes?: string;
}

// 3. Contas a Pagar / Receber
export type BillType = 'a_pagar' | 'a_receber';

export type BillStatus = 'pago' | 'pendente' | 'atrasado';

export type BillCategory = 
  | 'fornecedor' 
  | 'aluguel' 
  | 'energia' 
  | 'agua' 
  | 'internet' 
  | 'impostos' 
  | 'patrocinio' 
  | 'outros';

export type BillPaymentMethod = 
  | 'dinheiro' 
  | 'pix' 
  | 'boleto' 
  | 'cartao_credito' 
  | 'cartao_debito' 
  | 'transferencia';

export interface BillAccount {
  id: string;
  description: string;
  type: BillType;
  amount: number; // R$
  dueDate: string; // YYYY-MM-DD
  status: BillStatus;
  category: BillCategory;
  paymentMethod: BillPaymentMethod;
  paymentDate?: string; // YYYY-MM-DD
  notes?: string;
}

// 4. Vendas e Despesas (Fluxo de Caixa)
export type CashTransactionType = 'venda' | 'despesa';

export type SaleCategory = 'vendas_geral' | 'bar' | 'comida' | 'couvert' | 'outros';
export type ExpenseCategory = 'fornecedor' | 'manutencao' | 'salario' | 'energia' | 'insumos' | 'outros';

export type CashPaymentMethod = 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix';

export type CashTransactionStatus = 'concluido' | 'pendente';

export interface CashTransaction {
  id: string;
  type: CashTransactionType;
  description: string;
  amount: number; // R$
  date: string; // YYYY-MM-DD
  category: string; // SaleCategory | ExpenseCategory
  paymentMethod: CashPaymentMethod;
  status: CashTransactionStatus;
  notes?: string;
}

export type UserRole = 'criador' | 'dono' | 'administrador';

export type ActiveTab = 'dashboard' | 'estoque' | 'bandas' | 'contas' | 'financeiro' | 'equipe' | 'perfil' | 'usuarios';

export interface NotificationSettings {
  mobileNotifications: boolean;
  lowStockAlert: boolean;
  dueBillsAlert: boolean;
  overdueBillsAlert: boolean;
  advanceDaysWarning: number;
}

export interface UserAuth {
  username: string;
  passwordHash: string;
  isLoggedIn: boolean;
  role?: UserRole;
}

export interface ActivityLog {
  id: string;
  module: 'estoque' | 'bandas' | 'contas' | 'financeiro' | 'equipe' | 'config';
  action: 'create' | 'update' | 'delete' | 'restock' | 'pay' | 'duplicate' | 'clear';
  description: string;
  timestamp: string;
  userName?: string;
}

