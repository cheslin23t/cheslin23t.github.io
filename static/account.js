(() => {
  const endpoint = 'https://api.ches.dev/site-auth';
  const account = document.querySelector('.site-account');
  if (!account) return;
  const login = account.querySelector('[data-account-login]');
  const dashboard = account.querySelector('[data-account-dashboard]');
  const logout = account.querySelector('[data-account-logout]');
  const status = account.querySelector('[data-account-status]');
  let busy = false;
  async function update() {
    if (busy || document.hidden) return;
    try {
      const response = await fetch(`${endpoint}/session`, { credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Account unavailable');
      const state = await response.json();
      login.hidden = state.authenticated === true;
      logout.hidden = state.authenticated !== true;
      logout.disabled = false;
      dashboard.hidden = !(state.authenticated === true && state.dashboardUrl === 'https://api.ches.dev/auth/if/admin/');
      status.textContent = '';
    } catch {
      dashboard.hidden = true;
      status.textContent = 'Account unavailable';
    }
  }
  logout.addEventListener('click', async () => {
    if (busy) return;
    busy = true; logout.disabled = true; status.textContent = 'Signing out…';
    try {
      const response = await fetch(`${endpoint}/logout`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Sign-out failed');
      const state = await response.json();
      const destination = new URL(state.logoutUrl, endpoint);
      if (destination.origin !== 'https://api.ches.dev') throw new Error('Invalid logout destination');
      location.assign(destination.href);
    } catch {
      busy = false; logout.disabled = false; status.textContent = 'Could not sign out. Try again.';
    }
  });
  addEventListener('pageshow', update);
  document.addEventListener('visibilitychange', update);
  setInterval(update, 60000);
})();
