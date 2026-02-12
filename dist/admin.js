// Admin Dashboard JavaScript - Server-side authentication

let clients = JSON.parse(localStorage.getItem("wayfinder_clients") || "[]");
let sessions = JSON.parse(localStorage.getItem("wayfinder_sessions") || "[]");
let agreementCount = parseInt(localStorage.getItem("wayfinder_agreement_count") || "0");

async function checkAuth() {
    try {
        const res = await fetch("/api/admin/check");
        const data = await res.json();
        return data.isAdmin === true;
    } catch {
        return false;
    }
}

function showDashboard() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("admin-dashboard").classList.remove("hidden");
    loadDashboard();
}

function showLogin() {
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("admin-dashboard").classList.add("hidden");
}

function loadDashboard() {
    document.getElementById("stat-clients").textContent = clients.length;
    document.getElementById("stat-sessions").textContent = sessions.length;
    document.getElementById("stat-agreements").textContent = agreementCount;

    const clientsList = document.getElementById("clients-list");
    if (clients.length === 0) {
        clientsList.innerHTML = '<p class="text-gray-500">No clients yet. Add your first client.</p>';
    } else {
        clientsList.innerHTML = clients.map((c, i) => `
            <div class="flex justify-between items-center bg-black p-3 rounded border border-gray-700">
                <div>
                    <p class="font-bold">${c.name}</p>
                    <p class="text-sm text-gray-500">${c.email} | Phase: ${c.phase}</p>
                </div>
                <button onclick="deleteClient(${i})" class="text-red-400 hover:text-red-300 text-sm">DELETE</button>
            </div>
        `).join("");
    }

    const sessionsList = document.getElementById("sessions-list");
    if (sessions.length === 0) {
        sessionsList.innerHTML = '<p class="text-gray-500">No sessions recorded yet.</p>';
    } else {
        sessionsList.innerHTML = sessions.slice(-5).reverse().map(s => `
            <div class="bg-black p-3 rounded border border-gray-700">
                <p class="font-bold">${s.client}</p>
                <p class="text-sm text-gray-500">${s.type} | ${s.date}</p>
            </div>
        `).join("");
    }

    fetch("data.json")
        .then(res => res.json())
        .then(data => {
            const agreementsList = document.getElementById("agreements-list");
            agreementsList.innerHTML = Object.entries(data.agreements).map(([key, val]) => `
                <div class="bg-black p-4 rounded border border-gray-700 hover:border-green-500 cursor-pointer" onclick="copyAgreement('${key}')">
                    <p class="font-bold text-sm">${val.name}</p>
                    <p class="text-xs text-gray-500 mt-1">Click to copy</p>
                </div>
            `).join("");
        });
}

function copyAgreement(key) {
    fetch("data.json")
        .then(res => res.json())
        .then(data => {
            if (data.agreements[key]) {
                navigator.clipboard.writeText(data.agreements[key].content);
                agreementCount++;
                localStorage.setItem("wayfinder_agreement_count", agreementCount.toString());
                document.getElementById("stat-agreements").textContent = agreementCount;
                alert("Agreement copied to clipboard!");
            }
        });
}

function deleteClient(index) {
    if (confirm("Are you sure you want to delete this client?")) {
        clients.splice(index, 1);
        localStorage.setItem("wayfinder_clients", JSON.stringify(clients));
        loadDashboard();
    }
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = document.getElementById("admin-password").value;
    
    try {
        const res = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });
        
        if (res.ok) {
            showDashboard();
        } else {
            document.getElementById("login-error").classList.remove("hidden");
        }
    } catch {
        document.getElementById("login-error").classList.remove("hidden");
    }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    showLogin();
});

document.getElementById("add-client-btn").addEventListener("click", () => {
    document.getElementById("add-client-modal").classList.remove("hidden");
});

document.getElementById("cancel-add-client").addEventListener("click", () => {
    document.getElementById("add-client-modal").classList.add("hidden");
});

document.getElementById("add-client-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const newClient = {
        name: document.getElementById("client-name").value,
        email: document.getElementById("client-email").value,
        project: document.getElementById("client-project").value,
        phase: document.getElementById("client-phase").value,
        createdAt: new Date().toISOString()
    };
    clients.push(newClient);
    localStorage.setItem("wayfinder_clients", JSON.stringify(clients));
    
    sessions.push({
        client: newClient.name,
        type: "REVERIE Foundation",
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem("wayfinder_sessions", JSON.stringify(sessions));
    
    document.getElementById("add-client-form").reset();
    document.getElementById("add-client-modal").classList.add("hidden");
    loadDashboard();
});

// Check authentication on page load
(async () => {
    const isAuthenticated = await checkAuth();
    if (isAuthenticated) {
        showDashboard();
    } else {
        showLogin();
    }
})();
