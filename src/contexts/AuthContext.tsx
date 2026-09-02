import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  email: string;
  name: string;
  role?: string;
  avatar?: string;
  loginTime?: string;
}

export interface AuthContextData {
  user: User | null;
  signed: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const STORAGE_USER_KEY = '@BarDaTenda:user';
const STORAGE_TOKEN_KEY = '@BarDaTenda:token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega os dados salvos no localStorage ao iniciar
    const loadStoredAuth = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_USER_KEY);
        const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);

        if (storedUser && storedToken) {
          const parsedUser: User = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de autenticação:', error);
        localStorage.removeItem(STORAGE_USER_KEY);
        localStorage.removeItem(STORAGE_TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (email: string, password = ''): Promise<{ success: boolean; message?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      return { success: false, message: 'Por favor, informe seu e-mail de acesso.' };
    }

    if (!trimmedPassword) {
      return { success: false, message: 'Por favor, digite sua senha.' };
    }

    // Simulação e validação de login seguro com persistência em localStorage
    const displayName =
      trimmedEmail.split('@')[0].charAt(0).toUpperCase() +
      trimmedEmail.split('@')[0].slice(1).replace(/[._-]/g, ' ');

    const authenticatedUser: User = {
      email: trimmedEmail,
      name: displayName || 'Gestor Bar da Tenda',
      role: 'Administrador / Gestor',
      loginTime: new Date().toISOString(),
    };

    const dummyToken = `token_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authenticatedUser));
      localStorage.setItem(STORAGE_TOKEN_KEY, dummyToken);
      localStorage.setItem('bardatenda_auth_user', authenticatedUser.name);
      localStorage.setItem('bardatenda_is_authenticated', 'true');
      setUser(authenticatedUser);
      return { success: true };
    } catch (err) {
      console.error('Erro ao salvar sessão de login:', err);
      return { success: false, message: 'Falha ao gravar sessão local.' };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem('bardatenda_is_authenticated');
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
