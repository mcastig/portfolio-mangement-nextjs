# DevPort

A full-stack developer portfolio management app built with Next.js 16, PostgreSQL, Zustand, and plain CSS.

Users sign up (email/password or GitHub OAuth), fill in their profile and projects, and get a shareable public portfolio page at `/portfolio/:username`.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 16 (via `pg`) |
| Auth | JWT sessions + GitHub OAuth |
| State | Zustand 5 |
| Email | SendGrid |
| Styling | Plain CSS (no utility framework) |
| Testing | Jest 30 + Testing Library |

---

## Project Structure

```
app/
  (auth)/                     # Sign in, sign up, forgot/reset password pages
  (dashboard)/                # Settings pages — protected, requires session
    settings/
      profile/                # Edit name, bio, job title, avatar
      projects/               # Add / edit / delete portfolio projects
  api/
    auth/github/              # GitHub OAuth redirect + callback
    portfolio/[username]/     # Public portfolio data + contact form endpoint
    user/                     # login, logout, signup, profile, projects, passwords
  portfolio/[username]/       # Public portfolio page (client component)
  page.tsx                    # Root redirect (→ settings or sign in)
components/
  NavBar/                     # Authenticated top nav with user dropdown
  DashboardInit/              # Hydrates Zustand store from /api/user/profile on mount
lib/
  db.ts                       # pg Pool wrapper
  session.ts                  # JWT sign/verify, cookie helpers, getSession()
  email.ts                    # SendGrid helpers (password reset, contact)
store/
  useStore.ts                 # Zustand store: user + projects state
db/
  init.sql                    # Schema (users, projects, password_reset_tokens)
__tests__/
  backend/                    # Node-environment tests for API routes and lib utilities
  frontend/                   # JSDOM tests for pages, components, and store
```

---

## Getting Started

### 1. Start the database

```bash
docker compose up -d
```

Starts PostgreSQL on port `5432` and runs `db/init.sql` to create the schema automatically.

### 2. Configure environment variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://portfolio_user:portfolio_pass@localhost:5432/portfolio_db

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# App URL (used in emails and OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the dev server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## GitHub OAuth Setup

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Set **Homepage URL** to `http://localhost:3000`
3. Set **Authorization callback URL** to `http://localhost:3000/api/auth/github/callback`
4. Copy the Client ID and Client Secret into `.env.local`

---

## Database Schema

Three tables managed by [`db/init.sql`](db/init.sql):

- **`users`** — email, password hash, GitHub identity, profile fields
- **`projects`** — name, URLs, description, image; linked to a user
- **`password_reset_tokens`** — one-time tokens with expiry, used by the forgot-password flow

Users can authenticate with email+password or GitHub OAuth. Both flows resolve to the same `users` row, linked by `github_id` or email match.

---

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/user/signup` | — | Create account |
| `POST` | `/api/user/login` | — | Email/password login |
| `POST` | `/api/user/logout` | — | Clear session cookie |
| `GET` | `/api/auth/github` | — | Redirect to GitHub OAuth |
| `GET` | `/api/auth/github/callback` | — | GitHub OAuth callback |
| `POST` | `/api/user/forgot-password` | — | Send password reset email |
| `POST` | `/api/user/reset-password` | — | Consume token, set new password |
| `GET` | `/api/user/profile` | ✓ | Get current user profile |
| `PUT` | `/api/user/profile` | ✓ | Update profile fields |
| `GET` | `/api/user/projects` | ✓ | List user's projects |
| `PUT` | `/api/user/projects` | ✓ | Create or update a project |
| `DELETE` | `/api/user/projects/:id` | ✓ | Delete a project |
| `GET` | `/api/portfolio/:username` | — | Public portfolio data |
| `POST` | `/api/portfolio/:username/contact` | — | Send contact email to portfolio owner |

---

## Testing

```bash
npm test                   # run all tests
npm run test:watch         # watch mode
npm run test:coverage      # coverage report
```

Tests are split into two environments:

- **`__tests__/backend/`** — `/** @jest-environment node */` — API routes and lib utilities with database, bcrypt, and email mocked
- **`__tests__/frontend/`** — JSDOM (default) — React pages, components, and Zustand store using Testing Library

132 tests across 22 suites, all passing.

Notable exclusions from coverage:
- `lib/db.ts` and `lib/email.ts` are infrastructure wrappers always mocked by callers
- Server-component layouts and the root redirect page contain no business logic and are not unit-tested

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
| `npm test` | Jest |
| `npm run test:coverage` | Jest with coverage report |
