import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = 5000;

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Example API route
app.post("/api/command", async (req, res) => {
  const { input } = req.body;
  if (input.toLowerCase() === "help") {
    return res.json({ text: "Available commands: help, status, clear, echo" });
  }
  if (input.toLowerCase() === "status") {
    return res.json({ text: "SYSTEM STATUS: OPTIMAL\nCORES: 128\nMEMORY: 1.2TB AVAILABLE" });
  }
  res.json({ text: `Echo: ${input}` });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 WayfinderOS running at http://0.0.0.0:${PORT}`);
});
