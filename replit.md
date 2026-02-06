# BOX - Creative Asset Management Platform

## Overview

BOX (by luctheleo.com) is a SaaS platform for independent music artists and studios to manage their creative assets, track projects from concept to publication, and protect their intellectual property. The philosophy: "In order for creators to be seen out of the box, they have to define their own box."

The platform provides tools for:

- **Project Tracking** - Track work from concept through development to published
- **Metadata Management** - Store ISRC, UPC, copyright registration numbers
- **Agreement Generation** - Create and download professional music industry agreements
- **Creative Space** - Private space for inspiration, notes, and media links

The platform uses the REVERIE | RVR Creative Development framework:
- **HTML** = Core identity (the authentic self, purpose, the "why")
- **CSS** = Presentation (visual identity, aesthetics, brand image)
- **JS** = Function (market operation, how work reaches audiences)

## User Preferences

- Preferred communication style: Simple, everyday language
- Capstone requirement: Must use React and OAuth authentication

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query)
- **UI Paradigm**: Terminal/command-line aesthetic with light/dark mode toggle
- **Styling**: Tailwind CSS with PostCSS, CSS variables for theme switching
- **Fonts**: LEDLIGHT (brand name "BOX"), Chicago (body text), fallback to JetBrains Mono
- **Theme System**: ThemeContext with localStorage persistence, CSS variables (--bg-primary, --text-primary, etc.)
- **Logo**: box-logo.png (checkered perspective box), ltl-logo.png (LTL monogram), favicon.png
- **Location**: `/wayfinder_app-v2/client/src/` directory

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **ODM**: Mongoose for MongoDB access
- **Database**: MongoDB (Atlas) with connect-mongo session storage
- **Stack**: MERN (MongoDB, Express, React, Node.js)
- **Authentication**: Google OAuth + GitHub OAuth + Email/Password (Replit Auth kept as fallback)
- **Entry Point**: `server/index.ts`
- **API Port**: 3000 (proxied through Vite on 5000)

### User Roles
- **Artist** - Individual artists managing their own projects, creative space, and agreements
- **Studio** - Business accounts that manage artist rosters, curate portfolios, and feature client work

### Database Schema (Mongoose/MongoDB)
- **users** - User accounts (_id, email, passwordHash, displayName, firstName, lastName, profileImageUrl, role, businessName, businessBio, boxCode, emailVerified, verificationToken, verificationTokenExpires, githubId, googleId)
- **sessions** - Express session storage for auth persistence
- **projects** - Creative works with title, type, status, description, metadata (JSONB), isFeatured
- **studio_artists** - Studio-artist relationships (studioId, artistId, status, inviteEmail, acceptedAt)
- **creative_notes** - Private notes with category, content, mediaUrl, tags, isPinned, sortOrder
- **shared_content** - Community sharing submissions (noteId, userId, status, adminNotes, approvedAt)
- **community_favorites** - User favorites on shared content
- **community_comments** - User comments on shared content
- **blog_posts** - Admin blog posts created from shared content
- **press_kits** - Electronic Press Kits with bios, photos, videos, achievements, contacts, technical rider

### API Structure

**Authentication (Google OAuth + GitHub OAuth + Email/Password):**
- `GET /api/auth/google` - Redirect to Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback handler
- `GET /api/auth/github` - Redirect to GitHub OAuth login
- `GET /api/auth/github/callback` - GitHub OAuth callback handler
- `GET /api/login` - Redirect to Replit OAuth login (fallback)
- `GET /api/callback` - Replit OAuth callback handler (fallback)
- `GET /api/logout` - End session
- `GET /api/auth/user` - Get current authenticated user
- `POST /api/auth/register` - Email/password registration (sends verification email)
- `POST /api/auth/login` - Email/password login (requires verified email)
- `GET /api/auth/verify` - Email verification endpoint
- `POST /api/auth/resend-verification` - Resend verification email

**Projects:**
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

**Creative Notes:**
- `GET /api/creative/notes` - List user's notes
- `POST /api/creative/notes` - Create new note
- `PUT /api/creative/notes/:id` - Update note
- `DELETE /api/creative/notes/:id` - Delete note
- `POST /api/creative/notes/:id/pin` - Toggle pin status
- `POST /api/creative/notes/reorder` - Reorder notes (drag and drop)

