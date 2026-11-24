(() => {
  'use strict';

  const page = document.body.dataset.chesKeyboard;
  if (!page || typeof HTMLDialogElement.prototype.showModal !== 'function') return;

  const isMac = /mac|iphone|ipad/i.test(navigator.userAgentData?.platform || navigator.platform);
  const openKeys = isMac ? '⌘ K' : 'Ctrl K';
  const shortcutPrefix = isMac ? '⌥ ⇧' : 'Alt Shift';
  const home = 'https://ches.dev/';
  const destinations = [
    ['Portfolio', home], ['CPU walkthrough', home + 'cpu/'],
    ['Printed storefront', home + '3D-Printing-Order-Management/index.html'],
    ['Troop 55 RSVP demo', home + 'BSA2/'],
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

  function element(tag, attrs = {}, text = '') {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    if (text) node.textContent = text;
    return node;
  }

  function keyLabel(key) {
    return shortcutPrefix + ' ' + ({ArrowLeft: '←', ArrowRight: '→'}[key] || key);
  }

  function shown(node) {
    if (!node || node.closest('[hidden], [inert], [aria-hidden="true"]') ||
        node.matches(':disabled, [aria-disabled="true"]')) return false;
    return node.getClientRects().length > 0 && getComputedStyle(node).visibility === 'visible';
  }

  function pageActions() {
    return (actionSets[page] || []).flatMap(([label, selector, key, operation, group = 'On this page']) => {
      const target = document.querySelector(selector);
      return shown(target) ? [{label, target, key, operation, group}] : [];
    });
  }

  function entries() {
    const actions = pageActions();
    const seen = new Set();
    const result = [...actions];
    for (const link of document.querySelectorAll('header nav a[href], [data-ches-command-link][href], header [data-account-login], header [data-account-dashboard], .account-tools a[href]')) {
      const accountLink = link.closest('.account-tools');
      if (!shown(link) && !(accountLink && !link.hidden && !accountLink.hidden)) continue;
      if (link.matches('[aria-disabled="true"]')) continue;
      const href = link.href;
      const label = link.textContent.trim().replace(/\s+/g, ' ');
      if (!label || !/^(https?:|mailto:)/.test(href) || seen.has(href)) continue;
      seen.add(href);
      result.push({label, target: link, href, group: accountLink ? 'Your tools' : 'Navigation'});
    }
    for (const [label, href] of destinations) {
      if (seen.has(href)) continue;
      result.push({label, href, group: 'Ches sites'});
    }
    return result;
  }

  const trigger = element('button', {
    class: 'ches-keys-trigger', type: 'button', 'aria-haspopup': 'dialog',
    'aria-controls': 'ches-keys-dialog', 'aria-keyshortcuts': (isMac ? 'Meta' : 'Control') + '+K',
  }, 'Quick search');
  const triggerHint = element('kbd', {'aria-hidden': 'true'}, openKeys);
  trigger.append(triggerHint);

  const dialog = element('dialog', {class: 'ches-keys-dialog', id: 'ches-keys-dialog', 'aria-labelledby': 'ches-keys-title'});
  const title = element('h2', {id: 'ches-keys-title'}, 'Quick search');
  const input = element('input', {
    type: 'search', role: 'combobox', 'aria-label': 'Search pages and actions',
    'aria-autocomplete': 'list', 'aria-expanded': 'true', 'aria-controls': 'ches-keys-results',
    placeholder: 'Search pages and actions…', autocomplete: 'off', spellcheck: 'false',
    autofocus: '',
  });
  const close = element('button', {type: 'button', class: 'ches-keys-close', 'aria-label': 'Close quick search'});
  close.append(element('kbd', {'aria-hidden': 'true'}, 'Esc'));
  const header = element('div', {class: 'ches-keys-search'});
  header.append(input, close);
  const list = element('div', {id: 'ches-keys-results', role: 'listbox', 'aria-label': 'Search results'});
  const status = element('p', {class: 'ches-keys-status', role: 'status'});
  const guide = element('footer', {class: 'ches-keys-guide'});
  for (const [keys, label] of [['↑ ↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']]) {
    const hint = element('span');
    hint.append(element('kbd', {'aria-hidden': 'true'}, keys), document.createTextNode(label));
    guide.append(hint);
  }
  dialog.append(title, header, list, status, guide);
  const mount = document.querySelector('header.site-header, header.topbar, [data-ches-keyboard-mount]');
  if (mount) mount.append(trigger);
  else {
    trigger.classList.add('ches-keys-docked');
    document.body.append(trigger);
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

  function activate(index, scroll = true) {
    active = index;
    for (const [position, row] of [...list.querySelectorAll('[role="option"]')].entries()) {
      const selected = position === active;
      row.setAttribute('aria-selected', selected);
      if (selected) {
        input.setAttribute('aria-activedescendant', row.id);
        if (scroll) row.scrollIntoView({block: 'nearest', inline: 'nearest'});
      }
    }
    if (active === -1) input.removeAttribute('aria-activedescendant');
  }

  function render() {
    const words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    visibleResults = workingEntries.filter(({label, group}) => words.every(word =>
      (label + ' ' + group).toLowerCase().includes(word)));
    const groups = new Map();
    list.replaceChildren();
    for (const [index, entry] of visibleResults.entries()) {
      if (!groups.has(entry.group)) {
        const group = element('div', {role: 'group', 'aria-label': entry.group, class: 'ches-keys-group'});
        group.append(element('div', {class: 'ches-keys-group-title', 'aria-hidden': 'true'}, entry.group));
        list.append(group);
        groups.set(entry.group, group);
      }
      const row = element('div', {role: 'option', id: 'ches-keys-option-' + index, 'aria-selected': 'false'}, entry.label);
      if (entry.key) {
        row.setAttribute('aria-keyshortcuts', 'Alt+Shift+' + entry.key);
        row.append(element('kbd', {'aria-hidden': 'true'}, keyLabel(entry.key)));
      }
      row.addEventListener('pointermove', () => activate(index, false));
      groups.get(entry.group).append(row);
    }
    status.textContent = visibleResults.length ? '' : 'No matching pages or actions.';
    status.hidden = visibleResults.length > 0;
    list.scrollTop = 0;
    activate(visibleResults.length ? 0 : -1, false);
  }

  function open(event) {
    if (dialog.open || document.querySelector('dialog[open], .modal.show')) return;
    focusBefore = event?.currentTarget ||
      (document.activeElement === document.body ? trigger : document.activeElement);
    workingEntries = entries();
    input.value = '';
    dialog.showModal();
    render();
    input.focus();
  }

  function run(entry) {
    if (entry.group === 'Your tools' &&
        (entry.target.hidden || entry.target.closest('.account-tools').hidden)) return;
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
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    dismiss();
  });
  list.addEventListener('click', event => {
    const row = event.target.closest('[role="option"]');
    if (row) choose(visibleResults[Number(row.id.slice('ches-keys-option-'.length))]);
  });
  input.addEventListener('input', event => {
    if (!event.isComposing) render();
  });
  input.addEventListener('compositionend', render);
  document.addEventListener('ches:tools-updated', () => {
    if (dialog.open) {
      workingEntries = entries();
      render();
    }
  });
  input.addEventListener('keydown', event => {
    if (event.isComposing || event.defaultPrevented) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (visibleResults.length) {
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        activate((active + delta + visibleResults.length) % visibleResults.length);
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
    if (primary && !event.altKey && !event.shiftKey && event.code === 'KeyK') {
      if (dialog.open) {
        event.preventDefault();
        input.focus();
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
        else target.title ||= keyLabel(key);
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
