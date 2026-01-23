import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";

dotenv.config();

const app = express();
const PORT = 5000;

// Validate required environment variables
if (!process.env.ADMIN_PASSWORD) {
  console.warn("WARNING: ADMIN_PASSWORD not set. Admin login will be disabled.");
}

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || require("crypto").randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Admin authentication routes
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
  req.session.destroy();
  res.json({ success: true });
});

app.get("/api/admin/check", (req, res) => {
  res.json({ isAdmin: req.session.isAdmin === true });
});

// Serve static files (but admin.html will check auth via API)
app.use(express.static(path.join(__dirname, "public")));

// Example API route
app.post("/api/command", async (req, res) => {
  const { input } = req.body;
  const cmd = input.toLowerCase().trim();
  
  if (cmd === "help") {
    return res.json({ text: "SYSTEM COMMANDS:\n- help: Display this manual\n- framework: View the HTML/CSS/JS creative identity logic\n- agreements: List music industry agreement templates\n- generate [name]: Create a specific agreement (e.g., 'generate split_sheet')\n- status: Check system integrity\n- clear: Purge terminal history\n- admin: Access admin dashboard" });
  }
  if (cmd === "admin") {
    return res.json({ text: "ADMIN ACCESS: Navigate to /admin.html to access the dashboard." });
  }
  if (cmd === "status") {
    return res.json({ text: "SYSTEM STATUS: OPTIMAL\nCORES: 128\nMEMORY: 1.2TB AVAILABLE" });
  }
  res.json({ text: `Echo: ${input}` });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 WayfinderOS running at http://0.0.0.0:${PORT}`);
});