**Community Sharing:**
- `POST /api/community/submit` - Submit note for community sharing
- `GET /api/community/my-submissions` - Get user's submission status
- `GET /api/community` - Get all approved shared content (public)
- `POST /api/community/:id/favorite` - Toggle favorite on shared content
- `POST /api/community/:id/comment` - Add comment to shared content
- `GET /api/community/:id/comments` - Get comments for shared content

**Admin:**
- `GET /api/admin/submissions` - Get all community submissions
- `POST /api/admin/submissions/:id/review` - Approve/reject submission
- `POST /api/admin/blog` - Create blog post from shared content
- `GET /api/blog` - Get published blog posts

**Electronic Press Kit (EPK):**
- `GET /api/epk` - Get current user's EPK
- `POST /api/epk` - Create or update user's EPK
- `GET /api/epk/:boxCode` - Get public EPK by BOX code

**Studio (role: studio):**
- `GET /api/studio/artists` - Get studio's artist roster
- `POST /api/studio/invite` - Invite artist by email
- `GET /api/studio/artists/:artistId/projects` - Get artist's projects
- `POST /api/studio/projects/:projectId/feature` - Toggle project featured status
- `DELETE /api/studio/artists/:relationId` - Remove artist from roster
- `GET /api/portfolio/:studioId` - Get public studio portfolio
- `GET /api/artist/invitations` - Get pending studio invitations (for artists)
- `POST /api/studio/invitations/:invitationId/accept` - Accept studio invitation

### Project Status Workflow
1. **Concept** - Initial idea stage
2. **Development** - Active work in progress
3. **Review** - Ready for review/approval
4. **Published** - Released and monetizable

### React Pages
- `/` - Landing page (unauthenticated) or Dashboard (authenticated)
- `/creative` - Creative Space for notes and inspiration
- `/project/:id` - Project details with IP protection workflow
- `/generator` - Agreement generator
- `/settings` - User settings with password change and display name editing
- `/community` - Public community page showing approved shared content
- `/admin` - Admin panel for reviewing submissions and managing users
- `/studio` - Studio Dashboard for managing artist roster and curating portfolio
- `/portfolio/:id` - Public studio portfolio page showing roster and featured work
- `/docs` - Documentation for copyrights, global identifiers, PROs, and IP workflow
- `/epk` - EPK Editor for creating professional press kits
- `/epk/:boxCode` - Public EPK view accessible via BOX code

### IP Protection Workflow (6 Steps)
1. **Fix Your Work** - Record/document in tangible form (FREE)
2. **Register Copyright** - File with US Copyright Office ($45-65)
3. **Join a PRO** - BMI (free) or ASCAP membership (FREE-$50)
4. **Register Composition** - Get ISWC from PRO (FREE)
5. **Upload to Distributor** - Get ISRC/UPC codes ($0-30/yr)
6. **Release & Monitor** - Track streams and royalties

### Agreement Generator
- **5 Agreement Types**: Split sheets, basic license, premium license, production agreement, NDA
- **3-Step Flow**: Select agreement type → Fill in details → View/Download

## External Dependencies

### Runtime Dependencies
- **@tanstack/react-query** - Server state management
- **bcryptjs** - Password hashing
- **connect-mongo** - MongoDB session store
- **mongoose** - MongoDB ODM
- **express** - Web server framework
- **express-session** - Session management
- **openid-client** - OIDC authentication
- **passport** - Authentication middleware
- **passport-github2** - GitHub OAuth strategy
- **react/react-dom** - UI framework
- **resend** - Email sending for verification
- **wouter** - React routing

### Dev Dependencies
- **@vitejs/plugin-react** - React plugin for Vite
- **concurrently** - Run multiple commands
- **tailwindcss/autoprefixer/postcss** - CSS processing
- **tsx** - TypeScript execution
- **typescript** - Type checking
- **vite** - Build tool

