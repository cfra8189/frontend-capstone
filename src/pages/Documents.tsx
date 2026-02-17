import { useEffect, useState } from "react";
import Header from "../components/Header";
import { ConfirmationModal } from "../components/modals/ConfirmationModal";
import { CueSheetModal } from "../components/modals/CueSheetModal";
import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";

interface DocItem {
  id: string;
  title: string;
  templateId?: string;
  createdAt: string;
}

export default function Documents() {
  const { isAuthenticated } = useAuth();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCueSheet, setShowCueSheet] = useState(false);

  const [location, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(page));
    params.set("limit", String(limit));

    setLoading(true);
    setError(null);
    fetch(`/api/documents?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).message || "Failed to load");
        return res.json();
      })
      .then((data) => {
        setDocs((data.documents || []).map((d: any) => ({ id: d.id, title: d.title, templateId: d.templateId, createdAt: d.createdAt })));
        setTotal(data.total || 0);
      })
      .catch((err) => setError(err.message || "Failed to load documents"))
      .finally(() => setLoading(false));
  }, [isAuthenticated, query, page, limit]);

  // auto-open if ?open=<id> in URL
  useEffect(() => {
    const u = new URL(window.location.href);
    const openId = u.searchParams.get("open");
    if (openId) {
      // clear query param after reading
      const p = new URL(window.location.href);
      p.searchParams.delete("open");
      window.history.replaceState({}, "", p.toString());
      openDoc(openId);
    }
  }, [isAuthenticated]);

  async function openDoc(id: string) {
    setSelectedHtml(null);
    setSelectedTitle(null);
    setSelectedId(id);
    try {
      const res = await fetch(`/api/documents/${id}`);
      if (!res.ok) throw new Error((await res.json()).message || "Failed to load");
      const data = await res.json();
      setSelectedTitle(data.title);
      setSelectedHtml(data.html || "");
    } catch (err: any) {
      setSelectedHtml(`<p style=\"color:red\">${err.message || 'Failed to load document'}</p>`);
    }
  }

  function downloadHtml() {
    if (!selectedHtml || !selectedTitle) return;
    const blob = new Blob([`<!doctype html><html><head><meta charset=\"utf-8\"><title>${selectedTitle}</title></head><body>${selectedHtml}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTitle.replace(/[^a-z0-9\- ]/gi, "") || 'agreement'}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  // rename / delete UI state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function startRename(id: string, currentTitle: string) {
    setRenamingId(id);
    setRenameValue(currentTitle);
  }

  async function doRename() {
    if (!renamingId) return;
    try {
      const res = await fetch(`/api/documents/${renamingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameValue }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Rename failed");
      setDocs(docs.map(d => d.id === renamingId ? { ...d, title: renameValue } : d));
      setRenamingId(null);
    } catch (err: any) {
      setError(err.message || "Rename failed");
    }
  }

  async function handleSaveCueSheet(title: string, html: string) {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          html,
          templateId: "CUE-SHEET"
        })
      });
      if (!res.ok) throw new Error("Failed to save cue sheet");

      // Refresh list
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", String(limit));
      const loadRes = await fetch(`/api/documents?${params.toString()}`);
      if (loadRes.ok) {
        const data = await loadRes.json();
        setDocs((data.documents || []).map((d: any) => ({ id: d.id, title: d.title, templateId: d.templateId, createdAt: d.createdAt })));
        setTotal(data.total || 0);
      }
      setShowCueSheet(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save cue sheet");
    }
  }

  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  function requestDelete(id: string) {
    setDocToDelete(id);
  }

  async function executeDelete() {
    if (!docToDelete) return;
    try {
      const res = await fetch(`/api/documents/${docToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message || "Delete failed");
      setDocs(docs.filter(d => d.id !== docToDelete));
      if (selectedId === docToDelete) {
        setSelectedHtml(null);
        setSelectedId(null);
        setSelectedTitle(null);
      }
    } catch (err: any) {
      setError(err.message || "Delete failed");
    } finally {
      setDocToDelete(null);
    }
  }

  // pagination helpers
  const totalPages = Math.max(1, Math.ceil(total / limit));
  function gotoPage(p: number) {
    setPage(Math.max(1, Math.min(totalPages, p)));
  }
  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />
      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b border-theme pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-[0.2em] text-theme-primary mb-2">Vault // Documents</h1>
            <p className="text-[10px] font-mono font-bold text-theme-muted uppercase tracking-widest">ARCHIVED LEGAL AGREEMENTS & CONTRACTS</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-mono text-theme-muted uppercase tracking-tighter">System synchronized</span>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="card p-6 rounded">
            <p className="text-theme-muted">You must be signed in to view saved agreements.</p>
          </div>
        )}

        {isAuthenticated && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2">
              <div className="card p-6 rounded">
                {loading && <div className="text-theme-muted">Loading...</div>}
                {error && <div className="text-red-500">{error}</div>}
                {!loading && docs.length === 0 && (
                  <div className="text-theme-muted">No saved agreements yet. Generate one in the <a className="text-accent" href="/generator">Agreement Generator</a>.</div>
                )}

                <div className="mb-8 p-4 bg-theme-primary border border-theme shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="text-theme-muted"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg></div>
                    <input
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                      placeholder="SEARCH VAULT..."
                      className="bg-transparent border-none text-sm text-theme-primary placeholder:text-theme-muted/30 focus:outline-none flex-1 uppercase font-mono tracking-tight"
                    />
                    <div className="text-[10px] font-mono font-bold text-theme-muted uppercase bg-theme-secondary px-2 py-1 border border-theme">{total} RECORDS</div>
                    <button
                      onClick={() => setShowCueSheet(true)}
                      className="ml-2 px-3 py-1 bg-accent text-theme-primary font-bold text-[10px] uppercase tracking-widest hover:bg-accent/80 transition-colors"
                    >
                      + New Cue Sheet
                    </button>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  {docs.map((d) => (
                    <div key={d.id} className="p-5 bg-theme-primary border border-theme hover:border-theme-primary/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group shadow-sm hover:shadow-md">
                      <div className="min-w-0 pr-4">
                        <div className="font-bold text-sm tracking-wide text-theme-primary mb-1 uppercase truncate">{d.title}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-mono font-bold text-theme-muted uppercase tracking-widest bg-theme-secondary px-1.5 py-0.5 border border-theme">{d.templateId || 'CUSTOM'}</span>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">{new Date(d.createdAt).toLocaleDateString()} // {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <button onClick={() => openDoc(d.id)} className="text-[9px] font-bold px-3 py-1.5 bg-theme-secondary border border-theme text-theme-primary hover:bg-theme-primary transition-all uppercase tracking-widest">[VIEW]</button>
                        <a href={`/api/documents/${d.id}`} className="text-[9px] font-bold px-3 py-1.5 bg-white text-black border border-white hover:bg-transparent hover:text-white transition-all uppercase tracking-widest" target="_blank" rel="noreferrer">OPEN</a>
                        <button onClick={() => startRename(d.id, d.title)} className="text-[9px] font-bold px-3 py-1.5 border border-theme text-theme-muted hover:text-theme-primary hover:border-theme-primary transition-all uppercase tracking-widest">RENAME</button>
                        <button onClick={() => requestDelete(d.id)} className="text-[9px] font-bold px-3 py-1.5 border border-red-500/30 text-red-500/50 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all uppercase tracking-widest">EJECT</button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-between border-t border-theme pt-8">
                    <div className="text-[10px] font-mono font-bold text-theme-muted uppercase tracking-widest">INDEX: {page} OF {totalPages}</div>
                    <div className="flex gap-1.5">
                      <button onClick={() => gotoPage(1)} disabled={page === 1} className="text-[9px] font-bold px-2 py-1 bg-theme-secondary border border-theme text-theme-muted disabled:opacity-20 hover:border-theme-primary transition-all uppercase">Start</button>
                      <button onClick={() => gotoPage(page - 1)} disabled={page === 1} className="text-[9px] font-bold px-2 py-1 bg-theme-secondary border border-theme text-theme-muted disabled:opacity-20 hover:border-theme-primary transition-all uppercase">Prev</button>
                      <button onClick={() => gotoPage(page + 1)} disabled={page === totalPages} className="text-[9px] font-bold px-2 py-1 bg-theme-secondary border border-theme text-theme-muted disabled:opacity-20 hover:border-theme-primary transition-all uppercase">Next</button>
                      <button onClick={() => gotoPage(totalPages)} disabled={page === totalPages} className="text-[9px] font-bold px-2 py-1 bg-theme-secondary border border-theme text-theme-muted disabled:opacity-20 hover:border-theme-primary transition-all uppercase">End</button>
                    </div>
                  </div>
                )}

                {renamingId && (
                  <div className="mt-4 p-4 rounded border border-theme-tertiary">
                    <div className="text-sm font-bold mb-2">Rename Agreement</div>
                    <div className="flex gap-2">
                      <input className="input-field p-2 rounded flex-1" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                      <button onClick={doRename} className="px-3 py-2 rounded bg-theme-accent text-white">Save</button>
                      <button onClick={() => setRenamingId(null)} className="px-3 py-2 rounded border border-theme-tertiary">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-1">
              <div className="card p-6 rounded h-full">
                <h3 className="font-bold mb-4">Preview</h3>
                {!selectedHtml && (
                  <div className="text-theme-muted text-sm">Select an agreement to preview its content here.</div>
                )}
                {selectedHtml && (
                  <>
                    <div className="bg-white text-gray-800 p-4 rounded text-sm max-h-[60vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: selectedHtml }} />
                    <div className="mt-4 flex gap-2">
                      <button onClick={downloadHtml} className="px-3 py-2 rounded bg-theme-accent text-white">Download HTML</button>
                      <button onClick={() => window.print()} className="px-3 py-2 rounded border border-theme-tertiary text-theme-secondary">Print</button>
                      <button onClick={() => { setSelectedHtml(null); setSelectedId(null); setSelectedTitle(null); }} className="px-3 py-2 rounded text-theme-muted border border-theme-tertiary">Close</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <ConfirmationModal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={executeDelete}
        title="DELETE AGREEMENT?"
        message="Are you sure you want to delete this saved agreement? This action cannot be undone."
        confirmText="DELETE"
        isDangerous={true}
      />

      <CueSheetModal
        isOpen={showCueSheet}
        onClose={() => setShowCueSheet(false)}
        onSave={handleSaveCueSheet}
      />
    </div>
  );
}
