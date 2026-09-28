import { locationService } from './locations';

const mounted = new WeakSet();
const timers = new WeakMap();
const requestVersions = new WeakMap();

function fieldById(id) { return document.getElementById(id); }
function findFieldByLabel(text) {
  const labels = [...document.querySelectorAll('label')];
  const label = labels.find((node) => node.textContent?.trim().toLowerCase().includes(text));
  if (!label) return null;
  if (label.htmlFor) return fieldById(label.htmlFor);
  return label.parentElement?.querySelector('input, textarea');
}
function findCityField() {
  return document.querySelector('input[autocomplete="address-level2"]') || fieldById('af-city') || findFieldByLabel('city');
}
function findLine1Field() {
  return document.querySelector('input[autocomplete="address-line1"]') || fieldById('af-line1') || findFieldByLabel('street address') || findFieldByLabel('address line 1');
}
function setFieldValue(input, value) {
  if (!input || value == null || value === '') return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, String(value));
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}
function ensureDropdown(input) {
  const host = input.parentElement;
  if (!host) return null;
  host.style.position ||= 'relative';
  let menu = host.querySelector('.lv-location-suggestions');
  if (!menu) {
    menu = document.createElement('div');
    menu.className = 'lv-location-suggestions';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    host.appendChild(menu);
  }
  return menu;
}
function close(menu) {
  if (menu) { menu.hidden = true; menu.replaceChildren(); }
}

async function fillFromPlace(placeId, menu, input) {
  const version = (requestVersions.get(input) || 0) + 1;
  requestVersions.set(input, version);
  try {
    const details = await locationService.details(placeId);
    if (requestVersions.get(input) !== version) return;
    const city = findCityField();
    const state = document.querySelector('input[autocomplete="address-level1"]') || fieldById('af-state') || findFieldByLabel('state');
    const pin = document.querySelector('input[autocomplete="postal-code"]') || fieldById('af-postal') || findFieldByLabel('postal code') || findFieldByLabel('pin code');
    const line1 = findLine1Field();
    setFieldValue(line1, details.line1);
    setFieldValue(city, details.city);
    setFieldValue(state, details.state);
    setFieldValue(pin, details.postal_code);
    close(menu);
  } catch { close(menu); }
}

function attach(input) {
  if (!input || mounted.has(input)) return;
  mounted.add(input);
  const menu = ensureDropdown(input);
  if (!menu) return;

  const search = async () => {
    const value = input.value.trim();
    close(menu);
    if (value.length < 2) return;
    const version = (requestVersions.get(input) || 0) + 1;
    requestVersions.set(input, version);
    try {
      const result = await locationService.autocomplete(value);
      if (requestVersions.get(input) !== version || !document.body.contains(input)) return;
      const items = Array.isArray(result?.items) ? result.items : [];
      if (!items.length) return;
      menu.replaceChildren();
      items.slice(0, 8).forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lv-location-suggestion';
        button.setAttribute('role', 'option');
        const title = document.createElement('strong');
        title.textContent = item.name || item.address || 'Location';
        const subtitle = document.createElement('span');
        subtitle.textContent = item.address || '';
        button.append(title, subtitle);
        button.addEventListener('mousedown', (event) => event.preventDefault());
        button.addEventListener('click', () => fillFromPlace(item.place_id, menu, input));
        menu.appendChild(button);
      });
      menu.hidden = false;
    } catch { close(menu); }
  };

  input.addEventListener('input', () => {
    window.clearTimeout(timers.get(input));
    timers.set(input, window.setTimeout(search, 350));
  });
  input.addEventListener('focus', () => { if (input.value.trim().length >= 2) search(); });
  input.addEventListener('blur', () => window.setTimeout(() => close(menu), 180));
}

export function installLocationAutocomplete() {
  const scan = () => { attach(findLine1Field()); attach(findCityField()); };
  scan();
  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