### Environment Variables Required
- `MONGODB_URI` - MongoDB connection string (MongoDB Atlas)
- `SESSION_SECRET` - Auto-generated session secret
- `REPL_ID` - Replit app ID (auto-configured for OAuth fallback)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (from Google Cloud Console)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (from Google Cloud Console)
- `GOOGLE_CALLBACK_URL` - Google OAuth callback URL (auto-detected, optional override)
- `GITHUB_CLIENT_ID` - GitHub OAuth app client ID (optional)
- `GITHUB_CLIENT_SECRET` - GitHub OAuth app client secret (optional)
- `GITHUB_CALLBACK_URL` - GitHub OAuth callback URL (optional)

## Recent Changes

- **Replaced Replit Auth with Google OAuth** - Landing page now shows "Continue with Google" and "Continue with GitHub" buttons instead of Replit OAuth, so users don't need a Replit account
- **Added Google OAuth** - passport-google-oauth20 strategy for Google Sign-In, with googleId field on User model

- **Migrated from PostgreSQL to MongoDB** - Full MERN stack: Mongoose ODM replaces Drizzle ORM, connect-mongo for sessions, MongoDB Atlas for data storage
- **Added GitHub OAuth** - passport-github2 strategy for portable authentication outside Replit
- **Interactive IP Protection Workflow** - Click steps to expand, enter data (copyright #, ISRC, UPC, etc.), mark complete
- **Search bar with guided hints** - Shows suggestions ("docs", "agreements", "community") when focused
- **Simplified navigation** - Premium minimal header with search-based discovery
- **Fixed logout flow** - Clean local session destroy instead of OIDC redirect that caused errors
- **Added Electronic Press Kit (EPK) system** - Full EPK editor with biography (3 lengths), photos, videos, featured tracks, achievements, press quotes, contact info, technical rider, and stage plot
- **EPK public view** - Professional shareable page accessible via /epk/:boxCode
- **Added Submission File Generator** - Export project data in CSV formats for The MLC, ASCAP/BMI, Music Reports, SoundExchange, and Harry Fox Agency
- **Added BOX Code system** - Unique identifiers (BOX-XXXXXX) for users and studios to share and connect
- **Studio code joining** - Artists can enter a studio's BOX code during registration to auto-join their network
- **BOX code display** - Settings page shows user's code; Studio Dashboard prominently displays studio code
- **Added role-based user system** - Artists and Studios with different dashboards and features
- **Added Studio Dashboard** - Manage artist roster, invite artists, curate portfolio
- **Added Portfolio page** - Public business portfolio showing roster and featured work
- **Added Docs page** - Comprehensive documentation for copyrights, PROs, identifiers, and IP workflow
- **Added progress bar** - Visual progress tracking for IP protection workflow on project details
- **Added responsive Header component** - Hamburger menu for mobile, role-based navigation
- **Added Settings page** with password change for email/password users
- **Added Community sharing system** - Users can share notes for admin approval, then visible to public with favorites and comments
- **Added Admin submissions tab** - Review pending submissions, approve/reject
- **Added Community page** - Public view of approved shared content with favorites/comments
- **Improved drag-and-drop** - Notes can be reordered with immediate visual feedback
- **Improved pin functionality** - Text-based pin/unpin button for better reliability
- **Fixed light mode text colors** - Tailwind config now uses CSS variables for theme-aware colors
- **Rebranded to "BOX"** from WayfinderOS with luctheleo.com domain
- **Added Chicago custom font** - Replaced JetBrains Mono with Chicago TTF font
- **New logos** - box-logo.png, ltl-logo.png, favicon.png
- **Added email verification system** using Resend integration (24-hour token expiry)
- **Dual authentication** - OAuth via Replit Auth + email/password with verification
- **Converted to React + TypeScript architecture** (capstone requirement)
- **Implemented Replit Auth for OAuth** (Google, GitHub, Apple, email login)
- **Set up Drizzle ORM** with PostgreSQL for type-safe database access
- **Created React pages**: Landing, Dashboard, CreativeSpace, ProjectDetails, Generator, Admin, Settings, Community
- **Configured Vite** with proxy to backend API
- **Terminal aesthetic** preserved with dark theme and accent colors
