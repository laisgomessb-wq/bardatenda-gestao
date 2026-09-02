import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Product,
  BandGig,
  StaffMember,
  StaffShift,
  BillAccount,
  CashTransaction,
  NotificationSettings,
  ActivityLog,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_GIGS,
  INITIAL_STAFF_MEMBERS,
  INITIAL_SHIFTS,
  INITIAL_BILLS,
  INITIAL_TRANSACTIONS,
} from '../data/mockData';
import { cleanAndDeduplicateProducts } from './storage';

// Firestore Collection Names
export const COLLECTIONS = {
  PRODUCTS: 'products',
  GIGS: 'gigs',
  STAFF_MEMBERS: 'staff_members',
  SHIFTS: 'shifts',
  BILLS: 'bills',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'app_settings',
  ACTIVITIES: 'activities',
} as const;

/**
 * Utilitário para limpar campos `undefined` e garantir que o Firestore não rejeite a escrita
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'id') continue; // O ID fica como identificador do documento
    if (value === undefined) continue; // Remove undefined para evitar erro no Firestore
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeForFirestore(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Testa a conectividade com o Firestore
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDoc = doc(db, COLLECTIONS.SETTINGS, 'ping');
    await setDoc(testDoc, { lastPing: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('Falha de conexão com Firestore:', err);
    return false;
  }
}

/**
 * Inicialização automática: popula o Firestore se for a primeira vez que o banco é aberto
 */
export async function ensureDatabaseInitialized(): Promise<void> {
  try {
    const initRef = doc(db, COLLECTIONS.SETTINGS, 'init');
    const initSnap = await getDoc(initRef);

    const currentVersion = initSnap.data()?.version;

    if (!initSnap.exists() || !initSnap.data()?.initialized || currentVersion !== '4.0') {
      console.log('⚡ Atualizando e sincronizando banco de dados no Firestore (v4.0 - Estoque limpo e sem duplicatas)...');
      
      // Limpeza de produtos duplicados ou antigos na coleção products do Firestore
      try {
        const prodColRef = collection(db, COLLECTIONS.PRODUCTS);
        const prodSnapshot = await getDocs(prodColRef);
        const validInitialIds = new Set(INITIAL_PRODUCTS.map((p) => p.id));
        const seenNames = new Set<string>();

        const prodBatch = writeBatch(db);
        prodSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const normName = (data.name || '').trim().toLowerCase().replace(/\s*\(cópia\)/gi, '');
          // Se for duplicado ou não pertencer aos válidos, remove
          if (seenNames.has(normName) || (!validInitialIds.has(docSnap.id) && data.name?.includes('(Cópia)'))) {
            prodBatch.delete(docSnap.ref);
          } else {
            seenNames.add(normName);
            // Limpa notes e lastRestockedDate
            prodBatch.set(docSnap.ref, {
              ...data,
              notes: '',
              lastRestockedDate: '',
            }, { merge: false });
          }
        });
        await prodBatch.commit();
      } catch (err) {
        console.warn('Aviso na limpeza de duplicados do Firestore:', err);
      }

      const batch = writeBatch(db);

      // Produtos limpos (sem observações e sem datas de reposição)
      INITIAL_PRODUCTS.forEach((p) => {
        const dRef = doc(db, COLLECTIONS.PRODUCTS, p.id);
        const cleanProduct: Record<string, any> = {
          name: p.name,
          category: p.category,
          unit: p.unit,
          currentQuantity: p.currentQuantity,
          minQuantity: p.minQuantity,
          supplier: p.supplier,
          unitPrice: p.unitPrice,
        };
        batch.set(dRef, cleanProduct, { merge: false });
      });

      // Bandas
      INITIAL_GIGS.forEach((g) => {
        const dRef = doc(db, COLLECTIONS.GIGS, g.id);
        batch.set(dRef, sanitizeForFirestore(g), { merge: true });
      });

      // Equipe
      INITIAL_STAFF_MEMBERS.forEach((m) => {
        const dRef = doc(db, COLLECTIONS.STAFF_MEMBERS, m.id);
        batch.set(dRef, sanitizeForFirestore(m), { merge: true });
      });

      // Escalas
      INITIAL_SHIFTS.forEach((s) => {
        const dRef = doc(db, COLLECTIONS.SHIFTS, s.id);
        batch.set(dRef, sanitizeForFirestore(s), { merge: true });
      });

      // Contas
      INITIAL_BILLS.forEach((b) => {
        const dRef = doc(db, COLLECTIONS.BILLS, b.id);
        batch.set(dRef, sanitizeForFirestore(b), { merge: true });
      });

      // Transações de Caixa
      INITIAL_TRANSACTIONS.forEach((t) => {
        const dRef = doc(db, COLLECTIONS.TRANSACTIONS, t.id);
        batch.set(dRef, sanitizeForFirestore(t), { merge: true });
      });

      // Marca como inicializado com versão 4.0
      batch.set(initRef, {
        initialized: true,
        initializedAt: new Date().toISOString(),
        version: '4.0',
      });

      await batch.commit();
      console.log('✅ Banco de dados Firestore sincronizado com sucesso na versão 4.0!');

      await recordActivity({
        module: 'estoque',
        action: 'update',
        description: 'Estoque limpo: observações e datas de reposição zeradas, duplicatas removidas',
        userName: 'Sistema',
      });
    }
  } catch (err) {
    console.error('Erro ao inicializar dados no Firestore:', err);
  }
}

