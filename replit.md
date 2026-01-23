# WayfinderOS - Creative Asset Management Platform

## Overview

WayfinderOS is a SaaS platform for independent music artists and studios to manage their creative assets, track projects from concept to publication, and protect their intellectual property. The platform provides tools for:

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
- **UI Paradigm**: Terminal/command-line aesthetic with dark theme
- **Styling**: Tailwind CSS with PostCSS, custom accent color (#c3f53c green)
- **Font**: JetBrains Mono for terminal aesthetic
- **Location**: `/wayfinder_app-v2/client/src/` directory

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **ORM**: Drizzle ORM for type-safe database access
- **Database**: PostgreSQL with session storage
- **Authentication**: Replit Auth (OAuth via OIDC - Google, GitHub, Apple, email)
- **Entry Point**: `server/index.ts`
- **API Port**: 3000 (proxied through Vite on 5000)

### User Roles
- **Creator** - Individual artists managing their own projects

### Database Schema (Drizzle ORM)
- **users** - OAuth user accounts (id, email, firstName, lastName, profileImageUrl, role)
- **sessions** - Express session storage for auth persistence
- **projects** - Creative works with title, type, status, description, metadata (JSONB)
- **creative_notes** - Private notes with category, content, mediaUrl, tags, isPinned

### API Structure

**Authentication (Replit Auth):**
- `GET /api/login` - Redirect to OAuth login
- `GET /api/callback` - OAuth callback handler
- `GET /api/logout` - End session
- `GET /api/auth/user` - Get current authenticated user

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
- **connect-pg-simple** - PostgreSQL session store
- **drizzle-orm** - Type-safe ORM
- **express** - Web server framework
- **express-session** - Session management
- **openid-client** - OIDC authentication
- **passport** - Authentication middleware
- **pg** - PostgreSQL client
- **react/react-dom** - UI framework
- **wouter** - React routing

### Dev Dependencies
- **@vitejs/plugin-react** - React plugin for Vite
- **concurrently** - Run multiple commands
- **drizzle-kit** - Database migrations
- **tailwindcss/autoprefixer/postcss** - CSS processing
- **tsx** - TypeScript execution
- **typescript** - Type checking
- **vite** - Build tool

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `SESSION_SECRET` - Auto-generated session secret
- `REPL_ID` - Replit app ID (auto-configured for OAuth)

## Recent Changes

- **Converted to React + TypeScript architecture** (capstone requirement)
- **Implemented Replit Auth for OAuth** (Google, GitHub, Apple, email login)
- **Set up Drizzle ORM** with PostgreSQL for type-safe database access
- **Created React pages**: Landing, Dashboard, CreativeSpace, ProjectDetails, Generator
- **Configured Vite** with proxy to backend API
- **Terminal aesthetic** preserved with dark theme and accent colors
