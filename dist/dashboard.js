let currentUser = null;
let projects = [];
let currentFilter = "all";

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

function showDashboard() {
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("user-name").textContent = currentUser.name;
    loadProjects();
}

function showAuthScreen() {
    document.getElementById("auth-screen").classList.remove("hidden");
    document.getElementById("dashboard").classList.add("hidden");
    
    if (window.location.hash === "#register") {
        showRegister();
    }
}

function showLogin() {
    document.getElementById("login-form-container").classList.remove("hidden");
    document.getElementById("register-form-container").classList.add("hidden");
}

function showRegister() {
    document.getElementById("login-form-container").classList.add("hidden");
    document.getElementById("register-form-container").classList.remove("hidden");
}

function showError(msg) {
    const el = document.getElementById("auth-error");
    el.textContent = msg;
    el.classList.remove("hidden");
}

function hideError() {
    document.getElementById("auth-error").classList.add("hidden");
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    
    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            currentUser = data.user;
            showDashboard();
        } else {
            showError(data.error || "Login failed");
        }
    } catch {
        showError("Connection error");
    }
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const role = document.getElementById("reg-role").value;
    const businessName = document.getElementById("reg-business").value;
    
    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role, businessName })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            currentUser = data.user;
            showDashboard();
        } else {
            showError(data.error || "Registration failed");
        }
    } catch {
        showError("Connection error");
    }
});

async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    currentUser = null;
    projects = [];
    showAuthScreen();
}

async function loadProjects() {
    try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        projects = data.projects || [];
        renderProjects();
        updateStats();
    } catch {
        console.error("Failed to load projects");
    }
}

function updateStats() {
    document.getElementById("stat-total").textContent = projects.length;
    document.getElementById("stat-concept").textContent = projects.filter(p => p.status === "concept").length;
    document.getElementById("stat-development").textContent = projects.filter(p => p.status === "development").length;
    document.getElementById("stat-published").textContent = projects.filter(p => p.status === "published").length;
}

function filterProjects(status) {
    currentFilter = status;
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("bg-gray-800");
        btn.classList.add("bg-gray-900");
    });
    document.querySelector(`[data-filter="${status}"]`).classList.remove("bg-gray-900");
    document.querySelector(`[data-filter="${status}"]`).classList.add("bg-gray-800");
    renderProjects();
}

