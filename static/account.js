(() => {
  const endpoint = 'https://api.ches.dev/site-auth';
  const adminDashboard = 'https://api.ches.dev/auth/if/admin/#/administration/overview';
  const libraryDashboard = 'https://api.ches.dev/auth/if/user/#/library';
  const account = document.querySelector('.site-account');
  if (!account) return;
  const login = account.querySelector('[data-account-login]');
  const calendar = account.querySelector('[data-account-calendar]');
  const dashboard = account.querySelector('[data-account-dashboard]');
  const admin = document.createElement('a');
  admin.href = adminDashboard;
  admin.textContent = 'Admin';
  admin.hidden = true;
  dashboard.after(admin);
  const logout = account.querySelector('[data-account-logout]');
  const status = account.querySelector('[data-account-status]');
  let busy = false;
  let available = null;
  let revision = 0;
  function offline(){revision++;available=false;dashboard.hidden=true;admin.hidden=true;if(calendar)calendar.hidden=true;logout.disabled=true;login.setAttribute('aria-disabled','true');status.textContent='Account offline';}
  login.addEventListener('click',event=>{if(available===false){event.preventDefault();status.textContent='Sign in is unavailable while the server is offline.';}});
  async function update() {
    if (busy || document.hidden) return;
    const version=++revision;
    admin.hidden = true;
    try {
      const response = await fetch(`${endpoint}/session`, { credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Account unavailable');
      const state = await response.json();
      if(version!==revision)return;available=true;login.removeAttribute('aria-disabled');
      if(calendar)calendar.hidden=!(state.authenticated===true&&state.calendarUrl==='https://ches.dev/calendar/');
      login.hidden = state.authenticated === true;
      logout.hidden = state.authenticated !== true;
      logout.disabled = false;
      const signedIn = state.authenticated === true;
      const hasAdminAccess = state.dashboardAdminUrl === adminDashboard;
      dashboard.href = libraryDashboard;
      dashboard.hidden = !(signedIn && state.dashboardUrl === libraryDashboard);
      admin.hidden = true;
      status.textContent = '';
      if (signedIn && hasAdminAccess) {
        try {
          const central = await fetch('https://api.ches.dev/auth/ches-admin-access', {
            credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(4000),
          });
          const state = central.ok ? await central.json() : {};
          if (version === revision) admin.hidden = state.admin !== true;
        } catch {
          // The regular account links still work if the central check is unavailable.
        }
      }
    } catch {
      if(version===revision)offline();
    }
  }
  logout.addEventListener('click', async () => {
    if (busy) return;
    revision++;busy = true; logout.disabled = true; status.textContent = 'Signing out…';
    try {
      const response = await fetch(`${endpoint}/logout`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Sign-out failed');
      const state = await response.json();
      const destination = new URL(state.logoutUrl, endpoint);
      if (destination.origin !== 'https://api.ches.dev') throw new Error('Invalid logout destination');
      location.assign(destination.href);
    } catch {
      // Central sign-out still runs if the application session is already gone or its API fails.
      location.assign('https://api.ches.dev/auth/flows/-/cancel/');
    }
  });
  addEventListener('pageshow', update);
  addEventListener('focus', update);
  addEventListener('online', update);
  addEventListener('offline', offline);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { revision++; admin.hidden = true; }
    else void update();
  });
  setInterval(update, 60000);
})();
