import "dotenv/config";
import express from "express";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { db } from "./db";
import { projects, creativeNotes } from "../shared/schema";
import { eq, desc } from "drizzle-orm";

const app = express();
app.use(express.json());

async function main() {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userProjects = await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
      res.json({ projects: userProjects });
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, type, status, description, metadata } = req.body;
      const [project] = await db.insert(projects).values({
        userId,
        title,
        type: type || "single",
        status: status || "concept",
        description,
        metadata: metadata || {},
      }).returning();
      res.json({ project });
    } catch (error) {
      console.error("Failed to create project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [project] = await db.select().from(projects).where(eq(projects.id, parseInt(req.params.id)));
      if (!project || project.userId !== userId) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ project });
    } catch (error) {
      console.error("Failed to fetch project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [existing] = await db.select().from(projects).where(eq(projects.id, parseInt(req.params.id)));
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Project not found" });
      }
      const { title, type, status, description, metadata } = req.body;
      const [project] = await db.update(projects)
        .set({
          title: title || existing.title,
          type: type || existing.type,
          status: status || existing.status,
          description: description !== undefined ? description : existing.description,
          metadata: metadata || existing.metadata,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, parseInt(req.params.id)))
        .returning();
      res.json({ project });
    } catch (error) {
      console.error("Failed to update project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [existing] = await db.select().from(projects).where(eq(projects.id, parseInt(req.params.id)));
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Project not found" });
      }
      await db.delete(projects).where(eq(projects.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  app.get("/api/creative/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notes = await db.select().from(creativeNotes).where(eq(creativeNotes.userId, userId)).orderBy(desc(creativeNotes.createdAt));
      res.json({ notes: notes.map(n => ({ ...n, is_pinned: n.isPinned === "true", tags: n.tags || [] })) });
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/creative/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { category, content, media_url, tags } = req.body;
      const [note] = await db.insert(creativeNotes).values({
        userId,
        category: category || "ideas",
        content,
        mediaUrl: media_url,
        tags: tags || [],
      }).returning();
      res.json({ note: { ...note, is_pinned: false, tags: note.tags || [] } });
    } catch (error) {
      console.error("Failed to create note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.put("/api/creative/notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [existing] = await db.select().from(creativeNotes).where(eq(creativeNotes.id, parseInt(req.params.id)));
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Note not found" });
      }
      const { category, content, media_url, tags } = req.body;
      const [note] = await db.update(creativeNotes)
        .set({
          category: category || existing.category,
          content: content || existing.content,
          mediaUrl: media_url !== undefined ? media_url : existing.mediaUrl,
          tags: tags || existing.tags,
          updatedAt: new Date(),
        })
        .where(eq(creativeNotes.id, parseInt(req.params.id)))
        .returning();
      res.json({ note: { ...note, is_pinned: note.isPinned === "true", tags: note.tags || [] } });
    } catch (error) {
      console.error("Failed to update note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/creative/notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [existing] = await db.select().from(creativeNotes).where(eq(creativeNotes.id, parseInt(req.params.id)));
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Note not found" });
      }
      await db.delete(creativeNotes).where(eq(creativeNotes.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  app.post("/api/creative/notes/:id/pin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [existing] = await db.select().from(creativeNotes).where(eq(creativeNotes.id, parseInt(req.params.id)));
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Note not found" });
      }
      const [note] = await db.update(creativeNotes)
        .set({ isPinned: existing.isPinned === "true" ? "false" : "true" })
        .where(eq(creativeNotes.id, parseInt(req.params.id)))
        .returning();
      res.json({ note: { ...note, is_pinned: note.isPinned === "true" } });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
      res.status(500).json({ message: "Failed to toggle pin" });
    }
  });

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch(console.error);
