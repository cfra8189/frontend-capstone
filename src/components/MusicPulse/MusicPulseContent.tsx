import { useState, useEffect, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { Plus, RefreshCw, Trash2, TrendingUp, Eye, ThumbsUp, MessageSquare, ExternalLink } from 'lucide-react';

// ---------- Types ----------
interface TrackedTrack {
    id: string;
    trackName: string;
    youtubeUrl: string;
    videoId: string;
    currentPlays: number;
    currentLikes: number;
    currentComments: number;
    growth7d: number;
    status: string;
    promoRecommendation: string;
    dateAdded: string;
    lastUpdated: string;
}

interface HistoryPoint {
    id: string;
    trackId: string;
    trackName: string;
    plays: number;
    likes: number;
    comments: number;
    timestamp: string;
}

// Colors for chart lines
const TRACK_COLORS = [
    '#ffffff', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373',
    '#525252', '#404040', '#262626', '#171717', '#0a0a0a',
];

// ---------- Main Component ----------
export default function MusicPulseContent() {
    const [tracks, setTracks] = useState<TrackedTrack[]>([]);
    const [history, setHistory] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ---------- Data Fetching ----------
    const fetchTracks = useCallback(async () => {
        try {
            const res = await fetch('/api/pulse/tracks', { credentials: 'include' });
            const data = await res.json();
            setTracks(data.tracks || []);
        } catch (err) {
            console.error('Failed to fetch tracks:', err);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch('/api/pulse/history', { credentials: 'include' });
            const data = await res.json();
            setHistory(data.history || []);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    }, []);

    useEffect(() => {
        Promise.all([fetchTracks(), fetchHistory()]).finally(() => setLoading(false));
    }, [fetchTracks, fetchHistory]);

    // ---------- Actions ----------
    const handleRefreshAll = async () => {
        setRefreshing(true);
        setError(null);
        try {
            const res = await fetch('/api/pulse/refresh', { method: 'POST', credentials: 'include' });
            const data = await res.json();
            if (data.tracks) setTracks(data.tracks.map((t: any) => ({ ...t, id: t.id || t._id })));
            await fetchHistory();
        } catch (err) {
            setError('Failed to refresh. Check your YouTube API key.');
        }
        setRefreshing(false);
    };

    const handleAddTrack = async (trackName: string, youtubeUrl: string) => {
        setError(null);
        try {
            const res = await fetch('/api/pulse/tracks', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackName, youtubeUrl }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Failed to add track');
                return;
            }
            setShowAddModal(false);
            await Promise.all([fetchTracks(), fetchHistory()]);
        } catch (err) {
            setError('Failed to add track');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this track from Music Pulse?')) return;
        try {
            await fetch(`/api/pulse/tracks/${id}`, { method: 'DELETE', credentials: 'include' });
            await Promise.all([fetchTracks(), fetchHistory()]);
        } catch (err) {
            setError('Failed to delete track');
        }
    };

    // ---------- Chart Data Transformation ----------
    const chartData = (() => {
        if (history.length === 0) return [];

        // Group history by timestamp (rounded to nearest hour)
        const timeMap = new Map<string, any>();

        history.forEach((h) => {
            const d = new Date(h.timestamp);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;

            if (!timeMap.has(key)) {
                timeMap.set(key, { date: key, _ts: d.getTime() });
            }
            const entry = timeMap.get(key)!;
            entry[h.trackName] = h.plays;
        });

        return Array.from(timeMap.values()).sort((a, b) => a._ts - b._ts);
    })();

    const trackNames = [...new Set(history.map((h) => h.trackName))];

    // ---------- Dashboard Summary ----------
    const totalPlays = tracks.reduce((sum, t) => sum + t.currentPlays, 0);
    const bestTrack = tracks.length > 0
        ? tracks.reduce((best, t) => (t.currentPlays > best.currentPlays ? t : best), tracks[0])
        : null;
    const worthPromoting = tracks.filter((t) => t.growth7d > 15).length;

    // ---------- Render ----------
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-theme-muted animate-pulse text-xs uppercase tracking-widest">Loading Music Pulse...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 pb-20 custom-scrollbar space-y-5">

            {/* Error Banner */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 text-xs font-mono rounded-sm">
                    {error}
                    <button onClick={() => setError(null)} className="ml-3 underline hover:no-underline">dismiss</button>
                </div>
            )}

            {/* ─── Dashboard Summary ─── */}
            <div className="border border-theme/15 bg-theme-secondary/20 backdrop-blur-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted">Music Pulse Dashboard</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent text-[9px] font-bold uppercase tracking-widest hover:bg-accent/20 transition-all"
                        >
                            <Plus size={12} /> Add Track
                        </button>
                        <button
                            onClick={handleRefreshAll}
                            disabled={refreshing}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-secondary/30 border border-theme/20 text-theme-muted text-[9px] font-bold uppercase tracking-widest hover:bg-theme-secondary/50 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh All'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Tracks Monitored" value={tracks.length.toString()} icon={<TrendingUp size={14} />} />
                    <StatCard label="Total Views" value={totalPlays.toLocaleString()} icon={<Eye size={14} />} />
                    <StatCard label="Best Performer" value={bestTrack?.trackName || '—'} sub={bestTrack?.status} icon={<ThumbsUp size={14} />} />
                    <StatCard label="Worth Promoting" value={`${worthPromoting} track${worthPromoting !== 1 ? 's' : ''}`} sub="Growth > 15%" icon={<TrendingUp size={14} />} />
                </div>
            </div>

            {/* ─── Performance Line Chart ─── */}
            {chartData.length > 0 && (
                <div className="border border-theme/15 bg-theme-secondary/20 backdrop-blur-md p-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted mb-4">Performance Over Time</h3>
                    <ResponsiveContainer width="100%" height={340}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                                tickFormatter={(val) => {
                                    const d = new Date(val);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }}
                                stroke="rgba(255,255,255,0.1)"
                            />
                            <YAxis
                                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toString()}
                                stroke="rgba(255,255,255,0.1)"
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#0a0a0a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: '#fff',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                }}
                                itemStyle={{ color: '#e5e5e5' }}
                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                labelFormatter={(label) => {
                                    const d = new Date(label);
                                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                                }}
                                formatter={(value: number, name: string) => [`${value.toLocaleString()} views`, name]}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                                iconType="circle"
                                iconSize={8}
                            />
                            {trackNames.map((name, i) => (
                                <Line
                                    key={name}
                                    type="monotone"
                                    dataKey={name}
                                    stroke={TRACK_COLORS[i % TRACK_COLORS.length]}
                                    strokeWidth={2.5}
                                    dot={{ r: 3, fill: TRACK_COLORS[i % TRACK_COLORS.length] }}
                                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ─── Engagement Comparison Bar Chart ─── */}
            {tracks.length > 0 && (
                <div className="border border-theme/15 bg-theme-secondary/20 backdrop-blur-md p-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted mb-4">Engagement Breakdown</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={tracks.map((t) => ({
                                name: t.trackName.length > 18 ? t.trackName.slice(0, 18) + '…' : t.trackName,
                                Views: t.currentPlays,
                                Likes: t.currentLikes,
                                Comments: t.currentComments,
                            }))}
                            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} stroke="rgba(255,255,255,0.1)" />
                            <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} stroke="rgba(255,255,255,0.1)" />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{
                                    background: '#0a0a0a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: '#fff',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                }}
                                itemStyle={{ color: '#e5e5e5' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconSize={8} />
                            <Bar dataKey="Views" fill="#ffffff" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="Likes" fill="#a3a3a3" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="Comments" fill="#525252" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ─── Track Table ─── */}
            <div className="border border-theme/15 bg-theme-secondary/20 backdrop-blur-md">
                <div className="p-4 border-b border-theme/10">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted">Tracked Videos</h3>
                </div>

                {tracks.length === 0 ? (
                    <div className="p-10 text-center">
                        <TrendingUp size={32} className="mx-auto text-theme-muted/30 mb-3" />
                        <p className="text-sm text-theme-muted mb-1">No tracks being monitored yet</p>
                        <p className="text-xs text-theme-muted/60 mb-4">Add a YouTube video to start tracking its performance</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 text-accent text-[10px] font-bold uppercase tracking-widest hover:bg-accent/20 transition-all"
                        >
                            <Plus size={14} /> Add Your First Track
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-theme/10 text-[9px] font-bold uppercase tracking-[0.2em] text-theme-muted">
                                    <th className="text-left p-3">Track</th>
                                    <th className="text-right p-3">Views</th>
                                    <th className="text-right p-3">Likes</th>
                                    <th className="text-right p-3">Comments</th>
                                    <th className="text-right p-3">7d Growth</th>
                                    <th className="text-center p-3">Status</th>
                                    <th className="text-left p-3">Recommendation</th>
                                    <th className="text-center p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tracks.map((track) => (
                                    <tr key={track.id} className="border-b border-theme/5 hover:bg-theme-secondary/20 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <div className="font-semibold text-theme-primary text-sm">{track.trackName}</div>
                                                    <a
                                                        href={track.youtubeUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] text-accent/60 hover:text-accent flex items-center gap-1 mt-0.5"
                                                    >
                                                        <ExternalLink size={9} /> youtube.com
                                                    </a>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-right p-3 font-mono text-theme-primary">{track.currentPlays.toLocaleString()}</td>
                                        <td className="text-right p-3 font-mono text-theme-primary">{track.currentLikes.toLocaleString()}</td>
                                        <td className="text-right p-3 font-mono text-theme-primary">{track.currentComments.toLocaleString()}</td>
                                        <td className="text-right p-3 font-mono">
                                            <span className={`${track.growth7d > 5 ? 'text-emerald-400' : track.growth7d < -5 ? 'text-red-400' : 'text-theme-muted'}`}>
                                                {track.growth7d > 0 ? '+' : ''}{track.growth7d}%
                                            </span>
                                        </td>
                                        <td className="text-center p-3 text-sm">{track.status}</td>
                                        <td className="text-left p-3 text-[10px] text-theme-muted leading-relaxed">{track.promoRecommendation}</td>
                                        <td className="text-center p-3">
                                            <button
                                                onClick={() => handleDelete(track.id)}
                                                className="p-1.5 text-theme-muted hover:text-red-400 transition-colors"
                                                title="Remove track"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── Last Updated ─── */}
            {tracks.length > 0 && (
                <div className="text-[9px] text-theme-muted/40 text-right uppercase tracking-widest">
                    Last updated: {tracks[0]?.lastUpdated ? new Date(tracks[0].lastUpdated).toLocaleString() : 'Never'}
                </div>
            )}

            {/* ─── Add Track Modal ─── */}
            {showAddModal && (
                <AddTrackModal
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleAddTrack}
                />
            )}
        </div>
    );
}

// ---------- Sub-Components ----------

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
    return (
        <div className="bg-theme-secondary/30 border border-theme/10 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-theme-muted/50">
                {icon}
                <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{label}</span>
            </div>
            <div className="text-lg font-bold text-theme-primary truncate">{value}</div>
            {sub && <div className="text-[9px] text-theme-muted truncate">{sub}</div>}
        </div>
    );
}

function AddTrackModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string, url: string) => void }) {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !url.trim()) return;
        setSubmitting(true);
        await onSubmit(name.trim(), url.trim());
        setSubmitting(false);
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[300] p-6"
            onClick={onClose}
        >
            <div
                className="bg-theme-primary border border-theme/20 p-6 max-w-md w-full shadow-[0_0_60px_rgba(0,0,0,0.5)]"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-theme-primary mb-5">+ Add YouTube Track</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[9px] font-bold uppercase text-theme-primary mb-1.5 tracking-widest">Track / Video Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Summer Vibes (Official Video)"
                            required
                            className="w-full bg-theme-secondary border border-theme/20 p-2.5 text-sm text-theme-primary font-mono outline-none focus:border-accent transition-colors placeholder:text-theme-muted/30"
                        />
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold uppercase text-theme-primary mb-1.5 tracking-widest">YouTube URL</label>
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            required
                            className="w-full bg-theme-secondary border border-theme/20 p-2.5 text-sm text-theme-primary font-mono outline-none focus:border-accent transition-colors placeholder:text-theme-muted/30"
                        />
                        <p className="text-[8px] text-theme-muted/50 mt-1.5 tracking-wide">Supports youtube.com/watch?v=, youtu.be/, and youtube.com/shorts/ URLs</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={submitting || !name.trim() || !url.trim()}
                            className="flex-1 bg-accent/10 border border-accent/40 text-accent font-bold py-2.5 text-[10px] uppercase tracking-widest hover:bg-accent/20 transition-all disabled:opacity-40"
                        >
                            {submitting ? 'Adding...' : 'Add Track'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 bg-theme-secondary/30 border border-theme/20 text-theme-muted font-bold py-2.5 text-[10px] uppercase tracking-widest hover:bg-theme-secondary/50 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
