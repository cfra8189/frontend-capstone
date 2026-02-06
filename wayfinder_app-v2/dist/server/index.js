// server/index.ts
import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import crypto2 from "crypto";
import path from "path";
import { fileURLToPath } from "url";

// server/replit_integrations/auth/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import MongoStore from "connect-mongo";

// shared/models/mongoose/User.ts
import mongoose, { Schema } from "mongoose";
var userSchema = new Schema({
  email: { type: String, unique: true, sparse: true, default: null },
  passwordHash: { type: String, default: null },
  displayName: { type: String, default: null },
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  profileImageUrl: { type: String, default: null },
  role: { type: String, maxlength: 20, default: "artist" },
  businessName: { type: String, default: null },
  businessBio: { type: String, default: null },
  boxCode: { type: String, maxlength: 12, unique: true, sparse: true, default: null },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpires: { type: Date, default: null },
  githubId: { type: String, default: null }
}, { timestamps: true });
var User = mongoose.model("User", userSchema);

// server/replit_integrations/auth/storage.ts
import crypto from "crypto";
async function generateUniqueBoxCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let attempts = 0;
  while (attempts < 10) {
    let code = "BOX-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await User.findOne({ boxCode: code });
    if (!existing) {
      return code;
    }
    attempts++;
  }
  return "BOX-" + crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
}
var AuthStorage = class {
  async getUser(id) {
    const user = await User.findById(id);
    if (user && !user.boxCode) {
      const boxCode = await generateUniqueBoxCode();
      user.boxCode = boxCode;
      await user.save();
    }
    return user;
  }
  async upsertUser(userData) {
    const boxCode = await generateUniqueBoxCode();
    const user = await User.findOneAndUpdate(
      { email: userData.email },
      {
        $set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: /* @__PURE__ */ new Date()
        },
        $setOnInsert: {
          displayName: userData.firstName || userData.email,
          boxCode,
          role: "artist",
          emailVerified: true
        }
      },
      { upsert: true, new: true }
    );
    return user;
  }
};
var authStorage = new AuthStorage();

