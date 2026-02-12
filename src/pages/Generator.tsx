import { useState } from "react";
import Header from "../components/Header";

const templateData = {
  'basic-ne': { 
    title: 'BASIC NON-EXCLUSIVE LICENSE', 
    idPrefix: 'LIC-B', 
    fields: [], 
    terms: 'Grant of non-exclusive rights for limited digital streaming and one official music video. Producer retains 100% ownership of composition.' 
  },
  'standard-ne': { 
    title: 'STANDARD NON-EXCLUSIVE LICENSE', 
    idPrefix: 'LIC-S', 
    fields: [], 
    terms: 'Grant of non-exclusive rights for increased streaming limits. Includes high-quality WAV files.' 
  },
  'premium-ne': { 
    title: 'PREMIUM NON-EXCLUSIVE LICENSE', 
    idPrefix: 'LIC-P', 
    fields: [], 
    terms: 'Unlimited non-exclusive rights for streaming and distribution. Includes multi-track stems.' 
  },
  'exclusive': { 
    title: 'EXCLUSIVE LICENSE AGREEMENT', 
    idPrefix: 'LIC-EX', 
    fields: ['exclusiveFee', 'masterShare'], 
    terms: 'Transfer of exclusive rights. Producer shall cease further licensing of track. Fee: $[exclusiveFee]. Master Royalty Share: [masterShare]%.' 
  },
  'buyout-addendum': { 
    title: 'EXCLUSIVE RIGHTS BUYOUT ADDENDUM', 
    idPrefix: 'LIC-BO', 
    fields: ['buyoutAmount', 'originalDate'], 
    terms: 'Complete transfer of all rights, title, and interest including publishing and master royalties for a buyout fee of $[buyoutAmount].' 
  },
  'split-sheet': { 
    title: 'SONGWRITER SPLIT SHEET', 
    idPrefix: 'SS', 
    fields: [], 
    terms: 'Official registration of songwriting and publishing percentages for track [Track Title].' 
  },
  'producer-agreement': { 
    title: 'PRODUCER SERVICE AGREEMENT', 
    idPrefix: 'PSA', 
    fields: ['exclusiveFee'], 
    terms: 'Contract for professional production services as a work-for-hire. Producer fee: $[exclusiveFee].' 
  },
  'nda': { 
    title: 'NON-DISCLOSURE AGREEMENT', 
    idPrefix: 'NDA', 
    fields: [], 
    terms: 'Agreement to maintain strict confidentiality regarding all unreleased files, stems, and project details.' 
  },
  'custom-license': { 
    title: 'CUSTOM MUSIC AGREEMENT', 
    idPrefix: 'CUST', 
    fields: ['exclusiveFee', 'masterShare'], 
    terms: 'Custom agreement for track [Track Title].' 
  }
};

interface Collaborator {
  id: string;
  name: string;
  role: string;
  split: string;
}

