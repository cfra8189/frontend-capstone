import React from 'react';
import { Project } from '../../types/Project';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FileMusic, Disc, Mic2, Layers, MoreVertical } from 'lucide-react';
import { Link } from 'wouter';

interface ProjectGridProps {
    projects: Project[];
    loading: boolean;
    onEdit: (project: Project) => void;
    onDelete: (id: number) => void;
}

const ProjectCard: React.FC<{
    project: Project;
    onEdit: (p: Project) => void;
    onDelete: (id: number) => void;
}> = ({ project, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `project-${project.id}`,
        data: { type: 'project', id: project.id, folderId: project.folderId }
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
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
        group relative bg-[#1e1e1e] border border-[#333] hover:border-blue-500/50 rounded-lg p-4 
        transition-all cursor-grab active:cursor-grabbing hover:bg-[#252526]
        ${isDragging ? 'ring-2 ring-blue-500 shadow-xl' : ''}
      `}
            onClick={() => onEdit(project)}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-black/30 rounded-lg">
                    {getIcon()}
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                        className="p-1.5 hover:bg-black/50 rounded text-zinc-400 hover:text-red-400"
                    >
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>

            <h3 className="text-sm font-semibold text-zinc-200 truncate mb-1">{project.title}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className={`
          px-1.5 py-0.5 rounded bg-black/20 uppercase tracking-wider text-[10px]
          ${project.status === 'published' ? 'text-green-400' :
                        project.status === 'development' ? 'text-blue-400' : 'text-zinc-500'}
        `}>
                    {project.status}
                </span>
                <span className="truncate opacity-50">{new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>

            <Link href={`/project/${project.id}`} className="absolute inset-0" onClick={e => e.stopPropagation()} />
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
