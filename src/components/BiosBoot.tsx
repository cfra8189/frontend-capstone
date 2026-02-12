import React, { useState, useEffect, useRef } from "react";

interface BiosBootProps {
    onComplete: () => void;
}

export default function BiosBoot({ onComplete }: BiosBootProps) {
    const [lines, setLines] = useState<string[]>([]);
    const [showPrompt, setShowPrompt] = useState(false);
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [showLogoTransition, setShowLogoTransition] = useState(false);
    const [showCursor, setShowCursor] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-focus input when prompt is shown
    useEffect(() => {
        if (showPrompt && inputRef.current && !showLogoTransition) {
            inputRef.current.focus();
        }
    }, [showPrompt, showLogoTransition]);

    // Blinking cursor effect
    useEffect(() => {
        const interval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // Scroll to bottom when lines change
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [lines, showPrompt, error]);

    // Boot sequence animation
    useEffect(() => {
        const bootSequence = [
            { text: ".rvr | REVERIE BIOS (C) 2026", delay: 500 },
            { text: "System Integrity Check ... 100%", delay: 800 },
            { text: "Processor: RVR-Elite 128-Core", delay: 1200 },
            { text: "Memory: 128TB Neural Link ... OK", delay: 1500 },
            { text: "Security Protocol: VAULT-7 Enforced", delay: 1700 },
            { text: "Biometric Scanners ... Active", delay: 1900 },
            { text: "Establishing Secure Tunnel ...", delay: 2100 },
            { text: "Encryption Key: RSA-4096 VALID", delay: 2300 },
            { text: "Mounting Virtual Drive ... REVERIE-MAIN", delay: 2800 },
            { text: "Accessing Archive ... RESTRICTED", delay: 3300 },
            { text: "Booting REVERIE OS...", delay: 4000 },
            { text: "Initializing High-Fidelity Environment...", delay: 5000 },
            { text: "Awaiting User Authentication...", delay: 6000 },
        ];

        let timeouts: NodeJS.Timeout[] = [];

        // Reset lines initially
        setLines([]);

        let accumDelay = 0;
        bootSequence.forEach((item) => {
            accumDelay = item.delay;
            const timeout = setTimeout(() => {
                setLines((prev) => [...prev, item.text]);
            }, item.delay);
            timeouts.push(timeout);
        });

        const promptTimeout = setTimeout(() => {
            setShowPrompt(true);
        }, accumDelay + 500);
        timeouts.push(promptTimeout);

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input === "@LTL2026") {
            setIsSuccess(true);
            setError("");

            // First show access granted message
            setTimeout(() => {
                // Then transition to logo screen
                setShowLogoTransition(true);

                // Finally complete boot sequence
                setTimeout(() => {
                    onComplete();
                }, 3500); // Extended slightly for the gif to play
            }, 1000);
        } else {
            setError("UNAUTHORIZED ACCESS DETECTED");
            setInput("");
            setTimeout(() => setError(""), 2000);
        }
    };

    if (showLogoTransition) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <img src="/background_gif/Box2.gif" alt="REVERIE" className="w-64 h-64 mb-8 object-contain" />
                    <div className="text-white font-mono tracking-[0.8em] text-xs opacity-70">ENTERING THE BOX</div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-black text-[#d4d4d4] font-mono p-8 overflow-y-auto cursor-text text-lg leading-relaxed select-none"
            onClick={() => inputRef.current?.focus()}
        >
            <div className="max-w-4xl mx-auto flex flex-col min-h-full">
                {/* Logo in BIOS Header */}
                {/* ASCII Art & Logo Header */}
                <div className="mb-0 text-center opacity-80 border-b border-gray-800/50 pb-6 relative overflow-hidden">
                    <div className="flex items-center justify-center gap-6">
                        <pre className="text-[6px] sm:text-[8px] md:text-[10px] leading-[6px] sm:leading-[8px] md:leading-[10px] text-accent font-bold whitespace-pre overflow-x-hidden opacity-50 select-none pointer-events-none">
{`
                                                                       
 _|_|_|    _|_|_|_|  _|      _|  _|_|_|_|  _|_|_|    _|_|_|  _|_|_|_|  
 _|    _|  _|        _|      _|  _|        _|    _|    _|    _|        
 _|_|_|    _|_|_|    _|      _|  _|_|_|    _|_|_|      _|    _|_|_|    
 _|    _|  _|          _|  _|    _|        _|    _|    _|    _|        
 _|    _|  _|_|_|_|      _|      _|_|_|_|  _|    _|  _|_|_|  _|_|_|_|  
                                                                       
                                                                       
`}
                        </pre>
                        <img src="/background_gif/Box2.gif" alt="RVR" className="h-16 w-auto" />
                        <div className="flex flex-col justify-center text-left">
                            <span className="font-bold text-white tracking-[0.2em] text-xl">.rvr</span>
                            <span className="text-[10px] tracking-widest opacity-60">REVERIE SYSTEM v2.0</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    {lines.map((line, i) => (
                        <div key={i} className="mb-1 text-shadow-glow font-light tracking-wide">{line}</div>
                    ))}

                    {showPrompt && !isSuccess && (
                        <form onSubmit={handleSubmit} className="mt-8">
                            <div className="flex flex-col gap-2">
                                <label className="text-white uppercase tracking-widest text-xs font-bold mb-2 opacity-80">
                                    Authenticate Access Level 5:
                                </label>
                                <div className="flex items-center group relative max-w-md">
                                    <span className="mr-3 text-accent text-xl">➜</span>
                                    <div className="relative flex items-center">
                                        <input
                                            ref={inputRef}
                                            type="password"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            className="bg-transparent border-b border-gray-700 focus:border-white transition-colors outline-none text-white w-full font-mono text-xl py-1 tracking-widest placeholder-gray-800"
                                            autoComplete="off"
                                            autoFocus
                                            placeholder="••••••"
                                            style={{
                                                caretColor: 'transparent',
                                                color: 'transparent'
                                            }}
                                        />
                                        <span className="absolute left-0 font-mono text-xl tracking-widest pointer-events-none">
                                            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                {input.replace(/./g, '•')}
                                            </span>
                                            <span style={{
                                                color: showCursor ? 'rgba(255, 255, 255, 0.6)' : 'transparent',
                                                textShadow: showCursor ? '0 0 4px rgba(255, 255, 255, 0.3)' : 'none',
                                                transition: 'all 0.2s ease-in-out'
                                            }}>
                                                █
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {error && (
                        <div className="mt-4 text-red-500 font-bold bg-red-900/20 inline-block px-2 py-1 border border-red-500/50 blink">
                            {error}
                        </div>
                    )}

                    {isSuccess && (
                        <div className="mt-6 text-white font-bold">
                            <div className="text-green-400">ACCESS GRANTED</div>
                            <div className="mt-2">Welcome to THE BOX.</div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="mt-8 border-t border-gray-800 pt-2 flex justify-between text-xs text-gray-500 uppercase">
                    <span>LTL BIOS v1.0.2</span>
                    <span>Mem: 64328K OK</span>
                </div>
            </div>

            <style>{`
                @keyframes blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0; }
                }
                .blink {
                  animation: blink 1s step-end infinite;
                }
                /* Override global font for this component */
                * {
                  font-family: 'Courier New', Courier, monospace !important;
                }
            `}</style>
        </div>
    );
}
