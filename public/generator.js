const agreementFields = {
    split_sheet: [
        { id: "song_title", label: "Song Title", type: "text", required: true },
        { id: "date", label: "Date", type: "date", required: true },
        { id: "writer1_name", label: "Writer 1 Name", type: "text", required: true },
        { id: "writer1_percent", label: "Writer 1 Percentage", type: "number", required: true },
        { id: "writer2_name", label: "Writer 2 Name", type: "text", required: false },
        { id: "writer2_percent", label: "Writer 2 Percentage", type: "number", required: false },
        { id: "producer_name", label: "Producer Name", type: "text", required: false },
        { id: "producer_percent", label: "Producer Percentage", type: "number", required: false }
    ],
    production: [
        { id: "artist_name", label: "Artist Name", type: "text", required: true },
        { id: "project_name", label: "Project Name", type: "text", required: true },
        { id: "date", label: "Date", type: "date", required: true }
    ],
    confidentiality: [
        { id: "client_name", label: "Client Name", type: "text", required: true },
        { id: "date", label: "Date", type: "date", required: true }
    ],
    content_release: [
        { id: "client_name", label: "Client Name", type: "text", required: true },
        { id: "content_description", label: "Content Description", type: "textarea", required: true },
        { id: "date", label: "Date", type: "date", required: true }
    ],
    non_exclusive_license: [
        { id: "licensee_name", label: "Licensee Name", type: "text", required: true },
        { id: "beat_title", label: "Beat Title", type: "text", required: true },
        { id: "date", label: "Date", type: "date", required: true }
    ],
    exclusive_license: [
        { id: "licensee_name", label: "Licensee Name", type: "text", required: true },
        { id: "beat_title", label: "Beat Title", type: "text", required: true },
        { id: "date", label: "Date", type: "date", required: true }
    ],
    buyout: [
        { id: "buyer_name", label: "Buyer Name", type: "text", required: true },
        { id: "asset_description", label: "Asset Description", type: "text", required: true },
        { id: "price", label: "Price (USD)", type: "number", required: true },
        { id: "date", label: "Date", type: "date", required: true }
    ],
    basic_license: [
        { id: "licensee_name", label: "Licensee Name", type: "text", required: true },
        { id: "beat_title", label: "Beat Title", type: "text", required: true },
        { id: "date", label: "Date", type: "date", required: true }
    ],
    standard_license: [
        { id: "licensee_name", label: "Licensee Name", type: "text", required: true },
        { id: "beat_title", label: "Beat Title", type: "text", required: true },
        { id: "date", label: "Date", type: "date", required: true }
    ],
    premium_license: [
        { id: "licensee_name", label: "Licensee Name", type: "text", required: true },
        { id: "beat_title", label: "Beat Title", type: "text", required: true },
        { id: "date", label: "Date", type: "date", required: true }
    ],
    coaching: [
        { id: "client_name", label: "Client Name", type: "text", required: true },
        { id: "session_type", label: "Session Type", type: "select", options: ["Individual Session ($75/hr)", "Package Deal (8 hrs - $500)"], required: true },
        { id: "start_date", label: "Start Date", type: "date", required: true }
    ]
};

let agreements = {};
let selectedAgreement = null;
let generatedContent = "";

async function loadAgreements() {
    const res = await fetch("data.json");
    const data = await res.json();
    agreements = data.agreements;
    renderAgreementGrid();
}

function renderAgreementGrid() {
    const grid = document.getElementById("agreement-grid");
    grid.innerHTML = Object.entries(agreements).map(([key, val]) => `
        <div onclick="selectAgreement('${key}')" 
             class="bg-gray-900 border border-gray-700 hover:border-green-500 p-4 rounded-lg cursor-pointer transition-all">
            <p class="font-bold text-sm">${val.name}</p>
            <p class="text-xs text-gray-500 mt-1">${val.category}</p>
        </div>
    `).join("");
}

function selectAgreement(key) {
    selectedAgreement = key;
    document.getElementById("step-1").classList.add("hidden");
    document.getElementById("step-2").classList.remove("hidden");
    document.getElementById("selected-agreement-name").textContent = agreements[key].name;
    renderForm();
}

