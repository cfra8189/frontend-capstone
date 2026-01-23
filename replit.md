# WayfinderOS - Creative Asset Management Platform

## Overview

WayfinderOS is a SaaS platform for independent music artists and studios to manage their creative assets, track projects from concept to publication, and protect their intellectual property. The platform provides tools for:

- **Project Tracking** - Track work from concept through development to published
- **Metadata Management** - Store ISRC, UPC, copyright registration numbers
- **Agreement Generation** - Create and download professional music industry agreements
- **Documentation** - Store important documents for each project

The platform uses the REVERIE | RVR Creative Development framework:
- **HTML** = Core identity (the authentic self, purpose, the "why")
- **CSS** = Presentation (visual identity, aesthetics, brand image)
- **JS** = Function (market operation, how work reaches audiences)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Pattern**: Static HTML/CSS/JS served from Express
- **UI Paradigm**: Terminal/command-line aesthetic with dark theme
- **Styling**: Tailwind CSS (CDN) with custom accent colors (#c3f53c green)
- **Location**: `/wayfinder_app-v2/public` directory contains all frontend assets

### Backend Architecture
- **Framework**: Express.js with ES modules
- **Database**: PostgreSQL for persistent storage
- **Authentication**: Session-based with bcrypt password hashing
- **Entry Point**: `server.js` serves API routes and static files
- **Port**: 5000

### User Roles
- **Creator** - Individual artists managing their own projects
- **Studio** - Business accounts that can manage clients and their projects
- **Platform Admin** - Access via ADMIN_PASSWORD for system administration

### Database Schema
- **users** - User accounts with email, password_hash, name, role, business_name
- **projects** - Creative works with title, type, status, description, metadata (JSONB)
- **project_documents** - Documents attached to projects (agreements, copyright registrations)
- **studio_clients** - Clients managed by studio accounts

### API Structure

**Authentication:**
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

**Projects:**
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/documents` - Get project documents
- `POST /api/projects/:id/documents` - Add document to project

**Studio (role-restricted):**
- `GET /api/studio/clients` - List studio's clients
- `POST /api/studio/clients` - Add new client

**Admin:**
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/logout` - End admin session
- `GET /api/admin/check` - Check admin status

**Terminal:**
- `POST /api/command` - Process terminal commands

### Project Status Workflow
1. **Concept** - Initial idea stage
2. **Development** - Active work in progress
3. **Review** - Ready for review/approval
4. **Published** - Released and monetizable

### Agreement Generator
- **Location**: `/generator.html`
- **3-Step Flow**: Select agreement type → Fill in details → View/Download
- **PDF Export**: Client-side PDF generation using jsPDF
- **11 Agreement Types**: Split sheets, licenses (basic/standard/premium), production, confidentiality, content release, exclusive license, buyout, coaching

### Key Pages
- `/` - Terminal interface (landing page)
- `/dashboard.html` - User project dashboard (requires login)
- `/creative.html` - Private creative space for notes/inspiration (requires login)
- `/generator.html` - Agreement generator (public access)
- `/admin.html` - Platform admin dashboard

### Creative Space
- **Private notes** - Only visible to the individual user
- **6 Categories**: Ideas, Lyrics, Inspiration, Audio, Visual, Journal
- **Media links** - Store URLs from Pinterest, Instagram, SoundCloud, YouTube, etc.
- **Tags and pinning** - Organize with tags, pin important notes to top
- **Terminal commands**: `creative`, `space`, `notes`, or `journal`

### Guided Tour
- Auto-starts on first login (stored in localStorage)
- 6-step walkthrough: Welcome, Create Projects, Stats, Filters, Projects List, Agreements
- "Help" button in nav to restart tour anytime
- Visual highlights with tooltips for each feature

### IP Education & Protection
- **Info tooltips** on ISRC, UPC, Copyright fields explain what each identifier is
- **"What are these?" link** opens comprehensive IP Guide explaining:
  - Primary identifiers (ISRC, UPC, ISWC, IPI)
  - How to get them (mostly free via distributors/PROs)
  - Recommended workflow: Create → Copyright → PRO → Distribute
  - Difference between identifiers (tracking) vs copyright (legal protection)
- **Publish Checkpoint** appears when moving project to "Published" status
  - Reminds users to register copyright, join PRO, get identifiers
  - Educational prompt, not a blocker

### Project Documentation System
- **Project Details Page** (`/project-details.html?id=X`) with comprehensive tracking
- **6-Step IP Protection Workflow** stored per project in metadata:
  1. **Fix Your Work** - Record/document in tangible form (FREE)
  2. **Register Copyright** - File with US Copyright Office ($45-65)
  3. **Join a PRO** - BMI (free) or ASCAP membership
  4. **Register Composition** - Get ISWC from PRO (FREE)
  5. **Upload to Distributor** - Get ISRC/UPC codes (varies $0-30/yr)
  6. **Release & Monitor** - Track streams and royalties
- **Each step includes**:
  - Detailed educational content with links to official sites
  - Form fields to record registration numbers, dates, fees
  - Completion checkbox to mark step done
- **Documentation section** shows all recorded information
- **All data stored** in project metadata.workflow JSONB field

## External Dependencies

### Runtime Dependencies
- **express** - Web server framework
- **express-session** - Session management
- **pg** - PostgreSQL client
- **bcryptjs** - Password hashing
- **dotenv** - Environment variable management

### Frontend Resources
- **Tailwind CSS CDN** - Utility-first CSS framework
- **jsPDF CDN** - Client-side PDF generation
- **JetBrains Mono** - Monospace font for terminal aesthetic

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `ADMIN_PASSWORD` - Required for platform admin access
- `SESSION_SECRET` - Optional, auto-generated if not provided

## Recent Changes

- Added PostgreSQL database with users, projects, and documents tables
- Implemented user registration/login with bcrypt password hashing
- Created project tracker with status workflow and metadata storage
- Added role-based system (creator vs studio accounts)
- Built user dashboard for project management
- Added studio client management API endpoints
