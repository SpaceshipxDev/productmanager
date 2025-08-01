# Architecture Overview

This project is a Next.js application that allows employees to log order status lines and chat with an AI assistant. The stack uses a SQLite database, server-side API routes, and Google Gemini for LLM capabilities.

## Components

### Database
- **SQLite** is used as the persistence layer (`database.sqlite`).
- Tables:
  - `users` – stores user credentials (`id`, `username`, `password`).
  - `lines` – each row of a daily log (`user_id`, `date`, `idx`, `content`, `last_modified`).
  - Database helpers in `lib/db.ts` provide CRUD operations. A new `getAllNotes` function aggregates all lines per user and date and reports each note's last modified timestamp.

### Authentication
- Sessions are signed tokens stored in a cookie. Creation and verification logic lives in `lib/auth.ts`.
- API routes verify the session before serving data.

### API Routes
- `/api/login`, `/api/register`, `/api/logout` – manage auth.
- `/api/notes` – fetch or update a user's daily lines.
- **`/api/chat`** – route that collects all lines and maintains a multi-turn conversation with Gemini 2.5 Flash.

### LLM Integration
1. `app/api/chat/route.ts` initializes `GoogleGenAI` with an API key from `GOOGLE_API_KEY`.
2. When a POST request with `{ question, history }` arrives to `/api/chat`:
   - Session is verified.
   - All lines are loaded with `getAllNotes()`, which also provides the last modified timestamp for each note.
   - The conversation history is passed to `ai.chats.create`, and the latest question is sent along with the current lines to the `gemini-2.5-flash` model.
   - The API returns the model's text reply.

### Client Application
- `JournalApp.tsx` provides the UI for daily status lines and a management chat interface.
- The management view posts questions to `/api/chat` and displays the response.
- Daily lines are saved automatically and retrieved via `/api/notes`.

## Data Flow
1. **User Authenticates** – credentials are validated; a session cookie is issued.
2. **User Enters Lines** – lines are saved to SQLite via `/api/notes`.
3. **User Queries AI** – a POST to `/api/chat` with the question and prior conversation. The server gathers all lines and queries Gemini.
4. **LLM Response** – the answer is returned and shown in the management chat view, and can be used in follow-up questions.

This architecture keeps the database and AI interaction on the server, while the UI remains a thin Next.js client. To scale, the SQLite database could be replaced with a networked database and the API routes deployed on a serverless or Node environment with access to Google Gemini.
