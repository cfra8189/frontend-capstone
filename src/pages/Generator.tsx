import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import CollaborationModal from "../components/CollaborationModal";
import { useCollaborationContext } from "../context/CollaborationContext";
import { useAuth } from "../hooks/use-auth";
import { Sparkles, Save, FileText, ChevronLeft, Printer, Share2, AlertCircle, CheckCircle2 } from "lucide-react";

interface Template {
  id: string;
  title: string;
  idPrefix: string;
  type: string;
  terms: string;
  labels: { producer: string; artist: string };
}

const templateData: Record<string, Template> = {
  'split-sheet': {
    id: 'split-sheet',
    title: 'SONGWRITER SPLIT SHEET',
    idPrefix: 'SS',
    type: 'split',
    labels: { producer: 'PRODUCER', artist: 'ARTIST' },
    terms: 'Official registration of songwriting and publishing percentages.'
  },
  'nda': {
    id: 'nda',
    title: 'NON-DISCLOSURE AGREEMENT',
    idPrefix: 'NDA',
    type: 'nda',
    labels: { producer: 'DISCLOSER', artist: 'RECIPIENT' },
    terms: 'Agreement to maintain strict confidentiality regarding unreleased materials.'
  },
  'basic-ne': {
    id: 'basic-ne',
    title: 'BASIC NON-EXCLUSIVE LICENSE',
    idPrefix: 'LIC-B',
    type: 'license',
    labels: { producer: 'LICENSOR', artist: 'LICENSEE' },
    terms: 'Grant of non-exclusive rights for limited digital streaming.'
  },
  'exclusive': {
    id: 'exclusive',
    title: 'EXCLUSIVE LICENSE AGREEMENT',
    idPrefix: 'LIC-EX',
    type: 'license',
    labels: { producer: 'LICENSOR', artist: 'LICENSEE' },
    terms: 'Transfer of exclusive rights. Producer ceases further licensing.'
  },
  'work-for-hire': {
    id: 'work-for-hire',
    title: 'WORK FOR HIRE AGREEMENT',
    idPrefix: 'WFH',
    type: 'service',
    labels: { producer: 'PRODUCER', artist: 'ARTIST' },
    terms: 'Producer/Musician provides services as a work-for-hire.'
  },
  'master-license': {
    id: 'master-license',
    title: 'MASTER USE LICENSE',
    idPrefix: 'LIC-M',
    type: 'master',
    labels: { producer: 'LICENSOR', artist: 'LICENSEE' },
    terms: 'Licensor grants Licensee the non-exclusive right to use the master recording of the Track for the permitted use, subject to buyout fee and royalty share.'
  }
};

