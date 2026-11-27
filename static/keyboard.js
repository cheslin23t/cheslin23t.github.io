(() => {
  'use strict';

  const page = document.body.dataset.chesKeyboard;
  const demo = ['cpu', 'printed', 'scouts'].includes(page);
  if (!page || (demo && page !== 'cpu') ||
      typeof HTMLDialogElement.prototype.showModal !== 'function') return;

  const platform = navigator.userAgentData?.platform || navigator.platform;
  const apple = /mac|iphone|ipad|ipod|ios/i.test(platform);
  const handheld = navigator.userAgentData?.mobile ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (/mac/i.test(platform) && navigator.maxTouchPoints > 1);
  const isMac = apple;
  const root = document.documentElement;
  root.classList.toggle('ches-no-key-hints', Boolean(handheld));
  if (getComputedStyle(root).colorScheme === 'dark') root.classList.add('ches-chrome-dark');
  if (handheld && !demo) {
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
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
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

  const destinations = [['Portfolio', home]];
  const appUrls = new Set([
    home + 'calendar/', 'https://images.ches.dev/admin', 'https://convert.ches.dev/',
    'https://api.ches.dev/book/', 'https://api.ches.dev/go/', home + 'service-status/', 'https://dash.ches.dev/',
    'https://api.ches.dev/auth/if/user/#/library',
    ...destinations.map(([, url]) => url),
  ]);
  const adminBase = 'https://api.ches.dev/auth/if/admin/#';
  const adminOverview = '/administration/overview';
  const adminLinks = 'header .site-account > a[href], header nav a[href], #dashboard-admin[href]';
  const adminActions = [
    ['Invitations', 'Manage invitations', '/flow/stages/invitations', 'invite people create onboarding enrollment new user'],
    ['Invitations', 'Review account enrollment', '/flow/flows/ches-invite-enrollment', 'invite invitation standard account signup flow'],
    ['Invitations', 'Review Images viewer enrollment', '/flow/flows/ches-invite-images-viewer', 'invite invitation read only ches drop flow'],
    ['Invitations', 'Review Images member enrollment', '/flow/flows/ches-invite-images-member', 'invite invitation upload ches drop flow'],
    ['People and permissions', 'Manage users', '/identity/users', 'people accounts user access memberships'],
    ['People and permissions', 'Manage group membership', '/identity/groups', 'people groups user access add remove members'],
    ['People and permissions', 'Manage roles and permissions', '/identity/roles', 'role grants access rights group'],
  ];
  const actionSets = {
    portfolio: [
      ['View live services', '#services', 'L', 'focus', 'Public resources'],
      ['Check calendar availability', '#availability', null, 'focus', 'Public resources'],
      ['Selected work', '#work', null, 'focus', 'Portfolio pages'],
      ['Other projects', '#other-projects', null, 'focus', 'Portfolio pages'],
      ['About Colin', '#about', null, 'focus', 'Portfolio pages'],
      ['BadAvo', '#project-badavo', null, 'focus', 'Projects'],
      ['Printed', '#project-printed', null, 'focus', 'Projects'],
      ['JB-X', '#project-jbx', null, 'focus', 'Projects'],
      ['CPU V2', '#project-cpu', null, 'focus', 'Projects'],
    ],
    calendar: [
      ['Create an event', '#new-event', 'N', null, 'Scheduling'],
      ['Find 30 free minutes', '#find-free-time', null, null, 'Scheduling'],
      ['Go to today', '#today', 'T', null, 'Calendar navigation'],
      ['Previous dates', '#previous-month', 'ArrowLeft', null, 'Calendar navigation'],
      ['Next dates', '#next-month', 'ArrowRight', null, 'Calendar navigation'],
      ['Show day view', '[data-view="day"]', 'D', null, 'Calendar navigation'],
      ['Show week view', '[data-view="week"]', 'W', null, 'Calendar navigation'],
      ['Show month view', '[data-view="month"]', 'M', null, 'Calendar navigation'],
      ['Jump to a month', '#month', 'J', 'focus', 'Calendar navigation'],
    ],
    status: [['Refresh service status', '#service-refresh', 'R', null, 'Operations']],
    drop: [
      ['Choose files to upload', '#choose-files', 'U', null, 'File actions'],
      ['Refresh files', '#refresh', 'R', null, 'File actions'],
      ['View files', '#files-heading', 'F', 'focus', 'File actions'],
      ['View collections', '#groups-heading', 'G', 'focus', 'File actions'],
      ['Select visible files', '#select-all', null, null, 'File actions'],
      ['Clear file selection', '#clear-selection', null, null, 'File actions'],
    ],
    convert: [
      ['Choose files to convert', '#file', 'U', null, 'File conversion'],
      ['Set batch output format', '#batch-target', 'F', 'focus', 'File conversion'],
      ['Download converted files as ZIP', '#download-zip', null, null, 'File conversion'],
    ],
    links: [
      ['Start a short link', '#destination', 'N', 'focus', 'Short links'],
      ['Set a custom alias', '#alias', 'A', 'focus', 'Short links'],
      ['Copy the new short link', '#copy-new', null, null, 'Short links'],
    ],
    bookings: [
      ['Start a booking link', '#booking-label', 'N', 'focus', 'Booking links'],
      ['Pick times on the calendar', '#open-week-picker', 'W', null, 'Booking links'],
      ['Add a time slot', '#add-slot', 'A', null, 'Booking links'],
      ['Copy the new booking link', '#copy-created', null, null, 'Booking links'],
      ['Refresh booking links', '#refresh-links', 'R', null, 'Booking links'],
    ],
    bookingGuest: [
      ['Previous month with openings', '#guest-prev', 'ArrowLeft', null, 'Reservations'],
      ['Next month with openings', '#guest-next', 'ArrowRight', null, 'Reservations'],
      ['Enter the guest name', '#guest-name', null, 'focus', 'Reservations'],
      ['Reload available times', '#guest-retry', null, null, 'Reservations'],
    ],
  };
  const primaryActions = {
    portfolio: ['#work', '#services', '#availability'],
    calendar: ['#new-event', '#find-free-time', '#today'],
    status: ['#service-refresh'],
    drop: ['#choose-files', 'files', '#groups-heading'],
    convert: ['#file', '#batch-target', '#download-zip'],
    links: ['#destination', '#copy-new'],
    bookings: ['#booking-label', '#open-week-picker', '#copy-created'],
    bookingGuest: ['#guest-name', '#guest-next', '#guest-retry'],
  };
  const actionKeywords = {
    '#work': 'featured projects portfolio', '#services': 'status uptime health',
    '#availability': 'schedule free busy',
    '#project-badavo': 'project app', '#project-printed': 'project printing',
    '#project-jbx': 'project terminal', '#project-cpu': 'project processor',
    '#choose-files': 'add file', '#file': 'upload', '#batch-target': 'conversion type',
    '#new-event': 'add new appointment', '#destination': 'new create shorten url',
    '#booking-label': 'new create booking', '#open-week-picker': 'schedule week time slot',
    '#find-free-time': 'schedule availability gap',
  };
  const sectionOrder = [
    'Your tools', 'Scheduling', 'Calendar navigation', 'File actions', 'File conversion',
    'Short links', 'Booking links', 'Reservations', 'Projects', 'Portfolio pages', 'Public resources', 'Ches sites',
    'Operations', 'Invitations', 'People and permissions', 'Navigation',
  ];
  const sectionRanks = new Map(sectionOrder.map((group, index) => [group, index]));
  const navigationLabels = new Map([['Admin', 'Admin console'], ['Dashboard', 'App dashboard'], ['Contact', 'Contact Colin']]);

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
    arrow: 'M6 18 18 6M8 6h10v10',
    jump: 'M5 12h14m-6-6 6 6-6 6',
    action: 'm8.5 6 9 6-9 6z',
    star: 'm12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4L2.8 9.7l6.4-.9Z',
    menu: 'M4 8h16M4 16h16',
    back: 'M13 6 7 12l6 6M7 12h12',
    settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM10 3h4l.5 2.4 1.7 1 2.4-.8 2 3.5-1.8 1.7v2.4l1.8 1.7-2 3.5-2.4-.8-1.7 1L14 21h-4l-.5-2.4-1.7-1-2.4.8-2-3.5 1.8-1.7v-2.4L3.4 9.1l2-3.5 2.4.8 1.7-1L10 3Z',
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
    if (page === 'drop' && shown(document.querySelector('#files'))) {
      result.push({id: 'page:drop:files', label: 'Find a file', keywords: 'search files name library',
        operation: 'files', group: 'File actions', local: true});
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
      const consoleLink = page === 'cockpit' && link.hasAttribute('data-ches-command-link');
      const linkLabel = navigationLabels.get(label) || label;
      result.push({id: app ? `app:${href}` : null, label: linkLabel, target: link, href, app,
        accessTarget: restricted ? link : null, local: consoleLink,
        group: accountLink ? 'Your tools' : consoleLink ? 'Operations' : 'Navigation', restricted});
      if (accountLink && href === 'https://dash.ches.dev/') {
        result.push({label: 'Open server logs', href: 'https://dash.ches.dev/system/logs',
          accessTarget: link, group: 'Operations', restricted: true});
      }
    }
    for (const [label, href] of destinations) {
      if (seen.has(href) || (page === 'portfolio' && href === home)) continue;
      result.push({id: `app:${href}`, label, href, group: 'Ches sites', app: true});
    }
    if (page !== 'portfolio') result.push({label: 'Open live service health', href: home + '#services', group: 'Public resources'});
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
    type: 'search', role: 'combobox', 'aria-label': 'Search commands',
    'aria-autocomplete': 'list', 'aria-expanded': 'true', 'aria-controls': 'ches-keys-results',
    placeholder: 'Search commands…', autocomplete: 'off', spellcheck: 'false',
    autofocus: '',
  });
  const close = element('button', {type: 'button', class: 'ches-keys-close', 'aria-label': 'Close quick search'});
  close.append(icon('close'));
  const header = element('div', {class: 'ches-keys-search'});
  const searchIcon = icon('search');
  const settingsTitle = element('h3', {class: 'ches-keys-settings-title', hidden: ''}, 'Search settings');
  header.append(searchIcon, input, settingsTitle, close);
  const controls = element('div', {class: 'ches-keys-controls'});
  const settingsButton = element('button', {type: 'button', class: 'ches-keys-settings-button',
    'aria-label': 'Settings', 'aria-expanded': 'false', 'aria-controls': 'ches-keys-settings', title: 'Settings'});
  settingsButton.append(icon('settings'));
  const sectionFilter = element('select', {class: 'ches-keys-section-filter',
    'aria-label': 'Filter commands', 'aria-controls': 'ches-keys-results'});
  const backToSearch = element('button', {type: 'button', class: 'ches-keys-back', hidden: ''}, 'Back to search');
  backToSearch.prepend(icon('back'));
  controls.append(sectionFilter, backToSearch, settingsButton);
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
    if (!demo) toolbar.append(trigger);
    if (page === 'portfolio') {
      const signIn = toolbar.querySelector('[data-account-login]');
      if (signIn) {
        signIn.classList.add('ches-direct-login');
        toolbar.append(signIn);
      }
    }
    if (toolbar.classList.contains('site-header')) {
      const updateHeader = () => toolbar.toggleAttribute('data-scrolled', scrollY > 24);
      updateHeader();
      addEventListener('scroll', updateHeader, {passive: true});
    }
    const navigation = toolbar.querySelector('nav');
    if (navigation) mountMenu(toolbar, navigation);
    return true;
  }

  if (demo) {
    mountTrigger();
    return;
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

  let focusBefore;
  let visibleResults = [];
  let active = -1;
  let workingEntries = [];
  let scope = 'all';
  let selectedSection = '';
  let editingPins = false;
  let fileTimer;
  let fileRequest;
  let fileResults = [];
  let fileMessage = '';
  let dismissTimer;
  let resultsMotion;

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
    return workingEntries;
  }

  function prioritized(matches) {
    const byId = new Map(matches.filter(entry => entry.id).map(entry => [entry.id, entry]));
    const used = new Set();
    function collect(entries, group, limit = Infinity) {
      const collected = [];
      for (const entry of entries) {
        if (!entry || used.has(entry)) continue;
        used.add(entry);
        collected.push({...entry, group});
        if (collected.length === limit) break;
      }
      return collected;
    }
    const fromIds = ids => ids.map(id => byId.get(id));
    const favorites = collect(fromIds(preferences.favorites), 'Favorites');
    const tools = fromIds(Array.from(appUrls, href => `app:${href}`)).filter(entry => entry?.group === 'Your tools');
    const local = fromIds((primaryActions[page] || []).map(selector => `page:${page}:${selector}`));
    const primary = page === 'portfolio' && tools.length ? collect(tools, 'Your tools') :
      collect(local.some(Boolean) ? local : matches.filter(entry => entry.local), 'Suggested', 4);
    const recent = collect(fromIds(preferences.recent), 'Recent', 3);
    const rest = matches.filter(entry => !used.has(entry)).sort((a, b) => compareSections(a.group, b.group));
    return [...favorites, ...primary, ...recent, ...rest];
  }

  function compareSections(first, second) {
    return (sectionRanks.get(first) ?? sectionOrder.length) - (sectionRanks.get(second) ?? sectionOrder.length);
  }

  function updateSectionFilter() {
    const groups = [...new Set(workingEntries.map(entry => entry.group))].sort(compareSections);
    if (selectedSection && !groups.includes(selectedSection)) selectedSection = '';
    const browsing = settings.hidden && scope !== 'files';
    controls.hidden = editingPins;
    sectionFilter.hidden = !browsing;
    settingsButton.hidden = !settings.hidden;
    backToSearch.hidden = browsing;
    const modes = [['all', 'All']];
    if (workingEntries.some(entry => entry.local)) modes.push(['app', 'This page']);
    if (workingEntries.some(entry => entry.app)) modes.push(['apps', 'Apps']);
    if (workingEntries.some(entry => entry.operation === 'files')) modes.push(['files', 'My files']);
    const sections = groups.map(group => [`section:${group}`, group]);
    const options = [...modes, ...sections];
    if (options.length === sectionFilter.options.length &&
        options.every(([value], index) => value === sectionFilter.options[index].value)) {
      sectionFilter.value = selectedSection ? `section:${selectedSection}` : scope;
    } else {
      const sectionOptions = element('optgroup', {label: 'Sections'});
      sectionOptions.append(...sections.map(([value, label]) => new Option(label, value)));
      sectionFilter.replaceChildren(...modes.map(([value, label]) => new Option(label, value)), sectionOptions);
      sectionFilter.value = selectedSection ? `section:${selectedSection}` : scope;
    }
  }

  function normalize(value) {
    return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }

  function matchRank(entry, query, words) {
    const name = normalize(entry.label);
    if (name === query) return 0;
    if (name.startsWith(query)) return 1;
    if (words.every(word => name.split(' ').some(part => part.startsWith(word)))) return 2;
    if (words.every(word => name.includes(word))) return 3;
    const terms = normalize(`${entry.label} ${entry.keywords || ''}`);
    if (words.every(word => terms.includes(word))) return 4;
    const category = `${terms} ${normalize(entry.group)}`;
    return words.every(word => category.includes(word)) ? 5 : Infinity;
  }

  function render() {
    updateSectionFilter();
    const query = normalize(input.value);
    const words = query.split(' ');
    const entries = scopedEntries().filter(entry => !selectedSection || entry.group === selectedSection);
    const groupedEntries = new Map();
    let sorted = entries;
    if (query && scope !== 'files') sorted = entries.map(entry => ({entry, rank: matchRank(entry, query, words)}))
      .filter(match => Number.isFinite(match.rank)).sort((a, b) => a.rank - b.rank).map(match => match.entry);
    else if (scope === 'all' && !editingPins && !selectedSection) sorted = prioritized(entries);
    else if (scope === 'apps') sorted = entries.sort((a, b) => Number(Boolean(b.restricted)) - Number(Boolean(a.restricted)));
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
      const row = element('div', {
        role: 'option', id: 'ches-keys-option-' + index, 'aria-selected': 'false',
        class: restricted ? 'ches-option-access' : 'ches-option-standard',
      });
      const tile = element('span', {class: 'ches-option-tile'});
      const iconName = entry.href ? 'arrow' : entry.operation === 'focus' ? 'jump' : 'action';
      tile.append(icon(restricted ? 'lock' : iconName));
      row.append(tile, element('span', {class: 'ches-option-label'}, entry.label));
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
    status.textContent = scope === 'files' ? fileMessage : visibleResults.length ? '' : 'No commands found.';
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
    updateSectionFilter();
    if (open) {
      clearHistory.disabled = !preferences.recent.length;
      status.hidden = true;
      (root.classList.contains('ches-no-key-hints') ? editPins : shortcutSelect).focus();
    } else {
      render();
      revealResults();
      input.focus();
    }
  }

  function revealResults() {
    resultsMotion?.cancel();
    if (reducedMotion.matches || typeof list.animate !== 'function') return;
    resultsMotion = list.animate([
      {opacity: .6, transform: 'translateY(4px)'},
      {opacity: 1, transform: 'translateY(0)'},
    ], {duration: 145, easing: 'cubic-bezier(.2,.75,.25,1)'});
  }

  function setScope(value, {section = '', keepQuery = false, focus = true, animate = true} = {}) {
    scope = value;
    selectedSection = section;
    editingPins = editingPins && value !== 'files';
    pinControls.hidden = !editingPins;
    input.placeholder = value === 'files' ? 'Search your file names…' : 'Search commands…';
    input.setAttribute('aria-label', value === 'files' ? 'Search your file names' : 'Search commands');
    if (!keepQuery) input.value = '';
    pointerPosition = undefined;
    resetFileSearch();
    list.removeAttribute('aria-busy');
    if (value === 'files') fileMessage = 'Enter at least two characters to find a file.';
    if (!settings.hidden) showSettings(false);
    else {
      render();
      if (animate) revealResults();
    }
    if (focus) input.focus();
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
    setScope(initialScope, {animate: false});
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
    if (!entry || dialog.hasAttribute('data-closing')) return;
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
    if (entry.operation === 'files') {
      setScope('files');
      return;
    }
    dialog.close();
    run(entry);
  }

  function dismiss() {
    if (!dialog.open || dialog.hasAttribute('data-closing')) return;
    if (reducedMotion.matches) {
      finishDismiss();
      return;
    }
    dialog.setAttribute('data-closing', '');
    dismissTimer = setTimeout(finishDismiss, 200);
  }

  function finishDismiss() {
    clearTimeout(dismissTimer);
    dialog.removeAttribute('data-closing');
    if (!dialog.open) return;
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
  backToSearch.addEventListener('click', () => {
    if (!settings.hidden) showSettings(false);
    else setScope('all');
  });
  sectionFilter.addEventListener('change', () => {
    const value = sectionFilter.value;
    if (value.startsWith('section:')) setScope('all', {section: value.slice(8), keepQuery: true, focus: false});
    else setScope(value, {keepQuery: value !== 'files', focus: value === 'files'});
  });
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
      clearTimeout(dismissTimer);
      dialog.removeAttribute('data-closing');
      resultsMotion?.cancel();
      availabilityObserver.disconnect();
      resetFileSearch();
    }
  });
  dialog.addEventListener('animationend', event => {
    if (event.target === dialog && event.animationName === 'ches-palette-out') finishDismiss();
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
      choose(visibleResults[Math.max(0, active)]);
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
