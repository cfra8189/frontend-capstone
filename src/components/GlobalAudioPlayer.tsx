import { useAudioPlayer } from "../context/AudioPlayerContext";
import { Play, Pause, X, Volume2 } from "lucide-react";

export default function GlobalAudioPlayer() {
    const { currentTrack, isPlaying, currentTime, duration, togglePlay, seekTo, close } = useAudioPlayer();

    if (!currentTrack) return null;

    function formatTime(seconds: number): string {
        if (!isFinite(seconds) || seconds < 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[500] animate-slide-up"
            style={{ animation: "slideUp 0.3s ease-out" }}
        >
            {/* Subtle top border glow */}
            <div className="h-px bg-gradient-to-r from-transparent via-theme-muted/30 to-transparent" />

            <div className="bg-theme-secondary/95 backdrop-blur-xl border-t border-theme/20 px-4 py-2.5">
                <div className="max-w-6xl mx-auto flex items-center gap-3">

                    {/* Play/Pause */}
                    <button
                        onClick={togglePlay}
                        className="w-9 h-9 rounded-full bg-theme-primary/30 border border-theme/20 flex items-center justify-center hover:bg-theme-primary/50 transition-all flex-shrink-0 text-theme-primary"
                    >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                    </button>

                    {/* Track Info */}
                    <div className="min-w-0 flex-shrink-0 max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                            <Volume2 size={10} className="text-theme-muted flex-shrink-0" />
                            <p className="text-[10px] font-bold text-theme-primary uppercase tracking-widest truncate">
                                {currentTrack.title}
                            </p>
                        </div>
                        {currentTrack.artist && (
                            <p className="text-[9px] text-theme-muted uppercase tracking-wider truncate">{currentTrack.artist}</p>
                        )}
                    </div>

                    {/* Time + Seek */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-[9px] font-mono text-theme-muted w-8 text-right flex-shrink-0">
                            {formatTime(currentTime)}
                        </span>

                        {/* Progress bar */}
                        <div
                            className="flex-1 h-1 bg-theme-primary/15 rounded-full cursor-pointer group relative"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const pct = x / rect.width;
                                seekTo(pct * duration);
                            }}
                        >
                            <div
                                className="h-full bg-theme-primary/60 rounded-full transition-all relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-theme-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <span className="text-[9px] font-mono text-theme-muted w-8 flex-shrink-0">
                            {formatTime(duration)}
                        </span>
                    </div>

                    {/* Close */}
                    <button
                        onClick={close}
                        className="w-6 h-6 flex items-center justify-center rounded-sm text-theme-muted hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}
