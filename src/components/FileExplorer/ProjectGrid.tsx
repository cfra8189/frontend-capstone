
import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../../types/folder';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FileMusic, Disc, Mic2, Layers, MoreVertical, Edit2, Trash2, ExternalLink, Music, AlignLeft, Check, ChevronDown } from 'lucide-react';
import { Link } from 'wouter';

interface ProjectGridProps {
    projects: Project[];
    loading: boolean;
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
    onMoveProject: (project: Project) => void;
}

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
    const [localStatus, setLocalStatus] = useState(project.status || 'concept');
    const [localDesc, setLocalDesc] = useState(project.description || '');
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : showMenu ? 40 : 1, // Ensure menu allows z-index to work
        opacity: isDragging ? 0 : 1,
    } : undefined;

    const getIcon = () => {
        switch (project.type) {
            case 'album': return <Disc size={16} className="text-purple-500" />;
            case 'ep': return <Layers size={16} className="text-blue-500" />;
            case 'beat': return <FileMusic size={16} className="text-theme-primary" />;
            case 'sample': return <Mic2 size={16} className="text-yellow-500" />;
            default: return <FileMusic size={16} className="text-theme-secondary" />;
        }
    };

    const statusColors: Record<string, string> = {
        published: 'text-theme-primary',
        development: 'text-blue-400',
        concept: 'text-theme-muted',
        demo: 'text-yellow-500'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                group relative flex items-center gap-4 p-3 
                border-b border-theme/20 hover:bg-theme-secondary/50 
                transition-all cursor-grab active:cursor-grabbing
                ${isDragging ? 'opacity-0' : ''}
            `}
            // Double click to open?
            onDoubleClick={() => onEdit(project)}
        >
            {/* Icon Column */}
            <div className="w-8 flex justify-center text-theme-secondary group-hover:text-theme-primary transition-colors">
                {getIcon()}
            </div>

            {/* Title Column */}
            <div className="flex-1 min-w-0">
                <Link href={`/project/${project.id}`} className="hover:underline block truncate font-bold font-mono text-xs uppercase tracking-wider text-theme-primary">
                    {project.title}
                </Link>
            </div>


            {/* Status Dropdown (Mock for now) */}
            <div className="w-32 hidden sm:block relative group/status">
                <button className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-sm border border-transparent hover:border-theme/30 hover:bg-theme-primary/10 transition-all ${statusColors[localStatus] || 'text-theme-muted'}`}>
                    <span>{localStatus}</span>
                    <ChevronDown size={10} className="opacity-0 group-hover/status:opacity-50" />
                </button>
            </div>

            {/* Date Column */}
            <div className="w-24 hidden md:block text-[10px] font-mono text-theme-muted/50 uppercase tracking-wider text-right">
                {new Date(project.updatedAt).toLocaleDateString()}
            </div>

            {/* Notes Field (Input) */}
            <div className="w-48 hidden lg:block">
                <div className="relative group/notes">
                    <input
                        type="text"
                        value={localDesc}
                        onChange={(e) => setLocalDesc(e.target.value)}
                        placeholder="Add note..."
                        className="w-full bg-transparent border-b border-transparent hover:border-theme/30 focus:border-theme-primary text-[10px] font-mono text-theme-muted focus:text-theme-primary outline-none px-1 py-0.5 transition-all placeholder:text-theme-muted/20"
                        onKeyDown={(e) => e.stopPropagation()} // Allow typing without triggering drag sorts if any
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking input
                    />
                </div>
            </div>

            {/* Actions Column */}
            <div className="w-10 flex justify-end relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                    className="p-1.5 hover:bg-theme-secondary hover:text-theme-primary rounded-sm text-theme-muted transition-colors opacity-0 group-hover:opacity-100"
                >
                    <MoreVertical size={14} />
                </button>

                {showMenu && (
                    <div
                        ref={menuRef}
                        className="absolute right-0 top-8 bg-theme-secondary border border-theme shadow-xl rounded-sm z-50 w-32 flex flex-col pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'default' }}
                    >
                        <Link href={`/project/${project.id}`}>
                            <a className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-theme-tertiary text-theme-secondary hover:text-theme-primary transition-colors">
                                <ExternalLink size={10} /> Open
                            </a>
                        </Link>
                        <button
                            onClick={() => {
                                setShowMenu(false);
                                onEdit(project);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-theme-tertiary text-theme-secondary hover:text-theme-primary transition-colors text-left"
                        >
                            <Edit2 size={10} /> Edit
                        </button>
                        <button
                            onClick={() => {
                                setShowMenu(false);
                                onMoveProject(project);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-theme-tertiary text-theme-secondary hover:text-theme-primary transition-colors text-left"
                        >
                            <ExternalLink size={10} /> Move To
                        </button>
                        <div className="h-px bg-theme mx-2 my-1"></div>
                        <button
                            onClick={() => {
                                setShowMenu(false);
                                onDelete(project.id);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-900/20 hover:text-red-400 text-red-500 transition-colors text-left"
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
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
                <div className="animate-pulse">Loading projects...</div>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                <Layers size={48} className="mb-4 opacity-20" />
                <p>No projects in this folder</p>
                <p className="text-sm opacity-50 mt-2">Drag projects here or create a new one</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full overflow-y-auto">
            {/* Header Row */}
            <div className="flex items-center gap-4 px-3 py-2 border-b border-theme/30 bg-theme-secondary/20 backdrop-blur-sm sticky top-0 z-20 text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-theme-muted select-none">
                <div className="w-8 flex justify-center">
                    <AlignLeft size={12} />
                </div>
                <div className="flex-1">NAME</div>
                <div className="w-32 hidden sm:block">STATUS</div>
                <div className="w-24 hidden md:block text-right">UPDATED</div>
                <div className="w-48 hidden lg:block">NOTES</div>
                <div className="w-10"></div>
            </div>

            {/* Project Rows */}
            <div className="flex-1 pb-10">
                {projects.map((project) => (
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
