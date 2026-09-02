import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Login } from '../pages/Login';
import { ShieldAlert } from 'lucide-react';
import { UserRole } from '../types';
import { BarDaTendaLogo } from '../components/common/BarDaTendaLogo';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackTabName?: string;
  onRedirect?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallbackTabName = 'Estoque',
  onRedirect,
}) => {
  const { signed, loading, role, user } = useAuth();

  // Enquanto verifica o estado de autenticação no Firebase
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-100">
        <div className="flex flex-col items-center gap-4">
          <BarDaTendaLogo id="auth-loading-logo" size="lg" showGlow className="animate-pulse" />
          <div className="flex flex-col items-center gap-1.5">
            <h2 className="text-sm font-bold text-zinc-200 tracking-wide">Gestão Bar da Tenda</h2>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Verificando autenticação e permissões...</span>
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

  // Se há restrição por papéis/roles
  const currentRole: UserRole = role || (user?.role as UserRole) || 'administrador';
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 text-zinc-100">
        <div className="max-w-md w-full bg-zinc-900/90 border border-rose-800/60 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">Acesso Não Permitido</h3>
            <p className="text-xs text-zinc-400 mt-1">
              O seu perfil atual (<span className="text-amber-400 font-bold uppercase">{currentRole}</span>) não possui permissão para acessar esta seção do sistema.
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Disponível apenas para os perfis: {allowedRoles.join(', ')}.
            </p>
          </div>
          {onRedirect && (
            <button
              onClick={onRedirect}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow active:scale-95"
            >
              Voltar para {fallbackTabName}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Se estiver autenticado e autorizado, libera o acesso
  return <>{children}</>;
};

export default ProtectedRoute;
