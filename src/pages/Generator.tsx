import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "../components/Header";
import CollaborationModal from "../components/CollaborationModal";
import { useCollaborationContext } from "../context/CollaborationContext";
import { useAuth } from "../hooks/use-auth";

const templateData = {
  'split-sheet': {
    title: 'SONGWRITER SPLIT SHEET',
    idPrefix: 'SS',
    type: 'split',
    terms: 'Official registration of songwriting and publishing percentages.'
  },
  'nda': {
    title: 'NON-DISCLOSURE AGREEMENT',
    idPrefix: 'NDA',
    type: 'nda',
    terms: 'Agreement to maintain strict confidentiality regarding unreleased materials.'
  },
  'basic-ne': {
    title: 'BASIC NON-EXCLUSIVE LICENSE',
    idPrefix: 'LIC-B',
    type: 'license',
    terms: 'Grant of non-exclusive rights for limited digital streaming.'
  },
  'exclusive': {
    title: 'EXCLUSIVE LICENSE AGREEMENT',
    idPrefix: 'LIC-EX',
    type: 'license',
    terms: 'Transfer of exclusive rights. Producer ceases further licensing.'
  },
  'work-for-hire': {
    title: 'WORK FOR HIRE AGREEMENT',
    idPrefix: 'WFH',
    type: 'service',
    terms: 'Producer/Musician provides services as a work-for-hire.'
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
}

export default function Generator() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { pendingCollaborations } = useCollaborationContext();

  const [selectedTemplate, setSelectedTemplate] = useState("split-sheet");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isViewMode, setIsViewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      if (collaborators.length === 0) {
        setCollaborators([{
          id: Date.now().toString(),
          name: (user.businessName || `${user.firstName} ${user.lastName}`.trim()) || "",
          role: "Producer",
          split: "50",
          pro: "",
          ipi: "",
          publisher: ""
        }]);
      }
    }
  }, [user]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
    setGeneratedContent(""); // Clear preview on change
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
      publisher: ""
    }]);
  };

  const removeCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  const generateAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    const template = templateData[selectedTemplate as keyof typeof templateData];

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
          <div><strong>PRODUCER:</strong> ${formData.producerName || '_________________'}</div>
          <div><strong>CLIENT/ARTIST:</strong> ${formData.artistName || '_________________'}</div>
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
              <th style="text-align: left; padding: 8px;">FULL LEGAL NAME</th>
              <th style="text-align: left; padding: 8px;">ROLE</th>
              <th style="text-align: left; padding: 8px;">PRO / IPI</th>
              <th style="text-align: left; padding: 8px;">PUBLISHER</th>
              <th style="text-align: right; padding: 8px;">SHARE %</th>
            </tr>
          </thead>
          <tbody>
            ${collaborators.map(c => `
              <tr style="border-bottom: 1px solid #ccc;">
                <td style="padding: 8px;">${c.name}</td>
                <td style="padding: 8px;">${c.role}</td>
                <td style="padding: 8px;">${c.pro || '-'}/${c.ipi || '-'}</td>
                <td style="padding: 8px;">${c.publisher || '-'}</td>
                <td style="padding: 8px; text-align: right;">${c.split}%</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; border-top: 2px solid #000;">
              <td colspan="4" style="padding: 8px; text-align: right;">TOTAL:</td>
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
        <div style="border: 1px solid #000; padding: 10px; margin-bottom: 20px; height: 100px;">
          ${formData.description || 'Unreleased recordings, stems, and related project files.'}
        </div>
      `;
    } else {
      // Standard License / WFH
      content += `
        <h3 style="background: #000; color: #fff; padding: 5px; font-size: 14px; text-transform: uppercase;">Agreement Terms</h3>
        <p style="line-height: 1.6; font-size: 12px; margin-bottom: 20px;">
          ${template.terms}
        </p>
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
          ${template.type === 'split' ?
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
                <p style="font-size: 11px; margin-top: 5px;">PRODUCER: ${formData.producerName}</p>
                <p style="font-size: 11px;">DATE: ___________</p>
              </div>
              <div style="margin-bottom: 30px;">
                <div style="border-bottom: 1px solid #000; height: 30px;"></div>
                <p style="font-size: 11px; margin-top: 5px;">CLIENT: ${formData.artistName}</p>
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

  return (
    <div className="min-h-screen bg-[#141414] text-white font-mono flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Agreement Generator</h1>
            <p className="text-zinc-500 text-xs">SYSTEM 1.0 // LEGAL DOCUMENTS</p>
          </div>
          {isViewMode && (
            <button
              onClick={() => setIsViewMode(false)}
              className="text-xs hover:bg-white hover:text-black px-3 py-1 border border-transparent hover:border-white transition-all uppercase"
            >
              ← Back to Editor
            </button>
          )}
        </div>

        {!isViewMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar Controls */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#1e1e1e] border border-[#333] p-4">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Document Type</label>
                <select
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  className="w-full bg-black border border-[#333] text-white p-2 text-sm focus:border-white focus:outline-none uppercase"
                >
                  {Object.entries(templateData).map(([key, t]) => (
                    <option key={key} value={key}>{t.title}</option>
                  ))}
                </select>
                <div className="mt-4 text-xs text-zinc-400 border-t border-[#333] pt-2">
                  {templateData[selectedTemplate as keyof typeof templateData].terms}
                </div>
              </div>

              <div className="bg-[#1e1e1e] border border-[#333] p-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase mb-4">Core Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 mb-1">Effective Date</label>
                    <input
                      type="date"
                      name="effectiveDate"
                      value={formData.effectiveDate || ''}
                      onChange={handleFormChange}
                      className="w-full bg-black border border-[#333] px-2 py-1 text-sm focus:border-white outline-none text-white placeholder-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 mb-1">Track Title</label>
                    <input
                      type="text"
                      name="trackTitle"
                      placeholder="ENTER TITLE..."
                      value={formData.trackTitle || ''}
                      onChange={handleFormChange}
                      className="w-full bg-black border border-[#333] px-2 py-1 text-sm focus:border-white outline-none text-white placeholder-zinc-700 uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form Area */}
            <div className="lg:col-span-2 bg-[#1e1e1e] border border-[#333] p-6">
              <form onSubmit={generateAgreement} className="space-y-6">

                {/* Dynamic Fields based on Type */}
                {selectedTemplate === 'split-sheet' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-500 mb-1">Studio Name/Location</label>
                        <input
                          name="studioName"
                          placeholder="STUDIO A..."
                          onChange={handleFormChange}
                          className="w-full bg-black border border-[#333] px-2 py-1 text-sm focus:border-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-500 mb-1">Recording Artist(s)</label>
                        <input
                          name="artistName"
                          placeholder="ARTIST NAME..."
                          onChange={handleFormChange}
                          className="w-full bg-black border border-[#333] px-2 py-1 text-sm focus:border-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="border border-[#333] p-4 bg-black">
                      <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
                        <h3 className="text-xs font-bold uppercase">Collaborators</h3>
                        <button type="button" onClick={addCollaborator} className="text-[10px] border border-[#333] px-2 py-1 hover:bg-white hover:text-black uppercase">
                          + Add Party
                        </button>
                      </div>
                      <div className="space-y-4">
                        {collaborators.map((c, idx) => (
                          <div key={c.id} className="grid grid-cols-12 gap-2 text-xs items-start border-b border-[#333] pb-2 last:border-0">
                            <div className="col-span-12 md:col-span-3">
                              <input placeholder="Name" value={c.name} onChange={e => updateCollaborator(c.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-[#333] focus:border-white outline-none py-1" />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <input placeholder="Role" value={c.role} onChange={e => updateCollaborator(c.id, 'role', e.target.value)} className="w-full bg-transparent border-b border-[#333] focus:border-white outline-none py-1" />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <input placeholder="PRO" value={c.pro} onChange={e => updateCollaborator(c.id, 'pro', e.target.value)} className="w-full bg-transparent border-b border-[#333] focus:border-white outline-none py-1" />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <input placeholder="IPI #" value={c.ipi} onChange={e => updateCollaborator(c.id, 'ipi', e.target.value)} className="w-full bg-transparent border-b border-[#333] focus:border-white outline-none py-1" />
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              <input placeholder="Share %" value={c.split} onChange={e => updateCollaborator(c.id, 'split', e.target.value)} className="w-full bg-transparent border-b border-[#333] focus:border-white outline-none py-1" />
                            </div>
                            <div className="col-span-2 md:col-span-1 flex justify-end">
                              <button type="button" onClick={() => removeCollaborator(c.id)} className="text-zinc-500 hover:text-red-500">×</button>
                            </div>
                            <div className="col-span-12">
                              <input placeholder="Publisher Name" value={c.publisher} onChange={e => updateCollaborator(c.id, 'publisher', e.target.value)} className="w-full bg-transparent border-b border-[#333] focus:border-white outline-none py-1 placeholder-zinc-700" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <input type="checkbox" name="hasSamples" onChange={handleFormChange} id="hasSamples" className="mt-1" />
                      <div className="flex-1">
                        <label htmlFor="hasSamples" className="text-xs uppercase font-bold">Contains Samples?</label>
                        {formData.hasSamples && (
                          <textarea
                            name="sampleDetails"
                            onChange={handleFormChange}
                            placeholder="Describe original artist and song title..."
                            className="w-full mt-2 bg-black border border-[#333] p-2 text-xs focus:border-white outline-none h-20"
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}

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

                {/* Generic Fields for other types */}
                {!['split-sheet', 'nda'].includes(selectedTemplate) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-500 mb-1">Producer Name</label>
                      <input
                        name="producerName"
                        value={formData.producerName || ''}
                        onChange={handleFormChange}
                        className="w-full bg-black border border-[#333] px-2 py-1 text-sm focus:border-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-500 mb-1">Client/Artist Name</label>
                      <input
                        name="artistName"
                        onChange={handleFormChange}
                        className="w-full bg-black border border-[#333] px-2 py-1 text-sm focus:border-white outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[#333]">
                  <button type="submit" className="w-full bg-white text-black font-bold py-3 uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                    Generate Document
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
        itemName={`${templateData[selectedTemplate as keyof typeof templateData].title} - ${formData.trackTitle || 'Untitled'}`}
      />
    </div>
  );
}
