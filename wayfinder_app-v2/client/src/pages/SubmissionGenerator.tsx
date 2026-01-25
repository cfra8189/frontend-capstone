import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import Header from "../components/Header";

interface Project {
  id: number;
  title: string;
  type: string;
  status: string;
  description: string | null;
  metadata: {
    isrc?: string;
    upc?: string;
    iswc?: string;
    copyrightNumber?: string;
    proWorkId?: string;
    releaseDate?: string;
    duration?: string;
    writers?: string[];
    publishers?: string[];
    genre?: string;
    bpm?: string;
  } | null;
  createdAt: string;
}

type PlatformType = "mlc" | "ascap_bmi" | "music_reports" | "soundexchange" | "hfa";
type FormatType = "csv" | "txt";

interface PlatformInfo {
  name: string;
  fullName: string;
  description: string;
  format: FormatType;
  fields: string[];
}

const PLATFORMS: Record<PlatformType, PlatformInfo> = {
  mlc: {
    name: "The MLC",
    fullName: "The Mechanical Licensing Collective",
    description: "Bulk Work Registration for digital mechanical royalties in the U.S.",
    format: "csv",
    fields: ["Work Title", "ISWC", "Writers", "Publishers", "Ownership %", "PRO Work ID", "Alternative Titles"]
  },
  ascap_bmi: {
    name: "ASCAP/BMI",
    fullName: "MusicMark Electronic Batch Registration",
    description: "Performance royalties registration via MusicMark EBR system.",
    format: "csv",
    fields: ["Work Title", "Writers", "Publishers", "ISWC", "Duration", "Genre", "PRO Affiliation"]
  },
  music_reports: {
    name: "Music Reports",
    fullName: "Songdex Catalog Template",
    description: "Licensing registration for platforms like TikTok and Amazon Music.",
    format: "csv",
    fields: ["Song Title", "ISRC", "ISWC", "Writers", "Publishers", "Release Date", "Duration", "UPC"]
  },
  soundexchange: {
    name: "SoundExchange",
    fullName: "ISRC Ingest Form",
    description: "Digital performance royalties for master recordings.",
    format: "csv",
    fields: ["Recording Title", "ISRC", "Artist Name", "Featured Artists", "Release Date", "Duration", "Label", "UPC"]
  },
  hfa: {
    name: "Harry Fox Agency",
    fullName: "eSong Bulk Registration Template",
    description: "Mechanical royalties for reproductions (streaming, downloads, CDs). Excel template for bulk uploads.",
    format: "csv",
    fields: ["Song Title", "Writer First Name", "Writer Last Name", "Ownership Share", "ISRC", "Artist Name", "Album Title", "Publisher P#"]
  }
};

