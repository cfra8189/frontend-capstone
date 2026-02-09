import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import Header from "../components/Header";

interface Project {
  id: number;
  title: string;
  type: string;
  status: string;
  description: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

const workflowSteps = [
  { 
    id: "fixation", 
    title: "1. Fix Your Work", 
    fee: "FREE", 
    description: "Record or document in tangible form",
    fields: [
      { key: "fixation_date", label: "Date Fixed", type: "date", placeholder: "When was it recorded?" },
      { key: "fixation_format", label: "Format", type: "text", placeholder: "Audio file, video, manuscript..." },
    ]
  },
  { 
    id: "copyright", 
    title: "2. Register Copyright", 
    fee: "$45-65", 
    description: "File with US Copyright Office",
    fields: [
      { key: "copyright_reg_number", label: "Registration Number", type: "text", placeholder: "e.g., SR0000123456" },
      { key: "copyright_date", label: "Registration Date", type: "date", placeholder: "" },
    ]
  },
  { 
    id: "pro", 
    title: "3. Join a PRO", 
    fee: "FREE-$50", 
    description: "ASCAP, BMI for royalty collection",
    fields: [
      { key: "pro_name", label: "PRO Name", type: "select", options: ["ASCAP", "BMI", "SESAC", "GMR", "Other"] },
      { key: "pro_member_id", label: "Member ID", type: "text", placeholder: "Your PRO member ID" },
    ]
  },
  { 
    id: "register_song", 
    title: "4. Register Composition", 
    fee: "FREE", 
    description: "Get ISWC from your PRO",
    fields: [
      { key: "iswc", label: "ISWC", type: "text", placeholder: "e.g., T-123.456.789-0" },
    ]
  },
  { 
    id: "distributor", 
    title: "5. Upload to Distributor", 
    fee: "$0-30/yr", 
    description: "Get ISRC and UPC codes",
    fields: [
      { key: "distributor", label: "Distributor", type: "text", placeholder: "DistroKid, TuneCore, CD Baby..." },
      { key: "isrc", label: "ISRC", type: "text", placeholder: "e.g., USRC12345678" },
      { key: "upc", label: "UPC", type: "text", placeholder: "e.g., 012345678901" },
    ]
  },
  { 
    id: "release", 
    title: "6. Release & Monitor", 
    fee: "N/A", 
    description: "Track performance and royalties",
    fields: [
      { key: "release_date", label: "Release Date", type: "date", placeholder: "" },
      { key: "release_notes", label: "Notes", type: "text", placeholder: "Streaming links, first week stats..." },
    ]
  },
];

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [localWorkflow, setLocalWorkflow] = useState<Record<string, any>>({});

  useEffect(() => {
    loadProject();
  }, [id]);

