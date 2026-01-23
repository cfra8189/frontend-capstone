let currentUser = null;
let currentProject = null;

const workflowSteps = [
    {
        id: "fixation",
        title: "1. Fix Your Work",
        description: "Record or document your song in a tangible form",
        fee: "FREE",
        details: `<div class="space-y-3">
            <p>Your song must be "fixed in a tangible medium" - meaning recorded, written down, or saved digitally.</p>
            <h4 class="font-bold text-white">What counts as fixation:</h4>
            <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Audio recording (WAV, MP3, etc.)</li>
                <li>Sheet music or lead sheet</li>
                <li>Session files with timestamps</li>
                <li>Written lyrics document</li>
            </ul>
            <div class="bg-blue-900/30 border border-blue-700 p-3 rounded text-sm">
                <p class="text-blue-400 font-bold">Pro Tip:</p>
                <p class="text-gray-300">Keep raw project files, session metadata, and timestamps as extra proof.</p>
            </div>
        </div>`,
        fields: [
            { id: "fixation_date", label: "Date Fixed", type: "date", placeholder: "When was this recorded/written?" },
            { id: "fixation_format", label: "Format", type: "select", options: ["Audio Recording", "Sheet Music", "Session Files", "Written Lyrics", "Multiple Formats"] }
        ]
    },
    {
        id: "copyright",
        title: "2. Register Copyright",
        description: "File with the US Copyright Office for legal protection",
        fee: "$45-65",
        details: `<div class="space-y-3">
            <p>Registration gives you the legal right to sue for infringement and claim statutory damages.</p>
            <h4 class="font-bold text-white">Application Types:</h4>
            <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li><strong>Single ($45):</strong> One song, one author, same claimant</li>
                <li><strong>Standard ($65):</strong> Multiple authors, work-for-hire, or co-writer splits</li>
                <li><strong>Group ($85):</strong> Up to 10 unpublished songs</li>
            </ul>
            <div class="bg-yellow-900/30 border border-yellow-700 p-3 rounded text-sm">
                <p class="text-yellow-400 font-bold">Important:</p>
                <p class="text-gray-300">Register BEFORE release or within 3 months to claim statutory damages.</p>
            </div>
            <a href="https://copyright.gov" target="_blank" class="inline-block text-[#c3f53c] hover:underline text-sm">Go to Copyright.gov &rarr;</a>
        </div>`,
        fields: [
            { id: "copyright_reg_number", label: "Registration Number", type: "text", placeholder: "e.g., SR0000123456" },
            { id: "copyright_date", label: "Registration Date", type: "date" },
            { id: "copyright_type", label: "Registration Type", type: "select", options: ["PA - Composition", "SR - Sound Recording", "Both PA and SR"] },
            { id: "copyright_fee", label: "Fee Paid", type: "text", placeholder: "e.g., $45" }
        ]
    },
    {
        id: "pro",
        title: "3. Join a PRO",
        description: "Register with a Performing Rights Organization to collect royalties",
        fee: "FREE (BMI) or $50 (ASCAP)",
        details: `<div class="space-y-3">
            <p>PROs collect performance royalties when your music is played publicly (radio, streaming, venues).</p>
            <h4 class="font-bold text-white">Major US PROs:</h4>
            <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li><strong>BMI:</strong> Free to join</li>
                <li><strong>ASCAP:</strong> Free for writers (was $50)</li>
                <li><strong>SESAC:</strong> Invitation only</li>
            </ul>
            <p class="text-sm text-gray-400">When you join, you'll receive your <strong class="text-white">IPI Number</strong> - your unique identifier as a songwriter.</p>
            <div class="flex gap-2 mt-3">
                <a href="https://bmi.com" target="_blank" class="text-[#c3f53c] hover:underline text-sm">BMI &rarr;</a>
                <a href="https://ascap.com" target="_blank" class="text-[#c3f53c] hover:underline text-sm">ASCAP &rarr;</a>
            </div>
        </div>`,
        fields: [
            { id: "pro_name", label: "PRO Name", type: "select", options: ["BMI", "ASCAP", "SESAC", "Other"] },
            { id: "ipi_number", label: "IPI Number", type: "text", placeholder: "Your 9-11 digit IPI" },
            { id: "pro_member_id", label: "Member ID", type: "text", placeholder: "Your PRO member ID" }
        ]
    },
    {
        id: "register_song",
        title: "4. Register Composition with PRO",
        description: "Register this specific song to receive an ISWC",
        fee: "FREE",
        details: `<div class="space-y-3">
            <p>After joining a PRO, register each composition separately to get your ISWC and start collecting royalties.</p>
            <h4 class="font-bold text-white">What you'll need:</h4>
            <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Song title (exact spelling)</li>
                <li>All writers and their splits</li>
                <li>Publisher info (if applicable)</li>
            </ul>
            <p class="text-sm text-gray-400">You'll receive an <strong class="text-white">ISWC</strong> - the unique code for your musical composition.</p>
        </div>`,
        fields: [
            { id: "iswc", label: "ISWC Code", type: "text", placeholder: "T-000.000.000-0" },
            { id: "pro_work_id", label: "PRO Work ID", type: "text", placeholder: "Work ID from your PRO" },
            { id: "writers_splits", label: "Writer Splits", type: "text", placeholder: "e.g., Artist 50%, Co-writer 50%" }
        ]
    },
    {
        id: "distributor",
        title: "5. Upload to Distributor",
        description: "Get your ISRC and UPC codes for streaming",
        fee: "Varies ($0-30/year)",
        details: `<div class="space-y-3">
            <p>Digital distributors deliver your music to streaming platforms and provide your tracking codes.</p>
            <h4 class="font-bold text-white">Popular Distributors:</h4>
            <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li><strong>DistroKid:</strong> $22.99/year unlimited</li>
                <li><strong>TuneCore:</strong> $9.99/single, $29.99/album</li>
                <li><strong>CD Baby:</strong> $9.95/single (one-time)</li>
                <li><strong>AWAL:</strong> Free (selective)</li>
            </ul>
            <p class="text-sm text-gray-400">They'll generate your <strong class="text-white">ISRC</strong> (per track) and <strong class="text-white">UPC</strong> (per release).</p>
        </div>`,
        fields: [
            { id: "distributor_name", label: "Distributor", type: "select", options: ["DistroKid", "TuneCore", "CD Baby", "AWAL", "Ditto", "Amuse", "Other"] },
            { id: "isrc", label: "ISRC Code", type: "text", placeholder: "XX-XXX-00-00000" },
            { id: "upc", label: "UPC Code", type: "text", placeholder: "12-digit code" },
            { id: "distribution_date", label: "Distribution Date", type: "date" }
        ]
    },
    {
        id: "release",
        title: "6. Release & Monitor",
        description: "Your work is live - track performance and royalties",
        fee: "N/A",
        details: `<div class="space-y-3">
            <p>Once released, monitor your streams and ensure royalties are being collected properly.</p>
            <h4 class="font-bold text-white">What to track:</h4>
            <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Streaming numbers (Spotify for Artists, etc.)</li>
                <li>PRO statements for performance royalties</li>
                <li>Distributor payments for mechanical royalties</li>
                <li>Any unauthorized uses (potential infringement)</li>
            </ul>
            <div class="bg-green-900/30 border border-green-700 p-3 rounded text-sm">
                <p class="text-green-400 font-bold">You did it!</p>
                <p class="text-gray-300">Your work is protected, registered, and earning royalties.</p>
            </div>
        </div>`,
        fields: [
            { id: "release_date", label: "Release Date", type: "date" },
            { id: "streaming_links", label: "Streaming Links", type: "text", placeholder: "Spotify, Apple Music URLs" },
            { id: "notes", label: "Notes", type: "textarea", placeholder: "Any additional notes..." }
        ]
    }
];

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

