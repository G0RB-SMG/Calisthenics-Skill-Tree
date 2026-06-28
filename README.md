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

### 2026-06-28 — Mobile floating buttons no longer cut off + bigger BACK button
- All three floating buttons now use `env(safe-area-inset-bottom)` + 18px clearance so iOS Safari's bottom toolbar can't clip them
- **Back button is now a labelled pill** (↶ BACK) on the bottom-LEFT with a green gradient and glow — much more obvious than the tiny circle it used to be
- Share + Settings stay as 50px circles (up from 44) on the bottom-right
- Mobile-scroll bottom padding bumped to ~110px so the path's "Start" anchor never sits under the floating buttons

### 2026-06-28 — Bug fix: stuck on "Saving…" after picking a username
- `createProfile` no longer uses the chained `.insert().select().single()` form — that pattern was returning `data=null` in some networks, which made the auth handler think the user had no profile and re-open the empty handle modal (looked like "stuck on Saving forever")
- Now does a plain INSERT and constructs the profile locally (we already know all the fields)
- Added a fast-path **pre-check** for an existing profile — handles the case where a previous attempt's request reached the server but the response was lost
- Added a **post-timeout fallback fetch** — if the INSERT call times out but the server actually processed it, we still land in 'signed-in' instead of erroring
- Reduced INSERT timeout from 15s → 10s
- Safeguarded `applyAuthState`: an unrelated auth event firing mid-submit no longer resets the typed handle / pulls the user out of "Saving…"

### 2026-06-28 — Mobile forks are literal forks now
- Forks render as a **grid of branch cards with diverging Y-lines** below them converging into your current leaf — visually a real tree fork instead of a horizontal swipe row
- Tapping a branch **commits** it as your new leaf; the fork moves up to show its children (or stops if it's the end of the line)
- New **↶ Back button** in the bottom-right (alongside ↗ Share and ⚙ Settings) — pops the most recent commitment, re-exposing the fork so you can pick a different branch
- Past path entries now show as single cards (no sibling swipe); to re-choose, hit ↶ Back until you reach the fork point
- Auto-built initial path now only walks through **achieved** skills, so the entry view always ends on what you've actually completed with the fork sitting one step above
- Layout: 2 branches side-by-side, 3 in a row, 4+ in a 2-column grid

### 2026-06-27 — Mobile view redesigned as a linear path
- Mobile view now shows a **single committed path** from "Start" up to your current leaf, one card per row
- At every fork (parent with multiple children), the row becomes a horizontal swipe — **tap any sibling to switch your branch**; the path auto-extends upward through the most-advanced unlocked branch from there
- "Pick the next skill" picker appears above your current leaf — tap one to push further up the tree
- "Swipe to pick a different branch" label appears on every fork row so the affordance is obvious
- Chosen path cards get a thicker glow + full opacity; siblings dim slightly so the current branch reads clearly
- Per-category chosen paths persist in state during the session — switching tabs preserves where you left off

### 2026-06-27 — Mobile-traversal view (new default on phones)
- Brand-new mobile UI: tap a **category tab** (push/pull/core/legs/mobility), scroll vertically through depth-rows (elite at top → "Start" at bottom), swipe horizontally at forks to pick a branch
- Auto-centers on your current progress on entry (your first available "ready" skill, or your highest-achieved one)
- Each card shows category, difficulty, figure SVG, name, and live status (ACHIEVED / READY / LOCKED) with colored borders + glow
- Tapping a card opens the existing detail panel as a **bottom sheet**
- Floating bottom-right: **⚙ Settings** sheet ("Switch to canvas view", "Share progress", "Reset progress")
- Default: mobile view on phones (<760px), canvas view on desktop — overridable in the settings sheet, persisted in localStorage as `cali-ui-mode`
- Desktop sidebar gained a **"Try mobile view"** button so you can preview the new UX on big screens
- The data-cali-mode attribute on the outer wrapper toggles the entire chrome via CSS — canvas chrome is hidden in mobile mode, mobile view is hidden in canvas mode

### 2026-06-26 — Less annoying milestone toast on mobile
- Toast now docks to the **bottom** on mobile so it can't cover the skill-panel close button
- Added a visible **×** indicator so it's obvious you can tap to dismiss
- Auto-dismiss shortened from 3.8s → 2.2s

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