export default function Generator() {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  function handleSelect(templateId: string) {
    setSelectedTemplate(templateId);
    setStep(2);
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const value = target.type === 'number' ? Number(target.value) : target.value;
    setFormData({ ...formData, [target.name]: value });
  }

  function addCollaborator() {
    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      name: "",
      role: "",
      split: ""
    };
    setCollaborators([...collaborators, newCollaborator]);
  }

  function removeCollaborator(id: string) {
    setCollaborators(collaborators.filter(c => c.id !== id));
  }

  function updateCollaborator(id: string, field: keyof Collaborator, value: string) {
    setCollaborators(collaborators.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    setStep(3);

    const template = templateData[selectedTemplate as keyof typeof templateData];
    const collaboratorData = collaborators
      .filter(c => c.name && c.role && c.split)
      .map(c => `- ${c.name} (${c.role}): ${c.split}%`)
      .join('\n');

    // Simulate API call (replace with actual API integration)
    setTimeout(() => {
      const mockContent = `
        <div class="agreement-document">
          <h2>${template.title}</h2>
          <p><strong>ID:</strong> ${template.idPrefix}-${Date.now()}</p>
          <p><strong>Producer/Company:</strong> ${formData.producerName || 'TBD'}</p>
          <p><strong>Artist/Client:</strong> ${formData.artistName}</p>
          <p><strong>Track:</strong> ${formData.trackTitle}</p>
          <p><strong>Project:</strong> ${formData.projectName || 'N/A'}</p>
          <p><strong>Effective Date:</strong> ${formData.effectiveDate || 'TBD'}</p>
          <p><strong>Delivery Date:</strong> ${formData.deliveryDate || 'N/A'}</p>
          <p><strong>BPM:</strong> ${formData.bpm || 'N/A'}</p>
          <p><strong>Key:</strong> ${formData.key || 'N/A'}</p>
          <p><strong>Genre:</strong> ${formData.genre || 'N/A'}</p>
          <p><strong>Producer Address:</strong> ${formData.producerAddress || 'N/A'}</p>
          <p><strong>Artist Address:</strong> ${formData.artistAddress || 'N/A'}</p>
          <p><strong>Producer Email:</strong> ${formData.producerEmail || 'N/A'}</p>
          <p><strong>Artist Email:</strong> ${formData.artistEmail || 'N/A'}</p>
          <p><strong>Producer Phone:</strong> ${formData.producerPhone || 'N/A'}</p>
          <p><strong>Artist Phone:</strong> ${formData.artistPhone || 'N/A'}</p>
          
          ${collaborators.length > 0 ? `
          <h3>Parties/Splits:</h3>
          <pre>${collaboratorData}</pre>
          ` : ''}
          
          <h3>Agreement Terms:</h3>
          <p>${template.terms}</p>
          
          ${formData.customTerms ? `
          <h3>Additional Terms:</h3>
          <p>${formData.customTerms}</p>
          ` : ''}
          
          <h3>SIGNATORIES</h3>
          <div class="signatures">
            <div class="signature-block">
              <p>Producer/Company: _________________________ Date: _________</p>
            </div>
            <div class="signature-block">
              <p>Artist/Client: _________________________ Date: _________</p>
            </div>
            ${collaborators.map(c => `
              <div class="signature-block">
                <p>${c.name} (${c.role}): _________________________ Date: _________</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
      setGeneratedContent(mockContent);
      setIsGenerating(false);
    }, 2000);
  }

  function handleReset() {
    setStep(1);
    setSelectedTemplate("");
    setFormData({});
    setCollaborators([]);
    setGeneratedContent("");
  }

  const template = templateData[selectedTemplate as keyof typeof templateData];
  const showAdditionalFields = template && template.fields.length > 0;

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? "btn-primary" : "bg-theme-tertiary text-theme-muted"}`}>
                {s}
              </div>
              <span className={`text-sm ${step >= s ? "text-theme-primary" : "text-theme-muted"}`}>
                {s === 1 ? "Select Template" : s === 2 ? "Fill Details" : "Generate"}
              </span>
              {s < 3 && <div className="w-8 h-px bg-theme-tertiary" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Select Agreement Template</h2>
            
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search templates (e.g. 'Split Sheet', 'NDA')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full p-4 rounded-lg bg-theme-tertiary border border-theme text-theme-primary focus:border-accent outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(templateData)
                .filter(([_, t]) => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.terms.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(([id, template]) => (
                <div
                  key={id}
                  onClick={() => handleSelect(id)}
                  className="card p-6 rounded-xl cursor-pointer hover:border-accent transition-colors"
                >
                  <h3 className="font-bold mb-2">{template.title}</h3>
                  <p className="text-sm text-theme-muted">{template.terms}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Fill Agreement Details</h2>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Track Title *</label>
                  <input 
                    name="trackTitle" 
                    required 
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                    placeholder="e.g. Moonlight"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Template Type</label>
                  <div className="input-field w-full p-3 rounded bg-theme-tertiary">
                    {template?.title || 'Not selected'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Producer/Company *</label>
                  <input 
                    name="producerName" 
                    required 
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                    placeholder="Legal Name or Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Artist/Client *</label>
                  <input 
                    name="artistName" 
                    required 
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                    placeholder="Legal Name or Artist Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Project/Album Name</label>
                <input 
                  name="projectName" 
                  onChange={handleFormChange} 
                  className="input-field w-full p-3 rounded" 
                  placeholder="e.g. Midnight Sessions EP"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Effective Date *</label>
                  <input 
                    name="effectiveDate" 
                    type="date" 
                    required
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Delivery Date</label>
                  <input 
                    name="deliveryDate" 
                    type="date" 
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">BPM</label>
                  <input 
                    name="bpm" 
                    type="number" 
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Key</label>
                  <select 
                    name="key" 
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded"
                  >
                    <option value="">Select Key</option>
                    <option value="C">C Major</option>
                    <option value="C#">C# Major</option>
                    <option value="D">D Major</option>
                    <option value="D#">D# Major</option>
                    <option value="E">E Major</option>
                    <option value="F">F Major</option>
                    <option value="F#">F# Major</option>
                    <option value="G">G Major</option>
                    <option value="G#">G# Major</option>
                    <option value="A">A Major</option>
                    <option value="A#">A# Major</option>
                    <option value="B">B Major</option>
                    <option value="Cm">C Minor</option>
                    <option value="Dm">D Minor</option>
                    <option value="Em">E Minor</option>
                    <option value="Fm">F Minor</option>
                    <option value="Gm">G Minor</option>
                    <option value="Am">A Minor</option>
                    <option value="Bm">B Minor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Genre</label>
                  <input 
                    name="genre" 
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                    placeholder="e.g. Hip Hop, R&B, Pop"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Producer Address</label>
                  <input 
                    name="producerAddress" 
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                    placeholder="Full Legal Address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Artist Address</label>
                  <input 
                    name="artistAddress" 
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                    placeholder="Full Legal Address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Producer Email</label>
                  <input 
                    name="producerEmail" 
                    type="email"
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                    placeholder="producer@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Artist Email</label>
                  <input 
                    name="artistEmail" 
                    type="email"
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                    placeholder="artist@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Producer Phone</label>
                  <input 
                    name="producerPhone" 
                    type="tel"
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Artist Phone</label>
                  <input 
                    name="artistPhone" 
                    type="tel"
                    onChange={handleFormChange} 
                    className="input-field w-full p-3 rounded" 
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {showAdditionalFields && (
                <div className="card p-4 rounded-lg bg-theme-tertiary">
                  <h3 className="font-bold mb-4">Additional Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {template.fields.includes('exclusiveFee') && (
                      <div>
                        <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Fee ($)</label>
                        <input 
                          name="exclusiveFee" 
                          type="number" 
                          onChange={handleFormChange} 
                          className="input-field w-full p-3 rounded" 
                        />
                      </div>
                    )}
                    {template.fields.includes('masterShare') && (
                      <div>
                        <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Master Royalty (%)</label>
                        <input 
                          name="masterShare" 
                          type="number" 
                          onChange={handleFormChange} 
                          className="input-field w-full p-3 rounded" 
                        />
                      </div>
                    )}
                    {template.fields.includes('buyoutAmount') && (
                      <div>
                        <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Buyout Amount ($)</label>
                        <input 
                          name="buyoutAmount" 
                          type="number" 
                          onChange={handleFormChange} 
                          className="input-field w-full p-3 rounded" 
                        />
                      </div>
                    )}
                    {template.fields.includes('originalDate') && (
                      <div>
                        <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Original Agreement Date</label>
                        <input 
                          name="originalAgreementDate" 
                          type="date" 
                          onChange={handleFormChange} 
                          className="input-field w-full p-3 rounded" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="card p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-theme-secondary uppercase">Additional Collaborators</h3>
                  <button 
                    type="button"
                    onClick={addCollaborator}
                    className="text-sm bg-theme-accent text-white px-3 py-1 rounded hover:bg-accent/80"
                  >
                    + Add Party
                  </button>
                </div>
                <div className="space-y-2">
                  {collaborators.map(collaborator => (
                    <div key={collaborator.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Full Legal Name"
                        value={collaborator.name}
                        onChange={(e) => updateCollaborator(collaborator.id, 'name', e.target.value)}
                        className="flex-1 input-field p-2 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Role (e.g. Writer)"
                        value={collaborator.role}
                        onChange={(e) => updateCollaborator(collaborator.id, 'role', e.target.value)}
                        className="w-24 input-field p-2 rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Split %"
                        value={collaborator.split}
                        onChange={(e) => updateCollaborator(collaborator.id, 'split', e.target.value)}
                        className="w-16 input-field p-2 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeCollaborator(collaborator.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-theme-secondary uppercase mb-2">Custom Clauses / Provisions</label>
                <textarea 
                  name="customTerms" 
                  rows={3}
                  onChange={handleFormChange} 
                  className="input-field w-full p-3 rounded resize-none text-sm" 
                  placeholder="Enter any specific terms or modifications..."
                />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-3 bg-theme-tertiary rounded">
                  Back
                </button>
                <button type="submit" className="flex-1 btn-primary font-bold py-3 rounded">
                  Generate Agreement
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="card p-8 rounded-xl">
              {isGenerating ? (
                <div className="text-center py-12">
                  <div className="animate-pulse text-accent font-medium">Finalizing legal language...</div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Agreement Generated!</h2>
                    <button className="btn-primary px-4 py-2 rounded">Download PDF</button>
                  </div>
                  <div className="bg-white text-gray-800 p-8 rounded-lg font-serif text-sm max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
                  </div>
                  <div className="mt-6 text-center">
                    <button onClick={handleReset} className="text-accent hover:underline">
                      Create Another Agreement
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-theme-tertiary">
          <div className="flex justify-center gap-8 text-sm">
            <a href="/docs" className="text-theme-secondary hover:text-accent transition-colors">
              Documentation
            </a>
            <a href="/generator" className="text-theme-secondary hover:text-accent transition-colors">
              Agreements
            </a>
            <a href="/community" className="text-theme-secondary hover:text-accent transition-colors">
              Community
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
