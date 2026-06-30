# Supabase setup — Calisthenics Skill Tree

The app is scaffolded for Google sign-in + cloud-synced progress via Supabase.
Until you complete the steps below, the account UI stays hidden and the app
behaves exactly as before (local-only progress in localStorage).

## 1. Create a Supabase project

1. Go to <https://supabase.com> and create a free account.
2. **New project** — pick any name. Save the database password somewhere.
3. Wait ~1 minute for provisioning.

## 2. Run the schema

In the Supabase dashboard → **SQL Editor** → **New query**, paste the SQL below
and click **Run**.

```sql
-- ─── profiles ─────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  handle       text unique not null check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

-- ─── progress ─────────────────────────────────────────────────────────
create table public.progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  checked    text[] not null default '{}',
  updated_at timestamptz default now()
);

-- ─── RLS: anyone can read, owner can write ────────────────────────────
alter table public.profiles enable row level security;
alter table public.progress enable row level security;

create policy "profiles_read_all"   on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "progress_read_all"   on public.progress for select using (true);
create policy "progress_insert_own" on public.progress for insert with check (auth.uid() = user_id);
create policy "progress_update_own" on public.progress for update using (auth.uid() = user_id);
```

> `profiles_read_all` and `progress_read_all` are deliberate — they make public
> profiles and (later) leaderboards possible. Sensitive auth data lives in the
> `auth.*` schema which isn't exposed.

## 3. Enable Google sign-in

In Supabase dashboard → **Authentication → Providers → Google**:

1. Toggle Google **on**.
2. Open the linked Google Cloud Console page.
3. Create an OAuth client (Web application). For **Authorized redirect URIs**,
   paste the one Supabase shows on that page
   (`https://<your-project>.supabase.co/auth/v1/callback`).
4. Copy the **Client ID** and **Client secret** back into Supabase's Google
   provider form. Save.
5. In Supabase **Authentication → URL Configuration**:
   - **Site URL**: your deployed URL (e.g. `https://your-app.vercel.app`).
   - **Additional redirect URLs**: add `http://localhost:*` if you want local dev
     to work, and any preview URLs (Vercel deploy previews) you'll use.

## 3b. Enable email/password sign-up

In Supabase dashboard → **Authentication → Providers → Email**:

1. **Email provider** is on by default — confirm it's enabled.
2. (Recommended for a hobby setup) **Authentication → Sign In / Up →
   "Confirm email"** → toggle **off**. With it on, new email users have to click
   a link before they can sign in, and Supabase's free SMTP is rate-limited.
   With it off, sign-up immediately logs them in.
3. (Optional) Adjust the password minimum length under
   **Authentication → Sign In / Up** if you want stricter passwords.

If you keep email confirmation on, the app handles it gracefully — sign-up
shows a "Check your email" screen and the user comes back signed in after
clicking the link.

## 3c. Keep users signed in (DON'T skip this)

By default, Supabase sessions expire after 1 hour and refresh tokens after 1
week. That means a returning user that hasn't opened the app in a week is
forced to re-verify their email every time. To fix:

1. **Authentication → Sessions** (or **Settings → Auth**, depending on dashboard version):
   - **Time-box user sessions** → set to **30 days** (or longer)
   - **JWT expiry** → leave at 3600 (1 hr). Refresh tokens handle the rest.
   - **Refresh token reuse interval** → 10 seconds is fine
   - **Refresh token rotation** → **Enabled** (recommended for security)
2. **Authentication → Providers → Email** → **"Confirm email"** → **OFF**.
   Users who already confirmed once won't be re-prompted, but if this is on
   and they signed up without confirming, they hit a verify step every time.
3. If a specific user reports "verify via email on every login":
   - They might be using **magic-link** sign-in (single-use). Have them sign
     in with their email **+ password** in the modal instead.
   - Or their original sign-up never completed the email confirmation — once
     they confirm once with the dashboard above set right, future logins are
     password-only.

The app's `auth.js` is already configured with `persistSession: true`,
`autoRefreshToken: true`, and an explicit `storageKey`, so once the session
is established it survives tab close, browser restart, and weeks of
inactivity — up to the Supabase-side expiry above.

## 3d. Storage bucket for uploaded avatars (DO THIS)

Custom profile pictures are stored in a Supabase Storage bucket. **Required**
for the "Upload photo" button in Settings to work.

**Dashboard route (easiest):**

1. **Storage → New bucket**
2. Name: `avatars`
3. **Public bucket: ON** (so avatar URLs work without signed tokens)
4. (Optional) set a 5MB file-size limit and restrict to `image/*` mime types
   in the bucket's settings panel.
5. **Storage → Policies → New policy → For Full Customization** and add the
   following four policies on `storage.objects`:

```sql
-- Anyone (signed-in or not) can read avatars (bucket is public anyway,
-- but RLS still gatekeeps the API path)
create policy "Avatar read public"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Only the signed-in user can upload to their own folder
create policy "Avatar upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only the owner can replace their files (uploads use new filenames so
-- this is mostly defensive)
create policy "Avatar update own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only the owner can delete their files
create policy "Avatar delete own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

You can paste the whole block into **SQL Editor → New query** and run it
instead of clicking through the policy wizard.

Without this bucket the Upload Photo button shows an error; the emoji-icon
picker keeps working.

## 4. Paste credentials into the app

Open `config.js` in this project and fill in:

```js
window.CALI_SUPABASE_CONFIG = {
  url:     'https://YOUR-PROJECT.supabase.co',
  anonKey: 'YOUR-PUBLIC-ANON-KEY',
};
```

Both values come from Supabase dashboard → **Settings → API**. The anon key is
safe to expose in client-side code — RLS policies above are what enforce
security.

After saving the file, reload the app. The account chip appears in the top-right
corner. Sign in with Google, pick a handle, and your progress will start syncing
to Supabase.

## 5. Phase 2 SQL — leaderboard RPC

After you've got sign-in working (steps 1–4 above), run this additional block
in the SQL editor to enable the public leaderboard at `/leaderboard`:

```sql
-- Returns the top N users by total achieved skills, joined with their profile.
create or replace function public.leaderboard(lim int default 50)
returns table(
  user_id      uuid,
  handle       text,
  display_name text,
  avatar_url   text,
  total_skills int,
  checked      text[]
)
language sql stable as $$
  select p.user_id, pr.handle, pr.display_name, pr.avatar_url,
         coalesce(cardinality(p.checked), 0)::int as total_skills,
         p.checked
  from public.progress p
  join public.profiles pr on pr.id = p.user_id
  where coalesce(cardinality(p.checked), 0) > 0
  order by total_skills desc, pr.handle asc
  limit lim
$$;

grant execute on function public.leaderboard(int) to anon, authenticated;
```

The leaderboard page degrades gracefully if you don't run this — it'll just
show “No athletes ranked yet.”

## 6. Phase 3 SQL — follows + compare

After phase 2, run this block to enable follow/unfollow and the compare view:

```sql
-- ─── follows table ───────────────────────────────────────────────────
create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

alter table public.follows enable row level security;

create policy "follows_read_all"   on public.follows for select using (true);
create policy "follows_insert_own" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on public.follows for delete using (auth.uid() = follower_id);

-- ─── following list: users that `uid` follows, with profile + total skills ─
create or replace function public.following_for(uid uuid)
returns table(
  user_id      uuid,
  handle       text,
  display_name text,
  avatar_url   text,
  total_skills int
)
language sql stable as $$
  select pr.id, pr.handle, pr.display_name, pr.avatar_url,
         coalesce(cardinality(p.checked), 0)::int
  from public.follows f
  join public.profiles pr on pr.id = f.followee_id
  left join public.progress p on p.user_id = pr.id
  where f.follower_id = uid
  order by pr.handle asc
$$;

grant execute on function public.following_for(uuid) to anon, authenticated;

-- ─── follower + following counts for any user ────────────────────────
create or replace function public.follow_counts(uid uuid)
returns table(followers int, following int)
language sql stable as $$
  select
    (select count(*)::int from public.follows where followee_id = uid),
    (select count(*)::int from public.follows where follower_id = uid)
$$;

grant execute on function public.follow_counts(uuid) to anon, authenticated;
```

If you don't run this, the Follow button and Compare view stay hidden and the
rest of the app works fine.

## 6d. Phase 6 SQL — target skill (goal)

To enable the **Set as goal** feature (highlights the prereq chain to a target
skill, sidebar shows "X of N steps to goal · Next: Y"), run:

```sql
alter table public.profiles
  add column if not exists goal_skill_id text;
```

Without this column the Set-as-Goal action falls back to localStorage (works
fine for a single device, doesn't sync across devices).

## 6c. Phase 5 SQL — avatar icons + bio

To enable custom profile icons + bio (Settings modal), run:

```sql
alter table public.profiles
  add column if not exists avatar_icon  text,
  add column if not exists avatar_color text,
  add column if not exists bio          text;
```

The `avatar_icon` column stores either a single emoji or an icon key from the
curated set. `avatar_color` is a hex string used as the avatar background
(otherwise the app derives one algorithmically from the handle). `bio` is a
short one-liner (~200 chars) shown on the user's public profile page.

Without this step, the Settings modal still opens but only display-name + handle
saving works; icon/color/bio fields silently no-op.

After adding the columns, re-run these RPCs so the new fields are returned by
the leaderboard / feed / following endpoints (existing rows just have NULLs and
the app handles that fine):

```sql
-- Updated leaderboard: returns avatar_icon + avatar_color in addition to base profile.
create or replace function public.leaderboard(lim int default 50)
returns table(
  user_id      uuid,
  handle       text,
  display_name text,
  avatar_url   text,
  avatar_icon  text,
  avatar_color text,
  total_skills bigint
)
language sql stable as $$
  select pr.id, pr.handle, pr.display_name, pr.avatar_url, pr.avatar_icon, pr.avatar_color,
         count(p.skill_id) as total_skills
  from public.profiles pr
  left join lateral (
    select unnest(coalesce((pg.checked), array[]::text[])) as skill_id
    from public.progress pg where pg.user_id = pr.id
  ) p on true
  group by pr.id
  order by total_skills desc, pr.handle asc
  limit lim
