import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { db } from "./db";
import { projects, creativeNotes, users, sharedContent, communityFavorites, communityComments, blogPosts, studioArtists } from "../shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { sendVerificationEmail } from "./lib/email";

const app = express();
app.use(express.json());

function renderVerificationPage(success: boolean, message: string): string {
  const color = success ? "#c3f53c" : "#ef4444";
  const icon = success ? "✓" : "✗";
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - The Box</title>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { font-family: 'JetBrains Mono', monospace; }
        body { background: #0a0a0a; color: #fff; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { text-align: center; max-width: 400px; padding: 40px; }
        .icon { width: 80px; height: 80px; border-radius: 50%; background: ${color}; color: #000; font-size: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        h1 { color: ${color}; margin-bottom: 10px; }
        p { color: #999; margin-bottom: 30px; }
        a { display: inline-block; background: ${color}; color: #000; font-weight: bold; padding: 15px 40px; text-decoration: none; border-radius: 8px; }
        a:hover { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${icon}</div>
        <h1>${success ? "Success!" : "Error"}</h1>
        <p>${message}</p>
        <a href="/">Go to The Box</a>
      </div>
    </body>
    </html>
  `;
}

async function main() {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  // Password Change Endpoint
  app.post("/api/auth/change-password", isAuthenticated, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.claims.sub;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.passwordHash) {
        return res.status(400).json({ message: "Account uses OAuth login - password cannot be changed" });
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, userId));

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Update Profile (Display Name)
  app.post("/api/auth/update-profile", isAuthenticated, async (req: any, res) => {
    try {
      const { displayName } = req.body;
      const userId = req.user.claims.sub;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      await db.update(users)
        .set({ 
          displayName: displayName || null,
          firstName: displayName || null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Helper function to generate unique BOX code
  async function generateUniqueBoxCode(): Promise<string> {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let attempts = 0;
    while (attempts < 10) {
      let code = "BOX-";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const [existing] = await db.select().from(users).where(eq(users.boxCode, code));
      if (!existing) {
        return code;
      }
      attempts++;
    }
    return "BOX-" + crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  }

  // Email/Password Registration
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const { email, password, displayName, firstName, lastName, role, businessName, studioCode } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (!displayName) {
        return res.status(400).json({ message: "Name is required" });
      }

      if (role === "studio" && !businessName) {
        return res.status(400).json({ message: "Business name is required for studios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      let studioToJoin: any = null;
      if (studioCode && role === "artist") {
        const [studio] = await db.select().from(users).where(eq(users.boxCode, studioCode.toUpperCase()));
        if (!studio || studio.role !== "studio") {
          return res.status(400).json({ message: "Invalid studio code" });
        }
        studioToJoin = studio;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const boxCode = await generateUniqueBoxCode();

      const [user] = await db.insert(users).values({
        email,
        passwordHash,
        displayName,
        firstName: firstName || null,
        lastName: lastName || null,
        role: role || "artist",
        businessName: role === "studio" ? businessName : null,
        boxCode,
        emailVerified: false,
        verificationToken,
        verificationTokenExpires,
      }).returning();

      if (studioToJoin && user) {
        await db.insert(studioArtists).values({
          studioId: studioToJoin.id,
          artistId: user.id,
          inviteEmail: email,
          status: "accepted",
          acceptedAt: new Date(),
        });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      await sendVerificationEmail(email, verificationToken, baseUrl);

      res.json({ 
        success: true, 
        needsVerification: true,
        message: studioToJoin 
          ? `Account created and joined ${studioToJoin.businessName || studioToJoin.displayName}'s network. Please check your email to verify.` 
          : "Please check your email to verify your account" 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Email verification endpoint
  app.get("/api/auth/verify", async (req: any, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).send(renderVerificationPage(false, "Invalid verification link"));
      }

      const [user] = await db.select().from(users).where(eq(users.verificationToken, token as string));
      
      if (!user) {
        return res.status(400).send(renderVerificationPage(false, "Invalid or expired verification link"));
      }

      if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
        return res.status(400).send(renderVerificationPage(false, "Verification link has expired"));
      }

      await db.update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
        })
        .where(eq(users.id, user.id));

      res.send(renderVerificationPage(true, "Your email has been verified!"));
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).send(renderVerificationPage(false, "Verification failed"));
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", async (req: any, res) => {
    try {
      const { email } = req.body;

      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        return res.json({ success: true });
      }

      if (user.emailVerified === true) {
        return res.json({ success: true, message: "Email already verified" });
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.update(users)
        .set({ verificationToken, verificationTokenExpires })
        .where(eq(users.id, user.id));

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      await sendVerificationEmail(email, verificationToken, baseUrl);

      res.json({ success: true, message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // Email/Password Login
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      console.log("Login attempt for:", req.body.email);
      const { email, password } = req.body;

      if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({ message: "Email and password are required" });
      }

      const [user] = await db.select().from(users).where(eq(users.email, email));
      console.log("User found:", !!user, "emailVerified:", user?.emailVerified);
      if (!user || !user.passwordHash) {
        console.log("User not found or no password");
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        console.log("Invalid password");
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.emailVerified !== true) {
        console.log("Email not verified");
        return res.status(403).json({ 
          message: "Please verify your email before logging in",
          needsVerification: true,
          email: user.email
        });
      }

      // Set session with expires_at for compatibility with auth middleware
      const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 1 week from now
      req.session.passport = {
        user: {
          claims: { sub: user.id },
          expires_at: expiresAt,
        }
      };
      
      console.log("Login successful for:", email, "session set");
      res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

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
      const notes = await db.select().from(creativeNotes)
        .where(eq(creativeNotes.userId, userId))
        .orderBy(creativeNotes.sortOrder, creativeNotes.createdAt);
      res.json({ notes: notes.map(n => ({ 
        ...n, 
        is_pinned: n.isPinned === "true", 
        tags: n.tags || [],
        sort_order: n.sortOrder ?? 0,
        media_url: Array.isArray(n.mediaUrls) && n.mediaUrls.length > 0 ? n.mediaUrls[0] : null
      })) });
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/creative/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { category, content, media_url, tags } = req.body;
      
      // Get max sortOrder for this user's notes and add 1
      const maxResult = await db.select({ max: sql<number>`COALESCE(MAX(${creativeNotes.sortOrder}), -1)` })
        .from(creativeNotes)
        .where(eq(creativeNotes.userId, userId));
      const nextSortOrder = (maxResult[0]?.max ?? -1) + 1;
      
      const [note] = await db.insert(creativeNotes).values({
        userId,
        category: category || "ideas",
        content,
        mediaUrls: media_url ? [media_url] : [],
        tags: tags || [],
        sortOrder: nextSortOrder,
      }).returning();
      res.json({ note: { ...note, is_pinned: false, tags: note.tags || [], media_url: media_url || null, sort_order: note.sortOrder } });
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
      const existingUrls = Array.isArray(existing.mediaUrls) ? existing.mediaUrls : [];
      const [note] = await db.update(creativeNotes)
        .set({
          category: category || existing.category,
          content: content || existing.content,
          mediaUrls: media_url !== undefined ? (media_url ? [media_url] : []) : existingUrls,
          tags: tags || existing.tags,
          updatedAt: new Date(),
        })
        .where(eq(creativeNotes.id, parseInt(req.params.id)))
        .returning();
      const returnUrl = Array.isArray(note.mediaUrls) && note.mediaUrls.length > 0 ? note.mediaUrls[0] : null;
      res.json({ note: { ...note, is_pinned: note.isPinned === "true", tags: note.tags || [], media_url: returnUrl } });
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

  // Reorder notes (drag and drop)
  app.post("/api/creative/notes/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { noteIds } = req.body;

      if (!Array.isArray(noteIds)) {
        return res.status(400).json({ message: "noteIds must be an array" });
      }

      // Verify all notes belong to the authenticated user
      const userNotes = await db.select({ id: creativeNotes.id }).from(creativeNotes).where(eq(creativeNotes.userId, userId));
      const userNoteIds = new Set(userNotes.map(n => n.id));
      
      for (const id of noteIds) {
        if (!userNoteIds.has(id)) {
          return res.status(403).json({ message: "Unauthorized: Note does not belong to user" });
        }
      }

      // Update sort order for each note owned by the user
      const updates = noteIds.map((id: number, index: number) =>
        db.update(creativeNotes)
          .set({ sortOrder: index })
          .where(sql`${creativeNotes.id} = ${id} AND ${creativeNotes.userId} = ${userId}`)
      );
      await Promise.all(updates);

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to reorder notes:", error);
      res.status(500).json({ message: "Failed to reorder notes" });
    }
  });

  // Admin routes
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  function isAdmin(req: any, res: any, next: any) {
    if (req.session?.isAdmin) {
      next();
    } else {
      res.status(401).json({ message: "Admin access required" });
    }
  }

  app.get("/api/admin/check", (req: any, res) => {
    if (req.session?.isAdmin) {
      res.json({ isAdmin: true });
    } else {
      res.status(401).json({ isAdmin: false });
    }
  });

  app.post("/api/admin/login", (req: any, res) => {
    const { password } = req.body;
    if (!ADMIN_PASSWORD) {
      return res.status(500).json({ message: "Admin password not configured" });
    }
    if (password === ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  });

  app.post("/api/admin/logout", (req: any, res) => {
    req.session.isAdmin = false;
    res.json({ success: true });
  });

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/projects", isAdmin, async (req, res) => {
    try {
      const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
      res.json(allProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      const allProjects = await db.select().from(projects);
      
      const projectsByStatus: Record<string, number> = {};
      allProjects.forEach(p => {
        projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1;
      });

      res.json({
        totalUsers: allUsers.length,
        totalProjects: allProjects.length,
        projectsByStatus,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Community Sharing Endpoints
  
  // User submits a note for community sharing
  app.post("/api/community/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { noteId } = req.body;

      // Verify the note belongs to the user
      const [note] = await db.select().from(creativeNotes).where(eq(creativeNotes.id, noteId));
      if (!note || note.userId !== userId) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Check if already submitted
      const [existing] = await db.select().from(sharedContent).where(eq(sharedContent.noteId, noteId));
      if (existing) {
        return res.status(400).json({ message: "Note already submitted for sharing", status: existing.status });
      }

      // Get numeric user ID
      const [userRecord] = await db.select({ numericId: users.id }).from(users).where(eq(users.id, userId));
      const numericUserId = typeof userRecord?.numericId === 'number' ? userRecord.numericId : parseInt(userId);

      const [submission] = await db.insert(sharedContent).values({
        noteId,
        userId: numericUserId,
        status: "pending",
      }).returning();

      res.json({ submission });
    } catch (error) {
      console.error("Failed to submit for sharing:", error);
      res.status(500).json({ message: "Failed to submit for sharing" });
    }
  });

  // User gets their submission status
  app.get("/api/community/my-submissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [userRecord] = await db.select({ numericId: users.id }).from(users).where(eq(users.id, userId));
      const numericUserId = typeof userRecord?.numericId === 'number' ? userRecord.numericId : parseInt(userId);

      const submissions = await db.select().from(sharedContent).where(eq(sharedContent.userId, numericUserId));
      res.json({ submissions });
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Admin: Get all pending submissions
  app.get("/api/admin/submissions", isAdmin, async (req, res) => {
    try {
      const submissions = await db
        .select({
          id: sharedContent.id,
          noteId: sharedContent.noteId,
          userId: sharedContent.userId,
          status: sharedContent.status,
          adminNotes: sharedContent.adminNotes,
          createdAt: sharedContent.createdAt,
          approvedAt: sharedContent.approvedAt,
          noteContent: creativeNotes.content,
          noteCategory: creativeNotes.category,
          noteMediaUrls: creativeNotes.mediaUrls,
          noteTags: creativeNotes.tags,
        })
        .from(sharedContent)
        .leftJoin(creativeNotes, eq(sharedContent.noteId, creativeNotes.id))
        .orderBy(desc(sharedContent.createdAt));
      res.json({ submissions });
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Admin: Approve or reject a submission
  app.post("/api/admin/submissions/:id/review", isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }

      const [updated] = await db.update(sharedContent)
        .set({
          status,
          adminNotes,
          approvedAt: status === "approved" ? new Date() : null,
        })
        .where(eq(sharedContent.id, parseInt(id)))
        .returning();

      res.json({ submission: updated });
    } catch (error) {
      console.error("Failed to review submission:", error);
      res.status(500).json({ message: "Failed to review submission" });
    }
  });

  // Public: Get approved community content
  app.get("/api/community", async (req, res) => {
    try {
      const approved = await db
        .select({
          id: sharedContent.id,
          noteId: sharedContent.noteId,
          userId: sharedContent.userId,
          approvedAt: sharedContent.approvedAt,
          noteContent: creativeNotes.content,
          noteCategory: creativeNotes.category,
          noteMediaUrls: creativeNotes.mediaUrls,
          noteTags: creativeNotes.tags,
        })
        .from(sharedContent)
        .leftJoin(creativeNotes, eq(sharedContent.noteId, creativeNotes.id))
        .where(eq(sharedContent.status, "approved"))
        .orderBy(desc(sharedContent.approvedAt));
      
      // Get favorites count for each
      const result = await Promise.all(approved.map(async (item) => {
        const favorites = await db.select().from(communityFavorites).where(eq(communityFavorites.sharedContentId, item.id));
        const comments = await db.select().from(communityComments).where(eq(communityComments.sharedContentId, item.id));
        return {
          ...item,
          favoritesCount: favorites.length,
          commentsCount: comments.length,
        };
      }));

      res.json({ content: result });
    } catch (error) {
      console.error("Failed to fetch community content:", error);
      res.status(500).json({ message: "Failed to fetch community content" });
    }
  });

  // Toggle favorite on shared content
  app.post("/api/community/:id/favorite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sharedContentId = parseInt(req.params.id);

      const [userRecord] = await db.select({ numericId: users.id }).from(users).where(eq(users.id, userId));
      const numericUserId = typeof userRecord?.numericId === 'number' ? userRecord.numericId : parseInt(userId);

      // Check if already favorited
      const [existing] = await db.select().from(communityFavorites)
        .where(sql`${communityFavorites.sharedContentId} = ${sharedContentId} AND ${communityFavorites.userId} = ${numericUserId}`);

      if (existing) {
        await db.delete(communityFavorites).where(eq(communityFavorites.id, existing.id));
        res.json({ favorited: false });
      } else {
        await db.insert(communityFavorites).values({
          sharedContentId,
          userId: numericUserId,
        });
        res.json({ favorited: true });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Add comment to shared content
  app.post("/api/community/:id/comment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sharedContentId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const [userRecord] = await db.select({ numericId: users.id }).from(users).where(eq(users.id, userId));
      const numericUserId = typeof userRecord?.numericId === 'number' ? userRecord.numericId : parseInt(userId);

      const [comment] = await db.insert(communityComments).values({
        sharedContentId,
        userId: numericUserId,
        content: content.trim(),
      }).returning();

      res.json({ comment });
    } catch (error) {
      console.error("Failed to add comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Get comments for shared content
  app.get("/api/community/:id/comments", async (req, res) => {
    try {
      const sharedContentId = parseInt(req.params.id);
      const comments = await db.select().from(communityComments)
        .where(eq(communityComments.sharedContentId, sharedContentId))
        .orderBy(desc(communityComments.createdAt));
      res.json({ comments });
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Get user's favorites
  app.get("/api/community/my-favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [userRecord] = await db.select({ numericId: users.id }).from(users).where(eq(users.id, userId));
      const numericUserId = typeof userRecord?.numericId === 'number' ? userRecord.numericId : parseInt(userId);

      const favorites = await db.select({ sharedContentId: communityFavorites.sharedContentId })
        .from(communityFavorites)
        .where(eq(communityFavorites.userId, numericUserId));
      
      res.json({ favoriteIds: favorites.map(f => f.sharedContentId) });
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Admin: Create blog post from shared content
  app.post("/api/admin/blog", isAdmin, async (req: any, res) => {
    try {
      const { sharedContentId, title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }

      const [post] = await db.insert(blogPosts).values({
        sharedContentId: sharedContentId || null,
        title,
        content,
        authorId: 1, // Admin user
      }).returning();

      // Update shared content with blog post reference
      if (sharedContentId) {
        await db.update(sharedContent)
          .set({ blogPostId: post.id })
          .where(eq(sharedContent.id, sharedContentId));
      }

      res.json({ post });
    } catch (error) {
      console.error("Failed to create blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  // Get all published blog posts
  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await db.select().from(blogPosts)
        .where(eq(blogPosts.isPublished, "true"))
        .orderBy(desc(blogPosts.publishedAt));
      res.json({ posts });
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Admin: Publish/unpublish blog post
  app.post("/api/admin/blog/:id/publish", isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, parseInt(id)));
      
      const newStatus = post.isPublished === "true" ? "false" : "true";
      const [updated] = await db.update(blogPosts)
        .set({
          isPublished: newStatus,
          publishedAt: newStatus === "true" ? new Date() : null,
        })
        .where(eq(blogPosts.id, parseInt(id)))
        .returning();

      res.json({ post: updated });
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      res.status(500).json({ message: "Failed to toggle publish" });
    }
  });

  // Studio: Get studio's artist roster
  app.get("/api/studio/artists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (user?.role !== "studio") {
        return res.status(403).json({ message: "Studio access only" });
      }

      const relations = await db.select().from(studioArtists).where(eq(studioArtists.studioId, parseInt(userId)));
      
      const artistsWithInfo = await Promise.all(relations.map(async (rel) => {
        if (rel.artistId) {
          const [artist] = await db.select().from(users).where(eq(users.id, rel.artistId));
          const artistProjects = await db.select().from(projects).where(eq(projects.userId, rel.artistId));
          return {
            id: rel.id,
            artistId: rel.artistId,
            inviteEmail: rel.inviteEmail,
            status: rel.status,
            createdAt: rel.createdAt,
            acceptedAt: rel.acceptedAt,
            artistName: artist?.displayName || artist?.email || "Unknown",
            artistEmail: artist?.email,
            projectCount: artistProjects.length,
          };
        }
        return {
          id: rel.id,
          artistId: null,
          inviteEmail: rel.inviteEmail,
          status: rel.status,
          createdAt: rel.createdAt,
          acceptedAt: null,
          artistName: null,
          artistEmail: rel.inviteEmail,
          projectCount: 0,
        };
      }));

      res.json({ artists: artistsWithInfo });
    } catch (error) {
      console.error("Failed to fetch artists:", error);
      res.status(500).json({ message: "Failed to fetch artists" });
    }
  });

  // Studio: Invite artist by email
  app.post("/api/studio/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email } = req.body;

      const userIdNum = parseInt(userId);
      const [user] = await db.select().from(users).where(eq(users.id, userIdNum));
      if (user?.role !== "studio") {
        return res.status(403).json({ message: "Studio access only" });
      }

      const [existingArtist] = await db.select().from(users).where(eq(users.email, email));
      
      if (existingArtist) {
        const [existingRelation] = await db.select().from(studioArtists)
          .where(and(
            eq(studioArtists.studioId, userIdNum),
            eq(studioArtists.artistId, existingArtist.id)
          ));

        if (existingRelation) {
          return res.status(400).json({ message: "Artist already in your roster" });
        }

        await db.insert(studioArtists).values({
          studioId: userIdNum,
          artistId: existingArtist.id,
          status: "pending",
          inviteEmail: email,
        });
      } else {
        const [existingInvite] = await db.select().from(studioArtists)
          .where(and(
            eq(studioArtists.studioId, userIdNum),
            eq(studioArtists.inviteEmail, email)
          ));

        if (existingInvite) {
          return res.status(400).json({ message: "Invitation already sent" });
        }

        await db.insert(studioArtists).values({
          studioId: userIdNum,
          artistId: null,
          status: "pending",
          inviteEmail: email,
        });
      }

      res.json({ success: true, message: "Invitation sent" });
    } catch (error) {
      console.error("Failed to invite artist:", error);
      res.status(500).json({ message: "Failed to invite artist" });
    }
  });

  // Studio: Get artist's projects
  app.get("/api/studio/artists/:artistId/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { artistId } = req.params;
      const userIdNum = parseInt(userId);
      const artistIdNum = parseInt(artistId);

      const [user] = await db.select().from(users).where(eq(users.id, userIdNum));
      if (user?.role !== "studio") {
        return res.status(403).json({ message: "Studio access only" });
      }

      const [relation] = await db.select().from(studioArtists)
        .where(and(
          eq(studioArtists.studioId, userIdNum),
          eq(studioArtists.artistId, artistIdNum)
        ));

      if (!relation || relation.status !== "accepted") {
        return res.status(403).json({ message: "Artist not in your roster" });
      }

      const artistProjects = await db.select().from(projects)
        .where(eq(projects.userId, artistIdNum))
        .orderBy(desc(projects.updatedAt));

      res.json({ projects: artistProjects });
    } catch (error) {
      console.error("Failed to fetch artist projects:", error);
      res.status(500).json({ message: "Failed to fetch artist projects" });
    }
  });

  // Studio: Toggle project featured status
  app.post("/api/studio/projects/:projectId/feature", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.params;
      const { featured } = req.body;
      const userIdNum = parseInt(userId);

      const [user] = await db.select().from(users).where(eq(users.id, userIdNum));
      if (user?.role !== "studio") {
        return res.status(403).json({ message: "Studio access only" });
      }

      const [project] = await db.select().from(projects).where(eq(projects.id, parseInt(projectId)));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const [relation] = await db.select().from(studioArtists)
        .where(and(
          eq(studioArtists.studioId, userIdNum),
          eq(studioArtists.artistId, project.userId)
        ));

      if (!relation || relation.status !== "accepted") {
        return res.status(403).json({ message: "Artist not in your roster" });
      }

      const [updated] = await db.update(projects)
        .set({ isFeatured: featured })
        .where(eq(projects.id, parseInt(projectId)))
        .returning();

      res.json({ project: updated });
    } catch (error) {
      console.error("Failed to toggle featured:", error);
      res.status(500).json({ message: "Failed to toggle featured" });
    }
  });

  // Studio: Remove artist from roster
  app.delete("/api/studio/artists/:relationId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { relationId } = req.params;
      const userIdNum = parseInt(userId);

      const [user] = await db.select().from(users).where(eq(users.id, userIdNum));
      if (user?.role !== "studio") {
        return res.status(403).json({ message: "Studio access only" });
      }

      await db.delete(studioArtists)
        .where(and(
          eq(studioArtists.id, parseInt(relationId)),
          eq(studioArtists.studioId, userIdNum)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove artist:", error);
      res.status(500).json({ message: "Failed to remove artist" });
    }
  });

  // Public: Get studio portfolio
  app.get("/api/portfolio/:studioId", async (req, res) => {
    try {
      const { studioId } = req.params;
      const studioIdNum = parseInt(studioId);

      const [studio] = await db.select().from(users).where(eq(users.id, studioIdNum));
      if (!studio || studio.role !== "studio") {
        return res.status(404).json({ message: "Studio not found" });
      }

      const relations = await db.select().from(studioArtists)
        .where(and(
          eq(studioArtists.studioId, studioIdNum),
          eq(studioArtists.status, "accepted")
        ));

      const roster = await Promise.all(relations.map(async (rel) => {
        if (!rel.artistId) return null;
        const [artist] = await db.select().from(users).where(eq(users.id, rel.artistId));
        const artistProjects = await db.select().from(projects).where(eq(projects.userId, rel.artistId));
        return {
          id: rel.artistId,
          displayName: artist?.displayName || "Unknown",
          projectCount: artistProjects.length,
        };
      }));

      const allFeaturedProjects: any[] = [];
      for (const rel of relations) {
        if (!rel.artistId) continue;
        const artistFeatured = await db.select().from(projects)
          .where(and(
            eq(projects.userId, rel.artistId),
            eq(projects.isFeatured, true)
          ));
        const [artist] = await db.select().from(users).where(eq(users.id, rel.artistId));
        for (const proj of artistFeatured) {
          allFeaturedProjects.push({
            ...proj,
            artistName: artist?.displayName || "Unknown",
          });
        }
      }

      res.json({
        studio: {
          id: studio.id,
          businessName: studio.businessName,
          businessBio: studio.businessBio,
          displayName: studio.displayName,
        },
        roster: roster.filter(r => r !== null),
        featuredProjects: allFeaturedProjects,
      });
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Artist: Accept studio invitation
  app.post("/api/studio/invitations/:invitationId/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { invitationId } = req.params;
      const userIdNum = parseInt(userId);

      const [invitation] = await db.select().from(studioArtists).where(eq(studioArtists.id, parseInt(invitationId)));
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userIdNum));
      if (invitation.inviteEmail !== user?.email) {
        return res.status(403).json({ message: "This invitation is not for you" });
      }

      const [updated] = await db.update(studioArtists)
        .set({
          artistId: userIdNum,
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(studioArtists.id, parseInt(invitationId)))
        .returning();

      res.json({ success: true, invitation: updated });
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Artist: Get pending invitations
  app.get("/api/artist/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userIdNum = parseInt(userId);
      const [user] = await db.select().from(users).where(eq(users.id, userIdNum));

      if (!user?.email) {
        return res.json({ invitations: [] });
      }

      const invitations = await db.select().from(studioArtists)
        .where(and(
          eq(studioArtists.inviteEmail, user.email),
          eq(studioArtists.status, "pending")
        ));

      const invitationsWithStudio = await Promise.all(invitations.map(async (inv) => {
        const [studio] = await db.select().from(users).where(eq(users.id, inv.studioId));
        return {
          id: inv.id,
          studioName: studio?.businessName || studio?.displayName || "Unknown Studio",
          createdAt: inv.createdAt,
        };
      }));

      res.json({ invitations: invitationsWithStudio });
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch(console.error);
