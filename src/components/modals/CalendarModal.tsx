import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Loader, Plus, CheckCircle, AlertCircle, Clock, Calendar as CalendarIcon, Filter, Layers, Zap } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from "date-fns";
import { useAuth } from "../../hooks/use-auth";
import ParticleNetwork from "../ParticleNetwork";

interface CalendarEvent {
    _id: string;
    title: string;
    date: string; // ISO string
    type: "session" | "habit" | "deadline" | "milestone" | "task";
    status: "pending" | "completed" | "missed";
    projectId?: string;
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
    const [loading, setLoading] = useState(false);

    // Quick Add State
    const [quickTitle, setQuickTitle] = useState("");
    const [quickType, setQuickType] = useState<CalendarEvent["type"]>("task");

    useEffect(() => {
        if (isOpen) {
            fetchEvents();
        }
    }, [isOpen]);

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
                    type: quickType, // Defaulting to 'task' or user selection
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
                const hasEvents = dayEvents.length > 0;

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
                                <div key={idx} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm bg-theme-secondary/50 backdrop-blur-[1px] border border-white/5">
                                    <div className={`w-1 h-1 rounded-full ${event.type === 'milestone' ? 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]' :
                                        event.type === 'deadline' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]' :
                                            event.type === 'habit' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' :
                                                'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]'
                                        }`} />
                                    <span className="text-[8px] font-mono truncate text-theme-primary/80">{event.title}</span>
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
            <div className="w-full md:w-80 border-l border-theme/20 bg-theme-primary/80 backdrop-blur-xl p-6 flex flex-col h-full absolute right-0 top-0 bottom-0 shadow-2xl z-30 transition-all duration-500 ease-in-out transform translate-x-0">
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-theme-muted mb-1">
                        {isToday ? "Today's Agenda" : "Selected Date"}
                    </h3>
                    <div className="text-3xl font-black font-mono text-theme-primary flex items-baseline gap-2">
                        {format(selectedDate, "dd")}
                        <span className="text-lg font-normal text-theme-muted opacity-60">{format(selectedDate, "MMM")}</span>
                    </div>
                    <div className="text-sm text-theme-secondary/80 font-mono mt-1">
                        {format(selectedDate, "EEEE")}
                    </div>
                </div>

                {/* Event List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-6 pr-2">
                    {selectedEvents.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-theme-muted/30 border-2 border-dashed border-theme/10 rounded-lg">
                            <Layers size={24} className="mb-2 opacity-50" />
                            <span className="text-[10px] uppercase tracking-widest">No Events</span>
                        </div>
                    ) : (
                        selectedEvents.map(event => (
                            <div key={event._id} className="group relative p-3 rounded-md bg-theme-secondary/20 border border-theme/10 hover:border-accent/30 hover:bg-theme-secondary/40 transition-all">
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${event.type === 'milestone' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' :
                                        event.type === 'deadline' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                                            event.type === 'habit' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                                                event.type === 'task' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' :
                                                    'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                                        }`} />
                                    <div>
                                        <h4 className="text-sm font-bold text-theme-primary leading-tight mb-1 group-hover:text-accent transition-colors">{event.title}</h4>
                                        <span className="text-[9px] font-mono text-theme-muted uppercase px-1.5 py-0.5 rounded bg-theme-tertiary border border-theme/10">
                                            {event.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Quick Add Form */}
                <div className="mt-auto">
                    <div className="mb-2 flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-theme-muted flex items-center gap-1">
                            <Zap size={10} className="text-accent" />
                            Quick Add
                        </label>

                        {/* Type Toggle for Quick Add */}
                        <div className="flex bg-theme-secondary rounded p-0.5">
                            {(['task', 'session', 'deadline'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setQuickType(t)}
                                    className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all ${quickType === t ? 'bg-theme-primary shadow-sm' : 'text-theme-muted hover:text-white'}`}
                                    title={t}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${t === 'task' ? 'bg-orange-500' : t === 'session' ? 'bg-blue-500' : 'bg-red-500'
                                        }`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleQuickAdd} className="relative group">
                        <input
                            type="text"
                            value={quickTitle}
                            onChange={(e) => setQuickTitle(e.target.value)}
                            placeholder="Add a task..."
                            className="w-full bg-theme-secondary border border-theme/20 text-sm p-3 rounded-lg text-theme-primary placeholder:text-theme-muted/50 focus:outline-none focus:border-accent/50 focus:bg-theme-tertiary transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!quickTitle}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-accent text-theme-primary rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-0 transition-all hover:scale-105"
                        >
                            <Plus size={14} />
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

                {/* Main Content (Calendar) */}
                <div className="flex-1 p-8 pr-80 md:pr-[22rem] z-10 flex flex-col h-full">
                    {/* The padding-right reserves space for the absolute positioned sidebar */}
                    {renderHeader()}

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader className="animate-spin text-accent" size={40} />
                        </div>
                    ) : (
                        renderCalendarGrid()
                    )}
                </div>

                {/* Side Panel (Tasks & Details) */}
                {renderSidePanel()}
            </div>
        </div>
    );
};