function renderForm() {
    const form = document.getElementById("agreement-form");
    const fields = agreementFields[selectedAgreement] || [];
    
    form.innerHTML = fields.map(field => {
        if (field.type === "textarea") {
            return `
                <div>
                    <label class="block text-sm accent mb-1">${field.label}${field.required ? " *" : ""}</label>
                    <textarea id="${field.id}" class="input-field w-full p-3 rounded" rows="3" ${field.required ? "required" : ""}></textarea>
                </div>
            `;
        } else if (field.type === "select") {
            return `
                <div>
                    <label class="block text-sm accent mb-1">${field.label}${field.required ? " *" : ""}</label>
                    <select id="${field.id}" class="input-field w-full p-3 rounded" ${field.required ? "required" : ""}>
                        ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join("")}
                    </select>
                </div>
            `;
        }
        return `
            <div>
                <label class="block text-sm accent mb-1">${field.label}${field.required ? " *" : ""}</label>
                <input type="${field.type}" id="${field.id}" class="input-field w-full p-3 rounded" ${field.required ? "required" : ""}>
            </div>
        `;
    }).join("");
}

function goBack() {
    document.getElementById("step-2").classList.add("hidden");
    document.getElementById("step-1").classList.remove("hidden");
}

function goToStep2() {
    document.getElementById("step-3").classList.add("hidden");
    document.getElementById("step-2").classList.remove("hidden");
}

function generateAgreement() {
    const fields = agreementFields[selectedAgreement] || [];
    const values = {};
    
    for (const field of fields) {
        const el = document.getElementById(field.id);
        if (field.required && !el.value) {
            alert(`Please fill in: ${field.label}`);
            return;
        }
        values[field.id] = el.value;
    }
    
    generatedContent = buildAgreementContent(selectedAgreement, values);
    
    document.getElementById("step-2").classList.add("hidden");
    document.getElementById("step-3").classList.remove("hidden");
    document.getElementById("agreement-preview").textContent = generatedContent;
}

