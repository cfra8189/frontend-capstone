import React from "react";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDangerous = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[500]" onClick={onClose}>
            <div
                className="bg-theme-secondary border border-theme p-6 rounded-sm max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        {isDangerous && <AlertTriangle className="text-red-500" size={20} />}
                        <h3 className="text-sm font-bold text-theme-primary uppercase tracking-widest leading-none mt-1">
                            {title}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <p className="text-xs text-theme-secondary font-mono mb-8 opacity-80 leading-relaxed">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-theme-muted hover:text-theme-primary border border-transparent hover:border-theme/20 rounded-sm transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white rounded-sm shadow-lg transition-all ${isDangerous
                                ? "bg-red-600/90 hover:bg-red-500 border border-red-500/50"
                                : "bg-accent hover:bg-accent/90 border border-accent/50 text-black"
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
