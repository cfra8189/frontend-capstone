import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Loader, Plus, CheckCircle, Clock, Zap, Trash2, Edit2, CheckSquare, Square, StickyNote, Save } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from "date-fns";
import { useAuth } from "../../hooks/use-auth";
import ParticleNetwork from "../ParticleNetwork";
import { ConfirmationModal } from "./ConfirmationModal";

interface CalendarEvent {
    _id: string;
    title: string;
    date: string; // ISO string
    type: "session" | "habit" | "deadline" | "milestone" | "task";
    status: "pending" | "completed" | "missed";
    projectId?: string;
}

interface CreativeNote {
    _id: string;
    content: string;
    date: string;
    tags: string[];
    createdAt: string;
}

interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [dayNotes, setDayNotes] = useState<CreativeNote[]>([]);
    const [loading, setLoading] = useState(false);

    // Quick Add State
    const [quickTitle, setQuickTitle] = useState("");
    const [quickType, setQuickType] = useState<CalendarEvent["type"]>("task");

    // Note State
    const [newNote, setNewNote] = useState("");
    const [isAddingNote, setIsAddingNote] = useState(false);

    // Edit State
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    // Delete Confirmation State
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'event' } | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchEvents();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchNotesForDate(selectedDate);
        }
    }, [selectedDate, isOpen]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/calendar");
            if (res.ok) {
                const data = await res.json();
                const allEvents = [...data.events, ...(data.milestones || [])].map((e: any) => ({
                    ...e,
                    date: e.startDate || e.date
                }));
                setEvents(allEvents);
            }
        } catch (error) {
            console.error("Failed to load calendar", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotesForDate = async (date: Date) => {
        try {
            const res = await fetch(`/api/creative/notes?date=${date.toISOString()}`);
            if (res.ok) {
                const data = await res.json();
                setDayNotes(data.notes);
            }
        } catch (error) {
            console.error("Failed to fetch notes", error);
        }
    };

    const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickTitle.trim()) return;

        try {
            const res = await fetch("/api/calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: quickTitle,
                    startDate: selectedDate,
                    type: quickType,
                    status: "pending"
                })
            });
            if (res.ok) {
                setQuickTitle("");
                fetchEvents();
            }
        } catch (error) {
            console.error("Failed to create event", error);
        }
    };

    const handleToggleStatus = async (event: CalendarEvent) => {
        const newStatus = event.status === "completed" ? "pending" : "completed";
        setEvents(prev => prev.map(e => e._id === event._id ? { ...e, status: newStatus } : e));

        try {
            await fetch(`/api/calendar/${event._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (error) {
            console.error("Failed to update status", error);
            fetchEvents();
        }
    };

    const confirmDeleteEvent = async () => {
        if (!itemToDelete) return;
        const id = itemToDelete.id;

        // Optimistic update
        setEvents(prev => prev.filter(e => e._id !== id));
        setItemToDelete(null);

        try {
            await fetch(`/api/calendar/${id}`, { method: "DELETE" });
        } catch (error) {
            console.error("Failed to delete event", error);
            fetchEvents();
        }
    };

    const startEditing = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingEventId(event._id);
        setEditTitle(event.title);
    };

    const saveEdit = async (id: string) => {
        if (!editTitle.trim()) return;

        setEvents(prev => prev.map(e => e._id === id ? { ...e, title: editTitle } : e));
        setEditingEventId(null);

        try {
            await fetch(`/api/calendar/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: editTitle })
            });
        } catch (error) {
            console.error("Failed to update title", error);
            fetchEvents();
        }
    };

    const handleSaveNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        try {
            const res = await fetch("/api/creative/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newNote,
                    category: "journal",
                    date: selectedDate,
                    tags: ["calendar"]
                })
            });
            if (res.ok) {
                setNewNote("");
                setIsAddingNote(false);
                fetchNotesForDate(selectedDate);
            }
        } catch (error) {
            console.error("Failed to save note", error);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getEventsForDate = (date: Date) => {
        return events.filter(e => isSameDay(parseISO(e.date), date));
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8 relative z-20">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h2 className="text-4xl font-black font-mono uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-theme-primary via-accent to-theme-primary animate-pulse">
                            {format(currentMonth, "MMMM")}
                        </h2>
                        <span className="text-sm font-mono text-theme-muted uppercase tracking-[0.5em] ml-1">
                            {format(currentMonth, "yyyy")}
                        </span>
                    </div>

                    <div className="flex gap-2 items-center bg-theme-secondary/20 p-1 rounded-full border border-theme/10 backdrop-blur-sm">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-theme-secondary/50 rounded-full text-theme-muted hover:text-theme-primary transition-all">
                            <ChevronLeft size={16} />
                        </button>
                        <div className="w-px h-4 bg-theme/20" />
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-theme-secondary/50 rounded-full text-theme-muted hover:text-theme-primary transition-all">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="group p-2 hover:bg-red-500/10 rounded-full transition-all">
                        <X size={24} className="text-theme-muted group-hover:text-red-500 transition-colors" />
                    </button>
                </div>
            </div>
        );
    };

    const renderCalendarGrid = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        // Days Header
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            weekDays.push(
                <div className="text-center font-mono text-[9px] uppercase tracking-widest text-theme-muted/50 py-3" key={i}>
                    {format(addDays(startDate, i), "eeee")}
                </div>
            );
        }

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const dayEvents = getEventsForDate(day);

                days.push(
                    <div
                        className={`
                            relative h-28 p-2 border border-theme/5 transition-all duration-300 cursor-pointer overflow-hidden group
                            ${!isCurrentMonth ? "bg-theme-tertiary/20 text-theme-muted/20 opacity-50" : "bg-theme-secondary/10 hover:bg-theme-secondary/20"}
                            ${isSelected ? "ring-2 ring-accent/50 bg-accent/5 z-10 shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]" : ""}
                            ${isToday ? "bg-theme-primary/10" : ""}
                        `}
                        key={day.toString()}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        {/* Date Number */}
                        <span className={`
                            absolute top-2 left-2 text-xs font-mono font-bold transition-all
                            ${isSelected ? "text-accent scale-110" : isCurrentMonth ? "text-theme-muted" : "text-theme-muted/20"}
                            ${isToday && !isSelected ? "text-theme-primary" : ""}
                        `}>
                            {formattedDate}
                        </span>

                        {/* Event Dots/Bars */}
                        <div className="mt-6 space-y-1">
                            {dayEvents.slice(0, 3).map((event, idx) => (
                                <div key={idx} className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm backdrop-blur-[1px] border border-theme/5 ${event.status === 'completed' ? 'opacity-50 grayscale' : 'bg-theme-secondary/50'
                                    }`}>
                                    <div className={`w-1 h-1 rounded-full ${event.type === 'milestone' ? 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]' :
                                        event.type === 'deadline' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]' :
                                            event.type === 'habit' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' :
                                                event.type === 'task' ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]' :
                                                    'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]'
                                        }`} />
                                    <span className={`text-[8px] font-mono truncate text-theme-primary/80 ${event.status === 'completed' ? 'line-through' : ''}`}>
                                        {event.title}
                                    </span>
                                </div>
                            ))}
                            {dayEvents.length > 3 && (
                                <div className="text-[8px] text-theme-muted pl-1">+ {dayEvents.length - 3} more</div>
                            )}
                        </div>

                        {/* Selection Highlight */}
                        {isSelected && (
                            <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }

        return (
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="grid grid-cols-7 border-b border-theme/10">{weekDays}</div>
                <div className="flex-1 border border-theme/10 rounded-lg overflow-hidden bg-theme-secondary/5 backdrop-blur-sm">
                    {rows}
                </div>
            </div>
        );
    };

    const renderSidePanel = () => {
        const selectedEvents = getEventsForDate(selectedDate);
        const isToday = isSameDay(selectedDate, new Date());

        return (
            <div className="w-96 border-l border-theme/20 bg-theme-primary/95 backdrop-blur-xl p-0 flex flex-col h-full shadow-2xl z-30">
                {/* Header */}
                <div className="p-6 border-b border-theme/10 bg-theme-secondary/10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-theme-muted mb-1">
                        {isToday ? "Today's Agenda" : "Selected Date"}
                    </h3>
                    <div className="text-3xl font-black font-mono text-theme-primary flex items-baseline gap-2">
                        {format(selectedDate, "dd")}
                        <span className="text-lg font-normal text-theme-muted opacity-60">{format(selectedDate, "MMM")}</span>
                    </div>
                    <div className="text-sm text-theme-secondary/80 font-mono mt-1">
                        {format(selectedDate, "EEEE, yyyy")}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                    {/* Events Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-theme-muted flex items-center gap-2">
                                <CheckCircle size={12} /> Tasks & Events
                            </h4>
                            <span className="text-[10px] text-theme-muted/50 font-mono">{selectedEvents.length} items</span>
                        </div>

                        <div className="space-y-2">
                            {selectedEvents.length === 0 ? (
                                <div className="p-4 text-center text-theme-muted/40 text-xs italic border border-dashed border-theme/10 rounded-lg">
                                    No events scheduled
                                </div>
                            ) : (
                                selectedEvents.map(event => (
                                    <div key={event._id} className={`group relative p-3 rounded-md border transition-all ${event.status === 'completed'
                                        ? 'bg-theme-secondary/10 border-theme/5 opacity-60'
                                        : 'bg-theme-secondary/20 border-theme/10 hover:border-accent/30 hover:bg-theme-secondary/40'
                                        }`}>
                                        <div className="flex items-start gap-3">
                                            {/* Checkbox / Status Toggle */}
                                            <button
                                                onClick={() => handleToggleStatus(event)}
                                                className={`mt-0.5 transition-colors ${event.status === 'completed' ? 'text-green-500' : 'text-theme-muted hover:text-theme-primary'}`}
                                            >
                                                {event.status === 'completed' ? <CheckSquare size={16} /> : <Square size={16} />}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                {editingEventId === event._id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            value={editTitle}
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            className="flex-1 bg-black/20 border border-theme/20 rounded px-2 py-1 text-sm text-theme-primary focus:outline-none focus:border-accent"
                                                            autoFocus
                                                        />
                                                        <button onClick={() => saveEdit(event._id)} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                                                            <Save size={14} />
                                                        </button>
                                                        <button onClick={() => setEditingEventId(null)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h4 className={`text-sm font-bold leading-tight mb-1 transition-colors ${event.status === 'completed' ? 'text-theme-muted line-through' : 'text-theme-primary group-hover:text-accent'
                                                            }`}>
                                                            {event.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-theme/10 flex items-center gap-1 ${event.type === 'milestone' ? 'bg-purple-500/20 text-purple-400' :
                                                                event.type === 'deadline' ? 'bg-red-500/20 text-red-400' :
                                                                    event.type === 'habit' ? 'bg-green-500/20 text-green-400' :
                                                                        event.type === 'task' ? 'bg-orange-500/20 text-orange-400' :
                                                                            'bg-blue-500/20 text-blue-400'
                                                                }`}>
                                                                <div className={`w-1 h-1 rounded-full ${event.type === 'milestone' ? 'bg-purple-500' :
                                                                    event.type === 'deadline' ? 'bg-red-500' :
                                                                        event.type === 'habit' ? 'bg-green-500' :
                                                                            event.type === 'task' ? 'bg-orange-500' :
                                                                                'bg-blue-500'
                                                                    }`} />
                                                                {event.type}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {!editingEventId && (
                                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={(e) => startEditing(event, e)}
                                                        className="p-1 text-theme-muted hover:text-accent transition-all"
                                                        title="Edit Event"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setItemToDelete({ id: event._id, type: 'event' });
                                                        }}
                                                        className="p-1 text-theme-muted hover:text-red-500 transition-all"
                                                        title="Delete Event"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-theme/10 w-full" />

                    {/* Journal/Notes Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-theme-muted flex items-center gap-2">
                                <StickyNote size={12} /> Daily Journal
                            </h4>
                            <button
                                onClick={() => setIsAddingNote(!isAddingNote)}
                                className="text-[10px] text-accent hover:underline uppercase tracking-wider font-bold"
                            >
                                {isAddingNote ? "Cancel" : "+ Add Entry"}
                            </button>
                        </div>

                        {isAddingNote && (
                            <form onSubmit={handleSaveNote} className="mb-4 animate-in fade-in slide-in-from-top-2">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Write your thoughts for today..."
                                    className="w-full bg-black/20 border border-theme/20 rounded-md p-3 text-sm text-theme-primary placeholder:text-theme-muted/50 focus:outline-none focus:border-accent/50 min-h-[100px] resize-none mb-2"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!newNote.trim()}
                                    className="w-full py-2 bg-theme-primary border border-accent text-accent hover:bg-accent hover:text-theme-primary text-xs font-bold uppercase tracking-wider rounded transition-all"
                                >
                                    Save Entry
                                </button>
                            </form>
                        )}

                        <div className="space-y-3">
                            {dayNotes.length === 0 ? (
                                <div className="p-4 text-center text-theme-muted/30 text-xs italic">
                                    No journal entries for this day.
                                </div>
                            ) : (
                                dayNotes.map(note => (
                                    <div key={note._id} className="bg-theme-tertiary/30 border border-theme/5 rounded-md p-3 text-sm text-theme-secondary">
                                        <p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                        <div className="mt-2 flex items-center gap-2 text-[10px] text-theme-muted/60">
                                            <Clock size={10} />
                                            {format(parseISO(note.date || note.createdAt), "h:mm a")}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

                {/* Quick Add Form (Fixed Bottom) */}
                <div className="mt-auto p-4 bg-theme-secondary/10 border-t border-theme/10">
                    <div className="mb-2 flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-theme-muted flex items-center gap-1">
                            <Zap size={10} className="text-accent" />
                            Quick Add
                        </label>
                    </div>

                    {/* Clearer Type Selectors */}
                    <div className="flex gap-2 mb-3">
                        {(['task', 'session', 'deadline'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setQuickType(t)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all border ${quickType === t
                                    ? 'bg-theme-primary text-theme-secondary border-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]'
                                    : 'bg-theme-secondary text-theme-muted border-theme/10 hover:bg-theme-tertiary hover:text-theme-primary'
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${t === 'task' ? 'bg-orange-500' : t === 'session' ? 'bg-blue-500' : 'bg-red-500'
                                    }`} />
                                {t}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleQuickAdd} className="relative group flex gap-2">
                        <input
                            type="text"
                            value={quickTitle}
                            onChange={(e) => setQuickTitle(e.target.value)}
                            placeholder={`Add a new ${quickType}...`}
                            className="flex-1 bg-theme-secondary border border-theme/20 text-sm p-3 rounded-lg text-theme-primary placeholder:text-theme-muted/50 focus:outline-none focus:border-accent/50 focus:bg-theme-tertiary transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!quickTitle}
                            className={`px-4 rounded-lg font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 ${quickTitle
                                ? 'bg-accent text-theme-primary opacity-100 hover:scale-105'
                                : 'bg-theme-secondary text-theme-muted opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <Plus size={16} />
                            Add
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-theme-primary/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-theme-secondary/95 border border-theme/30 w-full max-w-6xl h-[85vh] flex shadow-2xl rounded-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background Effects */}
                <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                    <ParticleNetwork />
                </div>
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                {/* Main Content Layout (Flexbox) */}
                <div className="flex w-full h-full relative z-10">
                    {/* Calendar Grid Section */}
                    <div className="flex-1 p-8 flex flex-col h-full min-w-0">
                        {renderHeader()}

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader className="animate-spin text-accent" size={40} />
                            </div>
                        ) : (
                            renderCalendarGrid()
                        )}
                    </div>

                    {/* Side Panel Section */}
                    {renderSidePanel()}
                </div>

                {/* Confirm Delete Modal */}
                <ConfirmationModal
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={confirmDeleteEvent}
                    title="DELETE EVENT"
                    message="Are you sure you want to delete this event? This action cannot be undone."
                    confirmText="DELETE"
                    isDangerous={true}
                />
            </div>
        </div>
    );
};