interface Collaborator {
  id: string;
  name: string;
  role: string;
  split: string;
  pro?: string;
  ipi?: string;
  publisher?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function Generator() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState("split-sheet");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isViewMode, setIsViewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [currentAgreementId, setCurrentAgreementId] = useState<string | null>(null);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        producerName: prev.producerName || (user.businessName || `${user.firstName} ${user.lastName}`.trim()),
        producerEmail: prev.producerEmail || user.email,
        effectiveDate: prev.effectiveDate || new Date().toISOString().split('T')[0]
      }));

      if (collaborators.length === 0) {
        setCollaborators([{
          id: Date.now().toString(),
          name: (user.businessName || `${user.firstName} ${user.lastName}`.trim()) || "",
          role: "Producer",
          split: "50",
          pro: "",
          ipi: "",
          publisher: "",
          email: user.email || undefined,
          phone: "",
          address: ""
        }]);
      }
    }
  }, [user]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
    setGeneratedContent("");
    setSavedDocumentId(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const updateCollaborator = (id: string, field: keyof Collaborator, value: string) => {
    setCollaborators(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const addCollaborator = () => {
    setCollaborators([...collaborators, {
      id: Date.now().toString(),
      name: "",
      role: "",
      split: "",
      pro: "",
      ipi: "",
      publisher: "",
      email: "",
      phone: "",
      address: ""
    }]);
  };

  const removeCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  const draftAgreementWithAI = async () => {
    setIsDrafting(true);
    try {
      const template = templateData[selectedTemplate];
      const res = await fetch("/api/ai/draft-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateTitle: template.title,
          terms: template.terms,
          formData,
          collaborators
        })
      });
      if (!res.ok) throw new Error("AI Draft failed");
      const data = await res.json();
      setGeneratedContent(data.draft);
      setIsViewMode(true);
    } catch (error) {
      console.error("AI Draft error:", error);
      alert("AI Drafting failed. Falling back to standard template.");
      generateAgreement(new Event('submit') as any);
    } finally {
      setIsDrafting(false);
    }
  };

  const generateAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    const template = templateData[selectedTemplate];
    const dateStr = new Date().toLocaleDateString();

    let content = `
      <div style="font-family: 'Courier New', monospace; max-width: 800px; margin: 0 auto; padding: 40px; color: #000; background: #fff; border: 1px solid #000;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 24px; text-transform: uppercase; margin: 0;">${template.title}</h1>
          <p style="font-size: 12px; margin-top: 5px;">ID: ${template.idPrefix}-${Date.now()}</p>
        </div>

        <div style="margin-bottom: 30px; border: 1px solid #000; padding: 15px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div><strong>DATE:</strong> ${formData.effectiveDate || dateStr}</div>
            <div><strong>TRACK TITLE:</strong> ${formData.trackTitle || '_________________'}</div>
            ${template.type === 'split' ? `
              <div><strong>STUDIO:</strong> ${formData.studioName || '_________________'}</div>
              <div><strong>ARTIST:</strong> ${formData.artistName || '_________________'}</div>
            ` : `
              <div><strong>${template.labels.producer.toUpperCase()}:</strong> ${formData.producerName || '_________________'}</div>
              <div><strong>${template.labels.artist.toUpperCase()}:</strong> ${formData.artistName || '_________________'}</div>
            `}
          </div>
        </div>
    `;

    if (template.type === 'split') {
      content += `
        <h3 style="background: #000; color: #fff; padding: 5px; font-size: 14px; text-transform: uppercase;">Ownership Shares</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${collaborators.map(c => `
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="padding: 10px;"><strong>${c.name}</strong><br/><small>${c.role}</small></td>
              <td style="padding: 10px; text-align: right;">${c.split}%</td>
            </tr>
          `).join('')}
        </table>
      `;
    } else {
      content += `
        <h3 style="background: #000; color: #fff; padding: 5px; font-size: 14px; text-transform: uppercase;">Terms</h3>
        <p style="font-size: 12px; line-height: 1.6;">${template.terms}</p>
        <div style="margin: 20px 0; border: 1px solid #eee; padding: 10px;">
          <strong>JURISDICTION:</strong> ${formData.jurisdiction || 'New York, NY'}
        </div>
      `;
    }

    content += `
        <div style="margin-top: 50px;">
          <p style="font-size: 10px; text-align: center;">--- END OF DOCUMENT ---</p>
        </div>
      </div>
    `;

    setGeneratedContent(content);
    setIsViewMode(true);
  };

  const saveAgreement = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const template = templateData[selectedTemplate];
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${template.title} - ${formData.trackTitle || 'Untitled'}`,
          templateId: selectedTemplate,
          html: generatedContent,
          metadata: formData,
          collaborators
        })
      });

      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setSavedDocumentId(data.document.id);
      setCurrentAgreementId(data.document.id);
    } catch (error) {
      setSaveError("Failed to save document.");
    } finally {
      setIsSaving(false);
    }
  };

  const template = templateData[selectedTemplate];

  return (
    <div className="min-h-screen bg-theme-primary text-theme-primary font-mono flex flex-col selection:bg-theme-secondary selection:text-theme-primary">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 relative">
        {/* Animated Background Pulse */}
        <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-theme-secondary rounded-full blur-[100px]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-end mb-8 border-b border-theme pb-4 relative z-10"
        >
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Agreement Generator</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
              <p className="text-theme-muted text-[10px] font-bold tracking-[0.2em] uppercase">System 2.0 // Vault Production</p>
            </div>
          </div>
          {isViewMode && (
            <button
              onClick={() => setIsViewMode(false)}
              className="group flex items-center gap-2 text-[10px] font-bold text-theme-muted hover:text-theme-primary transition-all uppercase tracking-widest"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              [Return to Editor]
            </button>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!isViewMode ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10"
            >
              {/* Sidebar Config */}
              <div className="lg:col-span-1 space-y-6">
                <section className="bg-theme-secondary border border-theme p-5 shadow-2xl">
                  <h2 className="text-[10px] font-bold text-theme-muted uppercase mb-4 tracking-[0.3em]">01 // Template Selection</h2>
                  <select
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                    className="w-full bg-theme-primary border border-theme text-theme-primary p-3 text-sm focus:ring-1 focus:ring-theme-primary outline-none uppercase font-mono tracking-tight appearance-none cursor-pointer"
                  >
                    {Object.entries(templateData).map(([key, t]) => (
                      <option key={key} value={key}>{t.title}</option>
                    ))}
                  </select>
                  <p className="mt-4 text-[11px] text-theme-muted leading-relaxed font-mono">
                    {template.terms}
                  </p>
                </section>

                <section className="bg-theme-secondary border border-theme p-5 shadow-2xl">
                  <h2 className="text-[10px] font-bold text-theme-muted uppercase mb-4 tracking-[0.3em]">02 // Metadata</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase text-theme-muted mb-1 font-bold">Effective Date</label>
                      <input
                        type="date"
                        name="effectiveDate"
                        value={formData.effectiveDate || ''}
                        onChange={handleFormChange}
                        className="w-full bg-theme-primary border border-theme px-3 py-2 text-sm focus:border-theme-primary outline-none text-theme-primary font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-theme-muted mb-1 font-bold">Track Title</label>
                      <input
                        type="text"
                        name="trackTitle"
                        placeholder="ENTER TITLE..."
                        value={formData.trackTitle || ''}
                        onChange={handleFormChange}
                        className="w-full bg-theme-primary border border-theme px-3 py-2 text-sm focus:border-theme-primary outline-none text-theme-primary placeholder:text-theme-muted/20 uppercase font-mono"
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Main Content Form */}
              <div className="lg:col-span-2 space-y-6">
                <form onSubmit={generateAgreement} className="space-y-6">
                  <div className="bg-theme-secondary border border-theme p-6 shadow-2xl">
                    <h2 className="text-[10px] font-bold text-theme-muted uppercase mb-6 tracking-[0.3em]">03 // Parties & Distribution</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="group">
                          <label className="block text-[10px] uppercase text-theme-muted mb-1 font-bold tracking-widest group-focus-within:text-theme-primary transition-colors">{template.labels.producer}</label>
                          <input
                            name="producerName"
                            placeholder="NAME / ENTITY"
                            value={formData.producerName || ''}
                            onChange={handleFormChange}
                            className="w-full bg-theme-primary border border-theme px-3 py-2 text-sm focus:border-theme-primary outline-none text-theme-primary placeholder-theme-muted/20 uppercase font-mono mb-2"
                          />
                        </div>
                        <div className="group">
                          <label className="block text-[10px] uppercase text-theme-muted mb-1 font-bold tracking-widest group-focus-within:text-theme-primary transition-colors">{template.labels.artist}</label>
                          <input
                            name="artistName"
                            placeholder="NAME / ENTITY"
                            value={formData.artistName || ''}
                            onChange={handleFormChange}
                            className="w-full bg-theme-primary border border-theme px-3 py-2 text-sm focus:border-theme-primary outline-none text-theme-primary placeholder-theme-muted/20 uppercase font-mono"
                          />
                        </div>
                      </div>

                      <div className="bg-theme-primary border border-theme p-5 shadow-inner space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={14} className="text-theme-muted" />
                          <h3 className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Financial Terms</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {template.id === 'master-license' ? (
                            <>
                              <div>
                                <label className="block text-[9px] uppercase text-theme-muted mb-1">Buyout Fee</label>
                                <input name="buyoutFee" placeholder="$0.00" onChange={handleFormChange} className="w-full bg-transparent border-b border-theme text-sm focus:border-theme-primary outline-none text-theme-primary px-1 py-1" />
                              </div>
                              <div>
                                <label className="block text-[9px] uppercase text-theme-muted mb-1">Share %</label>
                                <input name="masterShare" placeholder="100%" onChange={handleFormChange} className="w-full bg-transparent border-b border-theme text-sm focus:border-theme-primary outline-none text-theme-primary px-1 py-1" />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="block text-[9px] uppercase text-theme-muted mb-1">Flat Fee</label>
                                <input name="fee" placeholder="$0.00" onChange={handleFormChange} className="w-full bg-transparent border-b border-theme text-sm focus:border-theme-primary outline-none text-theme-primary px-1 py-1" />
                              </div>
                              <div>
                                <label className="block text-[9px] uppercase text-theme-muted mb-1">Royalty %</label>
                                <input name="royalty" placeholder="0%" onChange={handleFormChange} className="w-full bg-transparent border-b border-theme text-sm focus:border-theme-primary outline-none text-theme-primary px-1 py-1" />
                              </div>
                            </>
                          )}
                          <div className="col-span-2">
                            <label className="block text-[9px] uppercase text-theme-muted mb-1">Jurisdiction</label>
                            <input name="jurisdiction" placeholder="NEW YORK, NY" onChange={handleFormChange} className="w-full bg-transparent border-b border-theme text-sm focus:border-theme-primary outline-none text-theme-primary px-1 py-1 uppercase" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {['split', 'master'].includes(template.type) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-theme-secondary border border-theme p-6 shadow-2xl"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.3em]">04 // Collaborator Grid</h2>
                        <button type="button" onClick={addCollaborator} className="text-[9px] font-bold border border-theme px-3 py-1 hover:bg-theme-primary hover:text-theme-primary transition-all uppercase tracking-widest">+ Add Party</button>
                      </div>

                      <div className="space-y-6">
                        {collaborators.map((c, idx) => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-theme-primary border border-theme p-4 relative"
                          >
                            <div className="grid grid-cols-12 gap-4">
                              <div className="col-span-12 md:col-span-5">
                                <label className="block text-[8px] uppercase text-theme-muted mb-1">Legal Name</label>
                                <input value={c.name} onChange={e => updateCollaborator(c.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-theme focus:border-theme-primary outline-none py-1 text-xs uppercase" />
                              </div>
                              <div className="col-span-6 md:col-span-4">
                                <label className="block text-[8px] uppercase text-theme-muted mb-1">Role</label>
                                <input value={c.role} onChange={e => updateCollaborator(c.id, 'role', e.target.value)} className="w-full bg-transparent border-b border-theme focus:border-theme-primary outline-none py-1 text-xs uppercase" />
                              </div>
                              <div className="col-span-4 md:col-span-2">
                                <label className="block text-[8px] uppercase text-theme-muted mb-1">Share %</label>
                                <input value={c.split} onChange={e => updateCollaborator(c.id, 'split', e.target.value)} className="w-full bg-transparent border-b border-theme focus:border-theme-primary outline-none py-1 text-xs font-mono" />
                              </div>
                              <div className="col-span-2 md:col-span-1 flex items-end justify-end">
                                <button type="button" onClick={() => removeCollaborator(c.id)} className="text-theme-muted hover:text-red-500 p-1">×</button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-theme-primary text-theme-primary font-bold py-4 uppercase tracking-widest hover:bg-theme-secondary transition-all border border-theme group flex items-center justify-center gap-3 shadow-xl"
                    >
                      <FileText size={18} className="group-hover:scale-110 transition-transform" />
                      Build Template
                    </button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={draftAgreementWithAI}
                      disabled={isDrafting}
                      className="flex-1 bg-theme-primary text-theme-primary font-bold py-4 uppercase tracking-widest hover:bg-theme-secondary transition-all flex items-center justify-center gap-3 disabled:opacity-50 relative overflow-hidden shadow-xl border border-theme"
                    >
                      <AnimatePresence mode="wait">
                        {isDrafting ? (
                          <motion.div
                            key="drafting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            Drafting...
                          </motion.div>
                        ) : (
                          <motion.div key="ready" className="flex items-center gap-2">
                            <Sparkles size={18} className="text-black" />
                            AI Draft (Pro)
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="viewer"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col relative z-10"
            >
              <div className="flex gap-4 mb-6 items-center bg-theme-secondary border border-theme p-3 shadow-xl">
                <button
                  onClick={() => setIsViewMode(false)}
                  className="px-4 py-2 text-[10px] font-bold uppercase border border-theme hover:bg-theme-primary transition-all tracking-widest"
                >
                  Edit Data
                </button>

                <div className="flex-1" />

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase border border-theme hover:bg-theme-primary transition-all tracking-widest"
                >
                  <Printer size={14} />
                  Print / PDF
                </button>

                <motion.button
                  whileHover={!savedDocumentId ? { scale: 1.05 } : {}}
                  onClick={saveAgreement}
                  disabled={isSaving || !!savedDocumentId}
                  className={`flex items-center gap-2 px-6 py-2 text-[10px] font-bold uppercase transition-all tracking-widest shadow-lg border border-theme ${savedDocumentId
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-theme-primary text-theme-primary hover:bg-theme-secondary'
                    }`}
                >
                  {isSaving ? (
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : savedDocumentId ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  {isSaving ? 'Saving...' : savedDocumentId ? 'Vaulted' : 'Save to Vault'}
                </motion.button>
              </div>

              <div className="flex-1 bg-theme-secondary overflow-y-auto p-12 border border-theme shadow-2xl text-theme-primary">
                <div dangerouslySetInnerHTML={{ __html: generatedContent }} className="contract-preview" />
              </div>

              {savedDocumentId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-theme-secondary border border-green-500/30 flex items-center justify-between shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Document Secured in Vault</span>
                  </div>
                  <button
                    onClick={() => setShowCollaborationModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold uppercase bg-theme-primary border border-theme hover:bg-theme-tertiary transition-all tracking-widest"
                  >
                    <Share2 size={12} />
                    Invite Collaborators
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CollaborationModal
        isOpen={showCollaborationModal}
        onClose={() => setShowCollaborationModal(false)}
        agreementId={currentAgreementId || undefined}
        itemType="agreement"
        itemName={template ? `${template.title} - ${formData.trackTitle || 'Untitled'}` : 'Untitled Agreement'}
      />
    </div>
  );
}
