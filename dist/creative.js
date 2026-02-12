let currentUser = null;
let notes = [];
let currentFilter = "all";
let mediaLinkCount = 0;

async function checkAuth() {
    try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            return true;
        }
    } catch {}
    return false;
}

function showMain() {
    document.getElementById("auth-redirect").classList.add("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    document.getElementById("user-name").textContent = currentUser.name;
    loadNotes();
}

function showAuthRedirect() {
    document.getElementById("auth-redirect").classList.remove("hidden");
    document.getElementById("main-content").classList.add("hidden");
}

async function loadNotes() {
    try {
        const res = await fetch("/api/notes");
        if (res.ok) {
            const data = await res.json();
            notes = data.notes;
            renderNotes();
        }
    } catch (err) {
        console.error("Failed to load notes");
    }
}

function filterNotes(category) {
    currentFilter = category;
    document.querySelectorAll(".cat-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    document.querySelector(`[data-cat="${category}"]`).classList.add("active");
    renderNotes();
}

function renderNotes() {
    const container = document.getElementById("notes-grid");
    let filtered = notes;
    
    if (currentFilter !== "all") {
        filtered = notes.filter(n => n.category === currentFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center py-12">No notes in this category yet.</p>';
        return;
    }
    
    container.innerHTML = filtered.map(note => {
        const mediaUrls = note.media_urls || [];
        const tags = note.tags || [];
        const preview = (note.content || "").substring(0, 150);
        const hasMedia = mediaUrls.length > 0;
        
        return `
            <div class="card p-4 rounded-lg cursor-pointer category-${note.category} ${note.is_pinned ? 'pinned' : ''}" onclick="openEditNote(${note.id})">
                ${note.is_pinned ? '<span class="text-xs text-yellow-500 mb-2 block">PINNED</span>' : ''}
                <div class="flex items-start justify-between mb-2">
                    <span class="text-xs uppercase text-gray-500">${note.category}</span>
                    <span class="text-xs text-gray-600">${formatDate(note.updated_at)}</span>
                </div>
                <h3 class="font-bold mb-2">${note.title || 'Untitled'}</h3>
                <p class="text-gray-400 text-sm mb-3">${preview}${note.content && note.content.length > 150 ? '...' : ''}</p>
                ${hasMedia ? `<div class="flex gap-2 mb-2"><span class="text-xs text-blue-400">${mediaUrls.length} link${mediaUrls.length > 1 ? 's' : ''}</span></div>` : ''}
                ${tags.length > 0 ? `<div class="flex flex-wrap gap-1">${tags.slice(0, 3).map(t => `<span class="text-xs bg-gray-800 px-2 py-1 rounded">${t}</span>`).join('')}</div>` : ''}
            </div>
        `;
    }).join("");
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

function openNewNote() {
    document.getElementById("modal-title").textContent = "New Note";
    document.getElementById("note-id").value = "";
    document.getElementById("note-title").value = "";
    document.getElementById("note-category").value = currentFilter !== "all" ? currentFilter : "idea";
    document.getElementById("note-content").value = "";
    document.getElementById("note-tags").value = "";
    document.getElementById("note-pinned").checked = false;
    document.getElementById("media-links-container").innerHTML = "";
    document.getElementById("delete-note-btn").classList.add("hidden");
    mediaLinkCount = 0;
    document.getElementById("note-modal").classList.remove("hidden");
}

function openEditNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    document.getElementById("modal-title").textContent = "Edit Note";
    document.getElementById("note-id").value = note.id;
    document.getElementById("note-title").value = note.title || "";
    document.getElementById("note-category").value = note.category;
    document.getElementById("note-content").value = note.content || "";
    document.getElementById("note-tags").value = (note.tags || []).join(", ");
    document.getElementById("note-pinned").checked = note.is_pinned || false;
    
    const mediaContainer = document.getElementById("media-links-container");
    mediaContainer.innerHTML = "";
    mediaLinkCount = 0;
    
    const mediaUrls = note.media_urls || [];
    mediaUrls.forEach(url => {
        addMediaLink(url);
    });
    
    document.getElementById("delete-note-btn").classList.remove("hidden");
    document.getElementById("note-modal").classList.remove("hidden");
}

async function deleteNoteHandler() {
    const id = document.getElementById("note-id").value;
    if (!id) return;
    
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    try {
        const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
        if (res.ok) {
            closeModal();
            loadNotes();
        } else {
            alert("Failed to delete note");
        }
    } catch {
        alert("Connection error");
    }
}

function closeModal() {
    document.getElementById("note-modal").classList.add("hidden");
}

function addMediaLink(value = "") {
    const container = document.getElementById("media-links-container");
    const index = mediaLinkCount++;
    
    const div = document.createElement("div");
    div.className = "flex gap-2";
    div.innerHTML = `
        <input type="url" class="media-link input-field flex-1 p-2 rounded text-sm" placeholder="Paste URL (Pinterest, Instagram, SoundCloud, etc.)" value="${value}">
        <button type="button" onclick="this.parentElement.remove()" class="text-gray-500 hover:text-red-400 px-2">&times;</button>
    `;
    container.appendChild(div);
}

function getMediaLinks() {
    const links = [];
    document.querySelectorAll(".media-link").forEach(input => {
        if (input.value.trim()) {
            links.push(input.value.trim());
        }
    });
    return links;
}

document.getElementById("note-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const id = document.getElementById("note-id").value;
    const tagsInput = document.getElementById("note-tags").value;
    const tags = tagsInput ? tagsInput.split(",").map(t => t.trim()).filter(t => t) : [];
    
    const noteData = {
        title: document.getElementById("note-title").value,
        category: document.getElementById("note-category").value,
        content: document.getElementById("note-content").value,
        media_urls: getMediaLinks(),
        tags: tags,
        is_pinned: document.getElementById("note-pinned").checked
    };
    
    try {
        const url = id ? `/api/notes/${id}` : "/api/notes";
        const method = id ? "PUT" : "POST";
        
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(noteData)
        });
        
        if (res.ok) {
            closeModal();
            loadNotes();
        } else {
            alert("Failed to save note");
        }
    } catch {
        alert("Connection error");
    }
});

(async () => {
    const isAuth = await checkAuth();
    if (isAuth) {
        showMain();
    } else {
        showAuthRedirect();
    }
})();
