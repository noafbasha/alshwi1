
import React, { createContext, useContext, useState, useCallback } from 'react';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notify: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((message: string, type: NotificationType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 left-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`pointer-events-auto p-5 rounded-2xl shadow-2xl border-2 flex items-center gap-3 animate-in slide-in-from-bottom duration-300 max-w-md mx-auto w-full
              ${n.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
                n.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                'bg-red-50 border-red-200 text-red-800'}`}
          >
            <span className="text-2xl">
              {n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : '❌'}
            </span>
            <span className="font-bold text-lg">{n.message}</span>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotify must be used within NotificationProvider');
  return context;
};
