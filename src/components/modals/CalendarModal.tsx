import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Loader, Plus, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from "date-fns";
import { useAuth } from "../../hooks/use-auth";

interface CalendarEvent {
    _id: string;
    title: string;
    date: string; // ISO string
    type: "session" | "habit" | "deadline" | "milestone";
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
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        type: "session" as CalendarEvent["type"],
    });

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
                // Merge events and milestones
                const allEvents = [...data.events, ...data.milestones].map((e: any) => ({
                    ...e,
                    date: e.startDate || e.date // normalization
                }));
                setEvents(allEvents);
            }
        } catch (error) {
            console.error("Failed to load calendar", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newEvent.title,
                    startDate: new Date(newEvent.date),
                    type: newEvent.type,
                    status: "pending"
                })
            });
            if (res.ok) {
                setShowAddForm(false);
                setNewEvent({ title: "", date: format(new Date(), "yyyy-MM-dd"), type: "session" });
                fetchEvents();
            }
        } catch (error) {
            console.error("Failed to create event", error);
        }
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold font-mono uppercase tracking-widest text-theme-primary">
                        {format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <div className="flex gap-1">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-theme-secondary/20 rounded text-theme-muted hover:text-theme-primary transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-theme-secondary/20 rounded text-theme-muted hover:text-theme-primary transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-theme-primary transition-all font-mono text-xs font-bold uppercase tracking-widest"
                    >
                        <Plus size={14} /> Add Event
                    </button>
                    <button onClick={onClose} className="text-theme-muted hover:text-theme-primary">
                        <X size={24} />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const dateFormat = "eeee";
        const days = [];
        let startDate = startOfWeek(currentMonth);

        for (let i = 0; i < 7; i++) {
            days.push(
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-theme-muted py-2 border-b border-theme/20" key={i}>
                    {format(addDays(startDate, i), dateFormat)}
                </div>
            );
        }
        return <div className="grid grid-cols-7 mb-2">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;

                const dayEvents = events.filter(e => isSameDay(parseISO(e.date), cloneDay));

                days.push(
                    <div
                        className={`min-h-[100px] p-2 border border-theme/10 relative group hover:bg-theme-secondary/5 transition-colors ${!isSameMonth(day, monthStart)
                                ? "text-theme-muted/20 bg-black/20"
                                : isSameDay(day, new Date()) ? "bg-accent/5 ring-1 ring-inset ring-accent/30" : "bg-theme-secondary/10"
                            }`}
                        key={day.toString()}
                    >
                        <span className={`text-xs font-mono font-bold ${!isSameMonth(day, monthStart) ? "text-theme-muted/20" : "text-theme-muted"}`}>{formattedDate}</span>

                        <div className="mt-2 space-y-1">
                            {dayEvents.map((event, idx) => (
                                <div
                                    key={event._id || idx}
                                    className={`text-[9px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1.5
                    ${event.type === 'milestone' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                                            event.type === 'deadline' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                                event.type === 'habit' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                                    'bg-blue-500/10 border-blue-500/30 text-blue-400'}
                  `}
                                    title={event.title}
                                >
                                    {event.type === 'milestone' && <CheckCircle size={8} />}
                                    {event.type === 'deadline' && <AlertCircle size={8} />}
                                    {event.type === 'session' && <Clock size={8} />}
                                    <span className="truncate">{event.title}</span>
                                </div>
                            ))}
                        </div>

                        {isSameMonth(day, monthStart) && (
                            <button
                                onClick={() => {
                                    setNewEvent({ ...newEvent, date: format(cloneDay, "yyyy-MM-dd") });
                                    setShowAddForm(true);
                                }}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-theme-primary rounded text-theme-muted hover:text-theme-primary transition-all"
                            >
                                <Plus size={12} />
                            </button>
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
        return <div className="border border-theme/20 bg-theme-primary/40 backdrop-blur-sm rounded-sm overflow-hidden">{rows}</div>;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-8">
            <div className="bg-theme-secondary/90 border border-theme w-full max-w-6xl h-full max-h-[90vh] flex flex-col shadow-2xl rounded-lg overflow-hidden relative">
                {/* CRT Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar relative z-10">
                    {renderHeader()}
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader className="animate-spin text-accent" size={32} />
                        </div>
                    ) : (
                        <>
                            {renderDays()}
                            {renderCells()}
                        </>
                    )}
                </div>

                {/* Add Event Modal Overlay */}
                {showAddForm && (
                    <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center">
                        <div className="bg-theme-primary border border-theme p-6 w-full max-w-sm shadow-xl">
                            <h3 className="text-lg font-bold text-theme-primary mb-4 uppercase">New Event</h3>
                            <form onSubmit={handleAddEvent} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-theme-muted mb-1">Title</label>
                                    <input
                                        required
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                        className="w-full bg-theme-secondary border border-theme p-2 text-sm text-theme-primary outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-theme-muted mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newEvent.date}
                                        onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                        className="w-full bg-theme-secondary border border-theme p-2 text-sm text-theme-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-theme-muted mb-1">Type</label>
                                    <select
                                        value={newEvent.type}
                                        onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                                        className="w-full bg-theme-secondary border border-theme p-2 text-sm text-theme-primary outline-none"
                                    >
                                        <option value="session">Session</option>
                                        <option value="habit">Habit</option>
                                        <option value="deadline">Deadline</option>
                                        <option value="milestone">Milestone</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2 border border-theme text-theme-muted hover:bg-theme-secondary transition-colors text-xs font-bold uppercase">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 bg-accent text-theme-primary font-bold text-xs uppercase hover:bg-accent/80 transition-colors">Add</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
