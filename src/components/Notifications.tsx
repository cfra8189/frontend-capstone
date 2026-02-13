import React, { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

interface NotificationsProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onRemove }) => {
  useEffect(() => {
    notifications.forEach(notification => {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    });
  }, [notifications, onRemove]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-sm border max-w-sm shadow-2xl font-mono uppercase tracking-wider text-xs ${notification.type === 'success'
              ? 'bg-theme-secondary text-theme-primary border-theme-primary'
              : notification.type === 'error'
                ? 'bg-black text-white border-white'
                : 'bg-theme-secondary text-theme-muted border-theme-muted'
            }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => onRemove(notification.id)}
              className="ml-4 text-current/60 hover:text-current"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: Notification['type'], message: string, duration?: number) => {
    const id = Date.now().toString();
    const notification = { id, type, message, duration };
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    success: (message: string, duration?: number) => addNotification('success', message, duration),
    error: (message: string, duration?: number) => addNotification('error', message, duration),
    info: (message: string, duration?: number) => addNotification('info', message, duration),
  };
};
