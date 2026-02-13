import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { FolderIcon } from './FolderIcon';

interface WindowProps {
    id: string;
    title: string;
    onClose: () => void;
    onMinimize?: () => void;
    onFocus: () => void;
    zIndex: number;
    children: React.ReactNode;
    initialPosition?: { x: number; y: number };
}

export const FolderWindow: React.FC<WindowProps> = ({
    id,
    title,
    onClose,
    onMinimize,
    onFocus,
    zIndex,
    children,
    initialPosition = { x: 50, y: 50 }
}) => {
    const [isMaximized, setIsMaximized] = useState(false);

    return (
        <motion.div
            drag={!isMaximized}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95, ...initialPosition }}
            animate={{
                opacity: 1,
                scale: 1,
                width: isMaximized ? '100%' : '600px',
                height: isMaximized ? 'calc(100vh - 64px)' : '400px',
                x: isMaximized ? 0 : undefined,
                y: isMaximized ? 0 : undefined,
            }}
            style={{ zIndex, position: 'absolute' }}
            onMouseDown={onFocus}
            className={`
        bg-theme-secondary border border-theme shadow-2xl flex flex-col overflow-hidden
        ${isMaximized ? 'fixed top-16 left-0' : 'rounded-sm'}
      `}
        >
            {/* Window Header */}
            <div className="bg-theme-primary border-b border-theme p-2 flex items-center justify-between cursor-grab active:cursor-grabbing select-none">
                <div className="flex items-center gap-2">
                    <FolderIcon variant="solid" className="w-4 h-4 text-theme-primary" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-theme-primary">
                        {title}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onMinimize}
                        className="p-1 hover:bg-theme-secondary text-theme-muted transition-colors"
                    >
                        <Minus size={12} />
                    </button>
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-1 hover:bg-theme-secondary text-theme-muted transition-colors"
                    >
                        {isMaximized ? <Square size={10} /> : <Maximize2 size={10} />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-red-500/20 hover:text-red-500 text-theme-muted transition-colors"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-auto bg-theme-primary p-4">
                {children}
            </div>

            {/* Window Footer Status */}
            <div className="bg-theme-secondary border-t border-theme px-2 py-1 flex items-center justify-between">
                <span className="text-[8px] font-mono text-theme-muted uppercase tracking-widest">
                    SYSTEM_OBJECT // {id}
                </span>
                <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-theme-primary opacity-50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-theme-primary opacity-20" />
                </div>
            </div>
        </motion.div>
    );
};
