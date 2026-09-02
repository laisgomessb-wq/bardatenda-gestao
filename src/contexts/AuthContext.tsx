import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserRole } from '../types';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  loginTime?: string;
}

export interface AuthContextData {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  signed: boolean;
  loading: boolean;
  role: UserRole;
  isCriador: boolean;
  isDono: boolean;
  isAdministrador: boolean;
  canAccessFinance: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const STORAGE_USER_KEY = '@BarDaTenda:user';

/**
 * Normaliza o valor da role para um dos três perfis oficiais do sistema:
 * - 'criador' (acesso total)
 * - 'dono' (acesso total)
 * - 'administrador' (apenas Banda, Estoque e Equipe; sem Contas e Caixa)
 */
export function sanitizeRole(rawRole: any): UserRole {
  if (!rawRole) return 'administrador';
  const str = String(rawRole).toLowerCase().trim();
  if (str === 'criador' || str === 'creator') return 'criador';
  if (str === 'dono' || str === 'owner') return 'dono';
  return 'administrador';
}

/**
 * Busca dados adicionais do usuário na coleção 'users' do Firestore
 * para identificar a propriedade 'role' ('criador', 'dono' ou 'administrador').
 */
export async function fetchUserRoleAndProfile(
  uid: string,
  email?: string | null
): Promise<{ role: UserRole; name?: string }> {
  try {
    // 1. Busca prioritária pelo UID: doc /users/{uid}
    if (uid) {
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          role: sanitizeRole(data.role),
          name: data.name || data.displayName,
        };
      }
    }

    // 2. Busca secundária por e-mail na coleção 'users'
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const data = querySnap.docs[0].data();
        return {
          role: sanitizeRole(data.role),
          name: data.name || data.displayName,
        };
      }
    }
  } catch (error) {
    console.warn('Aviso: Não foi possível buscar perfil do usuário no Firestore:', error);
  }

  // Padrão de segurança estrito: 'administrador'
  return { role: 'administrador' };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          role: sanitizeRole(parsed.role),
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega e atualiza dados do Firestore para o usuário autenticado
  const syncUserDataFromFirestore = useCallback(async (fbUser: FirebaseUser) => {
    const formattedName =
      fbUser.displayName ||
      (fbUser.email
        ? fbUser.email.split('@')[0].charAt(0).toUpperCase() +
          fbUser.email.split('@')[0].slice(1).replace(/[._-]/g, ' ')
        : 'Gestor Bar da Tenda');

    // Busca permissões no Firestore na coleção 'users'
    const firestoreData = await fetchUserRoleAndProfile(fbUser.uid, fbUser.email);

    const authenticatedUser: User = {
      uid: fbUser.uid,
      email: fbUser.email || '',
      name: firestoreData.name || formattedName,
      role: firestoreData.role,
      avatar: fbUser.photoURL || undefined,
      loginTime: new Date().toISOString(),
    };

    setUser(authenticatedUser);
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authenticatedUser));
      localStorage.setItem('bardatenda_auth_user', authenticatedUser.name);
      localStorage.setItem('bardatenda_user_role', authenticatedUser.role);
      localStorage.setItem('bardatenda_is_authenticated', 'true');
    } catch (e) {
      console.error('Erro ao gravar sessão no localStorage:', e);
    }
    return authenticatedUser;
  }, []);

  useEffect(() => {
    // Timeout defensivo para garantir que a interface nunca fique travada em tela branca/carregando
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 1500);

    // Listener oficial do Firebase Authentication
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        clearTimeout(safetyTimeout);
        if (fbUser) {
          setFirebaseUser(fbUser);
          try {
            await syncUserDataFromFirestore(fbUser);
          } catch (e) {
            console.error('Erro ao sincronizar usuário do Firebase:', e);
          }
        } else {
          setFirebaseUser(null);
          // Só limpa o usuário do storage se não houver sessão local válida
          try {
            const hasLocalAuth = localStorage.getItem('bardatenda_is_authenticated');
            if (!hasLocalAuth) {
              setUser(null);
              localStorage.removeItem(STORAGE_USER_KEY);
              localStorage.removeItem('@BarDaTenda:token');
              localStorage.removeItem('bardatenda_user_role');
            }
          } catch (e) {
            console.error('Erro ao gerenciar sessão no localStorage:', e);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Erro no listener de autenticação do Firebase:', error);
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [syncUserDataFromFirestore]);

  const refreshUserData = async () => {
    if (firebaseUser) {
      await syncUserDataFromFirestore(firebaseUser);
    }
  };

  const login = async (email: string, password = ''): Promise<{ success: boolean; message?: string }> => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      return { success: false, message: 'Por favor, informe seu e-mail de acesso.' };
    }

    if (!trimmedPassword) {
      return { success: false, message: 'Por favor, digite sua senha de acesso.' };
    }

    try {
      // 1. Autenticação direta e real com o Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const fbUser = userCredential.user;

      setFirebaseUser(fbUser);

      // 2. Busca na coleção 'users' para recuperar a propriedade 'role' ('criador', 'dono', 'administrador')
      const authenticatedUser = await syncUserDataFromFirestore(fbUser);

      return { success: true };
    } catch (err: any) {
      console.error('Erro ao autenticar no Firebase Auth:', err);
      let errorMsg = 'Falha ao autenticar. Verifique suas credenciais.';

      switch (err?.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          errorMsg = 'E-mail ou senha incorretos no Firebase. Verifique suas credenciais.';
          break;
        case 'auth/invalid-email':
          errorMsg = 'Formato de e-mail inválido.';
          break;
        case 'auth/user-disabled':
          errorMsg = 'Este usuário foi desativado no Firebase Authentication.';
          break;
        case 'auth/too-many-requests':
          errorMsg = 'Muitas tentativas sem sucesso. Tente novamente em alguns minutos.';
          break;
        case 'auth/network-request-failed':
          errorMsg = 'Falha de conexão com a rede/Firebase. Verifique sua internet.';
          break;
        default:
          if (err?.message) {
            errorMsg = `Erro no Firebase: ${err.message}`;
          }
          break;
      }

      return { success: false, message: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao deslogar no Firebase:', error);
    } finally {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem('@BarDaTenda:token');
      localStorage.removeItem('bardatenda_user_role');
      localStorage.removeItem('bardatenda_is_authenticated');
      setUser(null);
      setFirebaseUser(null);
    }
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    if (data.role) {
      updated.role = sanitizeRole(data.role);
    }
    setUser(updated);
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
      if (updated.name) {
        localStorage.setItem('bardatenda_auth_user', updated.name);
      }
      if (updated.role) {
        localStorage.setItem('bardatenda_user_role', updated.role);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil do usuário:', error);
    }
  };

  const currentRole: UserRole = user?.role ? sanitizeRole(user.role) : 'administrador';
  const isCriador = currentRole === 'criador';
  const isDono = currentRole === 'dono';
  const isAdministrador = currentRole === 'administrador';
  const canAccessFinance = isCriador || isDono;

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        signed: !!user,
        loading,
        role: currentRole,
        isCriador,
        isDono,
        isAdministrador,
        canAccessFinance,
        login,
        logout,
        updateUserProfile,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;
