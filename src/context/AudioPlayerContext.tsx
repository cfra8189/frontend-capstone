import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";

interface TrackInfo {
    url: string;
    title: string;
    artist?: string;
}

interface AudioPlayerContextType {
    currentTrack: TrackInfo | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playTrack: (url: string, title: string, artist?: string) => void;
    pause: () => void;
    resume: () => void;
    togglePlay: () => void;
    seekTo: (time: number) => void;
    close: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function useAudioPlayer() {
    const ctx = useContext(AudioPlayerContext);
    if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
    return ctx;
}

function resolveAudioSrc(url: string): string {
    if (url.includes("drive.google.com")) {
        return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Lazily create the audio element (SSR-safe)
    const getAudio = useCallback(() => {
        if (!audioRef.current) {
            const audio = new Audio();
            audio.crossOrigin = "anonymous";
            audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
            audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
            audio.addEventListener("ended", () => setIsPlaying(false));
            audio.addEventListener("play", () => setIsPlaying(true));
            audio.addEventListener("pause", () => setIsPlaying(false));
            audioRef.current = audio;
        }
        return audioRef.current;
    }, []);

    const playTrack = useCallback((url: string, title: string, artist?: string) => {
        const audio = getAudio();
        const resolved = resolveAudioSrc(url);
        // If it's the same track, just resume
        if (currentTrack?.url === url && audio.src.includes(encodeURIComponent(url))) {
            audio.play();
            return;
        }
        audio.src = resolved;
        audio.load();
        audio.play();
        setCurrentTrack({ url, title, artist });
        setCurrentTime(0);
        setDuration(0);
    }, [getAudio, currentTrack]);

    const pause = useCallback(() => {
        audioRef.current?.pause();
    }, []);

    const resume = useCallback(() => {
        audioRef.current?.play();
    }, []);

    const togglePlay = useCallback(() => {
        if (isPlaying) pause();
        else resume();
    }, [isPlaying, pause, resume]);

    const seekTo = useCallback((time: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const close = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.src = "";
        }
        setCurrentTrack(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
    }, []);

    return (
        <AudioPlayerContext.Provider value={{
            currentTrack, isPlaying, currentTime, duration,
            playTrack, pause, resume, togglePlay, seekTo, close
        }}>
            {children}
        </AudioPlayerContext.Provider>
    );
}
