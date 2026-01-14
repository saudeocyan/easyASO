import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { NotificationLog } from '../types';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select(`
            *,
            actor:usuarios!actor_id (
              nome
            )
          `)
          .order('timestamp', { ascending: false })
          .limit(50);

        if (error) throw error;

        const mappedLogs: NotificationLog[] = (data || []).map((log: any) => {
          let type: 'create' | 'edit' | 'delete' | 'system' = 'system';
          const action = (log.action || '').toLowerCase();
          if (action.includes('create') || action.includes('add') || action.includes('insert')) type = 'create';
          else if (action.includes('update') || action.includes('edit')) type = 'edit';
          else if (action.includes('delete') || action.includes('remove')) type = 'delete';

          const date = new Date(log.timestamp);
          const formattedTime = date.toLocaleString('pt-BR', { hour: 'numeric', minute: 'numeric' });
          const timeDiff = new Date().getTime() - date.getTime();
          const hoursDiff = Math.floor(timeDiff / (1000 * 3600));
          let timeDisplay = formattedTime;

          if (hoursDiff < 24 && hoursDiff > 0) timeDisplay = `Há ${hoursDiff}h`;
          else if (hoursDiff == 0) {
            const minutesDiff = Math.floor(timeDiff / (1000 * 60));
            if (minutesDiff < 1) timeDisplay = 'Agora mesmo';
            else timeDisplay = `Há ${minutesDiff}m`;
          }
          else timeDisplay = date.toLocaleDateString('pt-BR');

          return {
            id: log.id,
            type,
            actorName: log.actor?.nome || 'Usuário Desconhecido',
            actorAvatar: undefined,
            action: log.action,
            target: log.target || '',
            targetName: log.target || '',
            timestamp: timeDisplay,
            details: log.details
          };
        });
        setNotifications(mappedLogs);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Helper to format log messages
  const formatLogMessage = (log: NotificationLog) => {
    const actor = <span className="font-semibold text-secondary">{log.actorName || 'Sistema'}</span>;
    const target = <span className="font-semibold text-secondary">{log.targetName}</span>;

    const actionKey = log.action.toLowerCase();

    if (actionKey === 'aso_launch') {
      return (
        <>
          {actor} registrou um novo ASO para {target}.
        </>
      );
    }

    if (actionKey === 'create' || actionKey === 'create_member') {
      return (
        <>
          {actor} cadastrou o novo integrante {target}.
        </>
      );
    }

    if (actionKey === 'delete' || actionKey === 'delete_member') {
      return (
        <>
          {actor} excluiu o integrante {target}.
        </>
      );
    }

    if (actionKey === 'update' || actionKey === 'edit' || actionKey === 'edit_member') {
      return (
        <>
          {actor} atualizou os dados de {target}.
        </>
      );
    }

    if (actionKey === 'invite_user') {
      return (
        <>
          {actor} convidou o usuário {target} para o sistema.
        </>
      );
    }

    // Default fallback
    return (
      <>
        {actor} realizou a ação <span className="text-text-secondary italic">{log.action}</span> em {target}.
      </>
    );
  };

  // Helper to get Icon based on action
  const getActionIcon = (type: string, action: string) => {
    const act = action.toLowerCase();
    if (act === 'aso_launch') return 'medical_services';
    if (act === 'invite_user') return 'mail';

    if (type === 'create') return 'person_add';
    if (type === 'delete') return 'delete';
    if (type === 'edit') return 'edit';
    return 'priority_high'; // Default
  }

  // Helper to get Color based on action
  const getActionColor = (type: string, action: string) => {
    const act = action.toLowerCase();
    if (act === 'aso_launch') return 'bg-blue-100 text-blue-600';

    if (type === 'create') return 'bg-green-100 text-green-600';
    if (type === 'delete') return 'bg-red-100 text-red-600';
    if (type === 'edit') return 'bg-orange-100 text-orange-600';
    return 'bg-gray-100 text-gray-600';
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/5 rounded-lg text-secondary">
                <span className="material-symbols-outlined">history</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-secondary">Histórico de Alterações</h3>
                <p className="text-xs text-text-secondary">Registro completo de atividades do sistema</p>
              </div>
            </div>
            <button className="text-sm text-primary font-medium hover:text-primary-dark">
              Marcar todas como lidas
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">Carregando histórico...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Nenhuma atividade registrada.</div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="p-6 hover:bg-gray-50 transition-colors flex gap-4 items-start group">
                  <div className="flex-shrink-0 relative">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary border border-gray-200 font-bold text-xs">
                      {(notification.actorName || '?').substring(0, 2).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center
                    ${getActionColor(notification.type, notification.action)}`}>
                      <span className="material-symbols-outlined text-[10px] font-bold">
                        {getActionIcon(notification.type, notification.action)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary leading-relaxed">
                      {formatLogMessage(notification)}
                    </p>
                    <span className="text-xs text-text-secondary mt-1 block flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {notification.timestamp}
                    </span>
                  </div>

                  <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary transition-all p-1">
                    <span className="material-symbols-outlined text-[1.25rem]">visibility</span>
                  </button>
                </div>
              )))}
          </div>

          <div className="p-4 bg-gray-50/50 text-center border-t border-gray-100">
            <button className="text-xs font-medium text-text-secondary hover:text-secondary transition-colors">
              Carregar atividades anteriores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;