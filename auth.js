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
    try {
      const { data, error } = await withTimeout(
        client
          .from('profiles')
          .insert({
            id: user.id,
            handle,
            display_name: displayName || null,
            avatar_url: avatarUrl || null,
          })
          .select(PROFILE_COLS)
          .single(),
        15000,
        'profile insert'
      );
      if (!error) {
        profile = data;
        notify();
      }
      return { data, error };
    } catch (e) {
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

  window.CaliAuth = {
    ready,                  // boolean: true if Supabase is configured
    init,                   // call once at mount
    onChange,               // subscribe to {session, profile} changes
    getSession: () => session,
    getProfile: () => profile,

    signInWithGoogle,
    signOut,

    checkHandleAvailable,
    createProfile,

    getMyProgress,
    saveMyProgress,

    // For future phases (profile pages, leaderboards).
    getProfileByHandle,
    getProgressByUserId,
  };
})();
