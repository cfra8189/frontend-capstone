import { useEffect, useState } from "react";
import Header from "../components/Header";
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

  async function confirmDelete(id: string) {
    if (!confirm("Delete this saved agreement? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message || "Delete failed");
      setDocs(docs.filter(d => d.id !== id));
      if (selectedId === id) {
        setSelectedHtml(null);
        setSelectedId(null);
        setSelectedTitle(null);
      }
    } catch (err: any) {
      setError(err.message || "Delete failed");
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Saved Agreements</h1>
          <p className="text-sm text-theme-muted">All agreements you've saved to The Box</p>
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

                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search saved agreements..." className="input-field p-2 rounded flex-1" />
                    <div className="text-sm text-theme-muted">{total} results</div>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  {docs.map((d) => (
                    <div key={d.id} className="p-4 rounded border border-theme-tertiary flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold">{d.title}</div>
                        <div className="text-xs text-theme-muted">{d.templateId || 'Custom'} • {new Date(d.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => openDoc(d.id)} className="px-3 py-2 rounded border border-theme-tertiary text-theme-secondary">View</button>
                        <a href={`/api/documents/${d.id}`} className="px-3 py-2 rounded bg-theme-accent text-white" target="_blank" rel="noreferrer">Open</a>
                        <button onClick={() => startRename(d.id, d.title)} className="px-3 py-2 rounded border border-theme-tertiary text-theme-secondary">Rename</button>
                        <button onClick={() => confirmDelete(d.id)} className="px-3 py-2 rounded border border-red-500 text-red-500">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-theme-muted">Page {page} of {totalPages}</div>
                  <div className="flex gap-2">
                    <button onClick={() => gotoPage(1)} disabled={page===1} className="px-3 py-1 rounded border border-theme-tertiary">First</button>
                    <button onClick={() => gotoPage(page-1)} disabled={page===1} className="px-3 py-1 rounded border border-theme-tertiary">Prev</button>
                    <button onClick={() => gotoPage(page+1)} disabled={page===totalPages} className="px-3 py-1 rounded border border-theme-tertiary">Next</button>
                    <button onClick={() => gotoPage(totalPages)} disabled={page===totalPages} className="px-3 py-1 rounded border border-theme-tertiary">Last</button>
                  </div>
                </div>

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
    </div>
  );
}
