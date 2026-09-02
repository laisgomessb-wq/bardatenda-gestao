import {
  ProductCategory,
  GigStatus,
  StaffRole,
  ShiftStatus,
  BillType,
  BillStatus,
  BillCategory,
  BillPaymentMethod,
  CashTransactionType,
  CashPaymentMethod,
  CashTransactionStatus,
} from '../types';

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const getTodayISO = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDayOfWeekBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
};

export const formatMonthYearBR = (year: number, month: number): string => {
  const date = new Date(year, month, 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  bebidas: 'Bebidas',
  descartaveis: 'Descartáveis',
  comida: 'Comida',
};

export const CATEGORY_COLORS: Record<ProductCategory, { bg: string; text: string; border: string }> = {
  bebidas: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-700/50' },
  descartaveis: { bg: 'bg-zinc-800/60', text: 'text-zinc-300', border: 'border-zinc-700/50' },
  comida: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-700/50' },
};

export const GIG_STATUS_LABELS: Record<GigStatus, string> = {
  confirmada: 'Confirmada',
  em_negociacao: 'Em negociação',
  cancelada: 'Cancelada',
};

export const GIG_STATUS_CONFIG: Record<GigStatus, { bg: string; text: string; border: string; dot: string }> = {
  confirmada: {
    bg: 'bg-emerald-950/50',
    text: 'text-emerald-300',
    border: 'border-emerald-700/60',
    dot: 'bg-emerald-400',
  },
  em_negociacao: {
    bg: 'bg-amber-950/50',
    text: 'text-amber-300',
    border: 'border-amber-700/60',
    dot: 'bg-amber-400',
  },
  cancelada: {
    bg: 'bg-rose-950/50',
    text: 'text-rose-300',
    border: 'border-rose-700/60',
    dot: 'bg-rose-500',
  },
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  cozinha: 'Cozinha',
  gerente: 'Gerente',
  garcom: 'Garçom',
  atendente: 'Atendente',
  motoqueiro: 'Motoqueiro',
  outros: 'Outros',
};

export const ROLE_BADGE_STYLE: Record<StaffRole, string> = {
  cozinha: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  gerente: 'bg-purple-950/60 text-purple-300 border-purple-800/50',
  garcom: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
  atendente: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
  motoqueiro: 'bg-orange-950/60 text-orange-300 border-orange-800/50',
  outros: 'bg-slate-800 text-slate-300 border-slate-700',
};

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  confirmado: 'Confirmado',
  faltou: 'Faltou',
  folga: 'Folga',
};

export const SHIFT_STATUS_CONFIG: Record<ShiftStatus, { bg: string; text: string; border: string }> = {
  confirmado: {
    bg: 'bg-emerald-950/50',
    text: 'text-emerald-300',
    border: 'border-emerald-700/60',
  },
  faltou: {
    bg: 'bg-rose-950/50',
    text: 'text-rose-300',
    border: 'border-rose-700/60',
  },
  folga: {
    bg: 'bg-zinc-800/60',
    text: 'text-zinc-400',
    border: 'border-zinc-700/60',
  },
};

// 3. Contas a Pagar / Receber Formatters
export const BILL_TYPE_LABELS: Record<BillType, string> = {
  a_pagar: 'A Pagar',
  a_receber: 'A Receber',
};

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  pago: 'Pago / Recebido',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
};

export const BILL_STATUS_CONFIG: Record<BillStatus, { bg: string; text: string; border: string }> = {
  pago: {
    bg: 'bg-emerald-950/50',
    text: 'text-emerald-300',
    border: 'border-emerald-700/60',
  },
  pendente: {
    bg: 'bg-amber-950/50',
    text: 'text-amber-300',
    border: 'border-amber-700/60',
  },
  atrasado: {
    bg: 'bg-rose-950/50',
    text: 'text-rose-300',
    border: 'border-rose-700/60',
  },
};

export const BILL_CATEGORY_LABELS: Record<BillCategory, string> = {
  fornecedor: 'Fornecedor',
  aluguel: 'Aluguel',
  energia: 'Energia Elétrica',
  agua: 'Água e Esgoto',
  internet: 'Internet & Telefonia',
  impostos: 'Impostos & Taxas',
  patrocinio: 'Patrocínio / Entrada',
  outros: 'Outros',
};

export const BILL_CATEGORY_COLORS: Record<BillCategory, string> = {
  fornecedor: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
  aluguel: 'text-rose-400 bg-rose-950/40 border-rose-800/40',
  energia: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/40',
  agua: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
  internet: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
  impostos: 'text-purple-400 bg-purple-950/40 border-purple-800/40',
  patrocinio: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
  outros: 'text-zinc-300 bg-zinc-800/60 border-zinc-700/40',
};

export const BILL_PAYMENT_METHOD_LABELS: Record<BillPaymentMethod, string> = {
  pix: 'PIX',
  boleto: 'Boleto Bancário',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência Bancária',
};

export const calculateBillEffectiveStatus = (
  dueDate: string,
  status: BillStatus,
  todayStr: string = getTodayISO()
): BillStatus => {
  if (status === 'pago') return 'pago';
  if (dueDate < todayStr) return 'atrasado';
  return 'pendente';
};

// 4. Vendas e Despesas Formatters
export const CASH_TYPE_LABELS: Record<CashTransactionType, string> = {
  venda: 'Venda / Entrada',
  despesa: 'Despesa / Saída',
};

export const CASH_PAYMENT_METHOD_LABELS: Record<CashPaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito',
  pix: 'PIX',
};

export const CASH_STATUS_LABELS: Record<CashTransactionStatus, string> = {
  concluido: 'Concluído',
  pendente: 'Pendente',
};

export const SALE_CATEGORY_LABELS: Record<string, string> = {
  vendas_geral: 'Vendas Geral',
  bar: 'Bar (Bebidas)',
  comida: 'Cozinha (Comidas & Porções)',
  couvert: 'Couvert Artístico',
  outros: 'Outras Vendas',
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  fornecedor: 'Fornecedor de Bebidas/Alimentos',
  manutencao: 'Manutenção e Equipamentos',
  salario: 'Diárias e Salários',
  energia: 'Contas (Energia, Água, Net)',
  insumos: 'Insumos e Descartáveis',
  outros: 'Outras Despesas',
};

