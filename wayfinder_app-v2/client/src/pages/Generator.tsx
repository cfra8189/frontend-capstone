import { useState } from "react";
import { Link } from "wouter";
import { useTheme } from "../context/ThemeContext";

const agreementTypes = [
  { id: "split_sheet", name: "Split Sheet", description: "Document ownership splits" },
  { id: "license_basic", name: "Basic License", description: "Non-exclusive lease" },
  { id: "license_premium", name: "Premium License", description: "Exclusive rights" },
  { id: "production", name: "Production Agreement", description: "Producer/artist terms" },
  { id: "confidentiality", name: "NDA", description: "Confidentiality agreement" },
];

export default function Generator() {
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  function handleSelect(typeId: string) {
    setSelectedType(typeId);
    setStep(2);
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setStep(3);
  }

  function handleReset() {
    setStep(1);
    setSelectedType("");
    setFormData({});
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-theme p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-theme-secondary hover:text-theme-primary">&larr;</Link>
            <img src="/box-logo.png" alt="BOX" className="w-8 h-8" />
            <span className="text-xl brand-font tracking-wider">BOX</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-theme-secondary text-theme-secondary hover:text-theme-primary transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? "btn-primary" : "bg-theme-tertiary text-theme-muted"}`}>
                {s}
              </div>
              <span className={`text-sm ${step >= s ? "text-theme-primary" : "text-theme-muted"}`}>
                {s === 1 ? "Select Type" : s === 2 ? "Fill Details" : "Download"}
              </span>
              {s < 3 && <div className="w-8 h-px bg-theme-tertiary" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Select Agreement Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agreementTypes.map(type => (
                <div
                  key={type.id}
                  onClick={() => handleSelect(type.id)}
                  className="card p-6 rounded-xl cursor-pointer hover:border-accent transition-colors"
                >
                  <h3 className="font-bold mb-1">{type.name}</h3>
                  <p className="text-sm text-theme-muted">{type.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Fill in Details</h2>
            <form onSubmit={handleGenerate} className="card p-6 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-theme-secondary mb-1">Party A Name *</label>
                  <input name="partyA" required onChange={handleFormChange} className="input-field w-full p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-theme-secondary mb-1">Party B Name *</label>
                  <input name="partyB" required onChange={handleFormChange} className="input-field w-full p-2 rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-theme-secondary mb-1">Work Title *</label>
                <input name="workTitle" required onChange={handleFormChange} className="input-field w-full p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm text-theme-secondary mb-1">Date</label>
                <input name="date" type="date" onChange={handleFormChange} className="input-field w-full p-2 rounded" />
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
          <div className="text-center">
            <div className="card p-8 rounded-xl mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                ✓
              </div>
              <h2 className="text-xl font-bold mb-2">Agreement Generated!</h2>
              <p className="text-theme-muted mb-6">
                {agreementTypes.find(t => t.id === selectedType)?.name} for "{formData.workTitle}"
              </p>
              <div className="text-left bg-theme-tertiary p-4 rounded-lg text-sm font-mono mb-6 max-h-64 overflow-y-auto">
                <p className="text-accent mb-2">// AGREEMENT PREVIEW</p>
                <p>Type: {agreementTypes.find(t => t.id === selectedType)?.name}</p>
                <p>Party A: {formData.partyA}</p>
                <p>Party B: {formData.partyB}</p>
                <p>Work: {formData.workTitle}</p>
                <p>Date: {formData.date || new Date().toLocaleDateString()}</p>
              </div>
              <p className="text-xs text-theme-muted mb-4">
                PDF generation available in full version
              </p>
            </div>
            <button onClick={handleReset} className="text-accent hover:underline">
              Create Another Agreement
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
