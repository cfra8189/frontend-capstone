Render deployment checklist for The Box

1) Frontend (Static Site)
  - In Render dashboard, create a new **Static Site**.
  - Link your Git repo and set the root directory to `frontend`.
  - Build Command: `npm ci && npm run build`.
  - Publish Directory: `dist`.
  - Add an environment variable `VITE_BACKEND_URL` and set it to your backend URL (e.g. `https://thebox-backend.onrender.com`).

2) Backend (Web Service)
  - Create a **Web Service** in Render.
  - Root directory: `backend`.
  - Environment: Node.
  - Build Command: `npm ci && npm run build`.
  - Start Command: `npm run start`.
  - Set Node version to 18+ if available.
  - Add the required environment variables (secure values):
    - `MONGODB_URI` (use MongoDB Atlas)
    - `SESSION_SECRET`
    - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` (if using Google OAuth)
    - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` (if using GitHub OAuth)
    - `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR` (if using object storage)
    - `PLATFORM_CONNECTORS_HOSTNAME`, `PLATFORM_IDENTITY`, `PLATFORM_WEB_RENEWAL` (only if you intend to use the platform connector flow)

3) Email sending (important)
  - Current code expects a platform connector and will call a connector host to fetch Resend credentials. For Render deployment, you should either:
    - Provide platform connector endpoints/tokens (advanced), OR
    - Modify `backend/lib/email.ts` to use a `RESEND_API_KEY` env var directly and initialize `new Resend(RESEND_API_KEY)`. (Recommended.)

4) Object storage
  - The object storage code uses a local platform sidecar by default. For Render, provide direct Google Cloud Storage credentials and adapt `objectStorageClient` initialization or implement signing via your own service.

5) OAuth callback URLs
  - Register your backend's Render domain for OAuth callback URLs in Google and GitHub developer consoles. Example callback: `https://<your-backend>.onrender.com/api/auth/google/callback`.

6) CORS & cookies
  - If frontend and backend are on separate domains, configure CORS and session cookie settings to allow cross-site cookies if needed. Ensure `SESSION_SECRET` is set and secure cookies are configured in production.

7) DNS and custom domains (optional)
  - Add custom domains in Render for both frontend and backend if desired. Update OAuth callback URLs and `VITE_BACKEND_URL` accordingly.

8) Deploy and verify
  - Deploy backend first, copy its public URL, set `VITE_BACKEND_URL` in the frontend static site, then deploy frontend.
  - Test signup, login, email verification, file uploads (if used), and OAuth flows.

9) Suggested follow-ups (I can do these for you):
  - Patch `backend/lib/email.ts` to accept `RESEND_API_KEY` directly so emails work on Render without the platform connector.
  - Add a small `render.yaml` based on the template and commit it.
  - Help setting up MongoDB Atlas and filling in env vars on Render.
