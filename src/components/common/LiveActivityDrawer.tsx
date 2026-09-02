import React from 'react';
import {
  X,
  Radio,
  Package,
  Music,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  Clock,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Edit,
  DollarSign,
  Copy,
  Layers,
} from 'lucide-react';
import { ActivityLog } from '../../types';

interface LiveActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityLog[];
  isConnected: boolean;
  totalSyncedCount: number;
}

export const LiveActivityDrawer: React.FC<LiveActivityDrawerProps> = ({
  isOpen,
  onClose,
  activities,
  isConnected,
  totalSyncedCount,
}) => {
  if (!isOpen) return null;

  const getModuleIcon = (module: ActivityLog['module']) => {
    switch (module) {
      case 'estoque':
        return <Package className="w-3.5 h-3.5 text-amber-400" />;
      case 'bandas':
        return <Music className="w-3.5 h-3.5 text-purple-400" />;
      case 'equipe':
        return <Users className="w-3.5 h-3.5 text-blue-400" />;
      case 'contas':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-400" />;
      case 'financeiro':
        return <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />;
      case 'config':
        return <Settings className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getActionBadge = (action: ActivityLog['action']) => {
    switch (action) {
      case 'create':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <PlusCircle className="w-2.5 h-2.5" /> Adicionado
          </span>
        );
      case 'update':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
            <Edit className="w-2.5 h-2.5" /> Alterado
          </span>
        );
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
            <Trash2 className="w-2.5 h-2.5" /> Excluído
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            <Copy className="w-2.5 h-2.5" /> Duplicado
          </span>
        );
      case 'pay':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <DollarSign className="w-2.5 h-2.5" /> Pago
          </span>
        );
      case 'restock':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            <Package className="w-2.5 h-2.5" /> Reposição
          </span>
        );
      case 'clear':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
            Limpeza
          </span>
        );
      default:
        return null;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHrs = Math.floor(diffMin / 60);

      if (diffSec < 45) return 'Agora mesmo';
      if (diffMin < 60) return `Há ${diffMin} min`;
      if (diffHrs < 24) return `Há ${diffHrs}h`;
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header do Drawer */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Histórico em Tempo Real</span>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Ao Vivo
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Reconectando...
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Todas as alterações feitas por você ou outros usuários aparecem aqui
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Card */}
        <div className="p-3 bg-zinc-900/40 border-b border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sincronização Nuvem Ativa</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              {totalSyncedCount} itens sincronizados
            </span>
          </div>
        </div>

        {/* Lista de Atividades */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-zinc-900">
          {activities.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-sm font-medium">Nenhuma alteração recente</p>
              <p className="text-xs text-zinc-600 mt-1">
                Qualquer criação, edição ou exclusão feita no sistema aparecerá instantaneamente aqui.
              </p>
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="pt-2.5 pb-2.5 px-2 rounded-xl hover:bg-zinc-900/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-zinc-800 border border-zinc-700/50">
                      {getModuleIcon(act.module)}
                    </div>
                    <span className="text-xs font-semibold text-zinc-200 capitalize">
                      {act.module}
                    </span>
                    {getActionBadge(act.action)}
                  </div>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 shrink-0 font-mono">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 mt-1.5 pl-7 leading-snug">
                  {act.description}
                </p>

                {act.userName && (
                  <div className="mt-1 pl-7 text-[10px] text-zinc-400">
                    Por: <span className="text-zinc-300 font-medium">{act.userName}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 text-center">
          <p className="text-[11px] text-zinc-400">
            Atualização instantânea entre todos os aparelhos e computadores logados.
          </p>
        </div>
      </div>
    </div>
  );
};
