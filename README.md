# The Box — Frontend

## Description

This repository contains the frontend portion of The Box: a web app that helps independent music creators manage projects, documents, and creative workflows. The UI is built with modern web tooling and is optimized for development and responsiveness.

## Table of Contents

- [Technologies Used](#technologies-used)
- [Features](#features)
- [Planned Enhancements](#planned-enhancements)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Author](#author)
- [Development Process](#development-process)
- [References](#references)

## <a name="technologies-used"></a>Technologies Used

- **React** — UI components and state management
- **Vite** — Development server and build tool
- **TypeScript** — Static typing for improved reliability
- **Tailwind CSS / PostCSS** — Utility-first styling and CSS pipeline
- **ESLint / Prettier** — Linting and formatting rules

## <a name="features"></a>Features

- Project dashboard and per-project views
- Document upload and preview UI
- Creative notes canvas with drag-and-drop positioning
- User authentication hooks (Google OAuth integration)
- Responsive layout and accessible components
- Asset loading and font handling for consistent branding

## <a name="planned-enhancements"></a>Planned Enhancements

- Persisted offline support for notes and drafts
- Improved accessibility across interactive widgets
- Additional charting and analytics for project statistics
- Integration with third-party storage providers
- Theming options (Light / Dark / High contrast)

## <a name="local-development"></a>Local Development

Prerequisites:

- Node.js (LTS) and npm installed

Quick start:

```bash
# from the repository root
cd frontend
npm install
npm run dev
```

Open the app at `http://localhost:5173/` (Vite will report the exact URL).

Build for production:

```bash
npm run build
```

Run a preview of the production build:

```bash
npm run preview
```

## <a name="deployment"></a>Deployment

The frontend can be hosted on most static hosting providers (Netlify, Vercel, GitHub Pages, etc.) or served behind a Node server as static assets. Ensure the production `API_BASE_URL` environment variable points to your deployed backend and that OAuth redirect URIs are registered for your production domain.

## <a name="author"></a>Author

**Clarence Franklin (cfra8189)**

GitHub: https://github.com/cfra8189

## <a name="development-process"></a>Development Process

- Feature branches and pull requests for changes
- Code formatting and lint rules enforced on commit
- Lightweight component-driven development using small, testable UI pieces

## <a name="references"></a>References

- React — https://react.dev/
- Vite — https://vitejs.dev/
- Tailwind CSS — https://tailwindcss.com/
- TypeScript — https://www.typescriptlang.org/
Frontend

How to run (development):

1. cd frontend
2. npm install
3. npm run dev

Build:

1. cd frontend
2. npm run build

Notes: This folder contains the React + Vite app and Tailwind configuration.