function renderProjects() {
    const container = document.getElementById("projects-list");
    let filtered = projects;
    
    if (currentFilter !== "all") {
        filtered = projects.filter(p => p.status === currentFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No projects found</p>';
        return;
    }
    
    container.innerHTML = filtered.map(p => {
        const meta = p.metadata || {};
        const hasMedia = meta.audio_url || meta.video_url || meta.artwork_url || meta.files_url;
        return `
            <div class="card p-4 rounded-lg cursor-pointer hover:border-gray-600" onclick="openEditProject(${p.id})">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <span class="status-${p.status} px-2 py-1 rounded text-xs uppercase">${p.status}</span>
                        <div>
                            <p class="font-bold">${p.title}</p>
                            <p class="text-xs text-gray-500">${p.type} ${meta.release_date ? '| Release: ' + meta.release_date : ''}</p>
                            ${hasMedia ? '<div class="flex gap-2 mt-1">' + 
                                (meta.audio_url ? '<a href="' + meta.audio_url + '" target="_blank" onclick="event.stopPropagation()" class="text-xs text-green-400 hover:underline">Audio</a>' : '') +
                                (meta.video_url ? '<a href="' + meta.video_url + '" target="_blank" onclick="event.stopPropagation()" class="text-xs text-blue-400 hover:underline">Video</a>' : '') +
                                (meta.artwork_url ? '<a href="' + meta.artwork_url + '" target="_blank" onclick="event.stopPropagation()" class="text-xs text-purple-400 hover:underline">Artwork</a>' : '') +
                                (meta.files_url ? '<a href="' + meta.files_url + '" target="_blank" onclick="event.stopPropagation()" class="text-xs text-yellow-400 hover:underline">Files</a>' : '') +
                            '</div>' : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-right text-xs text-gray-500">
                            ${meta.isrc ? '<span class="block">ISRC: ' + meta.isrc + '</span>' : ''}
                            ${meta.copyright ? '<span class="block">CR: ' + meta.copyright + '</span>' : ''}
                        </div>
                        <a href="/project-details.html?id=${p.id}" onclick="event.stopPropagation()" class="text-gray-600 hover:text-[#c3f53c] text-sm">Details</a>
                        <button onclick="event.stopPropagation(); deleteProjectHandler(${p.id})" class="text-gray-600 hover:text-red-400 text-sm">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function openNewProject() {
    previousStatus = null;
    document.getElementById("modal-title").textContent = "New Project";
    document.getElementById("project-id").value = "";
    document.getElementById("project-title").value = "";
    document.getElementById("project-type").value = "single";
    document.getElementById("project-status").value = "concept";
    document.getElementById("project-description").value = "";
    document.getElementById("meta-isrc").value = "";
    document.getElementById("meta-upc").value = "";
    document.getElementById("meta-copyright").value = "";
    document.getElementById("meta-release-date").value = "";
    document.getElementById("media-audio").value = "";
    document.getElementById("media-video").value = "";
    document.getElementById("media-artwork").value = "";
    document.getElementById("media-files").value = "";
    document.getElementById("project-modal").classList.remove("hidden");
}

function openEditProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    const meta = project.metadata || {};
    previousStatus = project.status;
    
    document.getElementById("modal-title").textContent = "Edit Project";
    document.getElementById("project-id").value = project.id;
    document.getElementById("project-title").value = project.title;
    document.getElementById("project-type").value = project.type;
    document.getElementById("project-status").value = project.status;
    document.getElementById("project-description").value = project.description || "";
    document.getElementById("meta-isrc").value = meta.isrc || "";
    document.getElementById("meta-upc").value = meta.upc || "";
    document.getElementById("meta-copyright").value = meta.copyright || "";
    document.getElementById("meta-release-date").value = meta.release_date || "";
    document.getElementById("media-audio").value = meta.audio_url || "";
    document.getElementById("media-video").value = meta.video_url || "";
    document.getElementById("media-artwork").value = meta.artwork_url || "";
    document.getElementById("media-files").value = meta.files_url || "";
    document.getElementById("project-modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("project-modal").classList.add("hidden");
}

let pendingProjectData = null;
let previousStatus = null;

function showIPGuide() {
    document.getElementById("ip-guide-modal").classList.remove("hidden");
}

function closeIPGuide() {
    document.getElementById("ip-guide-modal").classList.add("hidden");
}

function showPublishCheckpoint() {
    document.getElementById("check-copyright").checked = false;
    document.getElementById("check-pro").checked = false;
    document.getElementById("check-distributor").checked = false;
    document.getElementById("publish-checkpoint-modal").classList.remove("hidden");
}

function closePublishCheckpoint() {
    document.getElementById("publish-checkpoint-modal").classList.add("hidden");
    pendingProjectData = null;
}

async function confirmPublish() {
    closePublishCheckpoint();
    if (pendingProjectData) {
        await saveProject(pendingProjectData);
        pendingProjectData = null;
    }
}

async function saveProject(projectData) {
    const id = document.getElementById("project-id").value;
    try {
        const url = id ? `/api/projects/${id}` : "/api/projects";
        const method = id ? "PUT" : "POST";
        
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projectData)
        });
        
        if (res.ok) {
            closeModal();
            loadProjects();
        } else {
            alert("Failed to save project");
        }
    } catch {
        alert("Connection error");
    }
}

document.getElementById("project-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const id = document.getElementById("project-id").value;
    const newStatus = document.getElementById("project-status").value;
    const projectData = {
        title: document.getElementById("project-title").value,
        type: document.getElementById("project-type").value,
        status: newStatus,
        description: document.getElementById("project-description").value,
        metadata: {
            isrc: document.getElementById("meta-isrc").value || null,
            upc: document.getElementById("meta-upc").value || null,
            copyright: document.getElementById("meta-copyright").value || null,
            release_date: document.getElementById("meta-release-date").value || null,
            audio_url: document.getElementById("media-audio").value || null,
            video_url: document.getElementById("media-video").value || null,
            artwork_url: document.getElementById("media-artwork").value || null,
            files_url: document.getElementById("media-files").value || null
        }
    };
    
    if (newStatus === "published" && previousStatus !== "published") {
        pendingProjectData = projectData;
        showPublishCheckpoint();
        return;
    }
    
    await saveProject(projectData);
});

async function deleteProjectHandler(id) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    try {
        const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
        if (res.ok) {
            loadProjects();
        }
    } catch {
        alert("Failed to delete project");
    }
}

const tourSteps = [
    {
        element: null,
        title: "Welcome to WayfinderOS!",
        text: "Let's take a quick tour to help you get started with managing your creative projects.",
        position: "center"
    },
    {
        element: "#new-project-btn",
        title: "Create Projects",
        text: "Click here to create a new project. Track singles, EPs, albums, beats, and more from concept to publication.",
        position: "bottom"
    },
    {
        element: "#stats-panel",
        title: "Project Overview",
        text: "See your project stats at a glance. Track how many are in concept, development, or published.",
        position: "bottom"
    },
    {
        element: "#filter-buttons",
        title: "Filter Your Work",
        text: "Quickly filter projects by status. Focus on what needs attention right now.",
        position: "bottom"
    },
    {
        element: "#projects-list",
        title: "Your Projects",
        text: "All your projects appear here. Click any project to edit details, add metadata (ISRC, UPC), or link media files.",
        position: "top"
    },
    {
        element: "#nav-agreements",
        title: "Generate Agreements",
        text: "Create professional music agreements like split sheets, licenses, and contracts. Download as PDF!",
        position: "bottom"
    }
];

let currentTourStep = 0;
let tourOverlay = null;
let tourTooltip = null;

function startTour() {
    currentTourStep = 0;
    showTourStep();
}

function showTourStep() {
    clearTourHighlights();
    
    if (currentTourStep >= tourSteps.length) {
        endTour();
        return;
    }
    
    const step = tourSteps[currentTourStep];
    
    if (!tourOverlay) {
        tourOverlay = document.createElement("div");
        tourOverlay.className = "tour-overlay";
        document.body.appendChild(tourOverlay);
    }
    
    if (step.element) {
        const el = document.querySelector(step.element);
        if (el) {
            el.classList.add("tour-highlight");
        }
    }
    
    showTooltip(step);
}

function showTooltip(step) {
    if (tourTooltip) tourTooltip.remove();
    
    tourTooltip = document.createElement("div");
    tourTooltip.className = "tour-tooltip";
    
    const dots = tourSteps.map((_, i) => 
        `<div class="tour-step-dot ${i === currentTourStep ? 'active' : ''}"></div>`
    ).join("");
    
    tourTooltip.innerHTML = `
        <h4>${step.title}</h4>
        <p>${step.text}</p>
        <div class="tour-step-indicator">${dots}</div>
        <div class="tour-buttons">
            <button class="tour-btn tour-skip" onclick="endTour()">Skip</button>
            <button class="tour-btn tour-next" onclick="nextTourStep()">
                ${currentTourStep === tourSteps.length - 1 ? "Done" : "Next"}
            </button>
        </div>
    `;
    
    document.body.appendChild(tourTooltip);
    positionTooltip(step);
}

function positionTooltip(step) {
    if (step.position === "center" || !step.element) {
        tourTooltip.style.top = "50%";
        tourTooltip.style.left = "50%";
        tourTooltip.style.transform = "translate(-50%, -50%)";
        return;
    }
    
    const el = document.querySelector(step.element);
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    const tooltipRect = tourTooltip.getBoundingClientRect();
    
    let top, left;
    
    if (step.position === "bottom") {
        top = rect.bottom + 12;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    } else if (step.position === "top") {
        top = rect.top - tooltipRect.height - 12;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    }
    
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipRect.width - 16));
    top = Math.max(16, top);
    
    tourTooltip.style.top = top + "px";
    tourTooltip.style.left = left + "px";
    tourTooltip.style.transform = "none";
}

function nextTourStep() {
    currentTourStep++;
    showTourStep();
}

function clearTourHighlights() {
    document.querySelectorAll(".tour-highlight").forEach(el => {
        el.classList.remove("tour-highlight");
    });
}

function endTour() {
    clearTourHighlights();
    if (tourOverlay) {
        tourOverlay.remove();
        tourOverlay = null;
    }
    if (tourTooltip) {
        tourTooltip.remove();
        tourTooltip = null;
    }
    localStorage.setItem("wayfinder_tour_seen", "true");
}

function checkFirstVisit() {
    if (!localStorage.getItem("wayfinder_tour_seen")) {
        setTimeout(startTour, 500);
    }
}

(async () => {
    const isAuth = await checkAuth();
    if (isAuth) {
        showDashboard();
        checkFirstVisit();
    } else {
        showAuthScreen();
    }
})();
