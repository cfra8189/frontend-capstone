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
}

const ProjectCard: React.FC<{
    project: Project;
    onEdit: (p: Project) => void;
    onDelete: (id: string) => void;
}> = ({ project, onEdit, onDelete }) => {
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
            case 'beat': return <FileMusic size={24} className="text-green-500" />;
            case 'sample': return <Mic2 size={24} className="text-yellow-500" />;
            default: return <FileMusic size={24} className="text-zinc-500" />;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
        group relative border border-[#333] hover:border-white hover:bg-black p-4 
        transition-all cursor-grab active:cursor-grabbing bg-[#1e1e1e]
        ${isDragging ? 'ring-2 ring-white shadow-xl opacity-50 grayscale' : ''}
      `}
            onClick={() => onEdit(project)}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 border border-[#333] group-hover:border-white group-hover:bg-white group-hover:text-black transition-colors rounded-sm">
                    {getIcon()}
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-2 relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1.5 hover:bg-white hover:text-black rounded-sm text-zinc-500 transition-colors border border-transparent hover:border-black relative z-10"
                    >
                        <MoreVertical size={14} />
                    </button>

                    {showMenu && (
                        <div
                            ref={menuRef}
                            className="absolute right-0 top-8 bg-[#1e1e1e] border border-[#333] shadow-xl rounded-sm z-50 w-32 flex flex-col pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'default' }}
                        >
                            <Link href={`/project/${project.id}`}>
                                <a className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#2e2e2e] text-zinc-300 hover:text-white transition-colors">
                                    <ExternalLink size={10} /> Open
                                </a>
                            </Link>
                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    onEdit(project);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#2e2e2e] text-zinc-300 hover:text-white transition-colors text-left"
                            >
                                <Edit2 size={10} /> Edit
                            </button>
                            <div className="h-px bg-[#333] mx-2 my-1"></div>
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

            <h3 className="text-xs font-bold font-mono text-zinc-300 group-hover:text-white truncate mb-2 mt-2 uppercase tracking-wide">{project.title}</h3>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                <span className={`
          px-1 py-0.5 border border-[#333] group-hover:border-white group-hover:bg-white group-hover:text-black transition-colors uppercase
          ${project.status === 'published' ? 'text-green-400' :
                        project.status === 'development' ? 'text-blue-400' : 'text-zinc-500'}
        `}>
                    {project.status.substring(0, 3)}
                </span>
                <span className="truncate opacity-50">{new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>

            {/* This Link overlay causes issues with the menu click if not careful with z-index, but we stopped propagation on the menu button and menu itself */}
            <Link href={`/project/${project.id}`} className="absolute inset-0 z-0" onClick={e => e.stopPropagation()} />
        </div>
    );
};

export const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, loading, onEdit, onDelete }) => {
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
                />
            ))}
        </div>
    );
};