export default function SubmissionGenerator() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"select-platform" | "select-projects" | "preview">("select-platform");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleProject(id: number) {
    setSelectedProjects(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedProjects(projects.map(p => p.id));
  }

  function deselectAll() {
    setSelectedProjects([]);
  }

  function generateCSVContent(): string {
    if (!selectedPlatform) return "";
    
    const platform = PLATFORMS[selectedPlatform];
    const selectedData = projects.filter(p => selectedProjects.includes(p.id));
    
    let csvContent = "";
    
    switch (selectedPlatform) {
      case "mlc":
        csvContent = generateMLCFormat(selectedData);
        break;
      case "ascap_bmi":
        csvContent = generateASCAPBMIFormat(selectedData);
        break;
      case "music_reports":
        csvContent = generateMusicReportsFormat(selectedData);
        break;
      case "soundexchange":
        csvContent = generateSoundExchangeFormat(selectedData);
        break;
      case "hfa":
        csvContent = generateHFAFormat(selectedData);
        break;
    }
    
    return csvContent;
  }

  function generateMLCFormat(data: Project[]): string {
    const headers = ["Work Title", "ISWC", "Writers", "Publishers", "Ownership Percentage", "PRO Work ID", "Alternative Titles"];
    const rows = data.map(p => [
      p.title,
      p.metadata?.iswc || "",
      (p.metadata?.writers || []).join("; "),
      (p.metadata?.publishers || []).join("; "),
      "100",
      p.metadata?.proWorkId || "",
      ""
    ]);
    return [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
  }

  function generateASCAPBMIFormat(data: Project[]): string {
    const headers = ["Work Title", "Writers", "Publishers", "ISWC", "Duration", "Genre", "PRO Affiliation"];
    const rows = data.map(p => [
      p.title,
      (p.metadata?.writers || []).join("; "),
      (p.metadata?.publishers || []).join("; "),
      p.metadata?.iswc || "",
      p.metadata?.duration || "",
      p.metadata?.genre || "",
      ""
    ]);
    return [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
  }

  function generateMusicReportsFormat(data: Project[]): string {
    const headers = ["Song Title", "ISRC", "ISWC", "Writers", "Publishers", "Release Date", "Duration", "UPC"];
    const rows = data.map(p => [
      p.title,
      p.metadata?.isrc || "",
      p.metadata?.iswc || "",
      (p.metadata?.writers || []).join("; "),
      (p.metadata?.publishers || []).join("; "),
      p.metadata?.releaseDate || "",
      p.metadata?.duration || "",
      p.metadata?.upc || ""
    ]);
    return [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
  }

  function generateSoundExchangeFormat(data: Project[]): string {
    const headers = ["Recording Title", "ISRC", "Artist Name", "Featured Artists", "Release Date", "Duration", "Label", "UPC"];
    const rows = data.map(p => [
      p.title,
      p.metadata?.isrc || "",
      user?.displayName || "",
      "",
      p.metadata?.releaseDate || "",
      p.metadata?.duration || "",
      "",
      p.metadata?.upc || ""
    ]);
    return [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
  }

  function generateHFAFormat(data: Project[]): string {
    const headers = ["Song Title", "Writer First Name", "Writer Last Name", "Ownership Share", "ISRC", "Artist Name", "Album Title", "Publisher P#"];
    const rows: string[][] = [];
    
    data.forEach(p => {
      const writers = p.metadata?.writers || [];
      if (writers.length === 0) {
        rows.push([
          p.title,
          "",
          "",
          "100",
          p.metadata?.isrc || "",
          user?.displayName || "",
          "",
          ""
        ]);
      } else {
        const sharePerWriter = Math.floor(100 / writers.length);
        writers.forEach((writer, i) => {
          const nameParts = writer.trim().split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";
          rows.push([
            p.title,
            firstName,
            lastName,
            String(sharePerWriter),
            p.metadata?.isrc || "",
            user?.displayName || "",
            "",
            ""
          ]);
        });
      }
    });
    
    return [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
  }

  function downloadFile() {
    if (!selectedPlatform) return;
    
    const content = generateCSVContent();
    const platform = PLATFORMS[selectedPlatform];
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${platform.name.replace(/\//g, "_")}_submission_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function getPreviewData(): { headers: string[], rows: string[][] } {
    if (!selectedPlatform) return { headers: [], rows: [] };
    
    const selectedData = projects.filter(p => selectedProjects.includes(p.id));
    
    switch (selectedPlatform) {
      case "mlc":
        return {
          headers: ["Work Title", "ISWC", "Writers", "Publishers", "Ownership %", "PRO Work ID"],
          rows: selectedData.map(p => [
            p.title,
            p.metadata?.iswc || "-",
            (p.metadata?.writers || []).join("; ") || "-",
            (p.metadata?.publishers || []).join("; ") || "-",
            "100%",
            p.metadata?.proWorkId || "-"
          ])
        };
      case "ascap_bmi":
        return {
          headers: ["Work Title", "Writers", "Publishers", "ISWC", "Duration", "Genre"],
          rows: selectedData.map(p => [
            p.title,
            (p.metadata?.writers || []).join("; ") || "-",
            (p.metadata?.publishers || []).join("; ") || "-",
            p.metadata?.iswc || "-",
            p.metadata?.duration || "-",
            p.metadata?.genre || "-"
          ])
        };
      case "music_reports":
        return {
          headers: ["Song Title", "ISRC", "ISWC", "Writers", "Release Date", "UPC"],
          rows: selectedData.map(p => [
            p.title,
            p.metadata?.isrc || "-",
            p.metadata?.iswc || "-",
            (p.metadata?.writers || []).join("; ") || "-",
            p.metadata?.releaseDate || "-",
            p.metadata?.upc || "-"
          ])
        };
      case "soundexchange":
        return {
          headers: ["Recording Title", "ISRC", "Artist", "Release Date", "Duration", "UPC"],
          rows: selectedData.map(p => [
            p.title,
            p.metadata?.isrc || "-",
            user?.displayName || "-",
            p.metadata?.releaseDate || "-",
            p.metadata?.duration || "-",
            p.metadata?.upc || "-"
          ])
        };
      case "hfa":
        return {
          headers: ["Song Title", "Writer First", "Writer Last", "Share", "ISRC", "Artist"],
          rows: selectedData.flatMap(p => {
            const writers = p.metadata?.writers || [];
            if (writers.length === 0) {
              return [[p.title, "-", "-", "100", p.metadata?.isrc || "-", user?.displayName || "-"]];
            }
            const sharePerWriter = Math.floor(100 / writers.length);
            return writers.map(w => {
              const parts = w.trim().split(" ");
              return [p.title, parts[0] || "-", parts.slice(1).join(" ") || "-", String(sharePerWriter), p.metadata?.isrc || "-", user?.displayName || "-"];
            });
          })
        };
      default:
        return { headers: [], rows: [] };
    }
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <main className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submission File Generator</h1>
          <p className="text-theme-secondary">
            Export your project data in industry-standard formats for royalty and rights platforms
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setStep("select-platform")}
            className={`px-4 py-2 rounded-lg text-sm ${
              step === "select-platform" ? "bg-accent text-accent-contrast font-bold" : "bg-theme-secondary text-theme-muted"
            }`}
          >
            1. Select Platform
          </button>
          <button
            onClick={() => selectedPlatform && setStep("select-projects")}
            disabled={!selectedPlatform}
            className={`px-4 py-2 rounded-lg text-sm ${
              step === "select-projects" ? "bg-accent text-accent-contrast font-bold" : "bg-theme-secondary text-theme-muted"
            } disabled:opacity-50`}
          >
            2. Select Projects
          </button>
          <button
            onClick={() => selectedProjects.length > 0 && setStep("preview")}
            disabled={selectedProjects.length === 0}
            className={`px-4 py-2 rounded-lg text-sm ${
              step === "preview" ? "bg-accent text-accent-contrast font-bold" : "bg-theme-secondary text-theme-muted"
            } disabled:opacity-50`}
          >
            3. Preview & Download
          </button>
        </div>

        {step === "select-platform" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Select Destination Platform</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(PLATFORMS) as [PlatformType, PlatformInfo][]).map(([key, platform]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedPlatform(key);
                    setStep("select-projects");
                  }}
                  className={`card p-6 rounded-xl text-left transition-all hover:border-accent ${
                    selectedPlatform === key ? "border-2 border-accent" : "border border-theme"
                  }`}
                >
                  <h3 className="text-lg font-bold text-accent mb-1">{platform.name}</h3>
                  <p className="text-sm text-theme-secondary mb-2">{platform.fullName}</p>
                  <p className="text-xs text-theme-muted mb-3">{platform.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {platform.fields.slice(0, 4).map((field, i) => (
                      <span key={i} className="text-xs bg-theme-tertiary px-2 py-1 rounded">
                        {field}
                      </span>
                    ))}
                    {platform.fields.length > 4 && (
                      <span className="text-xs text-theme-muted">+{platform.fields.length - 4} more</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="card p-6 rounded-xl mt-8">
              <h3 className="text-lg font-bold mb-3">About File Formats</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-bold text-accent mb-1">CSV (Comma-Separated Values)</h4>
                  <p className="text-theme-muted">
                    User-friendly format for bulk uploads. Opens in Excel or Google Sheets. 
                    Recommended for independent artists and small publishers.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-accent mb-1">CWR (Common Works Registration)</h4>
                  <p className="text-theme-muted">
                    Industry "gold standard" for large publishers. Machine-readable format 
                    requiring specialized software. Used for automated catalog registration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "select-projects" && selectedPlatform && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Select Projects to Export</h2>
                <p className="text-sm text-theme-muted">
                  Exporting for: <span className="text-accent">{PLATFORMS[selectedPlatform].name}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-sm text-accent hover:underline">
                  Select All
                </button>
                <span className="text-theme-muted">|</span>
                <button onClick={deselectAll} className="text-sm text-theme-muted hover:underline">
                  Deselect All
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-theme-muted">Loading projects...</p>
            ) : projects.length === 0 ? (
              <div className="card p-8 rounded-xl text-center">
                <p className="text-theme-muted mb-4">No projects found. Create some projects first to export.</p>
                <a href="/" className="text-accent hover:underline">Go to Dashboard</a>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    className={`card p-4 rounded-lg cursor-pointer transition-all flex items-center gap-4 ${
                      selectedProjects.includes(project.id) 
                        ? "border-2 border-accent bg-theme-secondary" 
                        : "border border-theme hover:border-theme-muted"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedProjects.includes(project.id) 
                        ? "border-accent bg-accent" 
                        : "border-theme-muted bg-transparent"
                    }`}>
                      {selectedProjects.includes(project.id) && (
                        <span className="text-black text-xs font-bold">✓</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{project.title}</h3>
                      <div className="flex gap-3 text-xs text-theme-muted mt-1">
                        <span>{project.type}</span>
                        <span>•</span>
                        <span>{project.status}</span>
                        {project.metadata?.isrc && (
                          <>
                            <span>•</span>
                            <span>ISRC: {project.metadata.isrc}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-theme-muted">
                      {project.metadata?.iswc ? "✓ ISWC" : ""}
                      {project.metadata?.isrc ? " ✓ ISRC" : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep("select-platform")}
                className="text-theme-muted hover:text-theme-primary"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep("preview")}
                disabled={selectedProjects.length === 0}
                className="btn-primary px-6 py-3 rounded-lg font-bold disabled:opacity-50"
              >
                Preview ({selectedProjects.length} selected) →
              </button>
            </div>
          </div>
        )}

        {step === "preview" && selectedPlatform && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Preview & Download</h2>
              <p className="text-sm text-theme-muted">
                <span className="text-accent">{PLATFORMS[selectedPlatform].name}</span> format • 
                {selectedProjects.length} project{selectedProjects.length !== 1 ? "s" : ""} selected
              </p>
            </div>

            <div className="card p-6 rounded-xl mb-6 overflow-x-auto">
              <h3 className="font-bold mb-4">Data Preview</h3>
              {(() => {
                const { headers, rows } = getPreviewData();
                return (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-theme">
                        {headers.map((h, i) => (
                          <th key={i} className="text-left py-2 px-3 text-accent font-bold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-theme-tertiary hover:bg-theme-secondary">
                          {row.map((cell, j) => (
                            <td key={j} className="py-2 px-3 text-theme-secondary">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <div className="card p-6 rounded-xl mb-6">
              <h3 className="font-bold mb-2">Missing Data Notice</h3>
              <p className="text-sm text-theme-muted mb-4">
                Fields marked with "-" are empty. Complete your project metadata for accurate submissions.
              </p>
              <p className="text-xs text-theme-muted">
                Tip: Add ISRC, ISWC, writers, and publishers in each project's details page before exporting.
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep("select-projects")}
                className="text-theme-muted hover:text-theme-primary"
              >
                ← Back
              </button>
              <button
                onClick={downloadFile}
                className="btn-primary px-8 py-3 rounded-lg font-bold"
              >
                Download CSV File
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