// -------------------------------------------------------------
// REGISTRO DE ATIVIDADES E ALTERAÇÕES EM TEMPO REAL
// -------------------------------------------------------------

export const recordActivity = async (
  activity: Omit<ActivityLog, 'id' | 'timestamp'>
): Promise<void> => {
  try {
    const id = `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const fullActivity: ActivityLog = {
      ...activity,
      id,
      timestamp: new Date().toISOString(),
    };
    const actRef = doc(db, COLLECTIONS.ACTIVITIES, id);
    await setDoc(actRef, sanitizeForFirestore(fullActivity));
  } catch (err) {
    console.warn('Não foi possível gravar log de atividade:', err);
  }
};

export const subscribeToActivities = (
  onData: (activities: ActivityLog[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const colRef = collection(db, COLLECTIONS.ACTIVITIES);
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(30));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<ActivityLog, 'id'>) });
      });
      onData(list);
    },
    (err) => {
      console.error('Erro no ouvinte de atividades:', err);
      onError?.(err);
    }
  );
};

// -------------------------------------------------------------
// 1. LISTENERS EM TEMPO REAL (REAL-TIME SYNC FULL TIME)
// -------------------------------------------------------------

export const subscribeToProducts = (
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const colRef = collection(db, COLLECTIONS.PRODUCTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
      });
      const cleaned = cleanAndDeduplicateProducts(list);
      onData(cleaned);
    },
    (err) => {
      console.error('Erro na sincronização de produtos:', err);
      onError?.(err);
    }
  );
};

export const subscribeToGigs = (
  onData: (gigs: BandGig[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const colRef = collection(db, COLLECTIONS.GIGS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: BandGig[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<BandGig, 'id'>) });
      });
      onData(list);
    },
    (err) => {
      console.error('Erro na sincronização de bandas:', err);
      onError?.(err);
    }
  );
};

export const subscribeToStaffMembers = (
  onData: (members: StaffMember[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const colRef = collection(db, COLLECTIONS.STAFF_MEMBERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: StaffMember[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<StaffMember, 'id'>) });
      });
      onData(list);
    },
    (err) => {
      console.error('Erro na sincronização de equipe:', err);
      onError?.(err);
    }
  );
};

export const subscribeToShifts = (
  onData: (shifts: StaffShift[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const colRef = collection(db, COLLECTIONS.SHIFTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: StaffShift[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<StaffShift, 'id'>) });
      });
      onData(list);
    },
    (err) => {
      console.error('Erro na sincronização de escalas:', err);
      onError?.(err);
    }
  );
};

export const subscribeToBills = (
  onData: (bills: BillAccount[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const colRef = collection(db, COLLECTIONS.BILLS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: BillAccount[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<BillAccount, 'id'>) });
      });
      onData(list);
    },
    (err) => {
      console.error('Erro na sincronização de contas:', err);
      onError?.(err);
    }
  );
};

export const subscribeToTransactions = (
  onData: (transactions: CashTransaction[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const colRef = collection(db, COLLECTIONS.TRANSACTIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: CashTransaction[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<CashTransaction, 'id'>) });
      });
      onData(list);
    },
    (err) => {
      console.error('Erro na sincronização de transações:', err);
      onError?.(err);
    }
  );
};

export const subscribeToSettings = (
  onData: (settings: { notifications?: NotificationSettings; authUser?: string; authPass?: string }) => void
): Unsubscribe => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'general');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data());
      }
    },
    (err) => {
      console.error('Erro na sincronização de configurações:', err);
    }
  );
};

// -------------------------------------------------------------
// 2. OPERAÇÕES DE ESCRITA (PERSISTÊNCIA & PROPAGAÇÃO INSTANTÂNEA)
// -------------------------------------------------------------

// --- PRODUTOS (ESTOQUE) ---
export const saveProductToFirestore = async (product: Product, userName?: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
  const data = sanitizeForFirestore(product);
  await setDoc(docRef, data, { merge: true });
  await recordActivity({
    module: 'estoque',
    action: 'update',
    description: `Produto "${product.name}" salvo no estoque (${product.currentQuantity} ${product.unit})`,
    userName,
  });
};

export const deleteProductFromFirestore = async (productId: string, productName?: string, userName?: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  await recordActivity({
    module: 'estoque',
    action: 'delete',
    description: productName ? `Produto "${productName}" removido` : `Produto ${productId} removido`,
    userName,
  });
};

export const deleteMultipleProductsFromFirestore = async (productIds: string[], count?: number, userName?: string): Promise<void> => {
  const batch = writeBatch(db);
  productIds.forEach((id) => {
    batch.delete(doc(db, COLLECTIONS.PRODUCTS, id));
  });
  await batch.commit();
  await recordActivity({
    module: 'estoque',
    action: 'delete',
    description: `${count || productIds.length} produtos excluídos do estoque`,
    userName,
  });
};

// --- BANDAS (AGENDA DE SHOWS) ---
export const saveGigToFirestore = async (gig: BandGig, userName?: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.GIGS, gig.id);
  const data = sanitizeForFirestore(gig);
  await setDoc(docRef, data, { merge: true });
  await recordActivity({
    module: 'bandas',
    action: 'update',
    description: `Show "${gig.bandName}" em ${gig.date} atualizado/agendado`,
    userName,
  });
};

export const deleteGigFromFirestore = async (gigId: string, bandName?: string, userName?: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.GIGS, gigId));
  await recordActivity({
    module: 'bandas',
    action: 'delete',
    description: bandName ? `Show "${bandName}" removido da agenda` : `Show ${gigId} removido`,
    userName,
  });
};

export const deleteMultipleGigsFromFirestore = async (gigIds: string[], count?: number, userName?: string): Promise<void> => {
  const batch = writeBatch(db);
  gigIds.forEach((id) => {
    batch.delete(doc(db, COLLECTIONS.GIGS, id));
  });
  await batch.commit();
  await recordActivity({
    module: 'bandas',
    action: 'delete',
    description: `${count || gigIds.length} apresentações removidas da agenda`,
    userName,
  });
};

// --- FUNCIONÁRIOS (EQUIPE) ---
export const saveStaffMemberToFirestore = async (member: StaffMember, userName?: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.STAFF_MEMBERS, member.id);
  const data = sanitizeForFirestore(member);
  await setDoc(docRef, data, { merge: true });
  await recordActivity({
    module: 'equipe',
    action: 'update',
    description: `Colaborador(a) "${member.name}" atualizado(a)`,
    userName,
  });
};

export const deleteStaffMemberFromFirestore = async (memberId: string, memberName?: string, userName?: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.STAFF_MEMBERS, memberId));
  await recordActivity({
    module: 'equipe',
    action: 'delete',
    description: memberName ? `Colaborador(a) "${memberName}" removido(a)` : `Colaborador ${memberId} removido`,
    userName,
  });
};

export const deleteMultipleStaffMembersFromFirestore = async (memberIds: string[], count?: number, userName?: string): Promise<void> => {
  const batch = writeBatch(db);
  memberIds.forEach((id) => {
    batch.delete(doc(db, COLLECTIONS.STAFF_MEMBERS, id));
  });
  await batch.commit();
  await recordActivity({
    module: 'equipe',
    action: 'delete',
    description: `${count || memberIds.length} colaboradores removidos`,
    userName,
  });
};

// --- ESCALAS DIÁRIAS (PLANNER) ---
export const saveShiftToFirestore = async (shift: StaffShift, userName?: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.SHIFTS, shift.id);
  const data = sanitizeForFirestore(shift);
  await setDoc(docRef, data, { merge: true });
  await recordActivity({
    module: 'equipe',
    action: 'update',
    description: `Escala de "${shift.name}" (${shift.role}) para ${shift.date} salva`,
    userName,
  });
};

export const saveMultipleShiftsToFirestore = async (newShifts: StaffShift[], userName?: string): Promise<void> => {
  const batch = writeBatch(db);
  newShifts.forEach((shift) => {
    const docRef = doc(db, COLLECTIONS.SHIFTS, shift.id);
    const data = sanitizeForFirestore(shift);
    batch.set(docRef, data, { merge: true });
  });
  await batch.commit();
  await recordActivity({
    module: 'equipe',
    action: 'update',
    description: `${newShifts.length} plantões salvos na escala`,
    userName,
  });
};

export const deleteShiftFromFirestore = async (shiftId: string, shiftName?: string, userName?: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.SHIFTS, shiftId));
  await recordActivity({
    module: 'equipe',
    action: 'delete',
    description: shiftName ? `Escala de "${shiftName}" removida` : `Item de escala removido`,
    userName,
  });
};

export const deleteMultipleShiftsFromFirestore = async (shiftIds: string[], count?: number, userName?: string): Promise<void> => {
  const batch = writeBatch(db);
  shiftIds.forEach((id) => {
    batch.delete(doc(db, COLLECTIONS.SHIFTS, id));
  });
  await batch.commit();
  await recordActivity({
    module: 'equipe',
    action: 'delete',
    description: `${count || shiftIds.length} plantões removidos da escala`,
    userName,
  });
};

// --- CONTAS A PAGAR / RECEBER ---
export const saveBillToFirestore = async (bill: BillAccount, userName?: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.BILLS, bill.id);
  const data = sanitizeForFirestore(bill);
  await setDoc(docRef, data, { merge: true });
  await recordActivity({
    module: 'contas',
    action: bill.status === 'pago' ? 'pay' : 'update',
    description: `Conta "${bill.description}" (${bill.type === 'a_pagar' ? 'A Pagar' : 'A Receber'}) salva - Status: ${bill.status}`,
    userName,
  });
};

export const deleteBillFromFirestore = async (billId: string, billDesc?: string, userName?: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.BILLS, billId));
  await recordActivity({
    module: 'contas',
    action: 'delete',
    description: billDesc ? `Conta "${billDesc}" removida` : `Conta removida`,
    userName,
  });
};

export const deleteMultipleBillsFromFirestore = async (billIds: string[], count?: number, userName?: string): Promise<void> => {
  const batch = writeBatch(db);
  billIds.forEach((id) => {
    batch.delete(doc(db, COLLECTIONS.BILLS, id));
  });
  await batch.commit();
  await recordActivity({
    module: 'contas',
    action: 'delete',
    description: `${count || billIds.length} contas excluídas`,
    userName,
  });
};

export const clearAllBillsInFirestore = async (userName?: string): Promise<void> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.BILLS));
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await recordActivity({
    module: 'contas',
    action: 'clear',
    description: `Todas as contas foram limpas do sistema`,
    userName,
  });
};

// --- FLUXO DE CAIXA (TRANSAÇÕES) ---
export const saveTransactionToFirestore = async (transaction: CashTransaction, userName?: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.TRANSACTIONS, transaction.id);
  const data = sanitizeForFirestore(transaction);
  await setDoc(docRef, data, { merge: true });
  await recordActivity({
    module: 'financeiro',
    action: 'update',
    description: `Lançamento "${transaction.description}" (R$ ${transaction.amount.toFixed(2)}) registrado`,
    userName,
  });
};

export const deleteTransactionFromFirestore = async (transactionId: string, txDesc?: string, userName?: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.TRANSACTIONS, transactionId));
  await recordActivity({
    module: 'financeiro',
    action: 'delete',
    description: txDesc ? `Lançamento "${txDesc}" removido` : `Lançamento removido`,
    userName,
  });
};

export const deleteMultipleTransactionsFromFirestore = async (txIds: string[], count?: number, userName?: string): Promise<void> => {
  const batch = writeBatch(db);
  txIds.forEach((id) => {
    batch.delete(doc(db, COLLECTIONS.TRANSACTIONS, id));
  });
  await batch.commit();
  await recordActivity({
    module: 'financeiro',
    action: 'delete',
    description: `${count || txIds.length} lançamentos excluídos do caixa`,
    userName,
  });
};

export const clearAllTransactionsInFirestore = async (userName?: string): Promise<void> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await recordActivity({
    module: 'financeiro',
    action: 'clear',
    description: `Todas as atividades do caixa foram limpas`,
    userName,
  });
};

// --- CONFIGURAÇÕES & CREDENCIAIS COMPARTILHADAS ---
export const saveSettingsToFirestore = async (
  settings: Partial<{ notifications: NotificationSettings; authUser: string; authPass: string }>,
  userName?: string
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'general');
  await setDoc(docRef, sanitizeForFirestore(settings), { merge: true });
  await recordActivity({
    module: 'config',
    action: 'update',
    description: `Configurações globais atualizadas`,
    userName,
  });
};

// --- RESET GLOBAL NO FIRESTORE ---
export const resetAllDataInFirestore = async (userName?: string): Promise<void> => {
  await clearCollection(COLLECTIONS.PRODUCTS);
  await seedCollection(COLLECTIONS.PRODUCTS, INITIAL_PRODUCTS);

  await clearCollection(COLLECTIONS.GIGS);
  await seedCollection(COLLECTIONS.GIGS, INITIAL_GIGS);

  await clearCollection(COLLECTIONS.STAFF_MEMBERS);
  await seedCollection(COLLECTIONS.STAFF_MEMBERS, INITIAL_STAFF_MEMBERS);

  await clearCollection(COLLECTIONS.SHIFTS);
  await seedCollection(COLLECTIONS.SHIFTS, INITIAL_SHIFTS);

  await clearCollection(COLLECTIONS.BILLS);
  await seedCollection(COLLECTIONS.BILLS, INITIAL_BILLS);

  await clearCollection(COLLECTIONS.TRANSACTIONS);
  await seedCollection(COLLECTIONS.TRANSACTIONS, INITIAL_TRANSACTIONS);

  await recordActivity({
    module: 'config',
    action: 'clear',
    description: `Dados de exemplo restaurados no sistema`,
    userName,
  });
};

// Helpers internos para seed e limpeza
async function seedCollection<T extends { id: string }>(collectionName: string, items: T[]) {
  if (items.length === 0) return;
  const batch = writeBatch(db);
  items.forEach((item) => {
    const docRef = doc(db, collectionName, item.id);
    const data = sanitizeForFirestore(item);
    batch.set(docRef, data, { merge: true });
  });
  await batch.commit();
}

async function clearCollection(collectionName: string) {
  const snapshot = await getDocs(collection(db, collectionName));
  if (snapshot.empty) return;
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
