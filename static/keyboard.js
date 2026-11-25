(() => {
  'use strict';

  const page = document.body.dataset.chesKeyboard;
  if (!page || typeof HTMLDialogElement.prototype.showModal !== 'function') return;

  const platform = navigator.userAgentData?.platform || navigator.platform;
  const apple = /mac|iphone|ipad|ipod|ios/i.test(platform);
  const handheld = navigator.userAgentData?.mobile ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (/mac/i.test(platform) && navigator.maxTouchPoints > 1);
  const isMac = apple;
  const root = document.documentElement;
  root.classList.toggle('ches-no-key-hints', Boolean(handheld));
  if (getComputedStyle(root).colorScheme === 'dark') root.classList.add('ches-chrome-dark');
  if (handheld) {
    function detectKeyboard(event) {
      if (!event.isTrusted || event.isComposing ||
          !(event.ctrlKey || event.metaKey || event.altKey ||
            /^(Tab|Escape|Arrow(Up|Down|Left|Right)|F[1-9][0-2]?)$/.test(event.key))) return;
      root.classList.remove('ches-no-key-hints');
      document.removeEventListener('keydown', detectKeyboard, true);
    }
    document.addEventListener('keydown', detectKeyboard, true);
  }
  const openKeys = isMac ? '⌘ K' : 'Ctrl K';
  const shortcutPrefix = isMac ? '⌥ ⇧' : 'Alt Shift';
  const home = 'https://ches.dev/';
  const settingsKey = 'ches.quick-search.v1';
  const alternateKeys = {KeyK: `${shortcutPrefix} K`, Space: `${shortcutPrefix} Space`};
  const defaultPreferences = {favorites: [], recent: [], shortcut: 'default'};
  let preferences = readPreferences();

  function readPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey));
      const ids = (values, limit) => Array.isArray(values) ? values.filter(value =>
        typeof value === 'string' && value.length <= 150).slice(0, limit) : [];
      return {
        favorites: ids(saved?.favorites, 40), recent: ids(saved?.recent, 8),
        shortcut: Object.hasOwn(alternateKeys, saved?.shortcut) ? saved.shortcut : 'default',
      };
    } catch {
      return {...defaultPreferences};
    }
  }

  function savePreferences() {
    try { localStorage.setItem(settingsKey, JSON.stringify(preferences)); } catch {}
  }

  const destinations = [
    ['Portfolio', home], ['CPU walkthrough', home + 'cpu/'],
    ['Printed storefront', home + '3D-Printing-Order-Management/index.html'],
    ['Troop 55 RSVP demo', home + 'BSA2/'],
  ];
  const appUrls = new Set([
    home + 'calendar/', 'https://images.ches.dev/admin', 'https://convert.ches.dev/',
    'https://api.ches.dev/book/', 'https://api.ches.dev/go/', home + 'service-status/', 'https://dash.ches.dev/',
    'https://api.ches.dev/auth/if/user/#/library',
    ...destinations.map(([, url]) => url),
  ]);
  const tourStops = [
    ['#cpu-run', 'Simulate a CPU program', 'Watch three recorded instructions update the registers.'],
    ['#command', 'Try the JB-X command system', 'Start with help value to see a command and its arguments.'],
    ['#project-printed', 'Explore the Printed storefront', 'Try the sample ordering flow and review its steps.'],
  ];
  const adminBase = 'https://api.ches.dev/auth/if/admin/#';
  const adminOverview = '/administration/overview';
  const adminLinks = 'header .site-account > a[href], header nav a[href], #dashboard-admin[href]';
  const adminActions = [
    ['Invitations', 'Create or manage invitations', '/flow/stages/invitations', 'invite people onboarding enrollment new user'],
    ['Invitations', 'Review Ches enrollment flow', '/flow/flows/ches-invite-enrollment', 'invite invitation standard account signup'],
    ['Invitations', 'Review Images viewer flow', '/flow/flows/ches-invite-images-viewer', 'invite invitation read only ches drop'],
    ['Invitations', 'Review Images member flow', '/flow/flows/ches-invite-images-member', 'invite invitation upload ches drop'],
    ['People and permissions', 'Manage users', '/identity/users', 'people accounts user access memberships'],
    ['People and permissions', 'Manage groups and memberships', '/identity/groups', 'people user access add remove members'],
    ['People and permissions', 'Manage roles and permissions', '/identity/roles', 'role grants access rights group'],
  ];
  const actionSets = {
    portfolio: [
      ['Run the CPU demo', '#cpu-run', null, 'run-and-focus', 'Try it now'],
      ['Try a JB-X command', '#command', null, 'focus', 'Try it now'],
      ['Live services', '#services', 'L', 'focus', 'Try it now'],
      ['Calendar availability', '#availability', null, 'focus', 'Try it now'],
      ['Featured work', '#work', null, 'focus'], ['Other projects', '#other-projects', null, 'focus'],
      ['About', '#about', null, 'focus'], ['BadAvo', '#project-badavo', null, 'focus'],
      ['Printed project', '#project-printed', null, 'focus'], ['JB-X project', '#project-jbx', null, 'focus'],
      ['CPU project', '#project-cpu', null, 'focus'], ['Step CPU example', '#cpu-step'],
      ['Reset CPU example', '#cpu-reset'],
    ],
    calendar: [
      ['New event', '#new-event', 'N'], ['Go to today', '#today', 'T'],
      ['Find the next free 30 minutes', '#find-free-time'],
      ['Previous period', '#previous-month', 'ArrowLeft'], ['Next period', '#next-month', 'ArrowRight'],
      ['Day view', '[data-view="day"]', 'D'], ['Week view', '[data-view="week"]', 'W'],
      ['Month view', '[data-view="month"]', 'M'], ['Jump to month', '#month', 'J', 'focus'],
    ],
    status: [['Refresh service status', '#service-refresh', 'R']],
    cpu: [
      ['Focus 3D CPU viewer', '#build-canvas', 'V', 'focus'], ['Restore 3D view', '#restore-view', 'R'],
      ['Play or pause CPU replay', '#run-play', 'P'], ['Focus replay speed', '#run-speed', null, 'focus'],
    ],
    drop: [
      ['Choose files', '#choose-files', 'U'], ['Refresh files', '#refresh', 'R'],
      ['Go to files', '#files-heading', 'F', 'focus'], ['Go to collections', '#groups-heading', 'G', 'focus'],
      ['Select visible files', '#select-all'], ['Clear file selection', '#clear-selection'],
      ['Load more files', '#load-more'],
    ],
    convert: [
      ['Choose files to convert', '#file', 'U'], ['Choose the batch output format', '#batch-target', 'F', 'focus'],
      ['Focus Convert button', '#submit', null, 'focus'], ['Download converted files as ZIP', '#download-zip'],
    ],
    links: [
      ['Enter a destination URL', '#destination', 'N', 'focus'], ['Enter a short-link alias', '#alias', 'A', 'focus'],
      ['Copy new short link', '#copy-new'], ['Load more links', '#load-more'],
    ],
    bookings: [
      ['Name a booking link', '#booking-label', 'N', 'focus'], ['Open week picker', '#open-week-picker', 'W'],
      ['Add a time slot', '#add-slot', 'A'], ['Refresh booking links', '#refresh-links', 'R'],
      ['Copy created booking link', '#copy-created'], ['Load more booking links', '#load-links'],
    ],
    bookingGuest: [
      ['Previous month with available times', '#guest-prev', 'ArrowLeft'],
      ['Next month with available times', '#guest-next', 'ArrowRight'],
      ['Enter your name', '#guest-name', null, 'focus'], ['Retry loading availability', '#guest-retry'],
    ],
    printed: [
      ['Open order form', '#open-order-form', 'N'],
      ['Focus order form', '#order-form', null, 'focus'],
      ['Focus model size', '#modelSize', null, 'focus'],
      ['Open Printed admin sign-in', '[data-bs-target="#loginModal"]'],
    ],
    scouts: [
      ['Go to trip calendar', '#calendar', 'T', 'focus'], ['Go to next trip', '#next-trip', 'N', 'focus'],
      ['Start RSVP form', '#demo-rsvp-form input:not([type="hidden"])', 'N', 'focus'],
      ['Go to going responses', '#going-heading', null, 'focus'],
      ['Go to not going responses', '#not-going-heading', null, 'focus'],
    ],
  };
  const primaryActions = {
    portfolio: ['#work', '#services', '#availability'],
    calendar: ['#new-event', '#find-free-time', '#today'],
    status: ['#service-refresh'],
    cpu: ['#run-play', '#restore-view'],
    drop: ['#choose-files', 'files', '#groups-heading'],
    convert: ['#file', '#batch-target', '#download-zip'],
    links: ['#destination', '#copy-new'],
    bookings: ['#booking-label', '#open-week-picker', '#copy-created'],
    bookingGuest: ['#guest-name', '#guest-next', '#guest-retry'],
    printed: ['#open-order-form', '#modelSize'],
    scouts: ['#demo-rsvp-form input:not([type="hidden"])', '#next-trip', '#calendar'],
  };
  const actionKeywords = {
    '#work': 'projects portfolio', '#choose-files': 'upload add', '#file': 'upload convert',
    '#destination': 'new create shorten link', '#booking-label': 'new create booking',
    '#find-free-time': 'schedule availability gap', '#run-play': 'run simulate playback',
  };

  function element(tag, attrs = {}, text = '') {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    if (text) node.textContent = text;
    return node;
  }

  const iconPaths = {
    search: 'M16.8 10.5a6.3 6.3 0 1 1-12.6 0 6.3 6.3 0 0 1 12.6 0ZM15 15l5 5',
    close: 'm6 6 12 12M18 6 6 18',
    lock: 'M8 10V7a4 4 0 0 1 8 0v3m-4 4v2M8 10h8a2.5 2.5 0 0 1 2.5 2.5v5A2.5 2.5 0 0 1 16 20H8a2.5 2.5 0 0 1-2.5-2.5v-5A2.5 2.5 0 0 1 8 10Z',
    spark: 'M12 2.5 14.6 9.4 21.5 12 14.6 14.6 12 21.5 9.4 14.6 2.5 12 9.4 9.4Z',
    arrow: 'M6 18 18 6M8 6h10v10',
    action: 'm8.5 6 9 6-9 6z',
    star: 'm12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4L2.8 9.7l6.4-.9Z',
    menu: 'M4 8h16M4 16h16',
  };

  function icon(name) {
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    const path = document.createElementNS(namespace, 'path');
    for (const [key, value] of Object.entries({
      class: 'ches-icon-vector', viewBox: '0 0 24 24', width: '16', height: '16',
      'aria-hidden': 'true', focusable: 'false', fill: 'none', stroke: 'currentColor',
      'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    })) svg.setAttribute(key, value);
    path.setAttribute('d', iconPaths[name]);
    svg.append(path);
    return svg;
  }

  function keyLabel(key) {
    return shortcutPrefix + ' ' + ({ArrowLeft: '←', ArrowRight: '→'}[key] || key);
  }

  function enabled(node) {
    return Boolean(node && node.isConnected && !node.closest('[hidden], [inert], [aria-hidden="true"]') &&
      !node.matches(':disabled, [aria-disabled="true"]'));
  }

  function shown(node) {
    if (!enabled(node)) return false;
    return node.getClientRects().length > 0 && getComputedStyle(node).visibility === 'visible';
  }

  function availableLink(link) {
    return enabled(link) && (Boolean(link.closest('.ches-nav-menu, .account-tools')) || shown(link));
  }

  function pageActions() {
    return (actionSets[page] || []).flatMap(([label, selector, key, operation, group = 'On this page']) => {
      const target = document.querySelector(selector);
      return shown(target) ? [{id: `page:${page}:${selector}`, label, target, key, operation, group,
        keywords: actionKeywords[selector], local: true}] : [];
    });
  }

  function adminLink() {
    return Array.from(document.querySelectorAll(adminLinks)).find(link =>
      link.href === adminBase + adminOverview && availableLink(link));
  }

  function entries() {
    const actions = pageActions();
    const seen = new Set();
    const localSections = new Set(actions.filter(entry => entry.operation === 'focus' && entry.target.id)
      .map(entry => `#${entry.target.id}`));
    const result = [...actions];
    if (page === 'portfolio') result.unshift({label: 'Start the portfolio tour', operation: 'tour', group: 'Try it now', local: true});
    if (page === 'drop' && shown(document.querySelector('#files'))) {
      result.push({id: 'page:drop:files', label: 'Find a file', keywords: 'search files name library',
        operation: 'files', group: 'On this page', local: true});
    }
    const admin = adminLink();
    if (admin) {
      for (const [group, label, path, keywords] of adminActions) {
        result.push({label, href: adminBase + path, group, keywords, restricted: true, adminAction: true});
      }
    }
    for (const link of document.querySelectorAll('header nav a[href], [data-ches-command-link][href], header [data-account-login], header [data-account-dashboard], .account-tools a[href]')) {
      const accountLink = link.closest('.account-tools');
      if (!availableLink(link)) continue;
      if (link.origin === location.origin && link.pathname === location.pathname && localSections.has(link.hash)) continue;
      const href = link.href;
      const label = link.textContent.trim().replace(/\s+/g, ' ');
      if (!label || !/^(https?:|mailto:)/.test(href) || seen.has(href)) continue;
      seen.add(href);
      const app = appUrls.has(href);
      const restricted = Boolean(accountLink || /\/auth\/if\/(admin|user)\//.test(href));
      result.push({id: app ? `app:${href}` : null, label, target: link, href, app,
        accessTarget: restricted ? link : null, local: page === 'cockpit' && link.hasAttribute('data-ches-command-link'),
        group: accountLink ? 'Your tools' : 'Navigation', restricted});
      if (accountLink && href === 'https://dash.ches.dev/') {
        result.push({label: 'Open server logs', href: 'https://dash.ches.dev/system/logs',
          accessTarget: link, group: 'Operations', restricted: true});
      }
    }
    for (const [label, href] of destinations) {
      if (seen.has(href)) continue;
      result.push({id: `app:${href}`, label, href, group: 'Ches sites', app: true});
    }
    if (page !== 'portfolio') result.push({label: 'Open live service health', href: home + '#services', group: 'Ches sites'});
    return result;
  }

  const trigger = element('button', {
    class: 'ches-keys-trigger', type: 'button', 'aria-haspopup': 'dialog',
    'aria-label': 'Quick search', 'aria-controls': 'ches-keys-dialog',
    'aria-keyshortcuts': (isMac ? 'Meta' : 'Control') + '+K',
  });
  const triggerHint = element('kbd', {'aria-hidden': 'true'}, openKeys);
  trigger.append(icon('search'), element('span', {class: 'ches-keys-trigger-label'}, 'Quick search'), triggerHint);

  const dialog = element('dialog', {class: 'ches-keys-dialog', id: 'ches-keys-dialog', 'aria-labelledby': 'ches-keys-title'});
  const title = element('h2', {id: 'ches-keys-title', class: 'ches-visually-hidden'}, 'Quick search');
  const input = element('input', {
    type: 'search', role: 'combobox', 'aria-label': 'Search pages and actions',
    'aria-autocomplete': 'list', 'aria-expanded': 'true', 'aria-controls': 'ches-keys-results',
    placeholder: 'Search pages and actions…', autocomplete: 'off', spellcheck: 'false',
    autofocus: '',
  });
  const close = element('button', {type: 'button', class: 'ches-keys-close', 'aria-label': 'Close quick search'});
  close.append(icon('close'));
  const header = element('div', {class: 'ches-keys-search'});
  const searchIcon = icon('search');
  const settingsTitle = element('h3', {class: 'ches-keys-settings-title', hidden: ''}, 'Quick Search settings');
  header.append(searchIcon, input, settingsTitle, close);
  const controls = element('div', {class: 'ches-keys-controls'});
  const scopes = element('div', {class: 'ches-keys-scopes', role: 'group', 'aria-label': 'Search scope'});
  const scopeButtons = new Map();
  for (const [value, label] of [['all', 'All'], ['app', 'This app'], ['apps', 'Apps'], ['files', 'My files'], ['tour', 'Portfolio tour']]) {
    const button = element('button', {type: 'button', 'aria-pressed': String(value === 'all')}, label);
    button.hidden = value === 'files' || value === 'tour';
    button.addEventListener('click', () => setScope(value));
    scopeButtons.set(value, button);
    scopes.append(button);
  }
  const settingsButton = element('button', {type: 'button', 'aria-expanded': 'false',
    'aria-controls': 'ches-keys-settings'}, 'Settings');
  controls.append(scopes, settingsButton);
  const settings = element('div', {class: 'ches-keys-settings', id: 'ches-keys-settings', hidden: ''});
  const storageNote = element('p', {}, 'Favorites, history, and shortcuts are saved for this site in your browser.');
  const shortcutField = element('div', {class: 'ches-keys-shortcut-field'});
  const shortcutLabel = element('label', {for: 'ches-keys-shortcut'}, 'Open Quick Search with');
  const shortcutSelect = element('select', {id: 'ches-keys-shortcut'});
  shortcutSelect.append(new Option(openKeys, 'default'));
  for (const [code, label] of Object.entries(alternateKeys)) shortcutSelect.append(new Option(label, code));
  shortcutField.append(shortcutLabel, shortcutSelect);
  const settingsActions = element('div', {class: 'ches-keys-settings-actions'});
  const editPins = element('button', {type: 'button'}, 'Edit favorites');
  const clearHistory = element('button', {type: 'button'}, 'Clear recent commands');
  settingsActions.append(editPins, clearHistory);
  settings.append(storageNote, shortcutField, settingsActions);
  const pinControls = element('div', {class: 'ches-keys-pin-controls', hidden: ''});
  const pinHelp = element('p', {}, 'Choose a result to pin or unpin it.');
  const finishPins = element('button', {type: 'button'}, 'Done');
  pinControls.append(pinHelp, finishPins);
  const announcement = element('p', {role: 'status', class: 'ches-visually-hidden'});
  const list = element('div', {id: 'ches-keys-results', role: 'listbox', 'aria-label': 'Search results'});
  const status = element('p', {class: 'ches-keys-status', role: 'status'});
  const guide = element('footer', {class: 'ches-keys-guide'});
  for (const [keys, label] of [['↑ ↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']]) {
    const hint = element('span');
    hint.append(element('kbd', {'aria-hidden': 'true'}, keys), document.createTextNode(label));
    guide.append(hint);
  }
  dialog.append(title, header, controls, settings, pinControls, list, status, announcement, guide);
  let toolbarMenu;
  function mountMenu(toolbar, navigation) {
    const menu = element('details', {class: 'ches-nav-menu'});
    const summary = element('summary', {'aria-label': 'Menu'});
    summary.append(icon('menu'));
    toolbar.classList.add('ches-command-bar-menu');
    navigation.before(menu);
    menu.append(summary, navigation);
    toolbarMenu = menu;
    document.addEventListener('click', event => {
      if (!menu.contains(event.target) || event.target.closest('a[href]')) menu.open = false;
    });
    menu.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !menu.open) return;
      event.preventDefault();
      menu.open = false;
      summary.focus();
    });
  }

  function mountTrigger() {
    const toolbar = document.querySelector('header[data-account-enabled], header.site-header, header.topbar, header.bar, [data-ches-keyboard-mount]');
    if (!shown(toolbar)) return false;
    toolbar.classList.add('ches-command-bar');
    trigger.classList.remove('ches-keys-docked');
    toolbar.append(trigger);
    const navigation = toolbar.querySelector('nav');
    if (navigation) mountMenu(toolbar, navigation);
    return true;
  }

  if (!mountTrigger()) {
    trigger.classList.add('ches-keys-docked');
    document.body.append(trigger);
    const app = page === 'drop' && document.querySelector('#app');
    if (app) {
      const observer = new MutationObserver(() => {
        if (mountTrigger()) {
          observer.disconnect();
          if (dialog.open) refreshEntries();
        }
      });
      observer.observe(app, {childList: true, subtree: true});
    }
  }
  document.body.append(dialog);

  const publicTrigger = document.querySelector('[data-public-quick-search]');
  if (publicTrigger) {
    publicTrigger.setAttribute('aria-haspopup', 'dialog');
    publicTrigger.setAttribute('aria-controls', dialog.id);
    publicTrigger.addEventListener('click', open);
    publicTrigger.disabled = false;
    publicTrigger.hidden = false;
  }

  let focusBefore;
  let visibleResults = [];
  let active = -1;
  let workingEntries = [];
  let scope = 'all';
  let editingPins = false;
  let fileTimer;
  let fileRequest;
  let fileResults = [];
  let fileMessage = '';

  let rows = [];
  let pointerPosition;

  function activate(index, scroll = true) {
    rows[active]?.setAttribute('aria-selected', 'false');
    active = index;
    const row = rows[active];
    if (!row) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    row.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', row.id);
    if (scroll) row.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'});
  }

  function updatePointerSelection() {
    if (!pointerPosition) return;
    const [x, y] = pointerPosition;
    const row = document.elementFromPoint(x, y)?.closest('[role="option"]');
    const index = rows.indexOf(row);
    if (index !== active) activate(index, false);
  }

  function trackPointer(event) {
    if (event.pointerType === 'touch') return;
    pointerPosition = [event.clientX, event.clientY];
    updatePointerSelection();
  }

  function scopedEntries() {
    if (scope === 'app') return workingEntries.filter(entry => entry.local);
    if (scope === 'apps') return workingEntries.filter(entry => entry.app);
    if (scope === 'files') return fileResults;
    if (scope === 'tour') return tourStops.flatMap(([selector, label, detail]) => {
      const entry = workingEntries.find(item => item.id === `page:${page}:${selector}`);
      return entry ? [{...entry, label, detail, group: 'Portfolio tour'}] : [];
    });
    return workingEntries;
  }

  function prioritized(matches) {
    const byId = new Map(matches.filter(entry => entry.id).map(entry => [entry.id, entry]));
    const used = new Set();
    function collect(entries, group, limit = Infinity) {
      return entries.filter(entry => entry && !used.has(entry)).slice(0, limit).map(entry => {
        used.add(entry);
        return {...entry, group};
      });
    }
    const fromIds = ids => ids.map(id => byId.get(id));
    const favorites = collect(fromIds(preferences.favorites), 'Favorites');
    const tools = fromIds(Array.from(appUrls, href => `app:${href}`)).filter(entry => entry?.group === 'Your tools');
    const local = fromIds((primaryActions[page] || []).map(selector => `page:${page}:${selector}`));
    const primary = page === 'portfolio' && tools.length ? collect(tools, 'Your tools') :
      collect(local.some(Boolean) ? local : matches.filter(entry => entry.local), 'Quick actions', 4);
    const recent = collect(fromIds(preferences.recent), 'Recent', 3);
    if (favorites.length || primary.length || recent.length) return [...favorites, ...primary, ...recent];
    return collect(matches.filter(entry => entry.app || entry.target?.matches('[data-account-login]')), 'Useful links', 4);
  }

  function render() {
    const query = input.value.toLowerCase().trim();
    const words = query.split(/\s+/).filter(Boolean);
    const matches = scopedEntries().filter(({label, group, keywords = ''}) => {
      if (scope === 'files') return true;
      const searchable = `${label} ${group} ${keywords}`.toLowerCase();
      return words.every(word => searchable.includes(word));
    });
    const groupedEntries = new Map();
    function rank({label}) {
      const name = label.toLowerCase();
      if (name === query) return 0;
      if (name.startsWith(query)) return 1;
      return words.every(word => name.includes(word)) ? 2 : 3;
    }
    let sorted = matches;
    if (scope === 'all' && !editingPins && !query) sorted = prioritized(matches);
    else if (query && scope !== 'files') sorted = matches.sort((a, b) => rank(a) - rank(b));
    else if (scope === 'apps') sorted = [...matches.filter(entry => entry.restricted), ...matches.filter(entry => !entry.restricted)];
    for (const entry of sorted) {
      if (editingPins && !entry.id) continue;
      if (!groupedEntries.has(entry.group)) groupedEntries.set(entry.group, []);
      groupedEntries.get(entry.group).push(entry);
    }
    visibleResults = [...groupedEntries.values()].flat();
    const groups = new Map();
    list.replaceChildren();
    rows = [];
    active = -1;
    for (const [index, entry] of visibleResults.entries()) {
      if (!groups.has(entry.group)) {
        const group = element('div', {role: 'group', 'aria-label': entry.group, class: 'ches-keys-group'});
        group.append(element('div', {class: 'ches-keys-group-title', 'aria-hidden': 'true'}, entry.group));
        list.append(group);
        groups.set(entry.group, group);
      }
      const restricted = entry.restricted || entry.group === 'Your tools';
      const isPublic = ['Try it now', 'Ches sites'].includes(entry.group);
      const row = element('div', {
        role: 'option', id: 'ches-keys-option-' + index, 'aria-selected': 'false',
        class: restricted ? 'ches-option-access' : isPublic ? 'ches-option-public' : 'ches-option-standard',
      });
      const tile = element('span', {class: 'ches-option-tile'});
      tile.append(icon(restricted ? 'lock' : isPublic ? 'spark' : entry.href ? 'arrow' : 'action'));
      const caption = element('span', {class: 'ches-option-label'}, entry.label);
      if (entry.detail) caption.append(element('small', {class: 'ches-option-detail'}, entry.detail));
      row.append(tile, caption);
      const pinned = preferences.favorites.includes(entry.id);
      if (pinned || editingPins) {
        if (pinned) row.setAttribute('aria-label', `${entry.label} (favorite)`);
        row.append(element('span', {class: 'ches-option-pin', 'aria-hidden': 'true'},
          editingPins ? (pinned ? 'Unpin' : 'Pin') : ''));
        if (pinned && !editingPins) row.lastElementChild.append(icon('star'));
      }
      if (entry.key && !editingPins) {
        row.setAttribute('aria-keyshortcuts', 'Alt+Shift+' + entry.key);
        row.append(element('kbd', {'aria-hidden': 'true'}, keyLabel(entry.key)));
      }
      row.append(element('span', {class: 'ches-option-enter', 'aria-hidden': 'true'}, '↵'));
      rows.push(row);
      groups.get(entry.group).append(row);
    }
    status.textContent = scope === 'files' ? fileMessage : visibleResults.length ? '' : 'No matching pages or actions.';
    status.hidden = !settings.hidden || !status.textContent;
    list.scrollTop = 0;
    activate(visibleResults.length ? 0 : -1, false);
    updatePointerSelection();
  }

  function updateShortcut() {
    const selected = preferences.shortcut;
    triggerHint.textContent = alternateKeys[selected] || openKeys;
    trigger.setAttribute('aria-keyshortcuts', selected === 'default' ?
      (isMac ? 'Meta' : 'Control') + '+K' : 'Alt+Shift+' + (selected === 'KeyK' ? 'K' : 'Space'));
    shortcutSelect.value = selected;
  }

  function showSettings(open) {
    settings.hidden = !open;
    settingsButton.setAttribute('aria-expanded', String(open));
    input.hidden = searchIcon.hidden = list.hidden = guide.hidden = open;
    settingsTitle.hidden = !open;
    if (open) {
      clearHistory.disabled = !preferences.recent.length;
      status.hidden = true;
      (root.classList.contains('ches-no-key-hints') ? editPins : shortcutSelect).focus();
    } else {
      render();
      input.focus();
    }
  }

  function setScope(value, focus = true) {
    scope = value;
    editingPins = editingPins && value !== 'tour' && value !== 'files';
    pinControls.hidden = !editingPins;
    for (const [name, button] of scopeButtons) button.setAttribute('aria-pressed', String(name === value));
    scopeButtons.get('tour').hidden = value !== 'tour';
    updateFilesScope();
    input.placeholder = value === 'files' ? 'Search your file names…' : 'Search pages and actions…';
    input.setAttribute('aria-label', value === 'files' ? 'Search your file names' : 'Search pages and actions');
    input.value = '';
    pointerPosition = undefined;
    resetFileSearch();
    list.removeAttribute('aria-busy');
    if (value === 'files') fileMessage = 'Enter at least two characters to find a file.';
    if (!settings.hidden) showSettings(false);
    else render();
    if (focus) input.focus();
  }

  function updateFilesScope() {
    scopeButtons.get('files').hidden = page !== 'drop' || !shown(document.querySelector('#files'));
  }

  function resetFileSearch() {
    clearTimeout(fileTimer);
    fileRequest?.abort();
    fileRequest = undefined;
    fileResults = [];
  }

  function searchFiles() {
    resetFileSearch();
    const q = input.value.trim().slice(0, 100);
    fileMessage = q.length < 2 ? 'Enter at least two characters to find a file.' : 'Searching your files…';
    list.setAttribute('aria-busy', String(q.length >= 2));
    render();
    if (q.length >= 2) fileTimer = setTimeout(() => loadFileResults(q), 250);
  }

  async function loadFileResults(q) {
    const controller = new AbortController();
    fileRequest = controller;
    const timeout = setTimeout(() => controller.abort(), 7500);
    const options = {signal: controller.signal, cache: 'no-store'};
    try {
      const stateResponse = await fetch('/admin/api/state', options);
      if (!stateResponse.ok) throw new Error();
      const state = await stateResponse.json();
      if (fileRequest !== controller) return;
      if (state.authenticated !== true || (state.role === 'admin' && !state.subject)) {
        fileMessage = 'Sign in to search your files.';
        return;
      }
      const params = new URLSearchParams({q});
      if (state.role === 'admin') params.set('owner', state.subject);
      const response = await fetch(`/admin/api/files?${params}`, options);
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (fileRequest !== controller) return;
      fileResults = data.files.slice(0, 100).flatMap(file =>
        typeof file.name === 'string' && /^[0-9a-f-]{36}$/i.test(file.id) ? [{
          label: file.name, href: `/admin/api/preview/${file.id}`, restricted: true, group: 'Files in your library',
        }] : []);
      fileMessage = fileResults.length ? (data.nextCursor ? 'Showing the first 100 files. Narrow your search for more specific results.' : '') :
        'No files match this name.';
    } catch {
      if (fileRequest === controller) fileMessage = 'Could not search your files. Edit the search to try again.';
    } finally {
      clearTimeout(timeout);
      if (fileRequest === controller && dialog.open && scope === 'files') {
        list.removeAttribute('aria-busy');
        render();
      }
    }
  }

  const availabilityObserver = new MutationObserver(() => {
    if (dialog.open) refreshEntries();
  });

  function refreshEntries() {
    const next = entries();
    updateFilesScope();
    if (next.length === workingEntries.length && next.every((entry, index) => {
      const previous = workingEntries[index];
      return entry.label === previous.label && entry.target === previous.target && entry.href === previous.href;
    })) return;
    workingEntries = next;
    render();
  }

  function watchAvailability() {
    const toolbar = trigger.closest('.ches-command-bar') || (page === 'drop' && document.querySelector('#app'));
    const attributes = ['hidden', 'disabled', 'href', 'aria-hidden', 'aria-disabled', 'inert'];
    if (toolbar) availabilityObserver.observe(toolbar, {subtree: true, childList: true, attributeFilter: attributes});
    const controls = new Set();
    for (const [, selector] of actionSets[page] || []) {
      const control = document.querySelector(selector);
      if (!control) continue;
      controls.add(control);
      const fieldset = control.closest('fieldset');
      if (fieldset) controls.add(fieldset);
    }
    for (const control of controls) availabilityObserver.observe(control, {attributeFilter: attributes});
  }

  function open(event, initialScope = 'all') {
    if (dialog.open || document.querySelector('dialog[open], .modal.show')) return;
    focusBefore = event?.currentTarget ||
      (document.activeElement === document.body ? trigger : document.activeElement);
    if (toolbarMenu?.open) {
      if (toolbarMenu.contains(focusBefore)) focusBefore = toolbarMenu.querySelector('summary');
      toolbarMenu.open = false;
    }
    pointerPosition = undefined;
    input.value = '';
    dialog.showModal();
    editingPins = false;
    workingEntries = entries();
    setScope(initialScope);
    watchAvailability();
    input.focus();
  }

  function run(entry) {
    if (entry.adminAction) {
      if (adminLink()) location.assign(entry.href);
      return;
    }
    if (entry.accessTarget && !availableLink(entry.accessTarget)) return;
    if (entry.operation === 'focus' || entry.operation === 'run-and-focus') {
      if (!shown(entry.target)) return;
      entry.target.scrollIntoView({block: 'center'});
      if (entry.target.tabIndex < 0 && !entry.target.hasAttribute('tabindex')) {
        entry.target.tabIndex = -1;
        entry.target.addEventListener('blur', () => entry.target.removeAttribute('tabindex'), {once: true});
      }
      entry.target.focus({preventScroll: true});
      if (entry.operation === 'run-and-focus' && entry.target.getAttribute('aria-pressed') !== 'true') {
        entry.target.click();
      }
    } else if (entry.href && !shown(entry.target)) {
      location.assign(entry.href);
    } else if (shown(entry.target)) {
      entry.target.click();
    }
  }

  function choose(entry) {
    if (!entry) return;
    if (editingPins) {
      const pinned = preferences.favorites.includes(entry.id);
      if (!pinned && preferences.favorites.length >= 40) {
        announcement.textContent = 'Unpin a favorite before adding another.';
        return;
      }
      preferences.favorites = pinned ? preferences.favorites.filter(id => id !== entry.id) :
        [...preferences.favorites, entry.id];
      savePreferences();
      announcement.textContent = `${entry.label} ${pinned ? 'unpinned' : 'pinned'}.`;
      const scroll = list.scrollTop;
      render();
      list.scrollTop = scroll;
      activate(visibleResults.findIndex(item => item.id === entry.id), false);
      input.focus({preventScroll: true});
      return;
    }
    if (entry.id) {
      preferences.recent = [entry.id, ...preferences.recent.filter(id => id !== entry.id)].slice(0, 8);
      savePreferences();
    }
    if (entry.operation === 'tour' || entry.operation === 'files') {
      setScope(entry.operation);
      return;
    }
    dialog.close();
    run(entry);
  }

  function dismiss() {
    dialog.close();
    if (shown(focusBefore)) focusBefore.focus({preventScroll: true});
  }

  function isBackdrop(event) {
    if (event.target !== dialog) return false;
    const {left, top, right, bottom} = dialog.getBoundingClientRect();
    return event.clientX < left || event.clientX > right ||
      event.clientY < top || event.clientY > bottom;
  }

  let pressedBackdrop = false;
  dialog.addEventListener('pointerdown', event => {
    pressedBackdrop = event.isPrimary && event.button === 0 && isBackdrop(event);
  });
  dialog.addEventListener('click', event => {
    const dismissBackdrop = pressedBackdrop && isBackdrop(event);
    pressedBackdrop = false;
    if (dismissBackdrop) dismiss();
  });

  trigger.addEventListener('click', open);
  close.addEventListener('click', dismiss);
  settingsButton.addEventListener('click', () => showSettings(settings.hidden));
  shortcutSelect.addEventListener('change', () => {
    preferences.shortcut = shortcutSelect.value;
    savePreferences();
    updateShortcut();
  });
  clearHistory.addEventListener('click', () => {
    preferences.recent = [];
    savePreferences();
    clearHistory.disabled = true;
    announcement.textContent = 'Recent commands cleared.';
    editPins.focus();
  });
  editPins.addEventListener('click', () => {
    editingPins = true;
    setScope('all');
  });
  finishPins.addEventListener('click', () => {
    editingPins = false;
    pinControls.hidden = true;
    render();
    input.focus();
  });
  addEventListener('storage', event => {
    if (event.key !== settingsKey) return;
    preferences = readPreferences();
    updateShortcut();
    if (dialog.open && settings.hidden) render();
  });
  updateShortcut();
  dialog.addEventListener('close', () => {
    if (!dialog.open) {
      availabilityObserver.disconnect();
      resetFileSearch();
    }
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    dismiss();
  });
  list.addEventListener('pointermove', trackPointer, {passive: true});
  list.addEventListener('wheel', trackPointer, {passive: true});
  list.addEventListener('scroll', updatePointerSelection, {passive: true});
  list.addEventListener('pointerleave', () => {
    if (!pointerPosition) return;
    pointerPosition = undefined;
    activate(-1, false);
  });
  list.addEventListener('click', event => {
    const row = event.target.closest('[role="option"]');
    if (row) choose(visibleResults[Number(row.id.slice('ches-keys-option-'.length))]);
  });
  input.addEventListener('input', event => {
    pointerPosition = undefined;
    if (event.isComposing) return;
    if (scope === 'files') searchFiles();
    else render();
  });
  input.addEventListener('compositionend', () => {
    if (scope === 'files') searchFiles();
    else render();
  });
  document.addEventListener('ches:tools-updated', () => {
    if (dialog.open) refreshEntries();
  });
  input.addEventListener('keydown', event => {
    if (event.isComposing || event.defaultPrevented) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (visibleResults.length) {
        pointerPosition = undefined;
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const start = active < 0 && delta < 0 ? 0 : active;
        activate((start + delta + visibleResults.length) % visibleResults.length);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(visibleResults[active]);
    }
  });

  const letterCodes = {ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight'};
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.isComposing || event.repeat) return;
    const primary = isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
    const matchesOpen = preferences.shortcut === 'default' ?
      primary && !event.altKey && !event.shiftKey && event.code === 'KeyK' :
      !event.metaKey && !event.ctrlKey && event.altKey && event.shiftKey && event.code === preferences.shortcut;
    if (matchesOpen) {
      if (dialog.open) {
        event.preventDefault();
        if (settings.hidden) input.focus();
        else showSettings(false);
      } else if (!document.querySelector('dialog[open], .modal.show')) {
        event.preventDefault();
        open();
      }
      return;
    }
    if (dialog.open || event.metaKey || event.ctrlKey || !event.altKey || !event.shiftKey ||
        document.querySelector('dialog[open], .modal.show')) return;
    if (event.composedPath().some(node => node instanceof HTMLElement &&
        (node.isContentEditable || node.matches('input, textarea, select, [role="textbox"], [role="combobox"]')))) return;
    const entry = pageActions().find(({key}) => key && event.code === (letterCodes[key] || 'Key' + key));
    if (entry) {
      event.preventDefault();
      run(entry);
    }
  });

  for (const [, selector, key] of actionSets[page] || []) {
    if (!key) continue;
    const annotate = () => {
      const target = document.querySelector(selector);
      if (!target || target.hasAttribute('aria-keyshortcuts')) return false;
      target.setAttribute('aria-keyshortcuts', 'Alt+Shift+' + key);
      const hint = element('kbd', {class: 'ches-keys-hint', 'aria-hidden': 'true'}, keyLabel(key));
      if (target.matches('button, a') && !target.matches('[aria-label]')) target.append(hint);
      else {
        const label = target.labels?.[0];
        if (label) label.append(hint);

      }
      return true;
    };
    if (!annotate() && page === 'drop') {
      const app = document.querySelector('#app');
      if (app) {
        const observer = new MutationObserver(() => {
          if (annotate()) observer.disconnect();
        });
        observer.observe(app, {childList: true, subtree: true});
      }
    }
  }
})();
