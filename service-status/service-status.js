(() => {
  const endpoint = 'https://api.ches.dev/service-status/v1/services';
  const list = document.querySelector('#service-controls-list');
  const feedback = document.querySelector('#service-feedback');
  const refresh = document.querySelector('#service-refresh');
  const rows = new Map();
  let busy = false;
  let needsRefresh = true;

  function render(services) {
    const groups = new Map();
    const content = document.createDocumentFragment();
    for (const service of services) {
      if (!groups.has(service.category)) {
        const group = document.createElement('section');
        group.className = 'service-control-group';
        const heading = document.createElement('h2');
        heading.textContent = { web: 'Web', minecraft: 'Minecraft' }[service.category] || service.category;
        const entries = document.createElement('ul');
        group.append(heading, entries);
        groups.set(service.category, entries);
        content.append(group);
      }

      const row = document.createElement('li');
      const info = document.createElement('div');
      const name = document.createElement('strong');
      name.className = 'service-control-name';
      name.textContent = service.name;
      const disabled = service.state === 'disabled';
      const mode = document.createElement('span');
      mode.className = 'service-control-mode';
      mode.dataset.disabled = String(disabled);
      mode.textContent = disabled ? 'Disabled' : 'Live checks';
      info.append(name, mode);

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = disabled ? 'Use live checks' : 'Mark disabled';
      button.setAttribute('aria-label', button.textContent + ' for ' + service.name);
      button.addEventListener('click', () => void request(service, !disabled));
      row.append(info, button);
      groups.get(service.category).append(row);
      rows.set(service.id, button);
    }
    list.replaceChildren(content);
  }

  async function request(service, disabled) {
    if (busy || (service && needsRefresh)) return;
    busy = true;
    refresh.disabled = true;
    list.setAttribute('aria-busy', 'true');
    for (const button of rows.values()) button.setAttribute('aria-disabled', 'true');
    feedback.textContent = service ? 'Saving…' : 'Loading services…';
    try {
      const response = await fetch(endpoint, {
        method: service ? 'PATCH' : 'GET',
        credentials: 'include',
        cache: 'no-store',
        signal: AbortSignal.timeout(16000),
        ...(service && {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: service.id, disabled }),
        }),
      });
      if (response.status === 401 || response.status === 403) {
        needsRefresh = true;
        rows.clear();
        list.replaceChildren();
        feedback.textContent = response.status === 401
          ? 'Sign in to manage service status.'
          : 'Ask your Authentik administrator for the services:manage permission.';
        refresh.hidden = response.status === 401;
        return;
      }
      if (!response.ok) throw new Error('Service status request failed');

      const snapshot = await response.json();
      const focused = [...rows].find(([, button]) => button === document.activeElement)?.[0];
      rows.clear();
      render(snapshot.services);
      if (focused) (rows.get(focused) ?? refresh).focus();
      needsRefresh = false;
      refresh.hidden = false;
      feedback.textContent = service
        ? service.name + (disabled ? ' is marked Disabled.' : ' is using live checks.')
        : snapshot.services.length ? '' : 'No monitored services are currently listed.';
    } catch {
      needsRefresh = true;
      refresh.hidden = false;
      feedback.textContent = service
        ? 'Couldn’t confirm the change. Refresh to check the saved status.'
        : 'Couldn’t load service status. Try refreshing.';
    } finally {
      busy = false;
      refresh.disabled = false;
      list.setAttribute('aria-busy', 'false');
      for (const button of rows.values()) button.setAttribute('aria-disabled', String(needsRefresh));
    }
  }

  refresh.addEventListener('click', () => void request());
  void request();
})();
