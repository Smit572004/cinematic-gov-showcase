# TinPlant – Biotechnik und Pflanzenvermehrung GmbH

A bilingual (German/English) corporate website with a full-featured admin panel for **TinPlant**, a plant propagation and forestry company based in Sachsen-Anhalt, Germany.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Diagrams](#architecture-diagrams)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Edge Functions](#edge-functions)
- [Authentication & Authorization](#authentication--authorization)
- [Internationalization (i18n)](#internationalization-i18n)
- [Theming](#theming)
- [Admin Panel](#admin-panel)
- [Storage](#storage)
- [Deployment](#deployment)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Styling** | Tailwind CSS v3, shadcn/ui |
| **Animation** | Framer Motion |
| **Routing** | React Router DOM v6 |
| **Data Fetching** | TanStack React Query |
| **Backend** | Lovable Cloud (Supabase) – PostgreSQL, Auth, Storage, Edge Functions (Deno) |

---

## Project Structure

```
src/
├── assets/              # Static images, videos
├── components/          # Reusable UI components
│   ├── admin/           # Admin layout components
│   └── ui/              # shadcn/ui primitives
├── hooks/               # Custom React hooks (useAuth, useScrollAnimation, etc.)
├── i18n/                # Language & theme context providers, translations
├── integrations/        # Supabase client & auto-generated types (DO NOT EDIT)
├── lib/                 # Utility functions
├── pages/               # Route-level page components
│   └── admin/           # Admin panel pages
├── index.css            # Global styles & CSS design tokens
└── App.tsx              # Root component with providers & routing

supabase/
├── config.toml          # Supabase project config (auto-managed)
└── functions/           # Edge functions
    ├── setup-admin/     # First-admin bootstrap endpoint
    └── translate/       # German → English dictionary translation

docs/                    # Architecture & workflow diagrams (Mermaid)
```

---

## Architecture Diagrams

Visual documentation is in the `docs/` folder as Mermaid (`.mmd`) files. Open them in any Mermaid-compatible viewer (GitHub renders them natively, or use [mermaid.live](https://mermaid.live)).

| Diagram | File | Description |
|---------|------|-------------|
| Application Architecture | [`01_Application_Architecture.mmd`](docs/01_Application_Architecture.mmd) | Provider hierarchy, routing, shared components |
| Database Schema | [`02_Database_Schema.mmd`](docs/02_Database_Schema.mmd) | All tables, columns, and relationships |
| Authentication Flow | [`03_Authentication_Flow.mmd`](docs/03_Authentication_Flow.mmd) | Login, JWT verification, admin role check |
| Data Flow & RLS | [`04_Data_Flow_and_RLS.mmd`](docs/04_Data_Flow_and_RLS.mmd) | Who can read/write what data |
| Admin Workflow | [`05_Admin_Workflow.mmd`](docs/05_Admin_Workflow.mmd) | Content management, auto-translation, uploads |
| Technology Stack | [`06_Technology_Stack.mmd`](docs/06_Technology_Stack.mmd) | Full stack overview |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 (or Bun)
- **npm** / **bun** package manager

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`.

---

## Environment Variables

The following environment variables are auto-configured by Lovable Cloud (in `.env`):

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Backend API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public API key (safe for client-side) |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier |

> ⚠️ **Do not edit `.env` manually** – it is auto-generated.

---

## Database

### Tables

| Table | Purpose | Public Read? |
|-------|---------|:------------:|
| `products` | Plant/tree catalog | ✅ All |
| `gallery_images` | Photo gallery | ✅ Active only |
| `garden_offers` | Seasonal promotions | ✅ Active only |
| `team_members` | Staff directory | ✅ All |
| `site_content` | CMS key-value content | ✅ All |
| `contact_submissions` | Contact form entries | ❌ Insert only |
| `profiles` | User profile data | 🔒 Own only |
| `user_roles` | Role assignments (admin/user) | 🔒 Admin only |

### Row-Level Security (RLS)

All tables have RLS enabled. Key rules:
- **Anonymous users**: Can read public content and submit contact forms
- **Authenticated users**: Can manage their own profile
- **Admins**: Full CRUD on content tables, managed via `has_role()` security-definer function

### Key Database Functions

- **`has_role(user_id, role)`** – Security-definer function that checks if a user has a specific role. Prevents RLS recursion and limits role enumeration.
- **`handle_new_user()`** – Trigger function that auto-creates a profile row when a new user signs up.

---

## Edge Functions

| Function | Endpoint | Auth Required | Purpose |
|----------|----------|:-------------:|---------|
| `setup-admin` | `POST /setup-admin` | ✅ JWT | Bootstraps the first admin user (only works when no admin exists) |
| `translate` | `POST /translate` | ❌ | Dictionary-based German → English translation for admin content |

---

## Authentication & Authorization

1. **Email/password** sign-up and sign-in via Supabase Auth
2. **Admin role** stored in `user_roles` table (not in user metadata)
3. **`has_role()` RPC** used by the frontend (`useAuth` hook) to check admin status
4. **First admin setup**: When no admin exists, the first authenticated user can claim admin via the `setup-admin` edge function
5. All admin pages check `isAdmin` before rendering

---

## Internationalization (i18n)

- **Default language**: German (DE)
- **Supported**: German, English
- **Implementation**: React Context (`LanguageContext`) with a static translation dictionary in `src/i18n/translations.ts`
- **Admin auto-translation**: When content is entered in German, the `translate` edge function provides English translations using a domain-specific dictionary (forestry, gardening, company roles)
- **Language switcher** available in navbar and admin panel

---

## Theming

- **Default theme**: Dark mode
- **Modes**: Dark (deep forest tones) / Light (sage & natural palette)
- **Implementation**: CSS custom properties in `index.css` with a `ThemeContext` provider
- **Design tokens**: All colors use HSL via Tailwind semantic tokens (`--background`, `--primary`, `--muted`, etc.)

> ⚠️ **Never use hardcoded colors in components** – always use design tokens.

---

## Admin Panel

Accessible at `/admin` (requires admin role). Features:

| Section | Route | Manages |
|---------|-------|---------|
| Dashboard | `/admin` | Overview stats |
| Products | `/admin/products` | Plant catalog with image uploads |
| Team | `/admin/team` | Staff members |
| Content | `/admin/content` | CMS site text |
| Offers | `/admin/offers` | Garden shop promotions |
| Gallery | `/admin/gallery` | Photo gallery with categories |

All admin forms support bilingual input with auto-translation.

---

## Storage

Two **public** storage buckets:

| Bucket | Purpose |
|--------|---------|
| `product-images` | Product catalog photos |
| `gallery-images` | Gallery page photos |

Images are uploaded via the admin panel and served as public URLs.

---

## Deployment

The project is deployed via **Lovable** with automatic builds. The published site is available at:

🌐 **[https://tinplant.lovable.app](https://tinplant.lovable.app)**

---

## Important Files (Do Not Edit)

These files are auto-generated and should never be modified manually:

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env`

---

## License

© TinPlant Biotechnik und Pflanzenvermehrung GmbH. All rights reserved.
