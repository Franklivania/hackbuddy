# HackBuddy Backend – Integration Docs

Base URL: **`/api/v1`** (e.g. `https://hackbuddy-im66.onrender.com/api/v1`).

All JSON responses use the wrapper:

```ts
interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T | null;
  message: string;
  success: boolean;
}
```

Protected routes require header: **`Authorization: Bearer <token>`**.

TypeScript types for all request/response payloads live in **`src/types/`** (use `import { ... } from '@/types'`). Root **`api-types.ts`** re-exports them for backward compatibility.

---

## Health (no auth)

| Method | Path | Description | Response `data` |
|--------|------|-------------|------------------|
| GET | `/health` | Liveness | `{ status: "ok" }` |
| GET | `/health/db` | DB connectivity | `{ status: "ok" }` or 500 `{ status, message }` |

*Note: Health routes are at **root**, not under `/api/v1`.*

---

## Auth

| Method | Path | Auth | Body (TS type) | Success response `data` |
|--------|------|------|----------------|-------------------------|
| POST | `/api/v1/auth/register` | No | `RegisterInput` | `null` (201) |
| POST | `/api/v1/auth/login` | No | `LoginInput` | `LoginSuccessData` (`{ token }`) |
| POST | `/api/v1/auth/verify-email` | No | `VerifyEmailInput` | `null` |
| POST | `/api/v1/auth/resend-otp` | No | `ResendVerificationInput` | `null` |
| GET | `/api/v1/auth/google` | No | — | 302 redirect to Google |
| GET | `/api/v1/auth/google/callback` | No | query: `code`, `state?` | 302 redirect to frontend with `token` or `auth_error` |
| GET | `/api/v1/auth/github` | No | — | 302 redirect to GitHub |
| GET | `/api/v1/auth/github/callback` | No | query: `code`, `state?` | 302 redirect to frontend with `token` or `auth_error` |

---

## Users

| Method | Path | Auth | Body | Success response `data` |
|--------|------|------|------|-------------------------|
| GET | `/api/v1/users/me` | Bearer | — | `User` |
| GET | `/api/v1/users/:id` | Bearer | — | `User` |
| DELETE | `/api/v1/users/me/delete` | Bearer | — | `null` |

---

## Sessions

| Method | Path | Auth | Body (TS type) | Success response `data` |
|--------|------|------|----------------|-------------------------|
| POST | `/api/v1/sessions` | Bearer | `CreateSessionInput` | `Session` (201) |
| GET | `/api/v1/sessions` | Bearer | — | `Session[]` |
| GET | `/api/v1/sessions/:id` | Bearer | — | `Session` |
| DELETE | `/api/v1/sessions/:id` | Bearer | — | `null` |

---

## Sources (per session)

| Method | Path | Auth | Body (TS type) | Success response `data` |
|--------|------|------|----------------|-------------------------|
| POST | `/api/v1/sessions/:id/sources` | Bearer | `AddSourcesInput` | `Source[]` (201) |
| GET | `/api/v1/sessions/:id/sources` | Bearer | — | `Source[]` |

*`AddSourcesInput`: at least one of `links` (URLs) or `subject_link` (URL) required.*

---

## Analysis (per session)

| Method | Path | Auth | Body (TS type) | Success response `data` |
|--------|------|------|----------------|-------------------------|
| POST | `/api/v1/sessions/:id/analyze` | Bearer | `AnalyzeInput` (optional) | `Analysis` (201) |
| GET | `/api/v1/sessions/:id/analyses` | Bearer | — | `Analysis[]` |

---

## Chat (per session)

| Method | Path | Auth | Body (TS type) | Success response `data` |
|--------|------|------|----------------|-------------------------|
| POST | `/api/v1/sessions/:id/chat` | Bearer | `ChatInput` | `Message` (assistant reply) |

---

## Admin (Bearer + admin role)

| Method | Path | Auth | Body (TS type) | Success response `data` |
|--------|------|------|----------------|-------------------------|
| GET | `/api/v1/admin/users` | Bearer Admin | — | `User[]` |
| GET | `/api/v1/admin/sessions` | Bearer Admin | — | `Session[]` |
| GET | `/api/v1/admin/analyses` | Bearer Admin | — | `Analysis[]` |
| PATCH | `/api/v1/admin/role/:user_id` | Bearer Admin | `UpdateRoleRequest` | `UpdateRoleSuccessData` |
| DELETE | `/api/v1/admin/user/:user_id/delete` | Bearer Admin | — | `null` |
| DELETE | `/api/v1/admin/user/:user_id/hard-delete` | Bearer Admin | — | `null` |

---

## Error responses

- **400** – Validation or business rule (e.g. email in use). `data` may be `ValidationErrorItem[]` or string.
- **401** – Missing or invalid token.
- **403** – Valid token but insufficient role (e.g. admin required).
- **404** – Resource not found (session, user, etc.).
- **500** – Server error.

Use **`@/types`** (or `src/types`) for exact TypeScript types of all request bodies and response `data` shapes.
