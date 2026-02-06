import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

type Tab = "routes" | "erd";

export default function CapstoneDoc() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("routes");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    auth: true,
    projects: true,
    notes: true,
    community: true,
    admin: true,
    studio: true,
    epk: true,
    uploads: true,
    blog: true,
  });

  function toggleGroup(group: string) {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  }

  const routeGroups = [
    {
      id: "auth",
      label: "Authentication",
      description: "Google OAuth, email/password login, registration, verification",
      routes: [
        { method: "GET", path: "/api/auth/google", desc: "Redirect to Google OAuth", auth: false },
        { method: "GET", path: "/api/auth/google/callback", desc: "Google OAuth callback handler", auth: false },
        { method: "POST", path: "/api/auth/register", desc: "Register new user (email/password)", auth: false },
        { method: "POST", path: "/api/auth/login", desc: "Login with email/password", auth: false },
        { method: "GET", path: "/api/auth/verify", desc: "Verify email address via token", auth: false },
        { method: "POST", path: "/api/auth/resend-verification", desc: "Resend verification email", auth: false },
        { method: "GET", path: "/api/auth/user", desc: "Get current authenticated user", auth: true },
        { method: "POST", path: "/api/auth/change-password", desc: "Change user password", auth: true },
        { method: "POST", path: "/api/auth/update-profile", desc: "Update display name / profile", auth: true },
        { method: "GET", path: "/api/logout", desc: "End session and logout", auth: false },
      ],
    },
    {
      id: "projects",
      label: "Projects",
      description: "CRUD operations for creative projects (tracks, albums, EPs)",
      routes: [
        { method: "GET", path: "/api/projects", desc: "List all user projects", auth: true },
        { method: "POST", path: "/api/projects", desc: "Create a new project", auth: true },
        { method: "GET", path: "/api/projects/:id", desc: "Get project details by ID", auth: true },
        { method: "PUT", path: "/api/projects/:id", desc: "Update a project", auth: true },
        { method: "DELETE", path: "/api/projects/:id", desc: "Delete a project", auth: true },
      ],
    },
    {
      id: "notes",
      label: "Creative Notes",
      description: "Private notes for inspiration, ideas, and media links",
      routes: [
        { method: "GET", path: "/api/creative/notes", desc: "List all user notes", auth: true },
        { method: "POST", path: "/api/creative/notes", desc: "Create a new note", auth: true },
        { method: "PUT", path: "/api/creative/notes/:id", desc: "Update a note", auth: true },
        { method: "DELETE", path: "/api/creative/notes/:id", desc: "Delete a note", auth: true },
        { method: "POST", path: "/api/creative/notes/:id/pin", desc: "Toggle pin status", auth: true },
        { method: "POST", path: "/api/creative/notes/reorder", desc: "Reorder notes (drag & drop)", auth: true },
      ],
    },
    {
      id: "community",
      label: "Community",
      description: "Share notes publicly, favorites, and comments",
      routes: [
        { method: "POST", path: "/api/community/submit", desc: "Submit note for community sharing", auth: true },
        { method: "GET", path: "/api/community/my-submissions", desc: "Get user's submission status", auth: true },
        { method: "GET", path: "/api/community", desc: "Get all approved shared content", auth: false },
        { method: "POST", path: "/api/community/:id/favorite", desc: "Toggle favorite on content", auth: true },
        { method: "POST", path: "/api/community/:id/comment", desc: "Add comment to content", auth: true },
        { method: "GET", path: "/api/community/:id/comments", desc: "Get comments for content", auth: false },
        { method: "GET", path: "/api/community/my-favorites", desc: "Get user's favorited items", auth: true },
      ],
    },
    {
      id: "admin",
      label: "Admin",
      description: "Admin panel for managing users, submissions, and blog posts",
      routes: [
        { method: "POST", path: "/api/admin/login", desc: "Admin login (password)", auth: false },
        { method: "POST", path: "/api/admin/logout", desc: "Admin logout", auth: false },
        { method: "GET", path: "/api/admin/check", desc: "Check admin session", auth: false },
        { method: "GET", path: "/api/admin/users", desc: "Get all users", auth: true },
        { method: "GET", path: "/api/admin/projects", desc: "Get all projects", auth: true },
        { method: "GET", path: "/api/admin/stats", desc: "Get system statistics", auth: true },
        { method: "GET", path: "/api/admin/submissions", desc: "Get community submissions", auth: true },
        { method: "POST", path: "/api/admin/submissions/:id/review", desc: "Approve/reject submission", auth: true },
        { method: "POST", path: "/api/admin/blog", desc: "Create blog post", auth: true },
        { method: "POST", path: "/api/admin/blog/:id/publish", desc: "Toggle blog publish status", auth: true },
      ],
    },
    {
      id: "blog",
      label: "Blog",
      description: "Public blog posts created from community content",
      routes: [
        { method: "GET", path: "/api/blog", desc: "Get published blog posts", auth: false },
      ],
    },
    {
      id: "studio",
      label: "Studio",
      description: "Studio management - artist roster, invitations, portfolio",
      routes: [
        { method: "GET", path: "/api/studio/artists", desc: "Get studio's artist roster", auth: true },
        { method: "POST", path: "/api/studio/invite", desc: "Invite artist by email", auth: true },
        { method: "GET", path: "/api/studio/artists/:artistId/projects", desc: "Get artist's projects", auth: true },
        { method: "POST", path: "/api/studio/projects/:projectId/feature", desc: "Toggle project featured", auth: true },
        { method: "DELETE", path: "/api/studio/artists/:relationId", desc: "Remove artist from roster", auth: true },
        { method: "GET", path: "/api/portfolio/:studioId", desc: "Get public studio portfolio", auth: false },
        { method: "POST", path: "/api/studio/invitations/:invitationId/accept", desc: "Accept studio invitation", auth: true },
        { method: "GET", path: "/api/artist/invitations", desc: "Get pending invitations", auth: true },
      ],
    },
    {
      id: "epk",
      label: "Electronic Press Kit (EPK)",
      description: "Create and share professional press kits",
      routes: [
        { method: "GET", path: "/api/epk", desc: "Get current user's EPK", auth: true },
        { method: "POST", path: "/api/epk", desc: "Create or update EPK", auth: true },
        { method: "GET", path: "/api/epk/:boxCode", desc: "Get public EPK by BOX code", auth: false },
      ],
    },
    {
      id: "uploads",
      label: "File Uploads",
      description: "Object storage for media files",
      routes: [
        { method: "POST", path: "/api/uploads/request-url", desc: "Get presigned upload URL", auth: true },
        { method: "GET", path: "/objects/:objectPath(*)", desc: "Serve uploaded files", auth: false },
      ],
    },
  ];

  const methodColors: Record<string, string> = {
    GET: "bg-green-600",
    POST: "bg-blue-600",
    PUT: "bg-yellow-600",
    DELETE: "bg-red-600",
  };

  const erdCollections = [
    {
      name: "Users",
      color: "#3b82f6",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK" },
        { name: "email", type: "String", key: "UQ" },
        { name: "passwordHash", type: "String", key: "" },
        { name: "displayName", type: "String", key: "" },
        { name: "firstName", type: "String", key: "" },
        { name: "lastName", type: "String", key: "" },
        { name: "profileImageUrl", type: "String", key: "" },
        { name: "role", type: "String", key: "" },
        { name: "businessName", type: "String", key: "" },
        { name: "businessBio", type: "String", key: "" },
        { name: "boxCode", type: "String", key: "UQ" },
        { name: "emailVerified", type: "Boolean", key: "" },
        { name: "verificationToken", type: "String", key: "" },
        { name: "verificationTokenExpires", type: "Date", key: "" },
        { name: "googleId", type: "String", key: "" },
        { name: "githubId", type: "String", key: "" },
        { name: "createdAt", type: "Date", key: "" },
        { name: "updatedAt", type: "Date", key: "" },
      ],
    },
    {
      name: "Projects",
      color: "#10b981",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK" },
        { name: "userId", type: "ObjectId", key: "FK -> Users" },
        { name: "title", type: "String", key: "" },
        { name: "type", type: "String", key: "" },
        { name: "status", type: "String", key: "" },
        { name: "description", type: "String", key: "" },
        { name: "metadata", type: "Mixed (JSON)", key: "" },
        { name: "isFeatured", type: "Boolean", key: "" },
        { name: "createdAt", type: "Date", key: "" },
        { name: "updatedAt", type: "Date", key: "" },
      ],
    },
    {
      name: "CreativeNotes",
      color: "#f59e0b",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK" },
        { name: "userId", type: "ObjectId", key: "FK -> Users" },
        { name: "category", type: "String", key: "" },
        { name: "title", type: "String", key: "" },
        { name: "content", type: "String", key: "" },
        { name: "mediaUrls", type: "String[]", key: "" },
        { name: "tags", type: "String[]", key: "" },
        { name: "isPinned", type: "Boolean", key: "" },
        { name: "sortOrder", type: "Number", key: "" },
        { name: "createdAt", type: "Date", key: "" },
        { name: "updatedAt", type: "Date", key: "" },
      ],
    },
    {
      name: "SharedContent",
      color: "#8b5cf6",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK" },
        { name: "noteId", type: "ObjectId", key: "FK -> CreativeNotes" },
        { name: "userId", type: "ObjectId", key: "FK -> Users" },
        { name: "status", type: "String", key: "" },
        { name: "adminNotes", type: "String", key: "" },
        { name: "blogPostId", type: "ObjectId", key: "FK -> BlogPosts" },
        { name: "approvedAt", type: "Date", key: "" },
        { name: "createdAt", type: "Date", key: "" },
      ],
    },
    {
      name: "CommunityFavorites",
      color: "#ec4899",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK" },
        { name: "sharedContentId", type: "ObjectId", key: "FK -> SharedContent" },
        { name: "userId", type: "ObjectId", key: "FK -> Users" },
        { name: "createdAt", type: "Date", key: "" },
      ],
    },
    {
      name: "CommunityComments",
      color: "#ef4444",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK" },
        { name: "sharedContentId", type: "ObjectId", key: "FK -> SharedContent" },
        { name: "userId", type: "ObjectId", key: "FK -> Users" },
        { name: "content", type: "String", key: "" },
        { name: "createdAt", type: "Date", key: "" },
      ],
    },
    {
      name: "BlogPosts",
      color: "#06b6d4",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK" },
        { name: "sharedContentId", type: "ObjectId", key: "FK -> SharedContent" },
        { name: "title", type: "String", key: "" },
        { name: "content", type: "String", key: "" },
        { name: "authorId", type: "ObjectId", key: "FK -> Users" },
        { name: "isPublished", type: "Boolean", key: "" },
        { name: "publishedAt", type: "Date", key: "" },
        { name: "createdAt", type: "Date", key: "" },
      ],
    },
    {
      name: "StudioArtists",
      color: "#f97316",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK" },
        { name: "studioId", type: "ObjectId", key: "FK -> Users" },
        { name: "artistId", type: "ObjectId", key: "FK -> Users" },
        { name: "status", type: "String", key: "" },
        { name: "inviteEmail", type: "String", key: "" },
        { name: "acceptedAt", type: "Date", key: "" },
        { name: "createdAt", type: "Date", key: "" },
      ],
    },
    {
      name: "Sessions",
      color: "#64748b",
      fields: [
        { name: "_id", type: "String", key: "PK" },
        { name: "expires", type: "Date", key: "" },
        { name: "session", type: "Mixed (JSON)", key: "" },
      ],
    },
    {
      name: "PressKits",
      color: "#84cc16",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK" },
        { name: "userId", type: "ObjectId", key: "FK -> Users (unique)" },
        { name: "shortBio", type: "String", key: "" },
        { name: "mediumBio", type: "String", key: "" },
        { name: "longBio", type: "String", key: "" },
        { name: "genre", type: "String", key: "" },
        { name: "location", type: "String", key: "" },
        { name: "photoUrls", type: "String[]", key: "" },
        { name: "videoUrls", type: "String[]", key: "" },
        { name: "featuredTracks", type: "Mixed[]", key: "" },
        { name: "achievements", type: "Mixed[]", key: "" },
        { name: "pressQuotes", type: "Mixed[]", key: "" },
        { name: "socialLinks", type: "Mixed", key: "" },
        { name: "contactEmail", type: "String", key: "" },
        { name: "contactName", type: "String", key: "" },
        { name: "bookingEmail", type: "String", key: "" },
        { name: "technicalRider", type: "String", key: "" },
        { name: "stagePlot", type: "String", key: "" },
        { name: "isPublished", type: "Boolean", key: "" },
        { name: "createdAt", type: "Date", key: "" },
        { name: "updatedAt", type: "Date", key: "" },
      ],
    },
  ];

  const relationships = [
    { from: "Users", to: "Projects", label: "1 : N", desc: "User owns many Projects" },
    { from: "Users", to: "CreativeNotes", label: "1 : N", desc: "User owns many Notes" },
    { from: "Users", to: "PressKits", label: "1 : 1", desc: "User has one Press Kit" },
    { from: "Users", to: "StudioArtists", label: "1 : N", desc: "Studio has many Artist relationships" },
    { from: "CreativeNotes", to: "SharedContent", label: "1 : 1", desc: "Note can be shared once" },
    { from: "Users", to: "SharedContent", label: "1 : N", desc: "User submits content" },
    { from: "SharedContent", to: "CommunityFavorites", label: "1 : N", desc: "Content has many Favorites" },
    { from: "SharedContent", to: "CommunityComments", label: "1 : N", desc: "Content has many Comments" },
    { from: "SharedContent", to: "BlogPosts", label: "1 : 1", desc: "Content becomes Blog Post" },
    { from: "Users", to: "BlogPosts", label: "1 : N", desc: "Admin authors Blog Posts" },
    { from: "Users", to: "CommunityFavorites", label: "1 : N", desc: "User has many Favorites" },
    { from: "Users", to: "CommunityComments", label: "1 : N", desc: "User has many Comments" },
  ];

  const totalRoutes = routeGroups.reduce((sum, g) => sum + g.routes.length, 0);

  return (
    <div className="min-h-screen bg-theme-primary text-theme-primary">
      <div className="border-b border-theme p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/box-logo.png" alt="BOX" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold">BOX - Capstone Documentation</h1>
              <p className="text-xs text-theme-muted">Backend Route Tree & Entity Relationship Diagram</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="text-theme-muted hover:text-theme-primary text-xs font-mono transition-colors"
            >
              [{theme}]
            </button>
            <a href="/" className="text-xs text-accent hover:underline">Back to App</a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex gap-2 mb-6 border-b border-theme">
          <button
            onClick={() => setActiveTab("routes")}
            className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 ${
              activeTab === "routes"
                ? "border-accent text-accent"
                : "border-transparent text-theme-muted hover:text-theme-primary"
            }`}
          >
            Backend Route Tree
          </button>
          <button
            onClick={() => setActiveTab("erd")}
            className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 ${
              activeTab === "erd"
                ? "border-accent text-accent"
                : "border-transparent text-theme-muted hover:text-theme-primary"
            }`}
          >
            Entity Relationship Diagram
          </button>
        </div>

        {activeTab === "routes" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Backend Route Tree</h2>
              <p className="text-sm text-theme-secondary mb-3">
                Express.js REST API running on port 3000, proxied through Vite on port 5000.
                Most routes prefixed with <code className="bg-theme-tertiary px-1 rounded">/api</code>. Object storage served at <code className="bg-theme-tertiary px-1 rounded">/objects</code>.
              </p>
              <div className="flex gap-4 text-xs text-theme-muted flex-wrap">
                <span>{routeGroups.length} route groups</span>
                <span>{totalRoutes} total endpoints</span>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-600 inline-block" /> GET</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-600 inline-block" /> POST</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-600 inline-block" /> PUT</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-600 inline-block" /> DELETE</span>
                </div>
              </div>
            </div>

            <div className="font-mono text-sm">
              <div className="p-3 bg-theme-secondary rounded-t-lg border border-theme">
                <span className="text-accent font-bold">EXPRESS APP</span>
                <span className="text-theme-muted ml-2">server/index.ts</span>
              </div>

              {routeGroups.map((group, gi) => (
                <div key={group.id} className={`border-x border-theme ${gi === routeGroups.length - 1 ? "border-b rounded-b-lg" : ""}`}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full text-left p-3 flex items-center gap-2 hover:bg-theme-secondary transition-colors border-b border-theme"
                  >
                    <span className="text-theme-muted w-4 text-center">
                      {expandedGroups[group.id] ? "v" : ">"}
                    </span>
                    <span className="text-accent font-bold">/api/{group.id === "blog" ? "blog" : group.id === "uploads" ? "uploads" : group.id}</span>
                    <span className="text-theme-muted text-xs ml-2">
                      {group.label} ({group.routes.length} routes)
                    </span>
                  </button>

                  {expandedGroups[group.id] && (
                    <div className="bg-theme-primary">
                      <div className="px-4 py-2 text-xs text-theme-muted border-b border-theme bg-theme-secondary/50">
                        {group.description}
                      </div>
                      {group.routes.map((route, ri) => (
                        <div
                          key={ri}
                          className="flex items-start gap-3 px-4 py-2 border-b border-theme/50 last:border-b-0 hover:bg-theme-secondary/30"
                        >
                          <span className="text-theme-muted w-6 flex-shrink-0 pt-0.5">
                            {ri === group.routes.length - 1 ? "└─" : "├─"}
                          </span>
                          <span className={`${methodColors[route.method]} text-white text-xs px-2 py-0.5 rounded font-bold w-16 text-center flex-shrink-0`}>
                            {route.method}
                          </span>
                          <span className="text-theme-primary flex-1 break-all">{route.path}</span>
                          <span className="text-theme-muted text-xs flex-shrink-0 hidden sm:block max-w-48">{route.desc}</span>
                          {route.auth && (
                            <span className="text-yellow-500 text-xs flex-shrink-0" title="Requires authentication">🔒</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-theme-secondary rounded-lg border border-theme">
              <h3 className="font-bold text-sm mb-2">Middleware Stack</h3>
              <div className="font-mono text-xs space-y-1 text-theme-secondary">
                <p>1. express.json() - Parse JSON request bodies</p>
                <p>2. express-session + connect-mongo - Session management (MongoDB store)</p>
                <p>3. passport.initialize() + passport.session() - Authentication</p>
                <p>4. isAuthenticated - Route-level auth guard (checks session + token expiry)</p>
                <p>5. isAdmin - Admin-only route guard (checks session.isAdmin)</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-theme-secondary rounded-lg border border-theme">
              <h3 className="font-bold text-sm mb-2">Authentication Flow</h3>
              <div className="font-mono text-xs space-y-1 text-theme-secondary">
                <p>Google OAuth: Client {"->"} /api/auth/google {"->"} Google Consent {"->"} /api/auth/google/callback {"->"} Create/Find User {"->"} Set Session {"->"} Redirect /</p>
                <p>Email/Pass: Client {"->"} POST /api/auth/register {"->"} Hash Password {"->"} Send Verification Email {"->"} GET /api/auth/verify?token=... {"->"} Activate Account</p>
                <p>Login: Client {"->"} POST /api/auth/login {"->"} Verify Email + Password {"->"} Set Session {"->"} Return User</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "erd" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Entity Relationship Diagram</h2>
              <p className="text-sm text-theme-secondary mb-1">
                MongoDB (Atlas) with Mongoose ODM. 10 collections with referential relationships.
              </p>
              <p className="text-xs text-theme-muted">
                PK = Primary Key | FK = Foreign Key | UQ = Unique Constraint
              </p>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-sm mb-3 text-accent">Relationships</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {relationships.map((rel, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 bg-theme-secondary rounded border border-theme">
                    <span className="font-bold text-theme-primary">{rel.from}</span>
                    <span className="text-accent font-mono">{rel.label}</span>
                    <span className="font-bold text-theme-primary">{rel.to}</span>
                    <span className="text-theme-muted ml-auto hidden sm:block">{rel.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {erdCollections.map((collection) => (
                <div key={collection.name} className="border border-theme rounded-lg overflow-hidden">
                  <div
                    className="px-3 py-2 font-bold text-sm text-white"
                    style={{ backgroundColor: collection.color }}
                  >
                    {collection.name}
                  </div>
                  <div className="divide-y divide-theme/50">
                    {collection.fields.map((field, fi) => (
                      <div
                        key={fi}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs ${
                          field.key ? "bg-theme-secondary" : "bg-theme-primary"
                        }`}
                      >
                        <span className="font-mono text-theme-primary flex-1">{field.name}</span>
                        <span className="text-theme-muted">{field.type}</span>
                        {field.key && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            field.key === "PK" 
                              ? "bg-yellow-500/20 text-yellow-500" 
                              : field.key === "UQ"
                                ? "bg-purple-500/20 text-purple-500"
                                : "bg-blue-500/20 text-blue-500"
                          }`}>
                            {field.key}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-theme-secondary rounded-lg border border-theme">
              <h3 className="font-bold text-sm mb-3">Data Flow Summary</h3>
              <div className="font-mono text-xs space-y-3 text-theme-secondary">
                <div>
                  <p className="text-accent font-bold mb-1">User Registration & Auth Flow:</p>
                  <p>New User {"->"} Users collection (email, passwordHash or googleId) {"->"} Sessions collection (express-session)</p>
                </div>
                <div>
                  <p className="text-accent font-bold mb-1">Project Management Flow:</p>
                  <p>User {"->"} Creates Projects (userId FK) {"->"} Tracks status: concept {"->"} development {"->"} review {"->"} published</p>
                  <p>Project.metadata stores: ISRC, UPC, copyright #, PRO registration, distributor info</p>
                </div>
                <div>
                  <p className="text-accent font-bold mb-1">Creative & Community Flow:</p>
                  <p>User {"->"} CreativeNotes (private) {"->"} SharedContent (submit for review) {"->"} Admin approves {"->"} Public community</p>
                  <p>SharedContent {"->"} CommunityFavorites + CommunityComments (user engagement)</p>
                  <p>SharedContent {"->"} BlogPosts (admin curates into blog)</p>
                </div>
                <div>
                  <p className="text-accent font-bold mb-1">Studio & Portfolio Flow:</p>
                  <p>Studio User {"->"} StudioArtists (invite by email) {"->"} Artist accepts {"->"} Studio views artist Projects</p>
                  <p>Studio User {"->"} Toggle isFeatured on artist Projects {"->"} Public Portfolio page</p>
                </div>
                <div>
                  <p className="text-accent font-bold mb-1">EPK Flow:</p>
                  <p>User {"->"} PressKits (1:1, unique userId) {"->"} Public view via /epk/:boxCode</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-theme text-center text-xs text-theme-muted">
          <p>BOX by luctheleo.com | MERN Stack (MongoDB, Express, React, Node.js) | Capstone Project Documentation</p>
        </div>
      </div>
    </div>
  );
}