$$;

grant execute on function public.leaderboard(int) to anon, authenticated;

-- Updated following_for: avatar_icon + avatar_color in the SELECT.
create or replace function public.following_for(uid uuid)
returns table(
  user_id      uuid,
  handle       text,
  display_name text,
  avatar_url   text,
  avatar_icon  text,
  avatar_color text,
  total_skills bigint
)
language sql stable as $$
  select pr.id, pr.handle, pr.display_name, pr.avatar_url, pr.avatar_icon, pr.avatar_color,
         coalesce(array_length(pg.checked, 1), 0)::bigint as total_skills
  from public.follows f
  join public.profiles pr on pr.id = f.followee_id
  left join public.progress pg on pg.user_id = pr.id
  where f.follower_id = uid
  order by total_skills desc, pr.handle asc
$$;

grant execute on function public.following_for(uuid) to anon, authenticated;

-- Updated feed_for: include avatar_icon + avatar_color so feed rows can render
-- the follower's chosen avatar.
create or replace function public.feed_for(uid uuid, lim int default 50)
returns table(
  user_id      uuid,
  handle       text,
  display_name text,
  avatar_url   text,
  avatar_icon  text,
  avatar_color text,
  skill_id     text,
  achieved_at  timestamptz
)
language sql stable as $$
  select a.user_id, pr.handle, pr.display_name, pr.avatar_url, pr.avatar_icon, pr.avatar_color,
         a.skill_id, a.achieved_at
  from public.follows f
  join public.achievements a on a.user_id = f.followee_id
  join public.profiles pr on pr.id = a.user_id
  where f.follower_id = uid
  order by a.achieved_at desc
  limit lim
$$;

grant execute on function public.feed_for(uuid, int) to anon, authenticated;
```

If the function signatures changed in a previous deploy, you may need to
`drop function ... cascade` first — Postgres won't let you change the return
table shape with `create or replace` alone.

## 6b. Phase 4 SQL — activity feed

To enable the activity feed at `/feed` and the "Recent activity" block on
profile pages, run this:

```sql
-- ─── achievements (granular, per-skill, with timestamps) ─────────────
create table public.achievements (
  user_id     uuid not null references auth.users(id) on delete cascade,
  skill_id    text not null,
  achieved_at timestamptz default now(),
  primary key (user_id, skill_id)
);

create index achievements_recent_idx on public.achievements (achieved_at desc);
create index achievements_user_recent_idx on public.achievements (user_id, achieved_at desc);

alter table public.achievements enable row level security;

create policy "achievements_read_all"   on public.achievements for select using (true);
create policy "achievements_insert_own" on public.achievements for insert with check (auth.uid() = user_id);
create policy "achievements_delete_own" on public.achievements for delete using (auth.uid() = user_id);

-- ─── feed: recent achievements from users that `uid` follows ─────────
create or replace function public.feed_for(uid uuid, lim int default 50)
returns table(
  user_id      uuid,
  handle       text,
  display_name text,
  avatar_url   text,
  skill_id     text,
  achieved_at  timestamptz
)
language sql stable as $$
  select a.user_id, pr.handle, pr.display_name, pr.avatar_url,
         a.skill_id, a.achieved_at
  from public.follows f
  join public.achievements a on a.user_id = f.followee_id
  join public.profiles pr on pr.id = a.user_id
  where f.follower_id = uid
  order by a.achieved_at desc
  limit lim
$$;

grant execute on function public.feed_for(uuid, int) to anon, authenticated;

-- ─── recent achievements for a single user (profile page) ────────────
create or replace function public.recent_achievements(uid uuid, lim int default 10)
returns table(skill_id text, achieved_at timestamptz)
language sql stable as $$
  select skill_id, achieved_at
  from public.achievements
  where user_id = uid
  order by achieved_at desc
  limit lim
$$;

grant execute on function public.recent_achievements(uuid, int) to anon, authenticated;
```

The `achievements` table only stores the **explicitly clicked** skills — when
you click Front Lever, only Front Lever gets a row (its prereqs cascade into
`progress.checked[]` but not into the feed, so it stays clean).

Without this step, the Feed page and Recent activity block stay empty —
existing features keep working.

## 7. (Optional) Test it

1. Open the app, mark a few skills.
2. Sign in with Google.
3. You should be prompted to pick a handle.
4. On submit, your local progress uploads to the `progress` table — verify in
   Supabase → **Table Editor → progress**.
5. Open the app in an incognito window, sign in with the same Google account →
   progress should load from the cloud.

## What's NOT built yet (next phases)

- Follow/friend system
- Friend comparison view (overlay another user's progress on the tree)

Tell me when you want me to build those.
