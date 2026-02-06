import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import { User } from "../../shared/models/mongoose/User";
import crypto from "crypto";

function generateBoxCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BOX-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function setupGoogleAuth(app: Express) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.log("Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required");
    return;
  }

  const callbackURL = process.env.GOOGLE_CALLBACK_URL ||
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`
      : (process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}/api/auth/google/callback`
        : "http://localhost:5000/api/auth/google/callback"));

  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL,
    scope: ["profile", "email"],
  }, async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error("No email found in Google profile"));
      }

      const googleId = profile.id;

      let existingUser = await User.findOne({
        $or: [{ email }, { googleId }]
      });

      if (!existingUser) {
        const boxCode = generateBoxCode();
        existingUser = await User.create({
          email,
          displayName: profile.displayName || email,
          firstName: profile.name?.givenName || profile.displayName?.split(" ")[0] || "",
          lastName: profile.name?.familyName || profile.displayName?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: profile.photos?.[0]?.value || null,
          role: "artist",
          boxCode,
          emailVerified: true,
          googleId,
        });
      } else if (!existingUser.googleId) {
        existingUser.googleId = googleId;
        existingUser.profileImageUrl = existingUser.profileImageUrl || profile.photos?.[0]?.value;
        existingUser.emailVerified = true;
        await existingUser.save();
      }

      return done(null, existingUser);
    } catch (error) {
      console.error("Google auth error:", error);
      return done(error);
    }
  }));

  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/?error=google_auth_failed" }),
    (req: any, res) => {
      const user = req.user;
      const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
      req.session.passport = {
        user: {
          claims: { sub: user._id.toString() },
          expires_at: expiresAt,
        }
      };
      res.redirect("/");
    }
  );

  console.log("Google OAuth configured");
}