// server/replit_integrations/auth/replitAuth.ts
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessions",
    ttl: sessionTtl / 1e3
  });
  return session({
    secret: process.env.SESSION_SECRET || "box-session-secret-" + (process.env.REPL_ID || "dev"),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || !!process.env.REPL_ID,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  const registeredStrategies = /* @__PURE__ */ new Set();
  const ensureStrategy = (domain) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    const hostname = req.hostname;
    console.log(`OAuth callback received for hostname: ${hostname}`);
    ensureStrategy(hostname);
    passport.authenticate(`replitauth:${hostname}`, (err, user, info) => {
      if (err) {
        console.error("OAuth callback error:", err);
        return res.redirect("/?error=auth_failed");
      }
      if (!user) {
        console.error("OAuth callback: no user returned, info:", info);
        return res.redirect("/api/login");
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("OAuth login error:", loginErr);
          return res.redirect("/?error=login_failed");
        }
        return res.redirect("/");
      });
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        res.clearCookie("connect.sid");
        res.redirect("/");
      });
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!user.expires_at) {
    if (user.claims?.sub) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/replit_integrations/auth/routes.ts
function registerAuthRoutes(app2) {
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (user) {
        res.json({
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          profileImageUrl: user.profileImageUrl,
          role: user.role || "artist",
          businessName: user.businessName || null,
          boxCode: user.boxCode || null,
          authType: user.passwordHash ? "email" : "oauth"
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

// server/replit_integrations/object_storage/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

// server/replit_integrations/object_storage/objectAcl.ts
var ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    // Implement the case for each type of access group to instantiate.
    //
    // For example:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    // case "EMAIL_DOMAIN":
    //   return new EmailDomainAccessGroup(group.id);
    // case "GROUP_MEMBER":
    //   return new GroupMemberAccessGroup(group.id);
    // case "SUBSCRIBER":
    //   return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}

// server/replit_integrations/object_storage/objectStorage.ts
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Gets the public object search paths.
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path2) => path2.trim()).filter((path2) => path2.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  // Gets the private object directory.
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Search for a public object from the search paths.
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  // Downloads an object to the response.
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }
  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission
  }) {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? "read" /* READ */
    });
  }
};
function parseObjectPath(path2) {
  if (!path2.startsWith("/")) {
    path2 = `/${path2}`;
  }
  const pathParts = path2.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/replit_integrations/object_storage/routes.ts
function registerObjectStorageRoutes(app2) {
  const objectStorageService = new ObjectStorageService();
  app2.post("/api/uploads/request-url", isAuthenticated, async (req, res) => {
    try {
      const { name, size, contentType } = req.body;
      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name"
        });
      }
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json({
        uploadURL,
        objectPath,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType }
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

// server/mongodb.ts
import mongoose2 from "mongoose";
async function connectMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is required");
  }
  await mongoose2.connect(uri);
  console.log("Connected to MongoDB");
}

// shared/models/mongoose/Project.ts
import mongoose3, { Schema as Schema2 } from "mongoose";
var projectSchema = new Schema2({
  userId: { type: Schema2.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, maxlength: 255 },
  type: { type: String, maxlength: 50, default: "single" },
  status: { type: String, maxlength: 50, default: "concept" },
  description: { type: String, default: null },
  metadata: { type: Schema2.Types.Mixed, default: {} },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });
var Project = mongoose3.model("Project", projectSchema);

// shared/models/mongoose/CreativeNote.ts
import mongoose4, { Schema as Schema3 } from "mongoose";
var creativeNoteSchema = new Schema3({
  userId: { type: Schema3.Types.ObjectId, ref: "User", required: true },
  category: { type: String, maxlength: 50, default: "ideas" },
  title: { type: String, maxlength: 255, default: null },
  content: { type: String, required: true },
  mediaUrls: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  isPinned: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });
var CreativeNote = mongoose4.model("CreativeNote", creativeNoteSchema);

// shared/models/mongoose/SharedContent.ts
import mongoose5, { Schema as Schema4 } from "mongoose";
var sharedContentSchema = new Schema4({
  noteId: { type: Schema4.Types.ObjectId, ref: "CreativeNote", required: true },
  userId: { type: Schema4.Types.ObjectId, ref: "User", required: true },
  status: { type: String, maxlength: 20, default: "pending" },
  adminNotes: { type: String, default: null },
  blogPostId: { type: Schema4.Types.ObjectId, ref: "BlogPost", default: null },
  approvedAt: { type: Date, default: null }
}, { timestamps: true });
var SharedContent = mongoose5.model("SharedContent", sharedContentSchema);

// shared/models/mongoose/CommunityFavorite.ts
import mongoose6, { Schema as Schema5 } from "mongoose";
var communityFavoriteSchema = new Schema5({
  sharedContentId: { type: Schema5.Types.ObjectId, ref: "SharedContent", required: true },
  userId: { type: Schema5.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
var CommunityFavorite = mongoose6.model("CommunityFavorite", communityFavoriteSchema);

// shared/models/mongoose/CommunityComment.ts
import mongoose7, { Schema as Schema6 } from "mongoose";
var communityCommentSchema = new Schema6({
  sharedContentId: { type: Schema6.Types.ObjectId, ref: "SharedContent", required: true },
  userId: { type: Schema6.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true }
}, { timestamps: true });
var CommunityComment = mongoose7.model("CommunityComment", communityCommentSchema);

// shared/models/mongoose/BlogPost.ts
import mongoose8, { Schema as Schema7 } from "mongoose";
var blogPostSchema = new Schema7({
  sharedContentId: { type: Schema7.Types.ObjectId, ref: "SharedContent", default: null },
  title: { type: String, required: true, maxlength: 255 },
  content: { type: String, required: true },
  authorId: { type: Schema7.Types.ObjectId, ref: "User", required: true },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date, default: null }
}, { timestamps: true });
var BlogPost = mongoose8.model("BlogPost", blogPostSchema);

// shared/models/mongoose/StudioArtist.ts
import mongoose9, { Schema as Schema8 } from "mongoose";
var studioArtistSchema = new Schema8({
  studioId: { type: Schema8.Types.ObjectId, ref: "User", required: true },
  artistId: { type: Schema8.Types.ObjectId, ref: "User", default: null },
  status: { type: String, maxlength: 20, default: "pending" },
  inviteEmail: { type: String, default: null },
  acceptedAt: { type: Date, default: null }
}, { timestamps: true });
var StudioArtist = mongoose9.model("StudioArtist", studioArtistSchema);

// shared/models/mongoose/PressKit.ts
import mongoose10, { Schema as Schema9 } from "mongoose";
var pressKitSchema = new Schema9({
  userId: { type: Schema9.Types.ObjectId, ref: "User", required: true, unique: true },
  shortBio: { type: String, default: null },
  mediumBio: { type: String, default: null },
  longBio: { type: String, default: null },
  genre: { type: String, maxlength: 100, default: null },
  location: { type: String, maxlength: 255, default: null },
  photoUrls: { type: [String], default: [] },
  videoUrls: { type: [String], default: [] },
  featuredTracks: { type: [Schema9.Types.Mixed], default: [] },
  achievements: { type: [Schema9.Types.Mixed], default: [] },
  pressQuotes: { type: [Schema9.Types.Mixed], default: [] },
  socialLinks: { type: Schema9.Types.Mixed, default: {} },
  contactEmail: { type: String, default: null },
  contactName: { type: String, default: null },
  bookingEmail: { type: String, default: null },
  technicalRider: { type: String, default: null },
  stagePlot: { type: String, default: null },
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });
var PressKit = mongoose10.model("PressKit", pressKitSchema);

// server/lib/email.ts
import { Resend } from "resend";
async function getUncachableResendClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }
  const connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        "Accept": "application/json",
        "X_REPLIT_TOKEN": xReplitToken
      }
    }
  ).then((res) => res.json()).then((data) => data.items?.[0]);
  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error("Resend not connected");
  }
  return {
    client: new Resend(connectionSettings.settings.api_key),
    fromEmail: connectionSettings.settings.from_email
  };
}
async function sendVerificationEmail(to, token, baseUrl) {
  try {
    console.log("Attempting to send verification email to:", to);
    const { client: client2, fromEmail } = await getUncachableResendClient();
    console.log("Resend client obtained, fromEmail:", fromEmail);
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;
    console.log("Verification URL:", verifyUrl);
    const result = await client2.emails.send({
      from: fromEmail || "The Box <noreply@luctheleo.com>",
      to: [to],
      subject: "Verify your account - The Box",
      html: `
        <div style="font-family: 'Courier New', Courier, monospace; background: #0a0a0a; color: #fff; padding: 40px; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://luctheleo.com/box-logo.png" alt="The Box" style="width: 50px; height: 50px;" />
          </div>
          <h1 style="color: #c3f53c; text-align: center; margin-bottom: 20px;">Verify Your Email</h1>
          <p style="text-align: center; color: #999; margin-bottom: 30px;">
            Click the button below to verify your email address and activate your account with The Box.
          </p>
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${verifyUrl}" style="display: inline-block; background: #c3f53c; color: #000; font-weight: bold; padding: 15px 40px; text-decoration: none; border-radius: 8px;">
              Verify Email
            </a>
          </div>
          <p style="text-align: center; color: #666; font-size: 12px;">
            This link expires in 24 hours. If you didn't create an account, you can ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
          <p style="text-align: center; color: #444; font-size: 11px;">
            &copy; 2026 The Box by luctheleo.com | REVERIE | RVR Creative Development
          </p>
        </div>
      `
    });
    console.log("Email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    console.error("Error details:", error?.message, error?.statusCode);
    return false;
  }
}

// server/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
app.use(express.json());
function toId(doc) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj._id) {
    obj.id = obj._id.toString();
  }
  return obj;
}
function renderVerificationPage(success, message) {
  const color = success ? "#c3f53c" : "#ef4444";
  const icon = success ? "\u2713" : "\u2717";
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
  await connectMongoDB();
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);
  app.post("/api/auth/change-password", isAuthenticated, async (req, res) => {
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
      const user = await User.findById(userId);
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
      await User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  app.post("/api/auth/update-profile", isAuthenticated, async (req, res) => {
    try {
      const { displayName } = req.body;
      const userId = req.user.claims.sub;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      await User.findByIdAndUpdate(userId, {
        displayName: displayName || null,
        firstName: displayName || null,
        updatedAt: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  async function generateUniqueBoxCode2() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let attempts = 0;
    while (attempts < 10) {
      let code = "BOX-";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await User.findOne({ boxCode: code });
      if (!existing) {
        return code;
      }
      attempts++;
    }
    return "BOX-" + crypto2.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  }
  app.post("/api/auth/register", async (req, res) => {
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
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      let studioToJoin = null;
      if (studioCode && role === "artist") {
        const studio = await User.findOne({ boxCode: studioCode.toUpperCase() });
        if (!studio || studio.role !== "studio") {
          return res.status(400).json({ message: "Invalid studio code" });
        }
        studioToJoin = studio;
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const verificationToken = crypto2.randomBytes(32).toString("hex");
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      const boxCode = await generateUniqueBoxCode2();
      const user = await User.create({
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
        verificationTokenExpires
      });
      if (studioToJoin && user) {
        await StudioArtist.create({
          studioId: studioToJoin._id,
          artistId: user._id,
          inviteEmail: email,
          status: "accepted",
          acceptedAt: /* @__PURE__ */ new Date()
        });
      }
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      await sendVerificationEmail(email, verificationToken, baseUrl);
      res.json({
        success: true,
        needsVerification: true,
        message: studioToJoin ? `Account created and joined ${studioToJoin.businessName || studioToJoin.displayName}'s network. Please check your email to verify.` : "Please check your email to verify your account"
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app.get("/api/auth/verify", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).send(renderVerificationPage(false, "Invalid verification link"));
      }
      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        return res.status(400).send(renderVerificationPage(false, "Invalid or expired verification link"));
      }
      if (user.verificationTokenExpires && /* @__PURE__ */ new Date() > user.verificationTokenExpires) {
        return res.status(400).send(renderVerificationPage(false, "Verification link has expired"));
      }
      await User.findByIdAndUpdate(user._id, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null
      });
      res.send(renderVerificationPage(true, "Your email has been verified!"));
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).send(renderVerificationPage(false, "Verification failed"));
    }
  });
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ success: true });
      }
      if (user.emailVerified === true) {
        return res.json({ success: true, message: "Email already verified" });
      }
      const verificationToken = crypto2.randomBytes(32).toString("hex");
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await User.findByIdAndUpdate(user._id, { verificationToken, verificationTokenExpires });
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      await sendVerificationEmail(email, verificationToken, baseUrl);
      res.json({ success: true, message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt for:", req.body.email);
      const { email, password } = req.body;
      if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({ message: "Email and password are required" });
      }
      const user = await User.findOne({ email });
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
      const expiresAt = Math.floor(Date.now() / 1e3) + 7 * 24 * 60 * 60;
      req.session.passport = {
        user: {
          claims: { sub: user._id.toString() },
          expires_at: expiresAt
        }
      };
      console.log("Login successful for:", email, "session set");
      res.json({ success: true, user: { id: user._id.toString(), email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const userProjects = await Project.find({ userId }).sort({ createdAt: -1 });
      res.json({ projects: userProjects.map(toId) });
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, type, status, description, metadata } = req.body;
      const project = await Project.create({
        userId,
        title,
        type: type || "single",
        status: status || "concept",
        description,
        metadata: metadata || {}
      });
      res.json({ project: toId(project) });
    } catch (error) {
      console.error("Failed to create project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });
  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await Project.findById(req.params.id);
      if (!project || project.userId.toString() !== userId) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ project: toId(project) });
    } catch (error) {
      console.error("Failed to fetch project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });
  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const existing = await Project.findById(req.params.id);
      if (!existing || existing.userId.toString() !== userId) {
        return res.status(404).json({ message: "Project not found" });
      }
      const { title, type, status, description, metadata } = req.body;
      const project = await Project.findByIdAndUpdate(req.params.id, {
        title: title || existing.title,
        type: type || existing.type,
        status: status || existing.status,
        description: description !== void 0 ? description : existing.description,
        metadata: metadata || existing.metadata,
        updatedAt: /* @__PURE__ */ new Date()
      }, { new: true });
      res.json({ project: toId(project) });
    } catch (error) {
      console.error("Failed to update project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });
  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const existing = await Project.findById(req.params.id);
      if (!existing || existing.userId.toString() !== userId) {
        return res.status(404).json({ message: "Project not found" });
      }
      await Project.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });
  app.get("/api/creative/notes", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const notes = await CreativeNote.find({ userId }).sort({ sortOrder: 1, createdAt: 1 });
      res.json({ notes: notes.map((n) => {
        const obj = toId(n);
        return {
          ...obj,
          is_pinned: !!n.isPinned,
          tags: n.tags || [],
          sort_order: n.sortOrder ?? 0,
          media_url: Array.isArray(n.mediaUrls) && n.mediaUrls.length > 0 ? n.mediaUrls[0] : null
        };
      }) });
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });
  app.post("/api/creative/notes", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { category, content, media_url, tags } = req.body;
      const maxNote = await CreativeNote.findOne({ userId }).sort({ sortOrder: -1 });
      const nextSortOrder = (maxNote?.sortOrder ?? -1) + 1;
      const note = await CreativeNote.create({
        userId,
        category: category || "ideas",
        content,
        mediaUrls: media_url ? [media_url] : [],
        tags: tags || [],
        sortOrder: nextSortOrder
      });
      const obj = toId(note);
      res.json({ note: { ...obj, is_pinned: false, tags: note.tags || [], media_url: media_url || null, sort_order: note.sortOrder } });
    } catch (error) {
      console.error("Failed to create note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });
  app.put("/api/creative/notes/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const existing = await CreativeNote.findById(req.params.id);
      if (!existing || existing.userId.toString() !== userId) {
        return res.status(404).json({ message: "Note not found" });
      }
      const { category, content, media_url, tags } = req.body;
      const existingUrls = Array.isArray(existing.mediaUrls) ? existing.mediaUrls : [];
      const note = await CreativeNote.findByIdAndUpdate(req.params.id, {
        category: category || existing.category,
        content: content || existing.content,
        mediaUrls: media_url !== void 0 ? media_url ? [media_url] : [] : existingUrls,
        tags: tags || existing.tags,
        updatedAt: /* @__PURE__ */ new Date()
      }, { new: true });
      const obj = toId(note);
      const returnUrl = Array.isArray(note.mediaUrls) && note.mediaUrls.length > 0 ? note.mediaUrls[0] : null;
      res.json({ note: { ...obj, is_pinned: !!note.isPinned, tags: note.tags || [], media_url: returnUrl } });
    } catch (error) {
      console.error("Failed to update note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });
  app.delete("/api/creative/notes/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const existing = await CreativeNote.findById(req.params.id);
      if (!existing || existing.userId.toString() !== userId) {
        return res.status(404).json({ message: "Note not found" });
      }
      await CreativeNote.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });
  app.post("/api/creative/notes/:id/pin", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const existing = await CreativeNote.findById(req.params.id);
      if (!existing || existing.userId.toString() !== userId) {
        return res.status(404).json({ message: "Note not found" });
      }
      const note = await CreativeNote.findByIdAndUpdate(req.params.id, {
        isPinned: !existing.isPinned
      }, { new: true });
      const obj = toId(note);
      res.json({ note: { ...obj, is_pinned: !!note.isPinned } });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
      res.status(500).json({ message: "Failed to toggle pin" });
    }
  });
  app.post("/api/creative/notes/reorder", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { noteIds } = req.body;
      if (!Array.isArray(noteIds)) {
        return res.status(400).json({ message: "noteIds must be an array" });
      }
      const userNotes = await CreativeNote.find({ userId }, "_id");
      const userNoteIds = new Set(userNotes.map((n) => n._id.toString()));
      for (const id of noteIds) {
        if (!userNoteIds.has(id.toString())) {
          return res.status(403).json({ message: "Unauthorized: Note does not belong to user" });
        }
      }
      const updates = noteIds.map(
        (id, index) => CreativeNote.updateOne({ _id: id, userId }, { sortOrder: index })
      );
      await Promise.all(updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to reorder notes:", error);
      res.status(500).json({ message: "Failed to reorder notes" });
    }
  });
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  function isAdmin(req, res, next) {
    if (req.session?.isAdmin) {
      next();
    } else {
      res.status(401).json({ message: "Admin access required" });
    }
  }
  app.get("/api/admin/check", (req, res) => {
    if (req.session?.isAdmin) {
      res.json({ isAdmin: true });
    } else {
      res.status(401).json({ isAdmin: false });
    }
  });
  app.post("/api/admin/login", (req, res) => {
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
  app.post("/api/admin/logout", (req, res) => {
    req.session.isAdmin = false;
    res.json({ success: true });
  });
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await User.find().sort({ createdAt: -1 });
      res.json(allUsers.map(toId));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app.get("/api/admin/projects", isAdmin, async (req, res) => {
    try {
      const allProjects = await Project.find().sort({ createdAt: -1 });
      res.json(allProjects.map(toId));
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const allProjects = await Project.find();
      const projectsByStatus = {};
      allProjects.forEach((p) => {
        projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1;
      });
      res.json({
        totalUsers,
        totalProjects: allProjects.length,
        projectsByStatus
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  app.post("/api/community/submit", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { noteId } = req.body;
      const note = await CreativeNote.findById(noteId);
      if (!note || note.userId.toString() !== userId) {
        return res.status(404).json({ message: "Note not found" });
      }
      const existing = await SharedContent.findOne({ noteId });
      if (existing) {
        return res.status(400).json({ message: "Note already submitted for sharing", status: existing.status });
      }
      const submission = await SharedContent.create({
        noteId,
        userId,
        status: "pending"
      });
      res.json({ submission: toId(submission) });
    } catch (error) {
      console.error("Failed to submit for sharing:", error);
      res.status(500).json({ message: "Failed to submit for sharing" });
    }
  });
  app.get("/api/community/my-submissions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const submissions = await SharedContent.find({ userId });
      res.json({ submissions: submissions.map(toId) });
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  app.get("/api/admin/submissions", isAdmin, async (req, res) => {
    try {
      const submissions = await SharedContent.find().sort({ createdAt: -1 }).populate("noteId");
      const result = submissions.map((sub) => {
        const subObj = toId(sub);
        const note = sub.noteId;
        return {
          id: subObj.id,
          noteId: note?._id?.toString() || subObj.noteId,
          userId: subObj.userId,
          status: subObj.status,
          adminNotes: subObj.adminNotes,
          createdAt: subObj.createdAt,
          approvedAt: subObj.approvedAt,
          noteContent: note?.content || null,
          noteCategory: note?.category || null,
          noteMediaUrls: note?.mediaUrls || null,
          noteTags: note?.tags || null
        };
      });
      res.json({ submissions: result });
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  app.post("/api/admin/submissions/:id/review", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      const updated = await SharedContent.findByIdAndUpdate(id, {
        status,
        adminNotes,
        approvedAt: status === "approved" ? /* @__PURE__ */ new Date() : null
      }, { new: true });
      res.json({ submission: toId(updated) });
    } catch (error) {
      console.error("Failed to review submission:", error);
      res.status(500).json({ message: "Failed to review submission" });
    }
  });
  app.get("/api/community", async (req, res) => {
    try {
      const approved = await SharedContent.find({ status: "approved" }).sort({ approvedAt: -1 }).populate("noteId");
      const result = await Promise.all(approved.map(async (item) => {
        const note = item.noteId;
        const itemObj = toId(item);
        const favoritesCount = await CommunityFavorite.countDocuments({ sharedContentId: item._id });
        const commentsCount = await CommunityComment.countDocuments({ sharedContentId: item._id });
        return {
          id: itemObj.id,
          noteId: note?._id?.toString() || itemObj.noteId,
          userId: itemObj.userId,
          approvedAt: itemObj.approvedAt,
          noteContent: note?.content || null,
          noteCategory: note?.category || null,
          noteMediaUrls: note?.mediaUrls || null,
          noteTags: note?.tags || null,
          favoritesCount,
          commentsCount
        };
      }));
      res.json({ content: result });
    } catch (error) {
      console.error("Failed to fetch community content:", error);
      res.status(500).json({ message: "Failed to fetch community content" });
    }
  });
  app.post("/api/community/:id/favorite", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const sharedContentId = req.params.id;
      const existing = await CommunityFavorite.findOne({ sharedContentId, userId });
      if (existing) {
        await CommunityFavorite.findByIdAndDelete(existing._id);
        res.json({ favorited: false });
      } else {
        await CommunityFavorite.create({
          sharedContentId,
          userId
        });
        res.json({ favorited: true });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });
  app.post("/api/community/:id/comment", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const sharedContentId = req.params.id;
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      const comment = await CommunityComment.create({
        sharedContentId,
        userId,
        content: content.trim()
      });
      res.json({ comment: toId(comment) });
    } catch (error) {
      console.error("Failed to add comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });
  app.get("/api/community/:id/comments", async (req, res) => {
    try {
      const sharedContentId = req.params.id;
      const comments = await CommunityComment.find({ sharedContentId }).sort({ createdAt: -1 });
      res.json({ comments: comments.map(toId) });
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  app.get("/api/community/my-favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await CommunityFavorite.find({ userId }, "sharedContentId");
      res.json({ favoriteIds: favorites.map((f) => f.sharedContentId.toString()) });
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  app.post("/api/admin/blog", isAdmin, async (req, res) => {
    try {
      const { sharedContentId, title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      const firstUser = await User.findOne();
      const adminId = firstUser?._id;
      const post = await BlogPost.create({
        sharedContentId: sharedContentId || null,
        title,
        content,
        authorId: adminId
      });
      if (sharedContentId) {
        await SharedContent.findByIdAndUpdate(sharedContentId, { blogPostId: post._id });
      }
      res.json({ post: toId(post) });
    } catch (error) {
      console.error("Failed to create blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });
  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await BlogPost.find({ isPublished: true }).sort({ publishedAt: -1 });
      res.json({ posts: posts.map(toId) });
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });
  app.post("/api/admin/blog/:id/publish", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await BlogPost.findById(id);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      const newStatus = !post.isPublished;
      const updated = await BlogPost.findByIdAndUpdate(id, {
        isPublished: newStatus,
        publishedAt: newStatus ? /* @__PURE__ */ new Date() : null
      }, { new: true });
      res.json({ post: toId(updated) });
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      res.status(500).json({ message: "Failed to toggle publish" });
    }
  });
  app.get("/api/studio/artists", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await User.findById(userId);
      if (user?.role !== "studio") {
        return res.status(403).json({ message: "Studio access only" });
      }
      const relations = await StudioArtist.find({ studioId: userId });
      const artistsWithInfo = await Promise.all(relations.map(async (rel) => {
        if (rel.artistId) {
          const artist = await User.findById(rel.artistId);
          const artistProjects = await Project.find({ userId: rel.artistId });
          return {
            id: rel._id.toString(),
            artistId: rel.artistId.toString(),
            inviteEmail: rel.inviteEmail,
            status: rel.status,
            createdAt: rel.createdAt,
            acceptedAt: rel.acceptedAt,
            artistName: artist?.displayName || artist?.email || "Unknown",
            artistEmail: artist?.email,
            projectCount: artistProjects.length
          };
        }
        return {
          id: rel._id.toString(),
          artistId: null,
          inviteEmail: rel.inviteEmail,
          status: rel.status,
          createdAt: rel.createdAt,
          acceptedAt: null,
          artistName: null,
          artistEmail: rel.inviteEmail,
          projectCount: 0
        };
      }));
      res.json({ artists: artistsWithInfo });
    } catch (error) {
      console.error("Failed to fetch artists:", error);
      res.status(500).json({ message: "Failed to fetch artists" });
    }
  });
  app.post("/api/studio/invite", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email } = req.body;
      const user = await User.findById(userId);
      if (user?.role !== "studio") {
        return res.status(403).json({ message: "Studio access only" });
      }
      const existingArtist = await User.findOne({ email });
      if (existingArtist) {
        const existingRelation = await StudioArtist.findOne({
          studioId: userId,
          artistId: existingArtist._id
        });
        if (existingRelation) {
          return res.status(400).json({ message: "Artist already in your roster" });
        }
        await StudioArtist.create({
          studioId: userId,
          artistId: existingArtist._id,
          status: "pending",
          inviteEmail: email
        });
      } else {
        const existingInvite = await StudioArtist.findOne({
          studioId: userId,
          inviteEmail: email
        });
        if (existingInvite) {
          return res.status(400).json({ message: "Invitation already sent" });
        }
        await StudioArtist.create({
          studioId: userId,
          artistId: null,
          status: "pending",
          inviteEmail: email
        });
      }
      res.json({ success: true, message: "Invitation sent" });
    } catch (error) {
      console.error("Failed to invite artist:", error);
      res.status(500).json({ message: "Failed to invite artist" });
    }
  });
  app.get("/api/studio/artists/:artistId/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { artistId } = req.params;
      const user = await User.findById(userId);
      if (user?.role !== "studio") {
        return res.status(403).json({ message: "Studio access only" });
      }
      const relation = await StudioArtist.findOne({
        studioId: userId,
        artistId
      });
      if (!relation || relation.status !== "accepted") {
        return res.status(403).json({ message: "Artist not in your roster" });
      }
      const artistProjects = await Project.find({ userId: artistId }).sort({ updatedAt: -1 });
      res.json({ projects: artistProjects.map(toId) });
    } catch (error) {
      console.error("Failed to fetch artist projects:", error);
      res.status(500).json({ message: "Failed to fetch artist projects" });
    }
  });
  app.post("/api/studio/projects/:projectId/feature", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.params;
      const { featured } = req.body;
      const user = await User.findById(userId);
      if (user?.role !== "studio") {
        return res.status(403).json({ message: "Studio access only" });
      }
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const relation = await StudioArtist.findOne({
        studioId: userId,
        artistId: project.userId
      });
      if (!relation || relation.status !== "accepted") {
        return res.status(403).json({ message: "Artist not in your roster" });
      }
      const updated = await Project.findByIdAndUpdate(projectId, {
        isFeatured: featured
      }, { new: true });
      res.json({ project: toId(updated) });
    } catch (error) {
      console.error("Failed to toggle featured:", error);
      res.status(500).json({ message: "Failed to toggle featured" });
    }
  });
  app.delete("/api/studio/artists/:relationId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { relationId } = req.params;
      const user = await User.findById(userId);
      if (user?.role !== "studio") {
        return res.status(403).json({ message: "Studio access only" });
      }
      await StudioArtist.deleteOne({ _id: relationId, studioId: userId });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove artist:", error);
      res.status(500).json({ message: "Failed to remove artist" });
    }
  });
  app.get("/api/portfolio/:studioId", async (req, res) => {
    try {
      const { studioId } = req.params;
      const studio = await User.findById(studioId);
      if (!studio || studio.role !== "studio") {
        return res.status(404).json({ message: "Studio not found" });
      }
      const relations = await StudioArtist.find({
        studioId,
        status: "accepted"
      });
      const roster = await Promise.all(relations.map(async (rel) => {
        if (!rel.artistId) return null;
        const artist = await User.findById(rel.artistId);
        const artistProjects = await Project.find({ userId: rel.artistId });
        return {
          id: rel.artistId.toString(),
          displayName: artist?.displayName || "Unknown",
          projectCount: artistProjects.length
        };
      }));
      const allFeaturedProjects = [];
      for (const rel of relations) {
        if (!rel.artistId) continue;
        const artistFeatured = await Project.find({
          userId: rel.artistId,
          isFeatured: true
        });
        const artist = await User.findById(rel.artistId);
        for (const proj of artistFeatured) {
          const projObj = toId(proj);
          allFeaturedProjects.push({
            ...projObj,
            artistName: artist?.displayName || "Unknown"
          });
        }
      }
      res.json({
        studio: {
          id: studio._id.toString(),
          businessName: studio.businessName,
          businessBio: studio.businessBio,
          displayName: studio.displayName
        },
        roster: roster.filter((r) => r !== null),
        featuredProjects: allFeaturedProjects
      });
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });
  app.post("/api/studio/invitations/:invitationId/accept", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { invitationId } = req.params;
      const invitation = await StudioArtist.findById(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      const user = await User.findById(userId);
      if (invitation.inviteEmail !== user?.email) {
        return res.status(403).json({ message: "This invitation is not for you" });
      }
      const updated = await StudioArtist.findByIdAndUpdate(invitationId, {
        artistId: userId,
        status: "accepted",
        acceptedAt: /* @__PURE__ */ new Date()
      }, { new: true });
      res.json({ success: true, invitation: toId(updated) });
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });
  app.get("/api/artist/invitations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await User.findById(userId);
      if (!user?.email) {
        return res.json({ invitations: [] });
      }
      const invitations = await StudioArtist.find({
        inviteEmail: user.email,
        status: "pending"
      });
      const invitationsWithStudio = await Promise.all(invitations.map(async (inv) => {
        const studio = await User.findById(inv.studioId);
        return {
          id: inv._id.toString(),
          studioName: studio?.businessName || studio?.displayName || "Unknown Studio",
          createdAt: inv.createdAt
        };
      }));
      res.json({ invitations: invitationsWithStudio });
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });
  app.get("/api/epk", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const epk = await PressKit.findOne({ userId });
      res.json({ epk: epk ? toId(epk) : null });
    } catch (error) {
      console.error("Failed to fetch EPK:", error);
      res.status(500).json({ message: "Failed to fetch EPK" });
    }
  });
  app.post("/api/epk", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const {
        shortBio,
        mediumBio,
        longBio,
        genre,
        location,
        photoUrls,
        videoUrls,
        featuredTracks,
        achievements,
        pressQuotes,
        socialLinks,
        contactEmail,
        contactName,
        bookingEmail,
        technicalRider,
        stagePlot,
        isPublished
      } = req.body;
      const existing = await PressKit.findOne({ userId });
      if (existing) {
        const updated = await PressKit.findByIdAndUpdate(existing._id, {
          shortBio,
          mediumBio,
          longBio,
          genre,
          location,
          photoUrls,
          videoUrls,
          featuredTracks,
          achievements,
          pressQuotes,
          socialLinks,
          contactEmail,
          contactName,
          bookingEmail,
          technicalRider,
          stagePlot,
          isPublished,
          updatedAt: /* @__PURE__ */ new Date()
        }, { new: true });
        res.json({ epk: toId(updated) });
      } else {
        const created = await PressKit.create({
          userId,
          shortBio,
          mediumBio,
          longBio,
          genre,
          location,
          photoUrls,
          videoUrls,
          featuredTracks,
          achievements,
          pressQuotes,
          socialLinks,
          contactEmail,
          contactName,
          bookingEmail,
          technicalRider,
          stagePlot,
          isPublished
        });
        res.json({ epk: toId(created) });
      }
    } catch (error) {
      console.error("Failed to save EPK:", error);
      res.status(500).json({ message: "Failed to save EPK" });
    }
  });
  app.get("/api/epk/:boxCode", async (req, res) => {
    try {
      const { boxCode } = req.params;
      const user = await User.findOne({ boxCode: boxCode.toUpperCase() });
      if (!user) {
        return res.status(404).json({ message: "Artist not found" });
      }
      const epk = await PressKit.findOne({ userId: user._id });
      if (!epk || !epk.isPublished) {
        return res.status(404).json({ message: "Press kit not found or not published" });
      }
      const userProjects = await Project.find({ userId: user._id, status: "published" }).sort({ createdAt: -1 }).limit(10);
      res.json({
        epk: toId(epk),
        artist: {
          id: user._id.toString(),
          displayName: user.displayName,
          profileImageUrl: user.profileImageUrl,
          boxCode: user.boxCode
        },
        projects: userProjects.map(toId)
      });
    } catch (error) {
      console.error("Failed to fetch public EPK:", error);
      res.status(500).json({ message: "Failed to fetch EPK" });
    }
  });
  const possiblePaths = [
    path.resolve(__dirname, "..", "public"),
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "wayfinder_app-v2", "dist", "public")
  ];
  const fs = await import("fs");
  const publicDir = possiblePaths.find((p) => fs.existsSync(path.join(p, "index.html")));
  if (publicDir) {
    console.log(`Serving static files from: ${publicDir}`);
    app.use(express.static(publicDir, { maxAge: "1d" }));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  } else {
    console.log("No static files found, checked:", possiblePaths);
  }
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
main().catch(console.error);
