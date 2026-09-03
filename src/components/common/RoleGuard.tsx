import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, ActiveTab } from '../../types';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  moduleName?: string;
  fallbackTab?: ActiveTab;
  onRedirect?: (tab: ActiveTab) => void;
  children: React.ReactNode;
}

/**
 * Componente guardião de papéis e permissões (Role-Based Access Control).
 * Impede que usuários não autorizados (ex: 'administrador') acessem
 * abas restritas (como Contas e Caixa), redirecionando-os para abas permitidas.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  moduleName = 'este módulo',
  fallbackTab = 'estoque',
  onRedirect,
  children,
}) => {
  const { user, role } = useAuth();
  const currentRole: UserRole = role || (user?.role as UserRole) || 'administrador';
  const hasAccess = allowedRoles.includes(currentRole);

  useEffect(() => {
    if (!hasAccess) {
      console.warn(
        `[Controle de Acesso] Usuário com perfil '${currentRole}' tentou acessar área restrita (${moduleName}). Redirecionando para '${fallbackTab}'.`
      );
      // Atualiza a URL hash caso esteja navegando diretamente
      if (window.location.hash && (window.location.hash.includes('contas') || window.location.hash.includes('caixa') || window.location.hash.includes('financeiro'))) {
        window.location.hash = `#/${fallbackTab}`;
      }
      
      const timer = setTimeout(() => {
        if (onRedirect) {
          onRedirect(fallbackTab);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [hasAccess, currentRole, moduleName, fallbackTab, onRedirect]);

  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto my-8 p-5 bg-zinc-900/90 border border-rose-800/60 rounded-2xl shadow-xl text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Acesso Restrito</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Seu perfil de <strong className="text-amber-400 uppercase">{currentRole === 'criador' ? 'DONO' : currentRole}</strong> não possui permissão para visualizar {moduleName}.
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Acesso permitido apenas para o perfil <strong className="text-zinc-300">Dono</strong>.
          </p>
        </div>

        <button
          onClick={() => onRedirect && onRedirect(fallbackTab)}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all shadow active:scale-95"
        >
          <span>Ir para Estoque</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
