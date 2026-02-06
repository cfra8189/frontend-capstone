# BOX - Creative Asset Management Platform

## Description

A full-stack SaaS platform for independent music artists and studios to manage creative assets, track projects from concept to publication, and protect intellectual property. Built with the MERN stack (MongoDB, Express, React, Node.js) and integrated with Google OAuth for secure authentication. Features a terminal-inspired monochrome interface with light/dark mode, professional agreement generation, electronic press kits, and community sharing tools.

**Philosophy:** *"In order for creators to be seen out of the box, they have to define their own box."*

Built on the **REVERIE | RVR Creative Development** framework:
- **HTML** = Core identity (the authentic self, purpose, the "why")
- **CSS** = Presentation (visual identity, aesthetics, brand image)
- **JS** = Function (market operation, how work reaches audiences)

## Table of Contents

- [Technologies Used](#technologiesused)
- [Features](#features)
- [Backend Route Tree](#routetree)
- [Entity Relationship Diagram](#erd)
- [Future Features](#nextsteps)
- [Deployed App](#deployment)
- [About the Author](#author)

## <a name="technologiesused"></a>Technologies Used

- **React 18** - Component-based UI with TypeScript
- **Vite 5** - Fast build tool and dev server
- **Express.js** - Backend REST API framework
- **MongoDB (Atlas)** - NoSQL database with Mongoose ODM
- **Node.js** - Server runtime environment
- **TypeScript** - Type-safe development across full stack
- **Google OAuth 2.0** - Secure third-party authentication (via Passport.js)
- **Tailwind CSS** - Utility-first styling with custom terminal aesthetic
- **TanStack Query** - Server state management and caching
- **Wouter** - Lightweight client-side routing
- **Resend** - Transactional email for verification
- **bcryptjs** - Password hashing for email/password auth
- **connect-mongo** - MongoDB-backed session storage

## <a name="features"></a> Features

**Google OAuth Authentication** - Sign in securely with Google account
**Email/Password Auth** - Register with email verification via Resend
**Project Tracking** - Track creative works from concept to publication
**IP Protection Workflow** - 6-step guided process for copyright, PRO registration, ISRC/UPC
**Agreement Generator** - Create split sheets, licenses, production agreements, and NDAs
**Creative Space** - Private notes with drag-and-drop reordering, pinning, and media links
**Electronic Press Kit (EPK)** - Professional press kits with bios, photos, videos, achievements, and technical rider
**Community Sharing** - Submit notes for admin approval, favorites, and comments
**Studio Dashboard** - Manage artist rosters, invite artists, curate featured portfolios
**BOX Code System** - Unique identifiers (BOX-XXXXXX) for networking and sharing
**Submission File Generator** - Export data for The MLC, ASCAP/BMI, SoundExchange, and Harry Fox Agency
**Documentation Hub** - Comprehensive guides on copyrights, PROs, and global identifiers
**Admin Panel** - Manage users, review submissions, create blog posts, view system stats
**Role-Based Access** - Artist and Studio roles with different dashboards and features
**Light/Dark Mode** - Theme toggle with localStorage persistence
**Responsive Design** - Mobile-friendly with hamburger navigation

**In Progress:**

- [ ] Custom domain deployment (luctheleo.com)

## <a name="routetree"></a>Backend Route Tree

Express.js REST API running on port 3000, proxied through Vite on port 5000.
Most routes prefixed with `/api`. Object storage served at `/objects`.

**9 route groups | 52 total endpoints**

```
EXPRESS APP  server/index.ts
│
├── /api/auth — Authentication (10 routes)
│   │  Google OAuth, email/password login, registration, verification
│   │
│   ├── GET    /api/auth/google                    Redirect to Google OAuth
│   ├── GET    /api/auth/google/callback            Google OAuth callback handler
│   ├── POST   /api/auth/register                   Register new user (email/password)
│   ├── POST   /api/auth/login                      Login with email/password
│   ├── GET    /api/auth/verify                     Verify email address via token
│   ├── POST   /api/auth/resend-verification        Resend verification email
│   ├── GET    /api/auth/user                       Get current authenticated user 🔒
│   ├── POST   /api/auth/change-password            Change user password 🔒
│   ├── POST   /api/auth/update-profile             Update display name / profile 🔒
│   └── GET    /api/logout                          End session and logout
│
├── /api/projects — Projects (5 routes)
│   │  CRUD operations for creative projects (tracks, albums, EPs)
│   │
│   ├── GET    /api/projects                        List all user projects 🔒
│   ├── POST   /api/projects                        Create a new project 🔒
│   ├── GET    /api/projects/:id                    Get project details by ID 🔒
│   ├── PUT    /api/projects/:id                    Update a project 🔒
│   └── DELETE /api/projects/:id                    Delete a project 🔒
│
├── /api/creative — Creative Notes (6 routes)
│   │  Private notes for inspiration, ideas, and media links
│   │
│   ├── GET    /api/creative/notes                  List all user notes 🔒
│   ├── POST   /api/creative/notes                  Create a new note 🔒
│   ├── PUT    /api/creative/notes/:id              Update a note 🔒
│   ├── DELETE /api/creative/notes/:id              Delete a note 🔒
│   ├── POST   /api/creative/notes/:id/pin          Toggle pin status 🔒
│   └── POST   /api/creative/notes/reorder          Reorder notes (drag & drop) 🔒
│
├── /api/community — Community (7 routes)
│   │  Share notes publicly, favorites, and comments
│   │
│   ├── POST   /api/community/submit                Submit note for community sharing 🔒
│   ├── GET    /api/community/my-submissions         Get user's submission status 🔒
│   ├── GET    /api/community                        Get all approved shared content
│   ├── POST   /api/community/:id/favorite           Toggle favorite on content 🔒
│   ├── POST   /api/community/:id/comment            Add comment to content 🔒
│   ├── GET    /api/community/:id/comments           Get comments for content
│   └── GET    /api/community/my-favorites           Get user's favorited items 🔒
│
├── /api/admin — Admin (10 routes)
│   │  Admin panel for managing users, submissions, and blog posts
│   │
│   ├── POST   /api/admin/login                     Admin login (password)
│   ├── POST   /api/admin/logout                    Admin logout
│   ├── GET    /api/admin/check                     Check admin session
│   ├── GET    /api/admin/users                     Get all users 🔒
│   ├── GET    /api/admin/projects                  Get all projects 🔒
│   ├── GET    /api/admin/stats                     Get system statistics 🔒
│   ├── GET    /api/admin/submissions               Get community submissions 🔒
│   ├── POST   /api/admin/submissions/:id/review    Approve/reject submission 🔒
│   ├── POST   /api/admin/blog                      Create blog post 🔒
│   └── POST   /api/admin/blog/:id/publish          Toggle blog publish status 🔒
│
├── /api/blog — Blog (1 route)
│   │  Public blog posts created from community content
│   │
│   └── GET    /api/blog                            Get published blog posts
│
├── /api/studio — Studio (8 routes)
│   │  Studio management - artist roster, invitations, portfolio
│   │
│   ├── GET    /api/studio/artists                           Get studio's artist roster 🔒
│   ├── POST   /api/studio/invite                            Invite artist by email 🔒
│   ├── GET    /api/studio/artists/:artistId/projects        Get artist's projects 🔒
│   ├── POST   /api/studio/projects/:projectId/feature       Toggle project featured 🔒
│   ├── DELETE /api/studio/artists/:relationId               Remove artist from roster 🔒
│   ├── GET    /api/portfolio/:studioId                      Get public studio portfolio
│   ├── POST   /api/studio/invitations/:invitationId/accept  Accept studio invitation 🔒
│   └── GET    /api/artist/invitations                       Get pending invitations 🔒
│
├── /api/epk — Electronic Press Kit (3 routes)
│   │  Create and share professional press kits
│   │
│   ├── GET    /api/epk                             Get current user's EPK 🔒
│   ├── POST   /api/epk                             Create or update EPK 🔒
│   └── GET    /api/epk/:boxCode                    Get public EPK by BOX code
│
└── /api/uploads — File Uploads (2 routes)
    │  Object storage for media files
    │
    ├── POST   /api/uploads/request-url             Get presigned upload URL 🔒
    └── GET    /objects/:objectPath(*)               Serve uploaded files
```

**Middleware Stack:**
1. `express.json()` — Parse JSON request bodies
2. `express-session` + `connect-mongo` — Session management (MongoDB store)
3. `passport.initialize()` + `passport.session()` — Authentication
4. `isAuthenticated` — Route-level auth guard (checks session + token expiry)
5. `isAdmin` — Admin-only route guard (checks session.isAdmin)

**Authentication Flow:**
- **Google OAuth:** Client → `/api/auth/google` → Google Consent → `/api/auth/google/callback` → Create/Find User → Set Session → Redirect `/`
- **Email Registration:** Client → `POST /api/auth/register` → Hash Password → Send Verification Email → `GET /api/auth/verify?token=...` → Activate Account
- **Email Login:** Client → `POST /api/auth/login` → Verify Email + Password → Set Session → Return User

## <a name="erd"></a>Entity Relationship Diagram

MongoDB (Atlas) with Mongoose ODM. 10 collections with referential relationships.

**Legend:** PK = Primary Key | FK = Foreign Key | UQ = Unique Constraint

#### Users
| Field | Type | Key |
|-------|------|-----|
| _id | ObjectId | PK |
| email | String | UQ |
| passwordHash | String | |
| displayName | String | |
| firstName | String | |
| lastName | String | |
| profileImageUrl | String | |
| role | String | |
| businessName | String | |
| businessBio | String | |
| boxCode | String | UQ |
| emailVerified | Boolean | |
| verificationToken | String | |
| verificationTokenExpires | Date | |
| googleId | String | |
| githubId | String | |
| createdAt | Date | |
| updatedAt | Date | |

#### Projects
| Field | Type | Key |
|-------|------|-----|
| _id | ObjectId | PK |
| userId | ObjectId | FK → Users |
| title | String | |
| type | String | |
| status | String | |
| description | String | |
| metadata | Mixed (JSON) | |
| isFeatured | Boolean | |
| createdAt | Date | |
| updatedAt | Date | |

#### CreativeNotes
| Field | Type | Key |
|-------|------|-----|
| _id | ObjectId | PK |
| userId | ObjectId | FK → Users |
| category | String | |
| title | String | |
| content | String | |
| mediaUrls | String[] | |
| tags | String[] | |
| isPinned | Boolean | |
| sortOrder | Number | |
| createdAt | Date | |
| updatedAt | Date | |

#### SharedContent
| Field | Type | Key |
|-------|------|-----|
| _id | ObjectId | PK |
| noteId | ObjectId | FK → CreativeNotes |
| userId | ObjectId | FK → Users |
| status | String | |
| adminNotes | String | |
| blogPostId | ObjectId | FK → BlogPosts |
| approvedAt | Date | |
| createdAt | Date | |

#### CommunityFavorites
| Field | Type | Key |
|-------|------|-----|
| _id | ObjectId | PK |
| sharedContentId | ObjectId | FK → SharedContent |
| userId | ObjectId | FK → Users |
| createdAt | Date | |

#### CommunityComments
| Field | Type | Key |
|-------|------|-----|
| _id | ObjectId | PK |
| sharedContentId | ObjectId | FK → SharedContent |
| userId | ObjectId | FK → Users |
| content | String | |
| createdAt | Date | |

#### BlogPosts
| Field | Type | Key |
|-------|------|-----|
| _id | ObjectId | PK |
| sharedContentId | ObjectId | FK → SharedContent |
| title | String | |
| content | String | |
| authorId | ObjectId | FK → Users |
| isPublished | Boolean | |
| publishedAt | Date | |
| createdAt | Date | |

#### StudioArtists
| Field | Type | Key |
|-------|------|-----|
| _id | ObjectId | PK |
| studioId | ObjectId | FK → Users |
| artistId | ObjectId | FK → Users |
| status | String | |
| inviteEmail | String | |
| acceptedAt | Date | |
| createdAt | Date | |

#### Sessions
| Field | Type | Key |
|-------|------|-----|
| _id | String | PK |
| expires | Date | |
| session | Mixed (JSON) | |

#### PressKits
| Field | Type | Key |
|-------|------|-----|
| _id | ObjectId | PK |
| userId | ObjectId | FK → Users (unique) |
| shortBio | String | |
| mediumBio | String | |
| longBio | String | |
| genre | String | |
| location | String | |
| photoUrls | String[] | |
| videoUrls | String[] | |
| featuredTracks | Mixed[] | |
| achievements | Mixed[] | |
| pressQuotes | Mixed[] | |
| socialLinks | Mixed | |
| contactEmail | String | |
| contactName | String | |
| bookingEmail | String | |
| technicalRider | String | |
| stagePlot | String | |
| isPublished | Boolean | |
| createdAt | Date | |
| updatedAt | Date | |

### Relationships

```
Users ──── 1 : N ──── Projects              User owns many Projects
Users ──── 1 : N ──── CreativeNotes          User owns many Notes
Users ──── 1 : 1 ──── PressKits             User has one Press Kit
Users ──── 1 : N ──── StudioArtists          Studio has many Artist relationships
Users ──── 1 : N ──── SharedContent          User submits content
Users ──── 1 : N ──── BlogPosts             Admin authors Blog Posts
Users ──── 1 : N ──── CommunityFavorites     User has many Favorites
Users ──── 1 : N ──── CommunityComments      User has many Comments
CreativeNotes ── 1 : 1 ── SharedContent      Note can be shared once
SharedContent ── 1 : N ── CommunityFavorites Content has many Favorites
SharedContent ── 1 : N ── CommunityComments  Content has many Comments
SharedContent ── 1 : 1 ── BlogPosts          Content becomes Blog Post
```

## <a name="nextsteps"></a>Future Features

- **Custom Domain** - Deploy to luctheleo.com
- **Advanced Analytics** - Stream tracking and royalty reporting dashboards
- **Collaboration Tools** - Real-time project collaboration between artists
- **Mobile App** - Native iOS and Android applications
- **AI-Powered Metadata** - Auto-suggest ISRC/UPC and metadata fields
- **Calendar Integration** - Release planning with deadline tracking
- **Payment Processing** - In-app licensing and agreement payments
- **Expanded EPK Templates** - Genre-specific press kit layouts

## <a name="deployment"></a>Deployed App

**Live Application:**
[BOX on Replit](https://box-luctheleo.replit.app)

**Repository:**
[GitHub Repository](https://github.com/luctheleo/BOX)

## <a name="author"></a>About The Author

**Luc The Leo**

- [luctheleo.com](https://luctheleo.com)

## Development Process

This project was built as a capstone using:

- MERN stack (MongoDB, Express, React, Node.js)
- TypeScript across the full stack
- Google OAuth 2.0 for authentication (capstone requirement)
- MongoDB Atlas for cloud database hosting
- Vite for fast development and production builds
- Git version control with iterative feature development

## Installation & Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/luctheleo/BOX.git
   ```

2. Navigate to project directory:

   ```bash
   cd BOX/wayfinder_app-v2
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Set up environment variables:

   ```bash
   MONGODB_URI=your_mongodb_atlas_connection_string
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. View in browser at `localhost:5000`

## Works Cited

- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB / Mongoose Documentation](https://mongoosejs.com/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Documentation](http://www.passportjs.org/)
- [TanStack Query Documentation](https://tanstack.com/query)
- [Resend Email API](https://resend.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)
