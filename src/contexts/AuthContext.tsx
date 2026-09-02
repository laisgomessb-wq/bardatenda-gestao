import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../services/firebase';

export interface User {
  uid: string;
  email: string;
  name: string;
  role?: string;
  avatar?: string;
  loginTime?: string;
}

export interface AuthContextData {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  signed: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const STORAGE_USER_KEY = '@BarDaTenda:user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener oficial do Firebase Authentication
    const unsubscribe = onAuthStateChanged(
      auth,
      (fbUser) => {
        if (fbUser) {
          setFirebaseUser(fbUser);
          const formattedName =
            fbUser.displayName ||
            (fbUser.email
              ? fbUser.email.split('@')[0].charAt(0).toUpperCase() +
                fbUser.email.split('@')[0].slice(1).replace(/[._-]/g, ' ')
              : 'Gestor Bar da Tenda');

          const authenticatedUser: User = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: formattedName,
            role: 'Administrador / Gestor',
            avatar: fbUser.photoURL || undefined,
            loginTime: new Date().toISOString(),
          };

          setUser(authenticatedUser);
          try {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authenticatedUser));
            localStorage.setItem('bardatenda_auth_user', authenticatedUser.name);
            localStorage.setItem('bardatenda_is_authenticated', 'true');
          } catch (e) {
            console.error('Erro ao gravar sessão no localStorage:', e);
          }
        } else {
          setFirebaseUser(null);
          setUser(null);
          try {
            localStorage.removeItem(STORAGE_USER_KEY);
            localStorage.removeItem('@BarDaTenda:token');
            localStorage.removeItem('bardatenda_is_authenticated');
          } catch (e) {
            console.error('Erro ao limpar sessão no localStorage:', e);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Erro no listener de autenticação do Firebase:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
      // Autenticação direta e real com o Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const fbUser = userCredential.user;

      const formattedName =
        fbUser.displayName ||
        (fbUser.email
          ? fbUser.email.split('@')[0].charAt(0).toUpperCase() +
            fbUser.email.split('@')[0].slice(1).replace(/[._-]/g, ' ')
          : 'Gestor Bar da Tenda');

      const authenticatedUser: User = {
        uid: fbUser.uid,
        email: fbUser.email || trimmedEmail,
        name: formattedName,
        role: 'Administrador / Gestor',
        avatar: fbUser.photoURL || undefined,
        loginTime: new Date().toISOString(),
      };

      setUser(authenticatedUser);
      setFirebaseUser(fbUser);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authenticatedUser));
      localStorage.setItem('bardatenda_auth_user', authenticatedUser.name);
      localStorage.setItem('bardatenda_is_authenticated', 'true');

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
      localStorage.removeItem('bardatenda_is_authenticated');
      setUser(null);
      setFirebaseUser(null);
    }
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
      if (updated.name) {
        localStorage.setItem('bardatenda_auth_user', updated.name);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil do usuário:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        signed: !!user,
        loading,
        login,
        logout,
        updateUserProfile,
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
