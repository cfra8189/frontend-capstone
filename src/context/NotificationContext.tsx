import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
}

interface NotificationContextType {
    showNotification: (type: NotificationType, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = (type: NotificationType, message: string, duration = 3000) => {
        const id = Math.random().toString(36).substring(7);
        setNotifications(prev => [...prev, { id, type, message, duration }]);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {notifications.map(notification => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onClose={() => removeNotification(notification.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
}

function NotificationItem({ notification, onClose }: { notification: Notification, onClose: () => void }) {
    useEffect(() => {
        if (notification.duration) {
            const timer = setTimeout(onClose, notification.duration);
            return () => clearTimeout(timer);
        }
    }, [notification, onClose]);

    const variants = {
        initial: { opacity: 0, y: 20, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };

    const colors = {
        success: 'bg-green-500/10 border-green-500 text-green-400',
        error: 'bg-red-500/10 border-red-500 text-red-400',
        warning: 'bg-yellow-500/10 border-yellow-500 text-yellow-400',
        info: 'bg-blue-500/10 border-blue-500 text-blue-400'
    };

    const icons = {
        success: <CheckCircle size={16} />,
        error: <AlertCircle size={16} />,
        warning: <AlertCircle size={16} />,
        info: <Info size={16} />
    };

    return (
        <motion.div
            layout
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`pointer-events-auto min-w-[300px] max-w-sm p-3 rounded-md border backdrop-blur-md shadow-2xl flex items-start gap-3 ${colors[notification.type]}`}
        >
            <div className="mt-0.5">{icons[notification.type]}</div>
            <div className="flex-1">
                <p className="text-sm font-mono font-bold leading-tight">{notification.message}</p>
            </div>
            <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
                <X size={14} />
            </button>
        </motion.div>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