  async function loadProject() {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setLocalWorkflow(data.project?.metadata?.workflow || {});
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStepComplete(stepId: string) {
    if (!project) return;
    const next = { ...localWorkflow, [`${stepId}_complete`]: !localWorkflow[`${stepId}_complete`] };
    setLocalWorkflow(next);
    setSaving(true);
    try {
      const newMetadata = { ...project.metadata, workflow: next };
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: newMetadata }),
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    } catch (error) {
      console.error("Failed to update workflow:", error);
    } finally {
      setSaving(false);
    }
  }

  function handleFieldChange(_stepId: string, fieldKey: string, value: string) {
    setLocalWorkflow(prev => ({ ...prev, [fieldKey]: value }));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-theme-muted">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-theme-muted mb-4">Project not found</p>
          <Link href="/" className="text-accent hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className={`status-${project.status} px-3 py-1 rounded text-xs uppercase`}>
              {project.status}
            </span>
            <span className="text-theme-muted text-sm">{project.type}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
          <p className="text-theme-secondary">{project.description || "No description"}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-accent">IP Protection Workflow</h2>
                  <p className="text-theme-muted text-sm">Click each step to track your progress and enter details.</p>
                </div>
                <Link href="/docs" className="text-xs text-accent hover:underline whitespace-nowrap">
                  View full guide →
                </Link>
              </div>

              {(() => {
                const completedCount = workflowSteps.filter(s => localWorkflow[`${s.id}_complete`]).length;
                const progressPercent = Math.round((completedCount / workflowSteps.length) * 100);
                return (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-theme-secondary">{completedCount} of {workflowSteps.length} steps complete</span>
                      <span className="text-sm font-bold text-accent">{progressPercent}%</span>
                    </div>
                    <div className="h-3 bg-theme-tertiary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
              
              <div className="space-y-3">
                {workflowSteps.map(step => {
                  const isComplete = localWorkflow[`${step.id}_complete`];
                  const isExpanded = expandedStep === step.id;
                  
                  return (
                    <div
                      key={step.id}
                      className={`card rounded-lg border transition-all ${isComplete ? "step-complete" : "step-pending"}`}
                    >
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                        className="w-full p-4 flex items-center gap-4 text-left"
                      >
                        <div className={`step-icon w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
                          {isComplete ? "✓" : step.title.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold">{step.title}</h3>
                          <p className="text-theme-muted text-sm truncate">{step.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs ${isComplete ? "text-green-400" : "text-theme-muted"}`}>
                            {isComplete ? "Complete" : step.fee}
                          </span>
                          <svg 
                            className={`w-4 h-4 text-theme-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-theme mt-0 pt-4">
                          <div className="space-y-3">
                            {step.fields.map(field => (
                              <div key={field.key}>
                                <label className="block text-xs text-theme-muted mb-1">{field.label}</label>
                                {field.type === "select" && field.options ? (
                                  <select
                                    value={localWorkflow[field.key] || ""}
                                    onChange={(e) => handleFieldChange(step.id, field.key, e.target.value)}
                                    className="w-full input-field px-3 py-2 rounded text-sm"
                                    disabled={saving}
                                  >
                                    <option value="">Select...</option>
                                    {field.options.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={field.type}
                                    value={localWorkflow[field.key] || ""}
                                    onChange={(e) => handleFieldChange(step.id, field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full input-field px-3 py-2 rounded text-sm"
                                    disabled={saving}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <button
                            onClick={() => toggleStepComplete(step.id)}
                            disabled={saving}
                            className={`mt-4 w-full py-2 px-4 rounded text-sm font-medium transition-colors ${
                              isComplete 
                                ? "bg-theme-tertiary text-theme-secondary hover:bg-red-900/30 hover:text-red-400" 
                                : "bg-accent text-accent-contrast hover:opacity-90"
                            }`}
                          >
                            {saving ? "Saving..." : isComplete ? "Mark as Incomplete" : "Mark as Complete"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Identifiers</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">ISRC</span>
                  <span className="text-theme-secondary font-mono">{localWorkflow.isrc || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">UPC</span>
                  <span className="text-theme-secondary font-mono">{localWorkflow.upc || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">ISWC</span>
                  <span className="text-theme-secondary font-mono">{localWorkflow.iswc || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Copyright #</span>
                  <span className="text-theme-secondary font-mono">{localWorkflow.copyright_reg_number || "Not set"}</span>
                </div>
              </div>
            </div>

            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Tracking Tools</h2>
              <div className="space-y-2 text-sm">
                <a href="https://artists.spotify.com" target="_blank" rel="noreferrer" className="flex justify-between text-green-400 hover:underline">
                  <span>Spotify for Artists</span>
                  <span className="text-theme-muted text-xs">Daily</span>
                </a>
                <a href="https://artists.apple.com" target="_blank" rel="noreferrer" className="flex justify-between text-pink-400 hover:underline">
                  <span>Apple Music</span>
                  <span className="text-theme-muted text-xs">Daily</span>
                </a>
                <a href="https://soundexchange.com" target="_blank" rel="noreferrer" className="flex justify-between text-blue-400 hover:underline">
                  <span>SoundExchange</span>
                  <span className="text-theme-muted text-xs">Monthly</span>
                </a>
              </div>
            </div>

            <div className="card p-6 rounded-xl">
              <h2 className="text-lg font-bold text-accent mb-4">Timeline</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Created</span>
                  <span className="text-theme-secondary">{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Updated</span>
                  <span className="text-theme-secondary">{new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
                {localWorkflow.release_date && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Released</span>
                    <span className="text-theme-secondary">{new Date(localWorkflow.release_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
