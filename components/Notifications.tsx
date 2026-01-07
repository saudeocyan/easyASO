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
            actor:usuarios (
              nome
            )
          `)
          .order('timestamp', { ascending: false })
          .limit(50);

        if (error) throw error;

        const mappedLogs: NotificationLog[] = (data || []).map((log: any) => {
          let type: 'create' | 'edit' | 'delete' | 'system' = 'system';
          const action = log.action.toLowerCase();
          if (action.includes('create') || action.includes('add') || action.includes('insert')) type = 'create';
          else if (action.includes('update') || action.includes('edit')) type = 'edit';
          else if (action.includes('delete') || action.includes('remove')) type = 'delete';

          const date = new Date(log.timestamp);
          const formattedTime = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }); // Simplified formatting
          // Or use a relative time library if available, but staying simple.
          const timeDiff = new Date().getTime() - date.getTime();
          const hoursDiff = Math.floor(timeDiff / (1000 * 3600));
          let timeDisplay = formattedTime;
          if (hoursDiff < 24 && hoursDiff > 0) timeDisplay = `${hoursDiff}h ago`;
          else if (hoursDiff == 0) timeDisplay = 'Just now';
          else timeDisplay = date.toLocaleDateString();


          return {
            id: log.id,
            type,
            actorName: log.actor?.nome || 'Unknown User',
            actorAvatar: undefined, // No avatar in audit_logs or simple join yet
            action: log.action,
            target: log.target,
            targetName: log.target,
            timestamp: timeDisplay,
            details: ''
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
                    ${notification.type === 'edit' ? 'bg-blue-100 text-blue-600' :
                        notification.type === 'create' ? 'bg-green-100 text-green-600' :
                          notification.type === 'delete' ? 'bg-red-100 text-red-600' :
                            'bg-orange-100 text-orange-600'
                      }`}>
                      <span className="material-symbols-outlined text-[10px] font-bold">
                        {notification.type === 'edit' ? 'edit' :
                          notification.type === 'create' ? 'add' :
                            notification.type === 'delete' ? 'delete' : 'priority_high'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary leading-relaxed">
                      <span className="font-semibold text-secondary">{notification.actorName}</span>{' '}
                      <span className="text-text-secondary">{notification.action}</span>{' '}
                      <span className="font-semibold text-secondary">{notification.targetName}</span>
                      {notification.details && (
                        <span className="text-text-secondary"> {notification.details}</span>
                      )}
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