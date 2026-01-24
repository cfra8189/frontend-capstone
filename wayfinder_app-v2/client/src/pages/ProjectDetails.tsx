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
  { id: "fixation", title: "1. Fix Your Work", fee: "FREE", description: "Record or document in tangible form" },
  { id: "copyright", title: "2. Register Copyright", fee: "$45-65", description: "File with US Copyright Office" },
  { id: "pro", title: "3. Join a PRO", fee: "FREE-$50", description: "ASCAP, BMI for royalty collection" },
  { id: "register_song", title: "4. Register Composition", fee: "FREE", description: "Get ISWC from your PRO" },
  { id: "distributor", title: "5. Upload to Distributor", fee: "$0-30/yr", description: "Get ISRC and UPC codes" },
  { id: "release", title: "6. Release & Monitor", fee: "N/A", description: "Track performance and royalties" },
];

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [id]);

  async function loadProject() {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setLoading(false);
    }
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

  const workflow = project.metadata?.workflow || {};

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
                  <p className="text-theme-muted text-sm">Complete these steps to protect your intellectual property.</p>
                </div>
                <Link href="/docs" className="text-xs text-accent hover:underline whitespace-nowrap">
                  View full guide →
                </Link>
              </div>

              {(() => {
                const completedCount = workflowSteps.filter(s => workflow[`${s.id}_complete`]).length;
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
              
              <div className="space-y-4">
                {workflowSteps.map(step => {
                  const isComplete = workflow[`${step.id}_complete`];
                  return (
                    <div
                      key={step.id}
                      className={`card p-4 rounded-lg border ${isComplete ? "step-complete" : "step-pending"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`step-icon w-10 h-10 rounded-full flex items-center justify-center font-bold`}>
                          {isComplete ? "✓" : step.title.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold">{step.title}</h3>
                          <p className="text-theme-muted text-sm">{step.description}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs ${isComplete ? "text-green-400" : "text-theme-muted"}`}>
                            {isComplete ? "Complete" : step.fee}
                          </span>
                        </div>
                      </div>
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
                  <span className="text-theme-secondary">{project.metadata?.isrc || workflow.isrc || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">UPC</span>
                  <span className="text-theme-secondary">{project.metadata?.upc || workflow.upc || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">ISWC</span>
                  <span className="text-theme-secondary">{workflow.iswc || "Not set"}</span>
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
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
