# Calisthenics Skill Tree

An interactive skill tree for bodyweight training — 218 skills across Push, Pull, Core, Legs, and Mobility, connected by real prerequisites. Static site (pure HTML/JS), Supabase for auth + sync.

## Features

**Tree exploration**
- Full canvas view with pan / zoom / minimap — every skill placed by category with connections showing prereqs
- Mobile view: vertical path through one category at a time, forks presented as concept branches ("Hips", "Splits", "Handstand", …) that auto-walk through single-child chains
- Search any skill by name; jump straight to it in either view

**Progress tracking**
- Tap a skill to mark it achieved — prereqs cascade automatically
- Per-category progress + hardest skill callout + visit streak
- Anonymous by default (localStorage); optional sign-in syncs across devices

**Ranking system**
- 9 tiers × 3 sub-tiers (Copper III → Grandmaster I) + a **Wizard** apex rank for full-tree completion
- Score = rarity-weighted sum of achieved skills, with Push + Pull weighted 1.5× and a per-category hardest-skill bonus
- Grandmaster gated behind ≥1 world-class skill (Full Maltese, Fingertip Full Planche, Victorian, One-arm FL, Manna, Pelican, Hefesto, Iron Split, Archer FL Pullup, Fingertip Full Planche Press, One-arm HS free)
- Metal-gradient hex badges everywhere the rank appears — sidebar, profile, leaderboard, account chip
- Click any tier badge to see the full ladder with score thresholds and gate hints

**Goals**
- Pick a target skill; the tree highlights the prereq chain to it and the sidebar shows "N of M steps · Next: X · Go to next →"
- Toggle full "goal mode" to dim everything not on the path

**Social**
- Public profiles at `/u/<handle>` — bio, avatar (upload / pick icon+color), stats, tier badge, best-at, recent activity
- Global leaderboard sorted by tier then score
- One-click follow (Twitter-style, asymmetric)
- Compare with any user side-by-side at `/compare/<handle>`
- Activity feed of people you follow
- Share your progress by link (hash-based, works while anonymous)

**Auth**
- Google sign-in + email/password
- Mobile-Safari session persistence: visibility/pageshow/focus handlers force a refresh on foreground so JWTs expiring while backgrounded don't kick you out
- `signOut({ scope: 'local' })` — signing out on one device won't kill others

## Deploy

Push this folder to a GitHub repo, then import the repo in Vercel. No configuration needed; Vercel will serve `index.html` at the root.

## Local preview

Open `index.html` in a browser, or run any static server:

```sh
npx serve .
```

## Changelog

### 2026-07-02 — Push layout spread + legs/mobility shifted right
Bumped inter-column spacing in push from ~80-100px to 160px so long labels ("Fingertip pike bent-arm press", etc) stop overlapping.
- **Push spans**: x=120 to x=2360 (width 2240; was 120 to 1520). Every column now 160 apart from its neighbor.
- **Legs shifted +980**: now x=2520 to 3180 (was 1540 to 2200).
- **Mobility shifted +980**: now x=3330 to 4430 (was 2350 to 3450).
- Gaps: 160 between push and legs, 150 between legs and mobility. Same relative layout, just wider.
- Pull and core untouched.
- Header comment updated with new root positions.
- No changes to prereqs, IDs, difficulties, descriptions, or badges.

### 2026-07-02 — Push tree canvas layout: compact tree shape
Repositioned all 91 push nodes for a proper trunk-and-branches look, keeping push contained within its own x-space (x=120–1520) so it no longer crashes into legs (x≥1540) or mobility (x≥2200).
- **Trunk (x=520)** is now a single vertical column: `plank → knee_pu → incline_pu → pushup → pppu_lean → tuck_planche → adv_tuck → one_leg → half_lay → straddle → full → weighted full`. Cleanest read of the base progression.
- **Fingertip variants sit adjacent to their non-fingertip parents** as sub-branches (not spread out as far-right columns):
  - fingertip push-up column at x=220 (next to bent-arm push-up at x=120)
  - fingertip planche at x=600 (next to planche core at x=520)
  - fingertip planche PU at x=800 (next to planche PU at x=720)
  - fingertip BA press at x=1300 (next to BA press core at x=1220)
  - fingertip SA press at x=1480 (next to SA press at x=1400)
