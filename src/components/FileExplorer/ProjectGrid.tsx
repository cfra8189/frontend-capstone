import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../../types/folder'; // Changed import
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FileMusic, Disc, Mic2, Layers, MoreVertical, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

interface ProjectGridProps {
    projects: Project[];
    loading: boolean;
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
    onMoveProject: (project: Project) => void;
}

const ProjectCard: React.FC<{
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
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    const getIcon = () => {
        switch (project.type) {
            case 'album': return <Disc size={24} className="text-purple-500" />;
            case 'ep': return <Layers size={24} className="text-blue-500" />;
            case 'beat': return <FileMusic size={24} className="text-theme-primary" />;
            case 'sample': return <Mic2 size={24} className="text-yellow-500" />;
            default: return <FileMusic size={24} className="text-theme-secondary" />;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
        group relative border border-theme hover:border-theme-primary hover:bg-theme-secondary p-4 
        transition-all cursor-grab active:cursor-grabbing bg-theme-tertiary
        ${isDragging ? 'ring-2 ring-theme-primary shadow-xl opacity-50 grayscale' : ''}
      `}
            onClick={() => onEdit(project)}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 border border-theme group-hover:border-theme-primary group-hover:bg-theme-primary group-hover:text-theme-primary transition-colors rounded-sm">
                    {getIcon()}
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-2 relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1.5 hover:bg-theme-primary hover:text-theme-primary rounded-sm text-theme-muted transition-colors border border-transparent hover:border-theme-primary relative z-10"
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
                                    onDelete(project.id); // Assuming id is number based on interface
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-900/20 hover:text-red-400 text-red-500 transition-colors text-left"
                            >
                                <Trash2 size={10} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <h3 className="text-xs font-bold font-mono text-theme-secondary group-hover:text-theme-primary truncate mb-2 mt-2 uppercase tracking-wide">
                <Link href={`/project/${project.id}`} className="hover:underline">
                    {project.title}
                </Link>
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-mono text-theme-muted">
                <span className={`
          px-1 py-0.5 border border-theme group-hover:border-theme-primary group-hover:bg-theme-primary group-hover:text-theme-primary transition-colors uppercase
          ${project.status === 'published' ? 'text-theme-primary' :
                        project.status === 'development' ? 'text-blue-400' : 'text-theme-muted'}
        `}>
                    {project.status}
                </span>
                <span className="truncate opacity-50">{new Date(project.updatedAt).toLocaleDateString()}</span>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6 overflow-y-auto">
            {projects.map((project) => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onMoveProject={onMoveProject}
                />
            ))}
        </div>
    );
};