async function loadProject() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("id");
    
    if (!projectId) {
        window.location.href = "/dashboard.html";
        return;
    }
    
    try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
            const data = await res.json();
            currentProject = data.project;
            renderProject();
        } else {
            window.location.href = "/dashboard.html";
        }
    } catch {
        window.location.href = "/dashboard.html";
    }
}

function renderProject() {
    const meta = currentProject.metadata || {};
    const workflow = meta.workflow || {};
    
    document.getElementById("project-title").textContent = currentProject.title;
    document.getElementById("project-description").textContent = currentProject.description || "No description";
    document.getElementById("project-type").textContent = currentProject.type;
    
    const statusBadge = document.getElementById("project-status-badge");
    statusBadge.textContent = currentProject.status;
    statusBadge.className = `px-3 py-1 rounded text-xs uppercase status-${currentProject.status}`;
    
    document.getElementById("meta-isrc-display").textContent = meta.isrc || workflow.isrc || "Not set";
    document.getElementById("meta-upc-display").textContent = meta.upc || workflow.upc || "Not set";
    document.getElementById("meta-iswc-display").textContent = workflow.iswc || "Not set";
    document.getElementById("meta-ipi-display").textContent = workflow.ipi_number || "Not set";
    document.getElementById("meta-copyright-display").textContent = meta.copyright || workflow.copyright_reg_number || "Not registered";
    
    if (meta.copyright || workflow.copyright_reg_number) {
        document.getElementById("copyright-status").textContent = "Registered";
        document.getElementById("copyright-status").className = "text-green-400";
    }
    
    document.getElementById("created-date").textContent = formatDate(currentProject.created_at);
    document.getElementById("updated-date").textContent = formatDate(currentProject.updated_at);
    document.getElementById("release-date").textContent = meta.release_date || workflow.release_date || "Not set";
    
    renderMediaLinks(meta);
    renderWorkflowSteps(workflow);
    renderDocumentation(workflow);
}

