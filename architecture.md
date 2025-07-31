# Architecture Overview

This project is a Next.js application that allows employees to log order status notes and chat with an AI assistant. The stack uses a SQLite database, server-side API routes, and Google Gemini for LLM capabilities.

## Components

### Database
- **SQLite** is used as the persistence layer (`database.sqlite`).
- Tables:
  - `users` – stores user credentials (`id`, `username`, `password`).
  - `notes` – stores order notes (`user_id`, `date`, `content`, `last_modified`).
- Database helpers in `lib/db.ts` provide CRUD operations. A new `getAllNotes` function aggregates every note with its author.

### Authentication
- Sessions are signed tokens stored in a cookie. Creation and verification logic lives in `lib/auth.ts`.
- API routes verify the session before serving data.

### API Routes
- `/api/login`, `/api/register`, `/api/logout` – manage auth.
- `/api/notes` – fetch or update a user's notes.
- **`/api/chat`** – new route that collects all notes and sends them to Gemini 2.5 Flash for a single-turn response.

### LLM Integration
1. `app/api/chat/route.ts` initializes `GoogleGenAI` with an API key from `GOOGLE_API_KEY`.
2. When a POST request with `{ question }` arrives:
   - Session is verified.
   - All notes are loaded with `getAllNotes()`.
   - Notes are concatenated and sent to the `gemini-2.5-flash` model along with the user's question.
   - The API returns the model's text reply.

### Client Application
- `JournalApp.tsx` provides the UI for daily notes and a management chat interface.
- The management view posts questions to `/api/chat` and displays the response.
- Daily notes are saved automatically and retrieved via `/api/notes`.

## Data Flow
1. **User Authenticates** – credentials are validated; a session cookie is issued.
2. **User Enters Notes** – notes are saved to SQLite via `/api/notes`.
3. **User Queries AI** – a POST to `/api/chat` with the question. The server gathers all notes and queries Gemini.
4. **LLM Response** – the answer is returned and shown in the management chat view.

This architecture keeps the database and AI interaction on the server, while the UI remains a thin Next.js client. To scale, the SQLite database could be replaced with a networked database and the API routes deployed on a serverless or Node environment with access to Google Gemini.