function buildAgreementContent(key, values) {
    const agreement = agreements[key];
    const date = values.date || values.start_date || new Date().toLocaleDateString();
    
    let content = `REVERIE | RVR Creative Development\n`;
    content += `${"=".repeat(40)}\n\n`;
    content += `${agreement.name.toUpperCase()}\n`;
    content += `Date: ${date}\n\n`;
    content += `${"=".repeat(40)}\n\n`;
    
    switch(key) {
        case "split_sheet":
            content += `SONG TITLE: ${values.song_title}\n\n`;
            content += `CONTRIBUTORS:\n`;
            content += `Writer 1: ${values.writer1_name} - ${values.writer1_percent}%\n`;
            if (values.writer2_name) content += `Writer 2: ${values.writer2_name} - ${values.writer2_percent}%\n`;
            if (values.producer_name) content += `Producer: ${values.producer_name} - ${values.producer_percent}%\n`;
            content += `\nOWNERSHIP:\nEach party owns their stated percentage of the composition and agrees to split all revenue accordingly.\n`;
            break;
            
        case "production":
            content += `PRODUCER: LUCTHELEO\n`;
            content += `ARTIST: ${values.artist_name}\n`;
            content += `PROJECT: ${values.project_name}\n\n`;
            content += `SERVICES:\nProducer agrees to provide creative development and production services for the specified project.\n\n`;
            content += `OWNERSHIP:\n- Artist retains ownership of master recording\n- Producer retains ownership of instrumental/beat composition\n\n`;
            content += `CREDIT:\nProducer credit: "Produced by LUCTHELEO"\n`;
            break;
            
        case "confidentiality":
            content += `PARTIES:\nProvider: LUCTHELEO / REVERIE | RVR\n`;
            content += `Client: ${values.client_name}\n\n`;
            content += `SESSION CONFIDENTIALITY:\nLUCTHELEO agrees to maintain complete confidentiality regarding all information shared during creative development sessions.\n\n`;
            content += `CREATIVE WORK OWNERSHIP:\nAll creative works developed during sessions remain the intellectual property of the client unless otherwise specified.\n`;
            break;
            
        case "content_release":
            content += `CLIENT: ${values.client_name}\n\n`;
            content += `CONTENT DESCRIPTION:\n${values.content_description}\n\n`;
            content += `RELEASE AUTHORIZATION:\nI authorize the release of the described content according to the terms specified in this form.\n\n`;
            content += `CREDIT:\nProducer Credit: LUCTHELEO\n`;
            break;
            
        case "non_exclusive_license":
        case "basic_license":
            content += `LICENSOR: LUCTHELEO\n`;
            content += `LICENSEE: ${values.licensee_name}\n`;
            content += `BEAT TITLE: ${values.beat_title}\n\n`;
            content += `LICENSE TERMS:\n`;
            content += `- Non-exclusive license to use instrumental composition\n`;
            content += `- Fee: $50 USD\n`;
            content += `- Usage Limit: 50,000 streams/sales\n`;
            content += `- Deliverables: MP3 file only\n`;
            content += `- One official music video allowed\n`;
            content += `- Credit required: "Produced by LUCTHELEO"\n`;
            break;
            
        case "standard_license":
            content += `LICENSOR: LUCTHELEO\n`;
            content += `LICENSEE: ${values.licensee_name}\n`;
            content += `BEAT TITLE: ${values.beat_title}\n\n`;
            content += `LICENSE TERMS:\n`;
            content += `- Non-exclusive license to use instrumental composition\n`;
            content += `- Fee: $100 USD\n`;
            content += `- Usage Limit: 100,000 streams/sales\n`;
            content += `- Deliverables: MP3 + WAV files\n`;
            content += `- One official music video allowed\n`;
            content += `- I (LUCTHELEO) keep 50% of publishing rights\n`;
            content += `- Credit required: "Produced by LUCTHELEO"\n`;
            break;
            
        case "premium_license":
            content += `LICENSOR: LUCTHELEO\n`;
            content += `LICENSEE: ${values.licensee_name}\n`;
            content += `BEAT TITLE: ${values.beat_title}\n\n`;
            content += `LICENSE TERMS:\n`;
            content += `- Non-exclusive license to use instrumental composition\n`;
            content += `- Fee: $175 USD\n`;
            content += `- Usage: Unlimited streams/sales\n`;
            content += `- Deliverables: MP3 + WAV + Stems\n`;
            content += `- Multiple music videos allowed\n`;
            content += `- Basic sync rights for independent projects\n`;
            content += `- Credit required: "Produced by LUCTHELEO"\n`;
            break;
            
        case "exclusive_license":
            content += `LICENSOR: LUCTHELEO\n`;
            content += `LICENSEE: ${values.licensee_name}\n`;
            content += `BEAT TITLE: ${values.beat_title}\n\n`;
            content += `EXCLUSIVE RIGHTS:\n`;
            content += `Licensee receives exclusive rights to instrumental composition including:\n`;
            content += `- Unlimited commercial use\n`;
            content += `- Full ownership transfer upon payment\n`;
            content += `- No further licensing of this beat to other parties\n\n`;
            content += `CREDIT:\nProducer credit required: "Produced by LUCTHELEO"\n`;
            break;
            
        case "buyout":
            content += `SELLER: LUCTHELEO\n`;
            content += `BUYER: ${values.buyer_name}\n`;
            content += `ASSET: ${values.asset_description}\n`;
            content += `PRICE: $${values.price} USD\n\n`;
            content += `RIGHTS TRANSFERRED:\nSeller transfers all rights, title, and interest in the specified asset to Buyer upon receipt of payment.\n`;
            break;
            
        case "coaching":
            content += `COACH: LUCTHELEO / REVERIE | RVR\n`;
            content += `CLIENT: ${values.client_name}\n`;
            content += `SESSION TYPE: ${values.session_type}\n\n`;
            content += `WHAT'S COVERED:\n`;
            content += `- Song structure and arrangement fundamentals\n`;
            content += `- Music theory basics for practical application\n`;
            content += `- Recording techniques and studio workflow\n`;
            content += `- Creative development and artistic direction\n`;
            content += `- Industry knowledge and business basics\n`;
            break;
            
        default:
            content += agreement.content;
    }
    
    content += `\n\n${"=".repeat(40)}\n`;
    content += `\nSIGNATURES:\n\n`;
    content += `LUCTHELEO / REVERIE | RVR: _________________________  Date: __________\n\n`;
    content += `Client: _________________________  Date: __________\n`;
    content += `\n${"=".repeat(40)}\n`;
    content += `Generated via WayfinderOS | REVERIE | RVR Creative Development\n`;
    
    return content;
}

function copyToClipboard() {
    navigator.clipboard.writeText(generatedContent);
    alert("Agreement copied to clipboard!");
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    
    const lines = doc.splitTextToSize(generatedContent, 180);
    let y = 20;
    
    for (const line of lines) {
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
        doc.text(line, 15, y);
        y += 5;
    }
    
    const filename = `${agreements[selectedAgreement].name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
}

loadAgreements();