function renderMediaLinks(meta) {
    const container = document.getElementById("media-links-display");
    const links = [];
    
    if (meta.audio_url) links.push(`<a href="${meta.audio_url}" target="_blank" class="text-green-400 hover:underline block">Audio</a>`);
    if (meta.video_url) links.push(`<a href="${meta.video_url}" target="_blank" class="text-blue-400 hover:underline block">Video</a>`);
    if (meta.artwork_url) links.push(`<a href="${meta.artwork_url}" target="_blank" class="text-purple-400 hover:underline block">Artwork</a>`);
    if (meta.files_url) links.push(`<a href="${meta.files_url}" target="_blank" class="text-yellow-400 hover:underline block">Files</a>`);
    
    container.innerHTML = links.length > 0 ? links.join("") : '<p class="text-gray-500">No media links added</p>';
}

function renderWorkflowSteps(workflow) {
    const container = document.getElementById("workflow-steps");
    
    container.innerHTML = workflowSteps.map(step => {
        const isComplete = workflow[`${step.id}_complete`];
        const stepClass = isComplete ? "step-complete" : "step-pending";
        
        return `
            <div class="card p-4 rounded-lg border ${stepClass} cursor-pointer hover:border-gray-500" onclick="openStepModal('${step.id}')">
                <div class="flex items-center gap-4">
                    <div class="step-icon w-10 h-10 rounded-full flex items-center justify-center font-bold">
                        ${isComplete ? '&#10003;' : step.title.charAt(0)}
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold">${step.title}</h3>
                        <p class="text-gray-500 text-sm">${step.description}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs ${isComplete ? 'text-green-400' : 'text-gray-500'}">${isComplete ? 'Complete' : step.fee}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function renderDocumentation(workflow) {
    const container = document.getElementById("documentation-list");
    const docs = [];
    
    if (workflow.fixation_complete) {
        docs.push({ label: "Fixation", value: `${workflow.fixation_format || 'Recorded'} on ${workflow.fixation_date || 'N/A'}` });
    }
    if (workflow.copyright_reg_number) {
        docs.push({ label: "Copyright Registration", value: `#${workflow.copyright_reg_number} (${workflow.copyright_type || 'N/A'})` });
    }
    if (workflow.pro_name) {
        docs.push({ label: "PRO Membership", value: `${workflow.pro_name} - IPI: ${workflow.ipi_number || 'N/A'}` });
    }
    if (workflow.iswc) {
        docs.push({ label: "ISWC", value: workflow.iswc });
    }
    if (workflow.distributor_name) {
        docs.push({ label: "Distribution", value: `${workflow.distributor_name} - ISRC: ${workflow.isrc || 'N/A'}` });
    }
    
    if (docs.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No documents recorded yet. Complete the workflow steps above to add documentation.</p>';
        return;
    }
    
    container.innerHTML = docs.map(doc => `
        <div class="flex justify-between items-center py-2 border-b border-gray-800">
            <span class="text-gray-400">${doc.label}</span>
            <span class="text-white text-sm">${doc.value}</span>
        </div>
    `).join("");
}

function openStepModal(stepId) {
    const step = workflowSteps.find(s => s.id === stepId);
    if (!step) return;
    
    const workflow = currentProject.metadata?.workflow || {};
    const isComplete = workflow[`${step.id}_complete`];
    
    document.getElementById("step-modal-title").textContent = step.title;
    
    let fieldsHtml = step.fields.map(field => {
        const value = workflow[field.id] || "";
        if (field.type === "select") {
            return `
                <div>
                    <label class="block text-sm text-gray-400 mb-1">${field.label}</label>
                    <select id="field-${field.id}" class="input-field w-full p-2 rounded text-sm">
                        <option value="">Select...</option>
                        ${field.options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join("")}
                    </select>
                </div>
            `;
        } else if (field.type === "textarea") {
            return `
                <div>
                    <label class="block text-sm text-gray-400 mb-1">${field.label}</label>
                    <textarea id="field-${field.id}" class="input-field w-full p-2 rounded text-sm" rows="3" placeholder="${field.placeholder || ''}">${value}</textarea>
                </div>
            `;
        } else {
            return `
                <div>
                    <label class="block text-sm text-gray-400 mb-1">${field.label}</label>
                    <input type="${field.type}" id="field-${field.id}" value="${value}" placeholder="${field.placeholder || ''}" class="input-field w-full p-2 rounded text-sm">
                </div>
            `;
        }
    }).join("");
    
    document.getElementById("step-modal-content").innerHTML = `
        ${step.details}
        <div class="border-t border-gray-700 pt-4 mt-4 space-y-3">
            <h4 class="font-bold text-white">Your Information</h4>
            ${fieldsHtml}
            <div class="flex items-center gap-3 pt-2">
                <input type="checkbox" id="step-complete" ${isComplete ? 'checked' : ''} class="w-4 h-4">
                <label for="step-complete" class="text-sm text-gray-400">Mark as complete</label>
            </div>
            <button onclick="saveStepData('${step.id}')" class="btn-primary w-full py-3 rounded text-black font-bold">Save</button>
        </div>
    `;
    
    document.getElementById("step-modal").classList.remove("hidden");
}

function closeStepModal() {
    document.getElementById("step-modal").classList.add("hidden");
}

async function saveStepData(stepId) {
    const step = workflowSteps.find(s => s.id === stepId);
    if (!step) return;
    
    const workflow = currentProject.metadata?.workflow || {};
    
    step.fields.forEach(field => {
        const el = document.getElementById(`field-${field.id}`);
        if (el) {
            workflow[field.id] = el.value;
        }
    });
    
    workflow[`${stepId}_complete`] = document.getElementById("step-complete").checked;
    
    const updatedMetadata = {
        ...currentProject.metadata,
        workflow: workflow,
        isrc: workflow.isrc || currentProject.metadata?.isrc,
        upc: workflow.upc || currentProject.metadata?.upc,
        copyright: workflow.copyright_reg_number || currentProject.metadata?.copyright
    };
    
    try {
        const res = await fetch(`/api/projects/${currentProject.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ metadata: updatedMetadata })
        });
        
        if (res.ok) {
            closeStepModal();
            loadProject();
        } else {
            alert("Failed to save");
        }
    } catch {
        alert("Connection error");
    }
}

function editProject() {
    window.location.href = `/dashboard.html?edit=${currentProject.id}`;
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
}

function showMain() {
    document.getElementById("auth-redirect").classList.add("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    loadProject();
}

function showAuthRedirect() {
    document.getElementById("auth-redirect").classList.remove("hidden");
    document.getElementById("main-content").classList.add("hidden");
}

(async () => {
    const isAuth = await checkAuth();
    if (isAuth) {
        showMain();
    } else {
        showAuthRedirect();
    }
})();
