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

## 6. (Optional) Test it

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
