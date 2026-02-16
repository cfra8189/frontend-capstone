
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project } from '../../types/folder';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FileMusic, Disc, Mic2, Layers, MoreVertical, Edit2, Trash2, ExternalLink, Music, AlignLeft, Check, ChevronDown, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { Link } from 'wouter';

interface ProjectGridProps {
    projects: Project[];
    loading: boolean;
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
    onMoveProject: (project: Project) => void;
}

type SortKey = 'title' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

const ProjectRow: React.FC<{
    project: Project;
    onEdit: (p: Project) => void;
    onDelete: (id: string) => void;
    onMoveProject: (project: Project) => void;
}> = ({ project, onEdit, onDelete, onMoveProject }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `project-${project.id}`,
        data: { type: 'project', id: project.id, folderId: project.folderId }
    });

    const [showMenu, setShowMenu] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [localStatus, setLocalStatus] = useState(project.status || 'concept');
    const [localDesc, setLocalDesc] = useState(project.description || '');

    const menuRef = useRef<HTMLDivElement>(null);
    const statusMenuRef = useRef<HTMLDivElement>(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
                setShowStatusMenu(false);
            }
        };

        if (showMenu || showStatusMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu, showStatusMenu]);

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : (showMenu || showStatusMenu) ? 40 : 1,
        opacity: isDragging ? 0 : 1,
    } : undefined;

    const getIcon = () => {
        switch (project.type) {
            case 'album': return <Disc size={14} className="text-purple-500" />;
            case 'ep': return <Layers size={14} className="text-blue-500" />;
            case 'beat': return <FileMusic size={14} className="text-theme-primary" />;
            case 'sample': return <Mic2 size={14} className="text-yellow-500" />;
            default: return <FileMusic size={14} className="text-theme-secondary" />;
        }
    };

    const statusColors: Record<string, string> = {
        published: 'text-theme-primary',
        development: 'text-blue-400',
        concept: 'text-theme-muted',
        demo: 'text-yellow-500'
    };

    const statuses = ['concept', 'development', 'demo', 'published'];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group relative flex items-center gap-3 py-2 px-3 
                border-b border-theme/10 hover:bg-theme-secondary/30 
                transition-all
                ${isDragging ? 'opacity-0' : ''}
            `}
        >
            {/* Drag Handle Column */}
            <div
                {...listeners}
                {...attributes}
                className="w-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-theme-muted opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
            >
                <GripVertical size={14} />
            </div>

            {/* Icon Column - Hidden on very small screens */}
            <div className="hidden xs:flex w-8 justify-center text-theme-muted group-hover:text-theme-primary transition-colors">
                {getIcon()}
            </div>

            {/* Title Column - Flexible width */}
            <div className="flex-1 min-w-0">
                <Link href={`/project/${project.id}`} className="hover:underline block truncate font-bold font-mono text-[11px] uppercase tracking-wider text-theme-primary">
                    {project.title}
                </Link>
            </div>


            {/* Status Dropdown (Functional) */}
            <div className="w-28 hidden sm:block relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowStatusMenu(!showStatusMenu);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm border border-transparent hover:border-theme/20 hover:bg-theme-primary/5 transition-all ${statusColors[localStatus] || 'text-theme-muted'}`}
                >
                    <span className="truncate">{localStatus}</span>
                    <ChevronDown size={8} className="opacity-50" />
                </button>

                {showStatusMenu && (
                    <div
                        ref={statusMenuRef}
                        className="absolute left-0 top-full mt-1 bg-theme-secondary border border-theme shadow-2xl rounded-sm z-[100] w-32 flex flex-col overflow-hidden"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {statuses.map(s => (
                            <button
                                key={s}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLocalStatus(s);
                                    setShowStatusMenu(false);
                                }}
                                className={`flex items-center justify-between px-3 py-1.5 text-[9px] font-mono uppercase hover:bg-theme-tertiary transition-colors ${statusColors[s]} ${localStatus === s ? 'bg-theme-primary/5' : ''}`}
                            >
                                {s}
                                {localStatus === s && <Check size={8} />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Date Column */}
            <div className="w-20 hidden md:block text-[9px] font-mono text-theme-muted/40 uppercase tracking-wider">
                {new Date(project.updatedAt).toLocaleDateString()}
            </div>

            {/* Notes Field (Input) - Flex to fill remaining space */}
            <div className="flex-1 hidden lg:block min-w-0">
                <div className="relative group/notes">
                    <input
                        type="text"
                        value={localDesc}
                        onChange={(e) => setLocalDesc(e.target.value)}
                        placeholder="Add note..."
                        className="w-full bg-transparent border-b border-transparent hover:border-theme/20 focus:border-theme-primary text-[9px] font-mono text-theme-muted/60 focus:text-theme-primary outline-none px-1 py-0.5 transition-all placeholder:text-theme-muted/10"
                        onKeyDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>

            {/* Actions Column */}
            <div className="w-8 flex justify-end relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowMenu(!showMenu);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-theme-secondary hover:text-theme-primary rounded-sm text-theme-muted transition-colors opacity-0 group-hover:opacity-60 hover:!opacity-100"
                >
                    <MoreVertical size={12} />
                </button>

                {showMenu && (
                    <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 bg-theme-secondary border border-theme shadow-2xl rounded-sm z-50 w-32 flex flex-col overflow-hidden"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <Link href={`/project/${project.id}`}>
                            <a className="flex items-center gap-2 px-3 py-2 text-[10px] hover:bg-theme-tertiary text-theme-secondary hover:text-theme-primary transition-colors uppercase font-mono tracking-wider">
                                <ExternalLink size={10} /> Open
                            </a>
                        </Link>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(false);
                                onEdit(project);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-[10px] hover:bg-theme-tertiary text-theme-secondary hover:text-theme-primary transition-colors text-left uppercase font-mono tracking-wider"
                        >
                            <Edit2 size={10} /> Edit
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(false);
                                onMoveProject(project);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-[10px] hover:bg-theme-tertiary text-theme-secondary hover:text-theme-primary transition-colors text-left uppercase font-mono tracking-wider"
                        >
                            <ExternalLink size={10} /> Move To
                        </button>
                        <div className="h-px bg-theme/20 mx-2 my-1"></div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(false);
                                onDelete(project.id);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-[10px] hover:bg-red-900/10 hover:text-red-400 text-red-500/80 transition-colors text-left uppercase font-mono tracking-wider"
                        >
                            <Trash2 size={10} /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, loading, onEdit, onDelete, onMoveProject }) => {
    const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const sortedProjects = useMemo(() => {
        return [...projects].sort((a, b) => {
            let valA: string | number = a[sortKey] || '';
            let valB: string | number = b[sortKey] || '';

            if (sortKey === 'updatedAt') {
                valA = new Date(a.updatedAt).getTime();
                valB = new Date(b.updatedAt).getTime();
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [projects, sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
                <div className="animate-pulse font-mono uppercase tracking-[0.2em] text-[10px]">Loading vault...</div>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                <Layers size={48} className="mb-4 opacity-10" />
                <p className="font-mono uppercase tracking-widest text-[10px]">No projects found</p>
                <p className="text-[9px] font-mono opacity-30 mt-2 uppercase tracking-tighter">Drag projects here or initiate NEW_PROJECT</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">
            {/* Header Row */}
            <div className="flex items-center gap-3 px-3 py-1.5 border-b border-theme/20 bg-theme-secondary/40 backdrop-blur-md sticky top-0 z-20 text-[8px] font-bold font-mono uppercase tracking-[0.2em] text-theme-muted select-none">
                <div className="w-6 flex justify-center opacity-30">
                    <AlignLeft size={10} />
                </div>
                <div className="hidden xs:flex w-8 justify-center opacity-30">
                    <Music size={10} />
                </div>

                <div
                    className="flex-1 cursor-pointer hover:text-theme-primary transition-colors flex items-center gap-2 group"
                    onClick={() => handleSort('title')}
                >
                    NAME
                    {sortKey === 'title' ? (
                        sortOrder === 'asc' ? <ArrowUp size={8} className="text-theme-primary" /> : <ArrowDown size={8} className="text-theme-primary" />
                    ) : (
                        <ArrowUp size={8} className="opacity-0 group-hover:opacity-20" />
                    )}
                </div>

                <div className="w-28 hidden sm:block">STATUS</div>

                <div
                    className="w-20 hidden md:block cursor-pointer hover:text-theme-primary transition-colors flex items-center gap-2 group"
                    onClick={() => handleSort('updatedAt')}
                >
                    UPDATED
                    {sortKey === 'updatedAt' ? (
                        sortOrder === 'asc' ? <ArrowUp size={8} className="text-theme-primary" /> : <ArrowDown size={8} className="text-theme-primary" />
                    ) : (
                        <ArrowUp size={8} className="opacity-0 group-hover:opacity-20" />
                    )}
                </div>

                <div className="flex-1 hidden lg:block">NOTES</div>
                <div className="w-8"></div>
            </div>

            {/* Project Rows */}
            <div className="flex-1 pb-10">
                {sortedProjects.map((project) => (
                    <ProjectRow
                        key={project.id}
                        project={project}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onMoveProject={onMoveProject}
                    />
                ))}
            </div>
        </div>
    );
};
