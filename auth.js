// auth.js — thin Supabase wrapper exposed as window.CaliAuth.
// Used by the skill-tree DC. Stays silent when CALI_SUPABASE_CONFIG isn't filled.

(function () {
  const cfg = window.CALI_SUPABASE_CONFIG || {};
  const configured = !!(cfg.url && cfg.anonKey);
  const sdkPresent = !!(window.supabase && window.supabase.createClient);
  const ready = configured && sdkPresent;

  let client = null;
  let session = null;
  let profile = null;
  const listeners = new Set();
  const PROFILE_COLS = 'id, handle, display_name, avatar_url, created_at';

  if (ready) {
    client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } else if (configured && !sdkPresent) {
    // Defensive — caller should load the SDK before this file.
    // eslint-disable-next-line no-console
    console.warn('[CaliAuth] supabase-js SDK not found on window. Auth disabled.');
  }

  function notify() {
    listeners.forEach((cb) => {
      try { cb({ session, profile }); } catch (e) {}
    });
  }

  async function fetchProfile(userId) {
    if (!client || !userId) return null;
    const { data, error } = await client
      .from('profiles')
      .select(PROFILE_COLS)
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[CaliAuth] fetchProfile error', error);
      return null;
    }
    return data;
  }

  async function init() {
    if (!ready) return { ready: false };
    try {
      const { data } = await client.auth.getSession();
      session = data.session;
      profile = session ? await fetchProfile(session.user.id) : null;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[CaliAuth] init error', e);
    }
    client.auth.onAuthStateChange(async (event, newSession) => {
      // INITIAL_SESSION fires right after subscribe with whatever's in storage
      // at that instant. If the URL-hash exchange (post-OAuth redirect) hasn't
      // completed yet, that value is null — don't let it clobber a real session
      // we already have.
      if (event === 'INITIAL_SESSION' && !newSession && session) return;
      session = newSession;
      profile = session ? await fetchProfile(session.user.id) : null;
      notify();
    });
    return { ready: true, session, profile };
  }

  function onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  // Authoritative user lookup — reads the session from supabase-js' local
  // storage (no network), so it's always live and instant. We don't trust the
  // module-local `session` variable because INITIAL_SESSION events can clobber
  // it; storage is the source of truth.
  async function getLiveUser() {
    if (!client) return null;
    try {
      const { data } = await client.auth.getSession();
      const s = data && data.session;
      if (!s || !s.user) return null;
      session = s;
      return s.user;
    } catch (e) {
      return null;
    }
  }

  // Wraps a promise so it rejects after `ms` instead of hanging forever.
  function withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error((label || 'request') + ' timed out after ' + ms + 'ms')), ms);
      promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
    });
  }

  async function signInWithEmail(email, password) {
    if (!client) return { error: { message: 'auth disabled' } };
    return client.auth.signInWithPassword({ email, password });
  }

  async function signUpWithEmail(email, password) {
    if (!client) return { error: { message: 'auth disabled' } };
    const redirectTo = window.location.origin + window.location.pathname;
    return client.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
  }

  async function signInWithGoogle() {
    if (!client) return { error: { message: 'auth disabled' } };
    // Redirect back to the current page (no hash) so we don't collide with
    // share-link hashes after the OAuth callback consumes #access_token.
    const redirectTo = window.location.origin + window.location.pathname;
    return client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    // onAuthStateChange will fire and clear session/profile.
  }

  // Returns true if available, false if taken, null on error.
  async function checkHandleAvailable(handle) {
    if (!client) return null;
    if (!/^[a-z0-9_]{3,24}$/.test(handle)) return false;
    const { data, error } = await client
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .maybeSingle();
    if (error) return null;
    return !data;
  }

  async function createProfile(handle, displayName, avatarUrl) {
    if (!client) return { error: { message: 'auth disabled' } };
    const user = await getLiveUser();
    if (!user) return { error: { message: 'Session expired — please refresh and sign in again.' } };

    // Fast path: a previous attempt may have succeeded server-side but lost
    // its response on the way back (resulting in a "stuck on Saving…" UI on
    // the last try). Check for an existing profile before re-inserting.
    const existing = await fetchProfile(user.id);
    if (existing) {
      profile = existing;
      notify();
      return { data: existing, error: null };
    }

    // Plain INSERT — no chained .select().single(). The chained form has been
    // observed to either hang or return null data on some networks/RLS combos,
    // leaving the handle-picker modal stuck in 'Saving…'. We already know every
    // column we'd get back, so we construct the profile object locally instead.
    try {
      const { error } = await withTimeout(
        client.from('profiles').insert({
          id: user.id,
          handle,
          display_name: displayName || null,
          avatar_url: avatarUrl || null,
        }),
        10000,
        'profile insert'
      );
      if (!error) {
        profile = {
          id: user.id,
          handle,
          display_name: displayName || null,
          avatar_url: avatarUrl || null,
          created_at: new Date().toISOString(),
        };
        notify();
      }
      return { data: profile, error };
    } catch (e) {
      // Timeout / network blip. The INSERT may have actually landed — re-fetch
      // before giving up so we don't strand the user on a successful save.
      const fallback = await fetchProfile(user.id);
      if (fallback) {
        profile = fallback;
        notify();
        return { data: fallback, error: null };
      }
      return { error: { message: e.message || 'Network error while saving handle.' } };
    }
  }

  // Pulls the signed-in user's cloud progress. Returns string[] or null.
  async function getMyProgress() {
    if (!client) return null;
    const user = await getLiveUser();
    if (!user) return null;
    const { data, error } = await client
      .from('progress')
      .select('checked')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error || !data) return null;
    return Array.isArray(data.checked) ? data.checked : null;
  }

  async function saveMyProgress(checkedArray) {
    if (!client) return { error: { message: 'auth disabled' } };
    const user = await getLiveUser();
    if (!user) return { error: { message: 'not signed in' } };
    return client.from('progress').upsert({
      user_id:    user.id,
      checked:    checkedArray,
      updated_at: new Date().toISOString(),
    });
  }

  // Used later for public profile pages and leaderboards.
  async function getProfileByHandle(handle) {
    if (!client) return null;
    const { data } = await client
      .from('profiles')
      .select(PROFILE_COLS)
      .eq('handle', handle)
      .maybeSingle();
    return data;
  }

  async function getProgressByUserId(userId) {
    if (!client || !userId) return null;
    const { data } = await client
      .from('progress')
      .select('checked')
      .eq('user_id', userId)
      .maybeSingle();
    if (!data) return null;
    return Array.isArray(data.checked) ? data.checked : null;
  }

  // Top N users by total skills (RPC defined in supabase-setup.md, phase 2).
  // Returns []
  async function getLeaderboard(limit) {
    if (!client) return [];
    try {
      const { data, error } = await client.rpc('leaderboard', { lim: limit || 50 });
      if (error) return [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  // ─── follows (phase 3) ─────────────────────────────────────────────────────
  async function follow(targetUserId) {
    if (!client) return { error: { message: 'auth disabled' } };
    const user = await getLiveUser();
    if (!user) return { error: { message: 'not signed in' } };
    if (user.id === targetUserId) return { error: { message: 'cannot follow self' } };
    return client.from('follows').insert({ follower_id: user.id, followee_id: targetUserId });
  }

  async function unfollow(targetUserId) {
    if (!client) return { error: { message: 'auth disabled' } };
    const user = await getLiveUser();
    if (!user) return { error: { message: 'not signed in' } };
    return client
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('followee_id', targetUserId);
  }

  async function isFollowing(targetUserId) {
    if (!client || !targetUserId) return false;
    const user = await getLiveUser();
    if (!user || user.id === targetUserId) return false;
    const { data } = await client
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('followee_id', targetUserId)
      .maybeSingle();
    return !!data;
  }

  async function getFollowCounts(userId) {
    if (!client || !userId) return { followers: 0, following: 0 };
    try {
      const { data } = await client.rpc('follow_counts', { uid: userId });
      if (Array.isArray(data) && data.length) {
        const row = data[0];
        return { followers: row.followers || 0, following: row.following || 0 };
      }
    } catch (e) {}
    return { followers: 0, following: 0 };
  }

  async function getFollowing(userId) {
    if (!client || !userId) return [];
    try {
      const { data } = await client.rpc('following_for', { uid: userId });
      return Array.isArray(data) ? data : [];
    } catch (e) {}
    return [];
  }

  // ─── achievements + feed (phase 4) ──────────────────────────────────────────
  async function addAchievement(skillId) {
    if (!client || !skillId) return null;
    const user = await getLiveUser();
    if (!user) return null;
    // Upsert by primary key so re-toggling without a network round-trip still works.
    return client.from('achievements').upsert({
      user_id: user.id,
      skill_id: skillId,
      achieved_at: new Date().toISOString(),
    }, { onConflict: 'user_id,skill_id', ignoreDuplicates: true });
  }

  async function removeAchievement(skillId) {
    if (!client || !skillId) return null;
    const user = await getLiveUser();
    if (!user) return null;
    return client
      .from('achievements')
      .delete()
      .eq('user_id', user.id)
      .eq('skill_id', skillId);
  }

  async function getFeed(limit) {
    if (!client) return [];
    const user = await getLiveUser();
    if (!user) return [];
    try {
      const { data } = await client.rpc('feed_for', { uid: user.id, lim: limit || 50 });
      return Array.isArray(data) ? data : [];
    } catch (e) {}
    return [];
  }

  async function getRecentAchievements(userId, limit) {
    if (!client || !userId) return [];
    try {
      const { data } = await client.rpc('recent_achievements', { uid: userId, lim: limit || 10 });
      return Array.isArray(data) ? data : [];
    } catch (e) {}
    return [];
  }

  window.CaliAuth = {
    ready,                  // boolean: true if Supabase is configured
    init,                   // call once at mount
    onChange,               // subscribe to {session, profile} changes
    getSession: () => session,
    getProfile: () => profile,

    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,

    checkHandleAvailable,
    createProfile,

    getMyProgress,
    saveMyProgress,

    // For future phases (profile pages, leaderboards).
    getProfileByHandle,
    getProgressByUserId,
    getLeaderboard,

    // Phase 3 — follows + compare.
    follow,
    unfollow,
    isFollowing,
    getFollowCounts,
    getFollowing,

    // Phase 4 — achievements + feed.
    addAchievement,
    removeAchievement,
    getFeed,
    getRecentAchievements,
  };
})();
