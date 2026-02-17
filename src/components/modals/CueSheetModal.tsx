import React, { useState } from "react";
import { X, Calendar, User, Building, Clock, FileText, Plus, Trash2, Printer } from "lucide-react";

interface Cue {
    id: string;
    title: string;
    timeIn: string;
    timeOut: string;
    usage: string;
    composer: string;
    publisher: string;
    pro: string;
}

interface CueSheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, html: string) => Promise<void>;
}

export const CueSheetModal: React.FC<CueSheetModalProps> = ({ isOpen, onClose, onSave }) => {
    const [details, setDetails] = useState({
        seriesTitle: "",
        episodeTitle: "",
        episodeNumber: "",
        airdate: "",
        network: "",
        productionCompany: "",
        duration: "",
        preparedBy: "",
        email: ""
    });

    const [cues, setCues] = useState<Cue[]>([
        { id: "1", title: "", timeIn: "", timeOut: "", usage: "BI", composer: "", publisher: "", pro: "" }
    ]);
    const [loading, setLoading] = useState(false);

    const addCue = () => {
        setCues([...cues, {
            id: Math.random().toString(36).substr(2, 9),
            title: "",
            timeIn: "",
            timeOut: "",
            usage: "BI",
            composer: "",
            publisher: "",
            pro: ""
        }]);
    };

    const removeCue = (id: string) => {
        setCues(cues.filter(c => c.id !== id));
    };

    const updateCue = (id: string, field: keyof Cue, value: string) => {
        setCues(cues.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const calculateDuration = (inTime: string, outTime: string) => {
        // Simple duration calc (assuming HH:MM:SS format)
        // This is purely visual for the UI, the sophisticated logic would happen in a real util
        return "";
        // Implementation omitted for brevity in this step, user can manually input or we can add later
    };

    const generateHTML = () => {
        const rows = cues.map((cue, index) => `
      <tr>
        <td style="border:1px solid #000; padding:4px; text-align:center;">${index + 1}</td>
        <td style="border:1px solid #000; padding:4px;">${cue.title}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center;">${cue.usage}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center;">${cue.timeIn}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center;">${cue.timeOut}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center;">-</td>
        <td style="border:1px solid #000; padding:4px;">${cue.composer}</td>
        <td style="border:1px solid #000; padding:4px;">${cue.publisher}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center;">${cue.pro}</td>
      </tr>
    `).join("");

        return `
      <div style="font-family: Arial, sans-serif; font-size: 11px; color: #000;">
        <h1 style="text-align: center; font-size: 16px; font-weight: bold; text-transform: uppercase;">Music Cue Sheet</h1>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 4px; font-weight: bold;">Series Title:</td>
            <td style="padding: 4px; border-bottom: 1px solid #ccc;">${details.seriesTitle}</td>
            <td style="padding: 4px; font-weight: bold;">Episode Title:</td>
            <td style="padding: 4px; border-bottom: 1px solid #ccc;">${details.episodeTitle}</td>
          </tr>
           <tr>
            <td style="padding: 4px; font-weight: bold;">Episode #:</td>
            <td style="padding: 4px; border-bottom: 1px solid #ccc;">${details.episodeNumber}</td>
            <td style="padding: 4px; font-weight: bold;">Airdate:</td>
            <td style="padding: 4px; border-bottom: 1px solid #ccc;">${details.airdate}</td>
          </tr>
          <tr>
            <td style="padding: 4px; font-weight: bold;">Network:</td>
            <td style="padding: 4px; border-bottom: 1px solid #ccc;">${details.network}</td>
             <td style="padding: 4px; font-weight: bold;">Prod Co:</td>
            <td style="padding: 4px; border-bottom: 1px solid #ccc;">${details.productionCompany}</td>
          </tr>
          <tr>
            <td style="padding: 4px; font-weight: bold;">Prepared By:</td>
            <td style="padding: 4px; border-bottom: 1px solid #ccc;">${details.preparedBy}</td>
             <td style="padding: 4px; font-weight: bold;">Email:</td>
            <td style="padding: 4px; border-bottom: 1px solid #ccc;">${details.email}</td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
          <thead style="background: #f0f0f0;">
            <tr>
              <th style="border:1px solid #000; padding:4px; width: 30px;">#</th>
              <th style="border:1px solid #000; padding:4px;">Cue Title</th>
              <th style="border:1px solid #000; padding:4px; width: 40px;">Usage</th>
              <th style="border:1px solid #000; padding:4px; width: 60px;">Time In</th>
              <th style="border:1px solid #000; padding:4px; width: 60px;">Time Out</th>
              <th style="border:1px solid #000; padding:4px; width: 60px;">Dur</th>
              <th style="border:1px solid #000; padding:4px;">Composer</th>
              <th style="border:1px solid #000; padding:4px;">Publisher</th>
              <th style="border:1px solid #000; padding:4px; width: 40px;">PRO</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; font-size: 10px; color: #666;">
            <strong>Usage Codes:</strong> BI = Background Instrumental, BV = Background Vocal, VI = Visual Instrumental, VV = Visual Vocal, MT = Main Title, ET = End Title
        </div>
      </div>
    `;
    };

    const handleSave = async () => {
        setLoading(true);
        const html = generateHTML();
        const title = `Cue Sheet - ${details.seriesTitle || "Untitled"} ${details.episodeNumber ? "#" + details.episodeNumber : ""}`;
        await onSave(title, html);
        setLoading(false);
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-theme-primary/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-theme-primary border border-theme w-full max-w-5xl h-full max-h-[90vh] flex flex-col shadow-2xl rounded-lg overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-theme/20 bg-theme-primary/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold font-mono uppercase tracking-widest text-theme-primary flex items-center gap-2">
                            <FileText size={20} className="text-accent" />
                            New Cue Sheet
                        </h2>
                        <p className="text-[10px] text-theme-muted uppercase tracking-wider font-mono">
                            Standardized Music Usage Reporting
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="p-2 hover:bg-theme-primary/50 rounded text-theme-muted hover:text-theme-primary">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Header Fields */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-theme-primary/30 p-3 border border-theme/10 rounded-sm">
                            <label className="block text-[9px] uppercase font-bold text-theme-muted mb-1">Series/Program Title</label>
                            <input
                                value={details.seriesTitle}
                                onChange={e => setDetails({ ...details, seriesTitle: e.target.value })}
                                className="w-full bg-transparent border-b border-theme/30 focus:border-accent text-theme-primary outline-none text-xs font-mono py-1"
                                placeholder="e.g. The Box Chronicles"
                            />
                        </div>
                        <div className="bg-theme-primary/30 p-3 border border-theme/10 rounded-sm">
                            <label className="block text-[9px] uppercase font-bold text-theme-muted mb-1">Episode Title</label>
                            <input
                                value={details.episodeTitle}
                                onChange={e => setDetails({ ...details, episodeTitle: e.target.value })}
                                className="w-full bg-transparent border-b border-theme/30 focus:border-accent text-theme-primary outline-none text-xs font-mono py-1"
                                placeholder="e.g. Pilot"
                            />
                        </div>
                        <div className="bg-theme-primary/30 p-3 border border-theme/10 rounded-sm">
                            <label className="block text-[9px] uppercase font-bold text-theme-muted mb-1">Episode Number</label>
                            <input
                                value={details.episodeNumber}
                                onChange={e => setDetails({ ...details, episodeNumber: e.target.value })}
                                className="w-full bg-transparent border-b border-theme/30 focus:border-accent text-theme-primary outline-none text-xs font-mono py-1"
                                placeholder="e.g. 101"
                            />
                        </div>
                        <div className="bg-theme-primary/30 p-3 border border-theme/10 rounded-sm">
                            <label className="block text-[9px] uppercase font-bold text-theme-muted mb-1">Airdate</label>
                            <input
                                value={details.airdate}
                                onChange={e => setDetails({ ...details, airdate: e.target.value })}
                                className="w-full bg-transparent border-b border-theme/30 focus:border-accent text-theme-primary outline-none text-xs font-mono py-1"
                                placeholder="YYYY-MM-DD"
                            />
                        </div>
                        <div className="bg-theme-primary/30 p-3 border border-theme/10 rounded-sm">
                            <label className="block text-[9px] uppercase font-bold text-theme-muted mb-1">Network/Source</label>
                            <input
                                value={details.network}
                                onChange={e => setDetails({ ...details, network: e.target.value })}
                                className="w-full bg-transparent border-b border-theme/30 focus:border-accent text-theme-primary outline-none text-xs font-mono py-1"
                                placeholder="e.g. YouTube / Netflix"
                            />
                        </div>
                        <div className="bg-theme-primary/30 p-3 border border-theme/10 rounded-sm">
                            <label className="block text-[9px] uppercase font-bold text-theme-muted mb-1">Production Co.</label>
                            <input
                                value={details.productionCompany}
                                onChange={e => setDetails({ ...details, productionCompany: e.target.value })}
                                className="w-full bg-transparent border-b border-theme/30 focus:border-accent text-theme-primary outline-none text-xs font-mono py-1"
                                placeholder="e.g. Box Studios"
                            />
                        </div>
                        <div className="bg-theme-primary/30 p-3 border border-theme/10 rounded-sm">
                            <label className="block text-[9px] uppercase font-bold text-theme-muted mb-1">Prepared By</label>
                            <input
                                value={details.preparedBy}
                                onChange={e => setDetails({ ...details, preparedBy: e.target.value })}
                                className="w-full bg-transparent border-b border-theme/30 focus:border-accent text-theme-primary outline-none text-xs font-mono py-1"
                            />
                        </div>
                        <div className="bg-theme-primary/30 p-3 border border-theme/10 rounded-sm">
                            <label className="block text-[9px] uppercase font-bold text-theme-muted mb-1">Email</label>
                            <input
                                value={details.email}
                                onChange={e => setDetails({ ...details, email: e.target.value })}
                                className="w-full bg-transparent border-b border-theme/30 focus:border-accent text-theme-primary outline-none text-xs font-mono py-1"
                            />
                        </div>
                    </div>

                    {/* Cues List */}
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-theme-primary">Musical Cues</h3>
                        <div className="text-[10px] text-theme-muted font-mono bg-theme-primary/20 px-2 py-1 rounded">
                            Total Cues: {cues.length}
                        </div>
                    </div>

                    <div className="space-y-1 mb-8">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 gap-1 text-[9px] uppercase font-bold text-theme-muted tracking-wider mb-2 px-2">
                            <div className="col-span-3">Title</div>
                            <div className="col-span-1">Usage</div>
                            <div className="col-span-1">In</div>
                            <div className="col-span-1">Out</div>
                            <div className="col-span-2">Composer</div>
                            <div className="col-span-2">Publisher</div>
                            <div className="col-span-1">PRO</div>
                            <div className="col-span-1"></div>
                        </div>

                        {cues.map((cue) => (
                            <div key={cue.id} className="grid grid-cols-12 gap-1 items-center bg-theme-primary/10 border border-theme/5 hover:border-theme/20 rounded p-1 transition-all">
                                <div className="col-span-3">
                                    <input
                                        value={cue.title}
                                        onChange={e => updateCue(cue.id, 'title', e.target.value)}
                                        className="w-full bg-transparent text-xs font-medium text-theme-primary p-1 focus:bg-theme-primary/20 outline-none rounded"
                                        placeholder="Track Title"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <select
                                        value={cue.usage}
                                        onChange={e => updateCue(cue.id, 'usage', e.target.value)}
                                        className="w-full bg-transparent text-[10px] font-mono p-1 outline-none cursor-pointer text-theme-secondary"
                                    >
                                        <option value="BI">BI</option>
                                        <option value="BV">BV</option>
                                        <option value="VI">VI</option>
                                        <option value="VV">VV</option>
                                        <option value="MT">MT</option>
                                        <option value="ET">ET</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <input
                                        value={cue.timeIn}
                                        onChange={e => updateCue(cue.id, 'timeIn', e.target.value)}
                                        className="w-full bg-transparent text-[10px] font-mono text-theme-muted p-1 focus:bg-theme-primary/20 outline-none rounded"
                                        placeholder="00:00:00"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <input
                                        value={cue.timeOut}
                                        onChange={e => updateCue(cue.id, 'timeOut', e.target.value)}
                                        className="w-full bg-transparent text-[10px] font-mono text-theme-muted p-1 focus:bg-theme-primary/20 outline-none rounded"
                                        placeholder="00:00:00"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        value={cue.composer}
                                        onChange={e => updateCue(cue.id, 'composer', e.target.value)}
                                        className="w-full bg-transparent text-[10px] text-theme-primary p-1 focus:bg-theme-primary/20 outline-none rounded"
                                        placeholder="Composer Name(s)"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        value={cue.publisher}
                                        onChange={e => updateCue(cue.id, 'publisher', e.target.value)}
                                        className="w-full bg-transparent text-[10px] text-theme-primary p-1 focus:bg-theme-primary/20 outline-none rounded"
                                        placeholder="Publisher"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <input
                                        value={cue.pro}
                                        onChange={e => updateCue(cue.id, 'pro', e.target.value)}
                                        className="w-full bg-transparent text-[10px] text-theme-muted p-1 focus:bg-theme-primary/20 outline-none rounded"
                                        placeholder="ASCAP"
                                    />
                                </div>
                                <div className="col-span-1 flex justify-end px-2">
                                    <button onClick={() => removeCue(cue.id)} className="text-theme-muted hover:text-red-500 transition-colors">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button onClick={addCue} className="w-full py-2 border border-dashed border-theme/20 text-theme-muted hover:text-theme-primary hover:border-theme/40 hover:bg-theme-secondary/10 transition-all text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2 mt-4 rounded-sm">
                            <Plus size={12} /> Add Cue
                        </button>
                    </div>

                </div>

                <div className="p-6 border-t border-theme/20 bg-theme-primary/80 flex justify-between items-center">
                    <div className="text-[10px] text-theme-muted font-mono">
                        * Saves as HTML document in Vault
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2 border border-theme/30 text-theme-muted hover:text-theme-primary font-bold uppercase tracking-widest text-xs transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={loading} className="px-8 py-2 bg-accent text-theme-primary font-bold uppercase tracking-widest text-xs hover:bg-accent/80 transition-colors disabled:opacity-50">
                            {loading ? "Generating..." : "Save Cue Sheet"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
