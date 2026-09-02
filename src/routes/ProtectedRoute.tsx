import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Login } from '../pages/Login';
import { GlassWater } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { signed, loading } = useAuth();

  // Enquanto verifica o estado de autenticação no localStorage
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-950/50 border border-amber-400/30 animate-pulse">
            <GlassWater className="w-7 h-7 text-zinc-950" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <h2 className="text-sm font-bold text-zinc-200 tracking-wide">Gestão Bar da Tenda</h2>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Verificando autenticação...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se não estiver logado, renderiza a tela de login
  if (!signed) {
    return <Login />;
  }

  // Se estiver autenticado, libera o acesso ao Dashboard e módulos do sistema
  return <>{children}</>;
};

export default ProtectedRoute;
