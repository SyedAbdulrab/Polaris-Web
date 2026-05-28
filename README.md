# Polaris — Web

Next.js 14 (App Router) + TypeScript + Tailwind + Recharts. Dark, single-page dashboard for the
Polaris API. The backend (and Terraform for AWS / Azure / GCP) lives in a separate repo:
**polaris**.

## Pages

- `/login` — login + register tabs
- `/dashboard` — the whole show

The dashboard pulls from the backend's `/api/v1/dashboard` endpoint (one call, everything
included) and renders:

- Headline metric cards: projected MRR, savings rate, monthly income / expenses
- 12-month projection chart (baseline / upside / downside)
- Income vs expenses area chart from the snapshot history
- Streak cards with inline "log today" / "break"
- Recent log entries (last 14)
- Goal progress bars
- A "Quick add" panel that creates income / expense / streak / log inline
- Buttons to **Take snapshot**, **Export JSON**, **Monthly PDF**, **Logout**

## Run it

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev                  # serves on http://localhost:3001
```

## Auth

Tokens land in `localStorage` (`polaris.accessToken`, `polaris.refreshToken`, `polaris.user`).
`lib/api.ts` is a thin fetch wrapper with auto-refresh: on 401 it tries the refresh token once,
then falls back to redirecting to `/login`.
