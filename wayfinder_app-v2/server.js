import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { 
  initDatabase, 
  createUser, 
  getUserByEmail, 
  getUserById,
  createProject,
  getProjectsByUser,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectDocument,
  getProjectDocuments,
  addStudioClient,
  getStudioClients,
  createNote,
  getNotesByUser,
  getNoteById,
  updateNote,
  deleteNote
} from "./db.js";

dotenv.config();

const app = express();
const PORT = 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

initDatabase().catch(console.error);

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, role, businessName } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }
    
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === "studio" ? "studio" : "creator";
    const user = await createUser(email, passwordHash, name, userRole, businessName);
    
    req.session.userId = user.id;
    req.session.userRole = user.role;
    
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    req.session.userId = user.id;
    req.session.userRole = user.role;
    
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

app.post("/api/projects", requireAuth, async (req, res) => {
  try {
    const { title, type, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    const project = await createProject(req.session.userId, title, type, description);
    res.json({ project });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

app.get("/api/projects", requireAuth, async (req, res) => {
  try {
    const projects = await getProjectsByUser(req.session.userId);
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: "Failed to get projects" });
  }
});

app.get("/api/projects/:id", requireAuth, async (req, res) => {
  try {
    const project = await getProjectById(req.params.id, req.session.userId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: "Failed to get project" });
  }
});

const VALID_STATUSES = ["concept", "development", "review", "published"];

app.put("/api/projects/:id", requireAuth, async (req, res) => {
  try {
    if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    const project = await updateProject(req.params.id, req.session.userId, req.body);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({ project });
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

app.delete("/api/projects/:id", requireAuth, async (req, res) => {
  try {
    await deleteProject(req.params.id, req.session.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

app.post("/api/projects/:id/documents", requireAuth, async (req, res) => {
  try {
    const project = await getProjectById(req.params.id, req.session.userId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const { docType, title, content, fileUrl } = req.body;
    const doc = await addProjectDocument(req.params.id, docType, title, content, fileUrl);
    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ error: "Failed to add document" });
  }
});

app.get("/api/projects/:id/documents", requireAuth, async (req, res) => {
  try {
    const project = await getProjectById(req.params.id, req.session.userId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const docs = await getProjectDocuments(req.params.id);
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: "Failed to get documents" });
  }
});

function requireStudio(req, res, next) {
  if (req.session.userRole !== "studio") {
    return res.status(403).json({ error: "Studio account required" });
  }
  next();
}

app.get("/api/studio/clients", requireAuth, requireStudio, async (req, res) => {
  try {
    const clients = await getStudioClients(req.session.userId);
    res.json({ clients });
  } catch (err) {
    res.status(500).json({ error: "Failed to get clients" });
  }
});

app.post("/api/studio/clients", requireAuth, requireStudio, async (req, res) => {
  try {
    const { clientName, clientEmail, notes } = req.body;
    if (!clientName) {
      return res.status(400).json({ error: "Client name is required" });
    }
    const client = await addStudioClient(req.session.userId, clientName, clientEmail, notes);
    res.json({ client });
  } catch (err) {
    res.status(500).json({ error: "Failed to add client" });
  }
});

app.get("/api/notes", requireAuth, async (req, res) => {
  try {
    const category = req.query.category || null;
    const notes = await getNotesByUser(req.session.userId, category);
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: "Failed to get notes" });
  }
});

app.post("/api/notes", requireAuth, async (req, res) => {
  try {
    const { category, title, content, media_urls, tags } = req.body;
    const note = await createNote(
      req.session.userId, 
      category || "idea", 
      title || "", 
      content || "",
      media_urls || [],
      tags || []
    );
    res.json({ note });
  } catch (err) {
    res.status(500).json({ error: "Failed to create note" });
  }
});

app.get("/api/notes/:id", requireAuth, async (req, res) => {
  try {
    const note = await getNoteById(req.params.id, req.session.userId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json({ note });
  } catch (err) {
    res.status(500).json({ error: "Failed to get note" });
  }
});

app.put("/api/notes/:id", requireAuth, async (req, res) => {
  try {
    const note = await getNoteById(req.params.id, req.session.userId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    const updated = await updateNote(req.params.id, req.session.userId, req.body);
    res.json({ note: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update note" });
  }
});

app.delete("/api/notes/:id", requireAuth, async (req, res) => {
  try {
    const note = await getNoteById(req.params.id, req.session.userId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    await deleteNote(req.params.id, req.session.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    return res.status(503).json({ success: false, message: "Admin login not configured" });
  }
  
  if (password && password === adminPassword) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: "Invalid password" });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.isAdmin = false;
  res.json({ success: true });
});

app.get("/api/admin/check", (req, res) => {
  res.json({ isAdmin: req.session.isAdmin === true });
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/command", async (req, res) => {
  const { input } = req.body;
  const cmd = input.toLowerCase().trim();
  
  if (cmd === "help") {
    return res.json({ text: "SYSTEM COMMANDS:\n- help: Display this manual\n- framework: View the HTML/CSS/JS creative identity logic\n- agreements: List music industry agreement templates\n- generator: Open agreement generator (fill prompts + download PDF)\n- dashboard: Access your project dashboard\n- status: Check system integrity\n- clear: Purge terminal history\n- admin: Platform admin access" });
  }
  if (cmd === "generator" || cmd === "generate") {
    return res.json({ text: "AGREEMENT GENERATOR: Navigate to /generator.html to create and download agreements.", redirect: "/generator.html" });
  }
  if (cmd === "dashboard") {
    return res.json({ text: "PROJECT DASHBOARD: Navigate to /dashboard.html to manage your projects.", redirect: "/dashboard.html" });
  }
  if (cmd === "admin") {
    return res.json({ text: "ADMIN ACCESS: Navigate to /admin.html to access the platform admin dashboard." });
  }
  if (cmd === "status") {
    return res.json({ text: "SYSTEM STATUS: OPTIMAL\nCORES: 128\nMEMORY: 1.2TB AVAILABLE\nDATABASE: CONNECTED" });
  }
  res.json({ text: `Echo: ${input}` });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`WayfinderOS running at http://0.0.0.0:${PORT}`);
});