- **Branch fan-out from pushup**: dip line (x=360) LEFT of trunk; planche continues UP trunk; planche PU + fingertip PPU RIGHT of trunk; then handstand → BA press → SA press → maltese in a clean rightward sweep.
- **Maltese endgame** (`full_maltese`, `fingertip_full_maltese`) placed at x=1520 — close to legs boundary but only 2 nodes, both at y≤-1400 where no legs node exists (legs' highest y is around y=-900).
- No changes to prereqs, difficulties, descriptions, badges, or IDs — only x,y positions.

### 2026-07-02 — Push rework hotfix: duplicate `inverted_cross` removed
- The 2026-07-01 push rework left a stale `inverted_cross` node in the pull section (from an older layout). Because it was declared later in the array, JS map insertion order silently overrode the new node — so `inverted_cross`'s prereq was still `ring_hspu` at runtime instead of the intended `ring_handstand`, and push count showed 92 instead of 91.
- Deleted the stale duplicate. Push count now correctly 91; `inverted_cross` correctly built on `ring_handstand` (handstand sub-branch).

### 2026-07-01 — Push tree rework: 49 → 91 nodes
Complete overhaul of the push category. Pull / core / legs / mobility untouched.
- **Deleted 5 nodes**: `straddle_maltese`, `fingertip_straddle_maltese`, `press_to_hs_tuck`, `press_to_hs_straddle`, `press_to_hs_pike` (last 3 replaced by the new bent-arm press chain).
- **Renamed** (display names only; IDs kept so existing user progress is preserved): "Parallel-bar dip" → **Bar dip**, "Bulgarian dip" → **Ring dip** (also diff 6→5, rarity ~3%→~10%).
- **`adv_tuck_planche` redefined** — now knees rotated down to floor (feet up/back), not tucked to chest. New description, cues, mistakes, and standard.
- **Half-lay ↔ one-leg swap**: `half_lay_planche` now diff 8 / ~0.1% (above one-leg in the chain); `one_leg_planche` stays diff 7 / ~0.35%. Prereq chain now `adv_tuck → one_leg → half_lay → straddle`.
- **7 new sub-branches with ~47 new nodes**:
  - **Dip**: 5 new (single-bar, deep-ROM, weighted, clapping, russian dip)
  - **Planche push-up**: 5 new tiers (tuck → adv tuck → one-leg → half-lay → straddle → planche PU → weighted → pelican)
  - **Straight-arm press**: 5 new (tuck press → adv tuck → pike SA → straddle → full planche press → full maltese press)
  - **Bent-arm press**: 5 new (tuck → pike → straddle 90° → 90° → dead press)
  - **Fingertip push-up**: 5 new (pushup → decline → diamond → archer → OAP)
  - **Fingertip planche + planche PU + SA press + BA press**: full fingertip counterpart chains (~22 new)
- **Prereq reassignments**: `crow` now requires `wall_hs_hold` too; `wall_hspu_neg` requires `chest_to_wall`; `ninety_pu` moved into the bent-arm press chain with body-flat emphasis; `pelican` now built on `weighted_planche_pu` + `full_bl`; `full_maltese` re-parented on `full_planche` (was `straddle_maltese`).
- **Badges**: expanded `iron_dipper` (all 7 dips), split `press_master` into `ba_press_master` + `sa_press_master`, added `planche_pu_line` + `fingertip_pushup_line`, moved `inverted_cross` from `hspu_master` to `handstand_vet`, trimmed `maltese_master` + `fingertip_god` for the deleted nodes.
- **⚠ Flagged rarity correction**: spec said `straddle_ninety_press` was ~0.15%, but its prereq `straddle_planche` is ~0.1% — impossible for a child to be more common than its prereq. Set to ~0.08%. Bump either value if the intent was different.
- Push count now 91 (was 49). Total tree 218 skills.

### 2026-07-01 — Mobile stats widget + drawer
The mobile view now has a bottom-of-screen widget bar and full stats drawer, bringing sidebar-equivalent info to mobile.
- **Compact widget** (always visible, fixed at bottom): hex tier badge on the left (tap → rank ladder modal), tier name + progress bar + streak in the middle, score + expand chevron on the right. Tap anywhere → opens the drawer.
- **Full drawer** (slides up from bottom): big Overall Tier card with metal-gradient hex, progress bar to next tier, score + percentile + skill count, streak stat, per-category breakdown (all 5 categories with progress + mini tier badge + percentile + pts), account section (profile/leaderboard/feed/settings for signed-in users; sign-in CTA for anon), actions section (switch to canvas / share / reset / sign out).
- **Floating buttons cleaned up**: Share and Settings floating circles are gone (their functions live in the drawer now). Back button remains as the sole floating action above the widget.
- Constellation vibe: dark radial background, subtle glow on the tier badge, drawer has a drag handle at the top.
- Same rank ladder modal as canvas view — one component, three entry points now (profile page, sidebar tier card, mobile widget hex badge).

### 2026-07-01 — Sidebar tier card is now clickable
- The "Overall Tier" card in the sidebar (canvas view) is now a button that opens the same full rank-ladder modal as the "See all ranks" button on your profile
- Added a small "SEE ALL ›" hint in the card header so users know it's clickable
- Hover state on the card (background brightens slightly, border becomes more visible)
- The ladder modal is one component — this just wires up a second entry point to it

### 2026-07-01 — Mobile-Safari sign-in persistence
Fixes the bug where users on mobile got logged out after closing/reopening the browser.
- **Foreground revive**: added `visibilitychange` / `pageshow` (bfcache) / `focus` handlers that force a session refresh whenever the tab comes back. Safari pauses the SDK's auto-refresh timer while backgrounded — without this fix, a JWT that expired during the backgrounded window would leave the session stale and the next API call would kick the user out.
- **`signOut()` now uses `scope: 'local'`** — previously used the default `global` scope, which invalidated refresh tokens on ALL your devices. Signing out on desktop was silently killing the mobile session (and vice-versa).
- **Transient `TOKEN_REFRESHED` with null session** — now ignored instead of triggering sign-out (was rare but possible during network hiccups).
- Docs: `supabase-setup.md §3c` now includes a "Mobile-Safari-specific notes" block explaining the timer-pause behavior, ITP 7-day eviction, and the Add-to-Home-Screen escape valve.

### 2026-07-01 — Rank visibility polish + leaderboard tier fix
- **Leaderboard now shows tiers correctly.** The RPC was only returning `total_skills` and not the `checked[]` array — so the client's tier computation ran on an empty set and everyone rendered as "Unranked". Fixed in `supabase-setup.md` (§6c updated leaderboard + following_for). **Run the updated SQL block to see it working.**
- **Beefier progress bar on profile page** — bumped from 5px to 8px, added inline labels: current tier (left), points to next tier (center), next tier name (right). Glowy accent tinted to your tier color.
- **New "See all ranks" button** on the profile tier card — opens a full 28-row ladder modal showing every tier (Wizard on top → Copper III at bottom), score thresholds, and gate requirements. Your current row is highlighted with a green tint + "YOU" badge.
- Wizard apex row shows "ALL skills" with the note "Every skill on the tree — rarer than any single element".
- Grandmaster tier III row shows "†Requires ≥1 world-class skill" hint so users know the gate exists.

### 2026-07-01 — Grandmaster gate expanded + tier-up hint no longer hidden by locked prereqs
- Added **Fingertip full planche press** and **Archer FL pullup** to the Grandmaster gate list (now 11 skills)
- Fixed the "Tier-up: achieving this would bump you to X" hint in the detail panel — it now shows on **any** unachieved skill that would bump your tier, not just skills whose prereqs are already met. Previously it was hidden on things like Full Maltese if you hadn't done the prereq chain yet, even though the hint is aspirational

### 2026-07-01 — Rarity recalibration for all 176 skills
- Every `rarity` field in `skills.js` reset using a consistent framework:
  - Denominator = physically active adults (2-3×/week)
  - Power-law by difficulty (roughly halves per step)
  - Category multipliers: push ×1.0, pull ×0.85, core ×0.9, **legs ×0.6** (under-trained in calisthenics), **mobility ×1.3** (higher genetic variance)
  - Diff-10 sub-tiered internally: Common (hundreds globally), Rare (dozens), Mythical (a handful ever)
  - Monotonic constraint enforced (a skill's rarity ≤ its rarest prereq)
- 20 skills that had no `rarity` field at all (e.g. Push-up, Dead hang, Side plank, Glute bridge, Weighted pull-up, Scap pulls…) now have one.
- Notable moves:
  - **Pelican**: 0.01% → 0.003% (10R)
  - **Manna**: reclassified 10-Common → 10-Rare (0.005%)
  - **One-arm handstand (free)**: reclassified 10-Common → 10-Rare (0.002%)
  - **Full maltese**: reclassified 10-Rare → 10-Mythical (0.0005%)
  - **One-arm front lever**: reclassified 10-Rare → 10-Mythical (0.0002%)
  - **Weighted full FL** and **Weighted full FL pullup**: brought into line with each other (0.02% and 0.003%)
- Diff values untouched. Names, prereqs, descriptions, cues, standards — all untouched.

### 2026-06-30 — Diff recalibration pass (push 1 of N)
- **Drops from diff 10:**
  - Iron cross (Pull) → 9
  - 90° HSPU (Push) → 8
  - Weighted full FL pullup (Pull) → 9
  - Weighted full front lever (Pull) → 9
  - Sissy squat (Legs) → 9 — still the apex leg skill
  - Straddle maltese (Push) → 9
  - One-arm pull-up (Pull) → 9 — too common (~0.1%) to share a row with Victorian (~0.002%)
- **Drops from diff 9:**
  - Natural leg extension (Legs) → 8
  - One-arm handstand (fingertip-assisted) (Push) → 8 — much less rare than other 9s
- **Bumps up:**
  - Dragon flag (Core): 7 → 8
  - L-sit (Core): 4 → 5
- **Drops:**
  - Diamond push-up (Push): 5 → 4
- **Iron cross removed from the Grandmaster gate list.** Since it's now diff 9, it doesn't count as world-class apex anymore. The 9 remaining gate skills (Full Maltese, Fingertip Full Planche, Victorian, One-arm FL, One-arm HS free, Manna, Pelican, Hefesto, Iron Split) still unlock Grandmaster overall. Iron cross stays in the per-category Pull gate (still elite for pull specifically).
- All score thresholds and tier badges unchanged — these are pure data-side recalibrations. Existing ranks will shift slightly down or up depending on which skills the user has.
- **Rarity (`~0.04%` etc.) values still need a pass** — saved for a separate round.

### 2026-06-30 — Ranking push 3: world-class gate finalized
- **Grandmaster overall gate** expanded from 3 to 10 skills. Achieving any of these now unlocks the Grandmaster tier (overall): Full Maltese, Fingertip Full Planche, Victorian, Iron Cross, One-arm Front Lever, One-arm Handstand (free), Manna, Pelican, Hefesto, Iron Split.
- **Per-category gates updated**:
  - Push: added Pelican
  - Pull: added Hefesto (Victorian / Iron Cross / One-arm FL already there)
  - Mobility: fixed Iron Split ID
- **Legs category caps at Master I.** No leg skill on the current tree is hard enough to count as world-class; Legs Grandmaster is intentionally locked off until harder skills get added.

### 2026-06-30 — Ranking push 2: tier-bump hints + PROMOTED celebration modal
- **Detail panel tier-bump hint** — clicking any unachieved, available skill now shows a "TIER-UP / Achieving this would bump you to **Silver II**" callout (only when achieving it would actually move you up; silent otherwise). Computed by comparing your current tier against a hypothetical "checked + this skill + ancestors" set.
- **PROMOTED celebration modal** — toggling a skill that bumps you up a tier now opens a big animated reveal:
  - Backdrop fades in, card scales+bobs into place
  - Big metal hex badge with the new sub-tier numeral, scaling/rotating in from below
  - "PROMOTED" label, tier name in the tier's color, "From Silver III" prev-tier line
  - Conic-gradient rays spinning slowly behind the card
  - Shimmer sweep across the badge face
  - "Onward →" CTA dismisses; clicking the backdrop also closes
- Special-cases:
  - First-ever rank (Unranked → Copper III) reads "**You're ranked!**" instead of "Promoted"
  - Wizard apex shows "**You did the impossible**" with a ★ instead of a sub-numeral
- Only fires on ADD (you don't get celebrated for un-checking; no rank-down toast)
- 220ms delay before opening so the achievement flash animation lands first

### 2026-06-30 — New ranking system: 9 tiers × 3 sub-tiers + Wizard apex
- **Brand-new tier ladder** replaces the old 6-tier `Novice → World-class` system:
  Copper → Bronze → Silver → Gold → Platinum → Emerald → Diamond → Master →
  Grandmaster (+ secret **Wizard** rank for full tree completion). Each main
  tier has 3 sub-tiers (III → II → I, low to high), so 27 ranks total + Wizard.
- **New score formula**: per-skill `diff^1.7` with **1.5× weighting on Push +
  Pull** (the longest, hardest trees); per-category bonus = `max_diff × 5`.
- **Hard gates** on the top ranks:
  - 0 skills → Unranked (no tier badge)
  - Grandmaster requires **at least one world-class skill** (`full_maltese`,
    `fingertip_full_planche`, or `victorian`) — without one you cap at Master I
  - Wizard requires **the entire tree** (insanely rare)
- **Metal-gradient hex badges** (clip-path polygon + gradient + roman-numeral
  sub-tier overlay) on:
  - Sidebar "Overall tier" card (with next-tier hint + progress bar)
  - Profile page (big badge at top)
  - Per-category sidebar rows (mini hex badge)
  - Account chip in top-right (tiny next to username)
  - Each leaderboard row (rank-aware badge)
- **Leaderboard** now sorts by **tier idx first**, then by score within tier —
  matches how every ranked-game ladder works.
- No SQL or schema changes — entirely client-side; existing data works as-is.

### 2026-06-30 — Mobile: forks are now side-by-side
- Replaced the grid layout (which wrapped to 2 columns when 4+ branches, stacking them vertically) with a **horizontal scroll row** — branches are always side-by-side like picking a path on a map.
- Cards fit 1-3 branches centered on screen with no scroll; 4+ branches you swipe horizontally with scroll-snap to lock onto each.
- Replaced the diverging Y-lines below the branches with a clean single-trunk descender + junction dot (the per-branch lines didn't make sense when the row could overflow / scroll).
- Applies universally to every category's fork — Pull (which has 5 branches after Dead Hang), Push, Mobility, etc.

### 2026-06-30 — Fix: fork diverging lines were invisible
- Dropped the `.cali-fork-line` class — its `opacity: 0` initial state + `stroke-dasharray: 240` overrode the inline `3 4` dash pattern, and the draw-in animation got stuck pending due to React re-mounting the SVG paths every render. Lines stayed invisible.
- Lines now render with the inline dashed attrs immediately at 60% opacity, no animation. Matches the constellation aesthetic without the broken effect.

### 2026-06-30 — Mobile redesign push 4: fork branch cards
- Fork branch cards (the 2-3 choices above the path leaf) now match the constellation aesthetic:
  - **Translucent backgrounds** with a hue-tinted wash instead of opaque dark cards — lets the star field show through
  - **Constellation corner brackets** (four L-shapes at each corner) — star-chart bookmark look
  - **"⟡ PICK A BRANCH" header** flanked by short constellation lines (matches the Elite cap style)
  - **Status pip** under the gem: "✓ DONE" / "ready" / "locked" in tiny monospace caps with category color
  - **Dashed diverging Y-lines** below the cards (3-4 dash pattern, thinner stroke) with a junction dot where they meet the trunk
  - Lines animate IN on mount via `stroke-dashoffset` — they "draw" themselves from the gem down to the trunk
- Mobile-redesign sprint complete — pushes 1-4 shipped.

### 2026-06-30 — Mobile redesign push 3: tactile animations
- **Tap press** — mobile cards briefly scale down to 0.97 on touch (`.mobile-card:active`). Pure CSS, works on touch + mouse.
- **Newly-available pulse** — when a tap unlocks a previously-locked node (its prereqs are now met), that node pulses 3× with a slow expand + accent-color glow.
- **Achievement flash** — toggling a skill to checked fires a brief radial white ring on the card (and on every cascaded prereq that became achieved).
- **Category cross-fade** — switching tabs fades the scroll container out (~180ms), swaps category mid-fade, and fades back in.
- All transient effects are driven by `data-just-achieved` / `data-just-unlocked` attrs that auto-clear after the animation finishes — they don't re-trigger on subsequent renders.

### 2026-06-30 — Mobile redesign push 2: gem-style constellation nodes
- Replaced the stick-figure SVGs on mobile path cards + branch cards with **gem-style constellation nodes** — outer ring with radial gradient + box-shadow glow, bright inner dot.
- Three visual states per node:
  - **Achieved**: bright core, pure-white dot with heavy glow ("the star is lit")
  - **Available/Ready**: medium core, hue-colored dot with strong glow
  - **Locked**: flat, no glow, dim grey dot
- Glow intensity is heaviest on path cards, gentler on smaller fork cards.
- All driven by inline styles (no class state machine), so the look survives direct-manipulation edits.

### 2026-06-29 — Mobile redesign push 1: star-field constellation aesthetic
- **Star-field background** behind the mobile view — radial deep-navy gradient + 22 twinkling dots (some bigger with subtle glow, all on slow 4-6s cycles). Replaces the flat dark-purple panel.
- **5-star difficulty** replaces the old `DIFF X` pill on both branch cards and path cards. Uses half-star precision via a percentage-fill overlay (e.g. DIFF 3 = 1.5 stars, DIFF 7 = 3.5 stars). Star color matches the category.
- **Halo on the focused (available) path card** — slow breathing glow with the category hue, gives the "your next move" card a tactile presence without distracting from achieved cards.
- **Elite cap refresh** — replaces the "ELITE ↑" header with `✦ ELITE` flanked by short constellation lines, plus a `⟡ Choose path` label above forks.
- **Header rebrand** — `★ Skill chart` subtitle (instead of plain "Skill tree") in the constellation accent color.
- Pushes 2-4 (gem-style node figures, tap animations, fork-card restyle) coming next.

### 2026-06-29 — Best-at callout · Feed skill popover · Account-features now sign-in gated
- **"Best at" callout on every profile** replaces "Hardest you could attempt". Two side-by-side cards:
  - **Strongest**: highest-ranked category by percentile (e.g. "Core · Top 5%")
  - **Hardest achieved**: highest-diff skill ticked (e.g. "Front lever · DIFF 8") — clickable, takes you to the tree
- Both shown for any profile (yours or someone else's) — celebrates accomplishments, doesn't leak future moves.
- **Feed skill mentions are now clickable.** Click any skill name in the feed → small popover with the skill's description, standard, prereqs, and a "View on tree →" button. Click outside to dismiss. The @handle stays clickable too — goes to that user's profile.
- **Account features gated behind sign-in.** Anonymous users:
  - Don't see the Leaderboard pill in the top-right header
  - Are bounced home + sign-in modal opens if they navigate to `/leaderboard`, `/feed`, `/u/<handle>`, or `/compare/<handle>`
  - Can still use the tree itself completely (progress saves to localStorage)
- Result: no such thing as a "signed in but empty" account — once you're signed in, you've gone through the handle picker and you have a real profile.

### 2026-06-29 — Critical hotfix: stuck on "Pick a username" prompt
- Last push added a `goal_skill_id` column to PROFILE_COLS in `auth.js`. If you hadn't run § 6d yet, that column doesn't exist in your DB → the profile SELECT 400'd → `fetchProfile` returned null → app showed the handle picker for users who already have a handle. Picking the existing handle then said "taken" (taken by yourself).
- **Fix:** `fetchProfile` and `getProfileByHandle` now **gracefully retry** without the optional columns if the first SELECT errors. App works whether or not § 6d has been run.
- `checkHandleAvailable` now selects only `id, handle` — same reason; was selecting full PROFILE_COLS and failing the same way.
- Goal sync to the server still requires § 6d, but the app no longer breaks if you haven't run it yet — goal just stays local until the column exists.

### 2026-06-29 — Goal / target skill
- **Pick a target skill** ("Front Lever", "Planche", etc.) and the canvas highlights the prereq chain leading to it. Set via:
  - The new **Set as goal ⚐** button in any skill's detail panel
  - The new **⚐ button** next to each result in the Search modal
  - **Right-click** any node on the canvas
- **Sidebar Goal card** shows: target name, X of N steps done, progress bar, the next concrete skill you can attempt, and a "Go to next →" button that pans/zooms the canvas to it.
- **Highlight mode toggle** (◉ ON / ◯ OFF pill in the card). When ON: chain nodes pop, target node pulses, all other nodes dim to 22% opacity, and non-chain connections fade out.
- Goal syncs to your Supabase profile (`profiles.goal_skill_id`) when signed in, falls back to localStorage otherwise. New **`supabase-setup.md` § 6d** documents the one-line SQL — without it the goal works fine locally but doesn't sync across devices.
- When viewing someone else's shared progress link, the Set-as-goal button is hidden (doesn't make sense to set someone else's progress as your goal from there).

### 2026-06-29 — Upload your own profile photo
- **New "Upload photo" section** in Settings — pick a JPEG/PNG/WebP/GIF and it's resized client-side to 512px (avoids shipping 5MB phone snaps) before uploading to Supabase Storage.
- Uploaded photos render everywhere: account chip, sidebar following dropdown, profile page, compare cards, leaderboard, feed.
- Photo wins over emoji icon wins over initials. Picking a photo dims the icon + color pickers below (since they're overridden anyway), and a "Remove" button clears it back to the icon/initials.
- Storage uses a new public `avatars` bucket under `${user_id}/avatar-${ts}.${ext}` so each upload has a unique URL (no stale-cache issues).
- **New `supabase-setup.md` § 3d** — walks through creating the public `avatars` bucket and the four storage RLS policies. Run before pushing this build or the Upload button shows an error (icon picker keeps working though).

### 2026-06-29 — Streaks are now login-based + auth persistence hardened
- **Streak counts visits, not achievements.** Opening the app records today's
  date locally; the streak is consecutive days the app was opened. Way more
  forgiving than the old "you must achieve a skill every day" rule, which
  basically broke any streak by week 2.
- "✓ Today" tag next to the streak number on the profile page so the user
  sees the visit was recorded.
- Streak still only shows on the user's own profile (check-ins are local to
  the viewer's browser) and in the sidebar tier card.
- **Supabase client now uses an explicit `storageKey`** + pinned localStorage
  + PKCE flow so sessions survive cleanly across tab close / browser restart
  with no collisions.
- **New `supabase-setup.md` § 3c** — documents how to extend session lifetime
  to 30 days and explains the "verify via email every time" issue (almost
  always `Confirm email` being ON, or signing in with magic links instead of
  password). Pass these settings on to your friend's account once you've
  applied them in the dashboard.

### 2026-06-29 — Profile polish: streaks, sparkline, hardest-next, achievement dates, skeletons
- **Streak stat** — current consecutive-day streak shown on profile (next to the sparkline) and in the sidebar tier card. Skipping today doesn't break the streak immediately — only an empty *yesterday* does.
- **30-day sparkline** on profile page — small SVG bar chart of achievements per day, accent color tied to the user's tier.
- **"Hardest you could attempt"** callout on your own profile — finds the highest-diff skill where every prereq is checked but the skill itself isn't. Tap to jump to it.
- **Achievement dates in detail panel** — clicking an already-achieved skill now shows when it was achieved (when the timestamp is known; older achievements logged before the table existed won't have one).
- **Loading skeletons** on profile / leaderboard / feed / compare pages — replaced the plain "Loading…" text with shimmer blocks that match each page's layout.
- All driven by a new `myAchievements` state slot (up to 500 rows loaded on sign-in). Toggling a skill updates it optimistically — no extra round-trip needed.
- No new SQL required — uses the existing `recent_achievements` RPC.

### 2026-06-28 — Pull tree shifted right (closer to the rest of the trees)
- All pull skills shifted +600 in x. Pull tree now spans -3200 (iron cross) to -1100 (FL pullups). Dead hang at -1600. Closer to core/push without overlapping anything.

### 2026-06-28 — Push tree restructure + canvas cleanup
- **Push tree restructured to match pull's pattern**: trunk extends to first strict push-up, then forks into 6 branches
  - **Trunk**: plank → knee_pu → incline_pu → pushup (no forks below pushup)
  - **6 branches from pushup**: Push-up Mastery, Dips, Handstand, HSPU, Press to HS, Planche
  - **Push-up Mastery** is now a single linear chain: decline → diamond → ring → archer → one-arm (ring_pu folded into the chain)
  - **crow** and **wall_hs_hold** moved from `pre: ['plank']` to `pre: ['pushup']` so they branch from the same fork as everything else
  - **pppu_lean** and **tuck_planche** simplified to linear prereqs in the planche entry chain
  - Sub-branches off **full_planche**: Maltese, Planche Presses, Fingertip variants (Planche Presses `ninety_pu` simplified to require only `full_planche`)
  - Cross-deps cleaned: `wall_hspu_neg`, `freestanding_hspu`, `press_to_hs_tuck` no longer require both planche AND handstand prereqs
- **Pull canvas layout fix**: branches were colliding with core's columns (iron cross at x=-100 was right next to core's human flag at x=-130). Compacted pull tree leftward:
  - Iron cross: -100 → **-3800**
  - Back lever: -800 → **-3300**
  - Muscle-up sub: -3600 → **-3000**
  - Pullup Mastery: -2900 → **-2600**
  - FL pullups: -1500 → **-1700**
  - Pull span now -3800 to -1700, well clear of core's leftmost at -630
- **Legs branch label**: `quad_crusher` now shows as **"Quads"** on the mobile fork picker (was "Shrimps")
- `push_up_vet` badge renamed: "Push-up Vet" → **"Push-up Mastery"** (matches branch label)
- Core + Mobility: no changes — branches were already organized correctly

### 2026-06-28 — Pull tree restructure: 5 clean branches from pull-up
- **Trunk extended to pull-up**: dead_hang → scap_pulls → negative_pullup → chin_up → pullup. No forks below pull-up — every branch starts at the first strict pull-up.
- **5 branches from pull-up**:
  - **Pullup Mastery** (x=-2900): weighted → chest_to_bar → l_sit_pullup → archer → typewriter → OAP negative → assisted OAP → one-arm pullup. Now a single linear chain (l_sit_pullup folded in).
  - **Front lever holds** (x=-2200): tuck → adv tuck → half-lay → one-leg → straddle → full → weighted full → one-arm FL. Linear.
  - **FL pullups** (x=-1500): independent branch, each tier no longer requires the matching FL hold (it's a pull-up shape, not a hold). Tops out at typewriter → archer FL pullup. Sub-fork to **Victorian** at weighted full FL pullup.
  - **Back lever** (x=-800): now includes skin-the-cat + german hang (the BL shoulder-mobility prep) → tuck → adv tuck → straddle → full → BL raise → Hefesto. Linear.
  - **Iron cross** (x=-100): ring support → ring L-sit → assisted iron cross → iron cross. Independent of front-lever progress.
- **Muscle-up sub-branch** (x=-3600) hangs off chest_to_bar inside Pullup Mastery (`bar_mu_kipping` → strict → ring kipping → strict → L-sit ring MU → L-sit bar MU).
- **Victorian** now requires only weighted_full_fl_pullup (no longer iron_cross). Placed at the apex of the FL pullups area.
- **Removed**: `inverted_row` (vestigial — wasn't gating anything important), `explosive_pullup` (was redundant with chest_to_bar as the muscle-up gate)
- Branch label updated: `pull_up_vet` badge now reads as **"Pullup Mastery"** on the mobile fork picker
- Badge skill lists updated: `front_lever_vet` no longer lists skin_the_cat/inverted_row; `back_lever_vet` adds skin_the_cat; `muscle_up_vet` drops explosive_pullup; `iron_cross` no longer lists victorian (victorian falls back to its own name as a leaf)
- `inverted_cross` is and remains a `push` skill (it's the push-side inverted variant); not affected here

### 2026-06-28 — Mobile: branch cards labeled by concept, not destination
- Branch picker cards now show the **branch concept** ("Hips", "Splits", "Hamstrings", "Knees", "Shoulders", "Compression", "Push-ups", "Planche", etc.) instead of the destination skill name
- Labels are pulled from the existing badge groupings — every branch's first skill maps to its badge → human-readable short name
- Card footer now reads "N steps → / ends at: [destination skill]" so you still see exactly where the branch lands
- Falls back to destination-skill name for the rare branch that doesn't map to a badge (e.g. the root entry node)
- Manual navigation now stops at every fork: `commitMobileBranch` and `popMobilePath` only auto-walk through single-child chains, never auto-pick at sub-forks. Initial path still uses achieved-pick so you land at the top of your current progress on first load.
- `popMobilePath` re-extends through chains if you back all the way out — so back→back→back lands you at the first real fork, never at an empty/start state

### 2026-06-28 — Mobile: scroll through chains, only pause at real forks
- Initial path build + post-commit auto-extension now follow **single-child chains automatically**, so the path only "stops" at points where you genuinely have a choice — no more tapping each intermediate skill just to advance
- Branch picker cards now show the **whole branch's destination** instead of just the first node:
  - The card's figure + name reflect the end of the chain (the next decision point or terminal skill)
  - DIFF badge shows the end skill's difficulty
  - A footer reads "N steps → / starts: [first skill]" so you still see what you're immediately committing to
- Committing a branch auto-walks past all single-child intermediates, plus any sub-forks you've already achieved at — lands you at the next real decision point or the top of the line
- Single-step branches (no further chain) still render as the simple "first skill" card with no footer

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
