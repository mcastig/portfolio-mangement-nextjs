@AGENTS.md

# DevPort — Codebase Guide

## Stack

- **Next.js 16** App Router — `app/` directory, route groups `(auth)` and `(dashboard)`
- **React 19** — `use(params)` for async params in client components
- **PostgreSQL** via `pg` pool (`lib/db.ts`) — always mocked in tests, never connect to real DB in tests
- **JWT sessions** — `lib/session.ts` signs/verifies tokens, stores them in an `HttpOnly` cookie named `portfolio_session`
- **Zustand 5** store at `store/useStore.ts` — holds `user`, `projects`, `isLoading`
- **Plain CSS** — no Tailwind in use; each feature area has its own `.css` file

## Auth flow

Sessions are cookie-based JWTs. `getSession()` in `lib/session.ts` reads `next/headers`'s `cookies()` — it must be called from Server Components or API routes, never from client components.

`DashboardInit` is a client component that hydrates the Zustand store on first mount by calling `/api/user/profile`.

`middleware.ts` guards all `/settings/**` routes at the edge — it checks for the `portfolio_session` cookie and redirects to `/signin` if absent. It also pairs with `Cache-Control: no-store` (set in `next.config.ts`) to prevent the browser from serving protected pages after logout via the back button.

## GitHub OAuth CSRF protection

The OAuth flow uses a `state` parameter to prevent CSRF. `/api/auth/github` generates a random 16-byte hex state, stores it in an `HttpOnly` cookie named `oauth_state` (TTL 10 min), and passes it to GitHub. `/api/auth/github/callback` reads `oauth_state` from `next/headers` cookies and rejects requests where the state doesn't match. The cookie is cleared after successful login via `headers.append('Set-Cookie', 'oauth_state=; ...')` — do NOT use `response.cookies.set()` after manually setting a `Set-Cookie` header, as the cookies API calls `headers.set()` internally and would wipe the session cookie.

## Input validation rules

All API routes validate inputs at the boundary:
- Passwords: 8–128 characters (upper bound prevents bcrypt DoS)
- URL fields (`profile_image`, `demo_url`, `repo_url`, `image_url`): must be `http:` or `https:` scheme — rejects `javascript:` URIs
- Text fields: `name`/`job_title` ≤ 255 chars, `bio`/`description` ≤ 2000 chars, contact `message` ≤ 5000 chars
- Public portfolio API (`GET /api/portfolio/[username]`) does NOT return the user's email

## API routes

All routes live under `app/api/`. Protected routes call `getSession()` at the top and return `401` when the session is absent.

The `params` argument in dynamic routes (e.g. `{ params: Promise<{ id: string }> }`) is a Promise in Next.js 16 — always `await params` before destructuring.

## Testing conventions

- Backend tests use `/** @jest-environment node */` at the top of the file
- Mock `@/lib/db`, `@/lib/session`, and `@/lib/email` in every backend test — never hit a real DB or send real emails
- Frontend tests use the default jsdom environment
- Mock `@/store/useStore` in component tests by providing a selector-aware mock:
  ```ts
  const mockUseStore = jest.fn();
  jest.mock('@/store/useStore', () => ({
    useStore: (selector) => mockUseStore(selector),
  }));
  mockUseStore.mockImplementation((selector) => selector({ user: MOCK_USER, setUser: mockSetUser }));
  ```
- When testing client components that use React 19's `use(params)`, pre-set `status` and `value` on the Promise to prevent Suspense from triggering:
  ```ts
  const p = Promise.resolve({ username: 'test' }) as any;
  p.status = 'fulfilled';
  p.value = { username: 'test' };
  render(<MyPage params={p} />);
  ```
- `jest.env.setup.ts` sets `JWT_SECRET` and `NEXT_PUBLIC_APP_URL` before any module is loaded — add new required env vars there if a module reads them at eval time (module-level `const X = process.env.X`)
- Mock `next/headers` in backend tests that call `cookies()` — the factory must NOT reference module-level variables (they aren't initialised yet due to hoisting); configure the mock in `beforeEach` instead:
  ```ts
  jest.mock('next/headers', () => ({ cookies: jest.fn() }));
  const { cookies: mockCookies } = require('next/headers') as { cookies: jest.Mock };
  const mockCookiesGet = jest.fn();
  // in beforeEach:
  mockCookies.mockResolvedValue({ get: mockCookiesGet });
  ```
- When a response sets multiple `Set-Cookie` headers (e.g. session + clearing oauth_state), use `res.headers.getSetCookie()` (returns an array) instead of `res.headers.get('Set-Cookie')` which only returns one value

## Key files

| File | Purpose |
|---|---|
| `middleware.ts` | Edge guard for `/settings/**` — redirects to `/signin` if no session cookie |
| `lib/session.ts` | `signToken`, `verifyToken`, `getSession`, cookie helpers |
| `lib/db.ts` | `query<T>(sql, params)` — thin pg wrapper |
| `lib/email.ts` | `sendPasswordResetEmail`, `sendContactEmail` |
| `store/useStore.ts` | Zustand store — `user`, `projects`, actions |
| `db/init.sql` | Full schema DDL |
| `next.config.ts` | Security headers + `Cache-Control: no-store` for dashboard routes |
| `jest.config.ts` | Jest config — `collectCoverageFrom` includes `app/`, `components/`, `lib/`, `store/` |
| `jest.env.setup.ts` | Env vars injected before module evaluation |
