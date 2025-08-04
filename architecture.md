# Architecture Overview

This project is a Next.js application that allows employees to log order status lines. The stack uses a SQLite database and server-side API routes.

## Components

### Database
- **SQLite** is used as the persistence layer (`database.sqlite`).
- Tables:
  - `users` – stores user credentials (`id`, `username`, `password`).
  - `lines` – each row of a daily log (`user_id`, `date`, `idx`, `content`, `last_modified`).
  - Database helpers in `lib/db.ts` provide CRUD operations. A `getAllNotes` function aggregates lines per user and date and reports each note's last modified timestamp.

### Authentication
- Sessions are signed tokens stored in a cookie. Creation and verification logic lives in `lib/auth.ts`.
- API routes verify the session before serving data.

### API Routes
- `/api/login`, `/api/register`, `/api/logout` – manage auth.
- `/api/notes` – fetch or update a user's daily lines.
- `/api/lines` – retrieve recent production line entries.
- `/api/user` – fetch the currently authenticated user's profile.

### Client Application
- `JournalApp.tsx` provides the UI for daily status lines.
- `ManagementApp.tsx` can display aggregated line information for an overview of production.
- Daily lines are saved automatically and retrieved via `/api/notes`.

## Data Flow
1. **User Authenticates** – credentials are validated; a session cookie is issued.
2. **User Enters Lines** – lines are saved to SQLite via `/api/notes`.
3. **Management Views Lines** – `/api/lines` and `/api/user` provide data for administrative views.

This architecture keeps data and business logic on the server, while the UI remains a thin Next.js client. To scale, the SQLite database could be replaced with a networked database and the API routes deployed on a serverless or Node environment.
