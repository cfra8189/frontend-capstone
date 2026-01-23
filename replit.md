# WayfinderOS - REVERIE Creative Development Platform

## Overview

WayfinderOS is a terminal-style web application that serves as a creative development assistant for LUCTHELEO's REVERIE | RVR creative consultancy. The platform implements a unique "HTML/CSS/JS" metaphorical framework for artist development:

- **HTML** = Core identity (the authentic self, purpose, the "why")
- **CSS** = Presentation (visual identity, aesthetics, brand image)
- **JS** = Function (market operation, how work reaches audiences)

The application provides a command-line interface for accessing creative development tools, agreement templates, session tracking, and client management resources. The philosophy is "No ego. Just work." - focused on systematic transformation of creative concepts into organized, documented results.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Pattern**: Static HTML/CSS/JS served from Express
- **UI Paradigm**: Terminal/command-line aesthetic with CRT visual effects
- **Styling**: Custom CSS with retro terminal styling, scanlines overlay, and accent colors (#c3f53c green)
- **Location**: `/public` directory contains all frontend assets

### Backend Architecture
- **Framework**: Express.js (v5.x) with ES modules
- **Pattern**: Simple REST API with static file serving
- **Entry Point**: `server.js` serves both API routes and static files
- **Port**: 5000

### API Structure
- `POST /api/command` - Processes terminal commands (help, status, echo)
- Static JSON data store at `/public/data.json` for templates and framework definitions

### Data Storage
- **Current**: File-based JSON (`data.json`) containing agreement templates and framework definitions
- **No Database**: Simple prototype without persistent storage
- **Client Data Model**: Conceptual folder structure for clients (session docs, brand documents, IP folders)

### Key Design Decisions

1. **Terminal UI over Traditional GUI**
   - Chosen for distinctive brand identity and developer-friendly aesthetic
   - Aligns with the systematic, "code-like" approach to creative development
   - Provides focused, distraction-free interaction

2. **ES Modules**
   - Modern JavaScript with `"type": "module"` in package.json
   - Clean import/export syntax throughout

3. **Static Data Files**
   - Agreement templates stored as JSON for easy updates
   - No database complexity for prototype phase
   - Templates include: Split Sheets, Production Agreements, Confidentiality, Content Release

## External Dependencies

### Runtime Dependencies
- **express** (v4.19.2) - Web server framework
- **dotenv** (v17.2.1) - Environment variable management
- **openai** (v5.12.2) - OpenAI API integration (prepared but not actively used in current routes)

### External Services
- **OpenAI API** - Intended for AI-powered responses (API key expected via environment variables)
- **Tailwind CSS** - Loaded via CDN for utility classes

### Environment Variables Required
- OpenAI API key (for future AI integration)

### Frontend Resources
- **Tailwind CSS CDN** - Utility-first CSS framework
- **JetBrains Mono** - Monospace font for terminal aesthetic