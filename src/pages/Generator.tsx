import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "../components/Header";
import CollaborationModal from "../components/CollaborationModal";
import { useCollaborationContext } from "../context/CollaborationContext";
import { useAuth } from "../hooks/use-auth";

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

      // Add user as first collaborator if list is empty
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
  }, [user]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
    setGeneratedContent(""); // Clear preview on change
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

    // Formatting helpers
    const dateStr = new Date().toLocaleDateString();

    let content = `
      <div style="font-family: 'Courier New', monospace; max-width: 800px; margin: 0 auto; padding: 40px; color: #000;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 24px; text-transform: uppercase; margin: 0;">${template.title}</h1>
          <p style="font-size: 12px; margin-top: 5px;">ID: ${template.idPrefix}-${Date.now()}</p>
        </div>
    `;

    // Common Header Info
    content += `
      <div style="margin-bottom: 30px; border: 1px solid #000; padding: 15px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div><strong>DATE:</strong> ${formData.effectiveDate || dateStr}</div>
          <div><strong>TRACK TITLE:</strong> ${formData.trackTitle || '_________________'}</div>
    `;

    if (template.type === 'split') {
      content += `
          <div><strong>STUDIO:</strong> ${formData.studioName || '_________________'}</div>
          <div><strong>ARTIST:</strong> ${formData.artistName || '_________________'}</div>
      `;
    } else {
      content += `
          <div><strong>${template.labels.producer.toUpperCase()}:</strong> ${formData.producerName || '_________________'}</div>
          <div><strong>${template.labels.artist.toUpperCase()}:</strong> ${formData.artistName || '_________________'}</div>
      `;
    }
    content += `</div></div>`;

    // Specific Content
    if (template.type === 'split') {
      content += `
        <h3 style="background: #000; color: #fff; padding: 5px; font-size: 14px; text-transform: uppercase;">Collaborator Details & Ownership</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; padding: 8px;">FULL LEGAL NAME & CONTACT</th>
              <th style="text-align: left; padding: 8px;">ROLE</th>
              <th style="text-align: left; padding: 8px;">PRO / IPI / PUB</th>
              <th style="text-align: right; padding: 8px;">SHARE %</th>
            </tr>
          </thead>
          <tbody>
            ${collaborators.map(c => `
              <tr style="border-bottom: 1px solid #ccc;">
                <td style="padding: 8px;">
                  <strong>${c.name}</strong><br/>
                  ${c.address ? `${c.address}<br/>` : ''}
                  ${c.email ? `${c.email}<br/>` : ''}
                  ${c.phone || ''}
                </td>
                <td style="padding: 8px; vertical-align: top;">${c.role}</td>
                <td style="padding: 8px; vertical-align: top;">
                  PRO: ${c.pro || '-'}<br/>
                  IPI: ${c.ipi || '-'}<br/>
                  PUB: ${c.publisher || '-'}
                </td>
                <td style="padding: 8px; text-align: right; vertical-align: top;">${c.split}%</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; border-top: 2px solid #000;">
              <td colspan="3" style="padding: 8px; text-align: right;">TOTAL:</td>
              <td style="padding: 8px; text-align: right;">${collaborators.reduce((acc, c) => acc + Number(c.split || 0), 0)}%</td>
            </tr>
          </tbody>
        </table>

        <h3 style="border-top: 1px solid #000; padding-top: 15px; margin-top: 20px; font-size: 14px; text-transform: uppercase;">Sample Clearance</h3>
        <p>Does this composition contain any unauthorized samples?</p>
        <p>[${formData.hasSamples ? 'X' : ' '}] YES &nbsp;&nbsp; [${!formData.hasSamples ? 'X' : ' '}] NO</p>
        ${formData.hasSamples ? `<p><strong>Details:</strong> ${formData.sampleDetails}</p>` : ''}
      `;
    } else if (template.type === 'nda') {
      content += `
        <h3 style="background: #000; color: #fff; padding: 5px; font-size: 14px; text-transform: uppercase;">Confidentiality Terms</h3>
        <p style="line-height: 1.6; font-size: 12px; margin-bottom: 20px;">
          The Receiving Party agrees to hold in strict confidence all Confidential Information and shall not disclose such information to any third party without the prior written approval of the Disclosing Party.
        </p>
        <p style="font-weight: bold;">Description of Confidential Material:</p>
        <div style="border: 1px solid #000; padding: 10px; margin-bottom: 20px; min-height: 50px;">
          ${formData.description || 'Unreleased recordings, stems, and related project files.'}
        </div>
      `;
    } else {
      // Standard License / WFH / Master
      content += `
        <h3 style="background: #000; color: #fff; padding: 5px; font-size: 14px; text-transform: uppercase;">Agreement Terms</h3>
        <p style="line-height: 1.6; font-size: 12px; margin-bottom: 20px;">
          ${template.terms}
        </p>

        <div style="margin-bottom: 20px; border: 1px solid #ccc; padding: 10px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
            ${template.id === 'master-license' ? `
              <div><strong>BUYOUT FEE:</strong> ${formData.buyoutFee || 'N/A'}</div>
              <div><strong>MASTER SHARE:</strong> ${formData.masterShare || '0'}%</div>
            ` : `
              <div><strong>FEE:</strong> ${formData.fee || 'N/A'}</div>
              <div><strong>ROYALTY:</strong> ${formData.royalty || '0'}%</div>
            `}
            <div><strong>JURISDICTION:</strong> ${formData.jurisdiction || 'New York, NY'}</div>
            <div><strong>DELIVERY DATE:</strong> ${formData.deliveryDate || 'Upon Payment'}</div>
          </div>
        </div>

        ${formData.customTerms ? `
          <p style="font-weight: bold;">Additional Terms:</p>
          <p style="line-height: 1.6; font-size: 12px;">${formData.customTerms}</p>
        ` : ''}
      `;
    }

    // Signatures
    content += `
      <div style="margin-top: 50px; border-top: 2px solid #000; padding-top: 20px;">
        <h3 style="font-size: 14px; text-transform: uppercase; margin-bottom: 30px;">Authorization & Signatures</h3>
        <p style="font-size: 11px; margin-bottom: 30px;">By signing below, each party acknowledges and agrees to the terms set forth above.</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          ${['split', 'master'].includes(template.type) ?
        collaborators.map(c => `
              <div style="margin-bottom: 30px;">
                <div style="border-bottom: 1px solid #000; height: 30px;"></div>
                <p style="font-size: 11px; margin-top: 5px;">SIGNED: <strong>${c.name}</strong> (${c.role})</p>
                <p style="font-size: 11px;">DATE: ___________</p>
              </div>
            `).join('')
        : `
              <div style="margin-bottom: 30px;">
                <div style="border-bottom: 1px solid #000; height: 30px;"></div>
                <p style="font-size: 11px; margin-top: 5px;">${template.labels.producer.toUpperCase()}: ${formData.producerName}</p>
                <p style="font-size: 10px;">${formData.producerAddress || ''}</p>
                <p style="font-size: 11px;">DATE: ___________</p>
              </div>
              <div style="margin-bottom: 30px;">
                <div style="border-bottom: 1px solid #000; height: 30px;"></div>
                <p style="font-size: 11px; margin-top: 5px;">${template.labels.artist.toUpperCase()}: ${formData.artistName}</p>
                <p style="font-size: 10px;">${formData.artistAddress || ''}</p>
                <p style="font-size: 11px;">DATE: ___________</p>
              </div>
            `
      }
        </div>
      </div>
    </div>`;

    setGeneratedContent(content);
    setIsViewMode(true);
  };

  const saveAgreement = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const template = templateData[selectedTemplate];
      const title = `${template.title} - ${formData.trackTitle || 'Untitled'}`;

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          templateId: selectedTemplate,
          html: generatedContent,
          metadata: formData,
          collaborators
        })
      });

      if (!res.ok) throw new Error("Failed to save document");

      const data = await res.json();
      setSavedDocumentId(data.document.id);
      setCurrentAgreementId(data.document.id);
    } catch (error) {
      console.error("Save error:", error);
      setSaveError("Failed to save document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const template = templateData[selectedTemplate];

  return (
    <div className="min-h-screen bg-theme-primary text-theme-primary font-mono flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider mb-2 text-theme-primary">Agreement Generator</h1>
            <p className="text-theme-muted text-xs font-bold tracking-[0.2em]">SYSTEM 1.0 // LEGAL DOCUMENTS</p>
          </div>
          {isViewMode && (
            <button
              onClick={() => setIsViewMode(false)}
              className="text-[10px] font-bold hover:bg-theme-primary hover:text-theme-primary px-3 py-1.5 border border-theme hover:border-theme-primary transition-all uppercase tracking-widest"
            >
              [← EDITOR]
            </button>
          )}
        </div>

        {!isViewMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#1e1e1e] border border-[#333] p-4 shadow-sm">
                <label className="block text-[10px] font-bold text-theme-muted uppercase mb-3 tracking-widest font-mono">Document Type</label>
                <select
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  className="w-full bg-theme-primary border border-theme text-theme-primary p-2 text-sm focus:border-theme-primary focus:outline-none uppercase font-mono tracking-tight"
                >
                  {Object.entries(templateData).map(([key, t]) => (
                    <option key={key} value={key}>{t.title}</option>
                  ))}
                </select>
                <div className="mt-4 text-xs text-zinc-400 border-t border-[#333] pt-2">
                  {template.terms}
                </div>
              </div>

              <div className="bg-theme-secondary border border-theme p-4 shadow-sm">
                <h3 className="text-[10px] font-bold text-theme-muted uppercase mb-4 tracking-widest font-mono">Core Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase text-theme-muted mb-1 font-bold tracking-widest">Effective Date</label>
                    <input
                      type="date"
                      name="effectiveDate"
                      value={formData.effectiveDate || ''}
                      onChange={handleFormChange}
                      className="w-full bg-theme-primary border border-theme px-2 py-1.5 text-sm focus:border-theme-primary outline-none text-theme-primary placeholder-theme-muted font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-theme-muted mb-1 font-bold tracking-widest">Track Title</label>
                    <input
                      type="text"
                      name="trackTitle"
                      placeholder="ENTER TITLE..."
                      value={formData.trackTitle || ''}
                      onChange={handleFormChange}
                      className="w-full bg-theme-primary border border-theme px-2 py-1.5 text-sm focus:border-theme-primary outline-none text-theme-primary placeholder:text-theme-muted/30 uppercase font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-theme-secondary border border-theme p-6 shadow-sm">
              <form onSubmit={generateAgreement} className="space-y-6">
                {selectedTemplate === 'nda' && (
                  <div className="bg-black border border-[#333] p-4">
                    <label className="block text-[10px] uppercase text-zinc-500 mb-2">Confidential Material Description</label>
                    <textarea
                      name="description"
                      onChange={handleFormChange}
                      placeholder="Describe what is being protected (e.g. 'Unreleased beat pack vol. 1')..."
                      className="w-full bg-[#1e1e1e] border border-[#333] p-2 text-sm focus:border-white outline-none h-32"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase text-theme-muted mb-1 font-bold tracking-widest">{template.labels.producer}</label>
                        <input name="producerName" placeholder="NAME / CO." value={formData.producerName || ''} onChange={handleFormChange} className="w-full bg-theme-primary border border-theme px-2 py-1.5 text-sm focus:border-theme-primary outline-none text-theme-primary placeholder-theme-muted/30 uppercase font-mono mb-2" />
                        <input name="producerAddress" placeholder="ADDRESS / LOCATION" onChange={handleFormChange} value={formData.producerAddress || ''} className="w-full bg-theme-primary border border-theme px-2 py-1.5 text-sm focus:border-theme-primary outline-none text-theme-primary placeholder-theme-muted/30 uppercase font-mono" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-theme-muted mb-1 font-bold tracking-widest">{template.labels.artist}</label>
                        <input name="artistName" placeholder="NAME / CO." onChange={handleFormChange} value={formData.artistName || ''} className="w-full bg-theme-primary border border-theme px-2 py-1.5 text-sm focus:border-theme-primary outline-none text-theme-primary placeholder-theme-muted/30 uppercase font-mono mb-2" />
                        <input name="artistAddress" placeholder="ADDRESS / LOCATION" onChange={handleFormChange} value={formData.artistAddress || ''} className="w-full bg-theme-primary border border-theme px-2 py-1.5 text-sm focus:border-theme-primary outline-none text-theme-primary placeholder-theme-muted/30 uppercase font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-theme-primary border border-theme p-4 shadow-inner">
                    <h3 className="text-[10px] font-bold text-theme-muted uppercase mb-4 tracking-widest font-mono">Dynamic Terms</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {template.id === 'master-license' ? (
                        <>
                          <div>
                            <label className="block text-[10px] uppercase text-theme-muted mb-1">Buyout Fee</label>
                            <input name="buyoutFee" placeholder="$0.00" onChange={handleFormChange} className="w-full bg-transparent border-b border-theme text-sm focus:border-theme-primary outline-none text-theme-primary px-1" />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase text-theme-muted mb-1">Master Share %</label>
                            <input name="masterShare" placeholder="100%" onChange={handleFormChange} className="w-full bg-transparent border-b border-theme text-sm focus:border-theme-primary outline-none text-theme-primary px-1" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-[10px] uppercase text-theme-muted mb-1">Base Fee</label>
                            <input name="fee" placeholder="$0.00" onChange={handleFormChange} className="w-full bg-transparent border-b border-theme text-sm focus:border-theme-primary outline-none text-theme-primary px-1" />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase text-theme-muted mb-1">Royalty %</label>
                            <input name="royalty" placeholder="0%" onChange={handleFormChange} className="w-full bg-transparent border-b border-theme text-sm focus:border-theme-primary outline-none text-theme-primary px-1" />
                          </div>
                        </>
                      )}
                      <div className="col-span-2">
                        <label className="block text-[10px] uppercase text-theme-muted mb-1">Jurisdiction</label>
                        <input name="jurisdiction" placeholder="NY, USA" onChange={handleFormChange} className="w-full bg-transparent border-b border-theme text-sm focus:border-theme-primary outline-none text-theme-primary px-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {['split', 'master'].includes(template.type) && (
                  <div className="space-y-6">
                    <div className="border border-theme-primary/20 bg-theme-secondary/50 p-4 rounded-sm">
                      <p className="text-[10px] font-mono text-theme-muted text-center uppercase tracking-widest italic opacity-50">
                        Section: Rights & Revenue Distribution // Collaborator Matrix
                      </p>
                    </div>

                    <div className="border border-theme p-4 bg-theme-primary shadow-inner">
                      <div className="flex justify-between items-center mb-4 border-b border-theme pb-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Collaborators</h3>
                        <button type="button" onClick={addCollaborator} className="text-[9px] font-bold border border-theme px-2 py-1 hover:bg-theme-primary hover:text-theme-primary transition-all uppercase tracking-wider">
                          + ADD PARTY
                        </button>
                      </div>
                      <div className="space-y-4">
                        {collaborators.map((c) => (
                          <div key={c.id} className="space-y-2 border-b border-theme pb-4 last:border-0">
                            <div className="grid grid-cols-12 gap-2 text-xs items-start">
                              <div className="col-span-12 md:col-span-4">
                                <input placeholder="Full Name" value={c.name} onChange={e => updateCollaborator(c.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-theme focus:border-theme-primary outline-none py-1 text-theme-primary uppercase font-bold" />
                              </div>
                              <div className="col-span-6 md:col-span-3">
                                <input placeholder="Role" value={c.role} onChange={e => updateCollaborator(c.id, 'role', e.target.value)} className="w-full bg-transparent border-b border-theme focus:border-theme-primary outline-none py-1 text-theme-muted uppercase" />
                              </div>
                              <div className="col-span-4 md:col-span-2">
                                <input placeholder="Share %" value={c.split} onChange={e => updateCollaborator(c.id, 'split', e.target.value)} className="w-full bg-transparent border-b border-theme focus:border-theme-primary outline-none py-1 text-theme-primary font-mono" />
                              </div>
                              <div className="col-span-2 md:col-span-1 flex justify-end">
                                <button type="button" onClick={() => removeCollaborator(c.id)} className="text-zinc-500 hover:text-red-500">×</button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <input placeholder="PRO" value={c.pro} onChange={e => updateCollaborator(c.id, 'pro', e.target.value)} className="bg-transparent border-b border-[#333] focus:border-white outline-none py-1" />
                              <input placeholder="IPI #" value={c.ipi} onChange={e => updateCollaborator(c.id, 'ipi', e.target.value)} className="bg-transparent border-b border-[#333] focus:border-white outline-none py-1" />
                              <input placeholder="Publisher" value={c.publisher} onChange={e => updateCollaborator(c.id, 'publisher', e.target.value)} className="bg-transparent border-b border-[#333] focus:border-white outline-none py-1" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <input placeholder="Email" value={c.email} onChange={e => updateCollaborator(c.id, 'email', e.target.value)} className="bg-transparent border-b border-[#333] focus:border-white outline-none py-1" />
                              <input placeholder="Phone" value={c.phone} onChange={e => updateCollaborator(c.id, 'phone', e.target.value)} className="bg-transparent border-b border-[#333] focus:border-white outline-none py-1" />
                            </div>
                            <input placeholder="Address" value={c.address} onChange={e => updateCollaborator(c.id, 'address', e.target.value)} className="w-full bg-transparent border-b border-[#333] focus:border-white outline-none py-1 text-xs" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-theme flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-theme-primary text-theme-primary font-bold py-3 uppercase tracking-widest hover:bg-theme-secondary transition-colors border border-theme"
                  >
                    Build Static Document
                  </button>
                  <button
                    type="button"
                    onClick={draftAgreementWithAI}
                    disabled={isDrafting}
                    className="flex-1 bg-white text-black font-bold py-3 uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {isDrafting ? 'DRAFTING...' : 'AI DRAFT (PRO)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex gap-4 mb-4 items-center">
              <button onClick={() => setIsViewMode(false)} className="text-xs uppercase hover:underline mr-auto">
                ← Edit
              </button>
              <button onClick={() => window.print()} className="bg-white text-black px-4 py-2 text-xs font-bold uppercase border border-white hover:bg-black hover:text-white transition-all">
                Print / PDF
              </button>
              <button
                onClick={saveAgreement}
                disabled={isSaving || !!savedDocumentId}
                className={`px-4 py-2 text-xs font-bold uppercase border transition-all ${isSaving || savedDocumentId
                  ? 'border-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'border-[#333] hover:border-white text-white'
                  }`}
              >
                {isSaving ? 'Saving...' : savedDocumentId ? 'Saved' : 'Save to Box'}
              </button>
            </div>

            {savedDocumentId && (
              <div className="mb-4 p-2 border border-green-900 bg-green-900/20 text-green-500 text-xs flex justify-between items-center">
                <span>Document saved successfully.</span>
                <button
                  onClick={() => setShowCollaborationModal(true)}
                  className="underline hover:text-green-400"
                >
                  Add Collaborators to Box
                </button>
              </div>
            )}

            {saveError && (
              <div className="mb-4 p-2 border border-red-900 bg-red-900/20 text-red-500 text-xs">
                {saveError}
              </div>
            )}

            <div className="flex-1 bg-white overflow-y-auto p-8 border border-[#333] text-black">
              <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
            </div>
          </div>
        )}
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
