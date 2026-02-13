import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { FileText, Music, Disc, Layers, Mic2 } from 'lucide-react';
import { FolderIcon } from './FolderIcon';

interface DesktopItemProps {
    id: string;
    type: 'folder' | 'project';
    title: string;
    onOpen: () => void;
    iconVariant?: string; // For projects
}

export const DesktopItem: React.FC<DesktopItemProps> = ({ id, type, title, onOpen, iconVariant }) => {
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: `${type}-${id}`,
        data: { type, id }
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `drop-${type}-${id}`,
        data: { type, id },
        disabled: type === 'project' // Only folders can be drop targets
    });

    const getProjectIcon = () => {
        switch (iconVariant) {
            case 'album': return <Disc size={32} className="text-purple-500/80" />;
            case 'ep': return <Layers size={32} className="text-blue-500/80" />;
            case 'beat': return <Music size={32} className="text-theme-primary/80" />;
            case 'sample': return <Mic2 size={32} className="text-yellow-500/80" />;
            default: return <FileText size={32} className="text-theme-secondary/80" />;
        }
    };

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 100 : undefined,
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    return (
        <div
            ref={(node) => {
                setDragRef(node);
                setDropRef(node);
            }}
            style={style}
            {...listeners}
            {...attributes}
            onDoubleClick={onOpen}
            className={`
        flex flex-col items-center gap-2 p-2 rounded-sm transition-all cursor-pointer w-24
        ${isOver ? 'bg-theme-primary/10 ring-1 ring-theme-primary shadow-lg scale-105' : 'hover:bg-theme-secondary/50'}
      `}
        >
            <div className="relative">
                {type === 'folder' ? (
                    <FolderIcon variant="solid" className={`w-12 h-12 ${isOver ? 'text-theme-primary' : 'text-theme-muted'}`} />
                ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-theme-secondary border border-theme shadow-sm">
                        {getProjectIcon()}
                    </div>
                )}
            </div>

            <span className="text-[10px] font-mono font-bold uppercase tracking-tight text-center break-all line-clamp-2 text-theme-secondary px-1 py-0.5 leading-tight">
                {title}
            </span>
        </div>
    );
};
