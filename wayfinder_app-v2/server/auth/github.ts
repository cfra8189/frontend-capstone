import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Express } from "express";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

function generateBoxCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "BOX-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function setupGitHubAuth(app: Express) {
  const clientID = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  if (!clientID || !clientSecret) {
    console.log("GitHub OAuth not configured - GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET required");
    return;
  }

  const callbackURL = process.env.GITHUB_CALLBACK_URL || 
    (process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/auth/github/callback`
      : "http://localhost:5000/api/auth/github/callback");

  passport.use(new GitHubStrategy({
    clientID,
    clientSecret,
    callbackURL,
    scope: ["user:email"],
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
      const githubId = profile.id;
      
      let [existingUser] = await db.select().from(users).where(eq(users.email, email));
      
      if (!existingUser) {
        const boxCode = generateBoxCode();
        const [newUser] = await db.insert(users).values({
          id visibleForTesting: crypto.randomUUID(),
          email,
          displayName: profile.displayName || profile.username,
          firstName: profile.displayName?.split(" ")[0] || profile.username,
          lastName: profile.displayName?.split(" ").slice(1).join(" ") || null,
          profileImageUrl: profile.photos?.[0]?.value || null,
          role: "artist",
          boxCode,
          emailVerified: true,
          githubId,
        }).returning();
        existingUser = newUser;
      } else if (!existingUser.githubId) {
        await db.update(users).set({ 
          githubId,
          profileImageUrl: existingUser.profileImageUrl || profile.photos?.[0]?.value,
        }).where(eq(users.id, existingUser.id));
      }

      return done(null, existingUser);
    } catch (error) {
      console.error("GitHub auth error:", error);
      return done(error);
    }
  }));

  app.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

  app.get("/api/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/?error=github_auth_failed" }),
    (req: any, res) => {
      const user = req.user;
      req.session.user = {
        claims: {
          sub: user.id,
          email: user.email,
          name: user.displayName,
          picture: user.profileImageUrl,
        }
      };
      res.redirect("/");
    }
  );

  console.log("GitHub OAuth configured");
}
