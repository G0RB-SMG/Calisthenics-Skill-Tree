# Calisthenics Skill Tree

Interactive skill tree planner. Pure static site — no build step.

## Deploy

Push this folder to a GitHub repo, then import the repo in Vercel. No configuration needed; Vercel will serve `index.html` at the root.

## Local preview

Open `index.html` in a browser, or run any static server:

```sh
npx serve .
```

## Changelog

### 2026-06-26 — Onboarding + Activity Feed
- **First-visit onboarding**: 3-step intro overlay (what the tree is → click to achieve → sign in to save), shown only to new users with no progress; "Skip" dismisses it; saved as `cali-onboarded-v1` in localStorage
- **Activity feed at `/feed`**: shows recent achievements from athletes you follow; accessible from the account dropdown
- **Recent activity block on profiles**: last 8 achievements with relative timestamps and a category-colored dot
- New `achievements` table (with timestamps) — only stores the *explicitly clicked* skill, not the auto-cascaded prereqs, so the feed stays clean
- Three new RPCs (`feed_for`, `recent_achievements`, plus the supporting table) — see `supabase-setup.md` section 6b
- New `vercel.json` rewrite for `/feed`

### 2026-06-26 — Bug fix: `/u/<handle>` crash
- Fixed `Cannot access 'initialsFor' before initialization` ReferenceError that left the profile page stuck on a red error banner
- Cause: the auth chip's Following dropdown referenced helper fns declared further down in `renderVals`; hoisted them above the auth chip block

### 2026-06-26 — Email/password sign-up
- Added email + password as an alternative to Google sign-in
- The "Sign in" chip now opens a modal with **Continue with Google** *and* an email/password form (toggle between sign-in / create account)
- If Supabase email confirmation is on, sign-up shows a "Check your email" screen and the user comes back signed in after clicking the link
- supabase-setup.md now covers the Email provider toggle (and recommends turning off email confirmation for a smoother flow)
- Started this changelog — README will be updated alongside every push from here on

### 2026-06-26 — Phase 3: follows + compare
- Follow / Following button on other-user profile pages
- "Compare with me" button → side-by-side view at `/compare/<handle>`: VS header, "you lead / they lead / tied" counts, per-category bar pairs, and three skill-chip lists (tied on, only they have, only you have)
- Account dropdown gained an expandable "Following" list with click-through to each profile
- Profile hero now shows follower / following counts
- New `vercel.json` rewrite for `/compare/:handle`

### 2026-06-26 — Bug fix: `/u/<handle>` 404s on Vercel
- Inline script writes `<base href="/">` on deep routes so relative asset srcs resolve from origin root
- Vercel rewrite `:handle` param constrained to `[a-z0-9_]+` so it can't catch asset paths like `support.js`

### 2026-06-26 — Phase 2: profile pages + leaderboard
- Public profile pages at `/u/<handle>` (avatar, tier, score, percentile, category bars, path badges, "View their tree")
- `/leaderboard` page — top 50 athletes by total skills, rows click through to profiles
- New "Leaderboard" pill next to the account chip; chip dropdown gained My profile + Leaderboard links
- Browser back/forward works across tree / profile / leaderboard
- `vercel.json` added for deep-link rewrites

### 2026-06-26 — Phase 1: Google sign-in + cloud-synced progress
- Google sign-in via Supabase (asymmetric account chip, top-right)
- One-time handle picker after first sign-in (3–24 chars, lowercase, unique)
- Progress saves to a `progress` table and pulls back on every device
- Local progress merges with cloud progress on first sign-in (no data loss)
- `config.js` carries the live Supabase URL + anon key
- `supabase-setup.md` walks through project + SQL schema + Google OAuth setup

### Earlier — Initial release
- Single-page skill tree planner with pan/zoom, minimap, sidebar stats
- Click-to-achieve with auto-cascade up the prereq chain
- Hash-based share links (`#p=…`) for read-only progress sharing
- Milestone toasts when crossing tier thresholds
- LocalStorage persistence
