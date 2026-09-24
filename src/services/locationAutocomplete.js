import { locationService } from './locations';

const mounted = new WeakSet();
const timers = new WeakMap();
const requestVersions = new WeakMap();
const cleanupHandlers = new WeakMap();

function fieldById(id) {
  return document.getElementById(id);
}

function findFieldByLabel(text) {
  const target = String(text || '').trim().toLowerCase();
  if (!target) return null;

  const labels = document.querySelectorAll('label');

  for (const label of labels) {
    const content = label.textContent?.trim().toLowerCase() || '';

    if (!content.includes(target)) continue;

    if (label.htmlFor) {
      const field = fieldById(label.htmlFor);
      if (field) return field;
    }

    const field = label.parentElement?.querySelector(
      'input, textarea',
    );

    if (field) return field;
  }

  return null;
}

function findCityField() {
  return (
    document.querySelector(
      'input[autocomplete="address-level2"]',
    ) ||
    fieldById('af-city') ||
    findFieldByLabel('city')
  );
}

function findLine1Field() {
  return (
    document.querySelector(
      'input[autocomplete="address-line1"]',
    ) ||
    fieldById('af-line1') ||
    findFieldByLabel('street address') ||
    findFieldByLabel('address line 1')
  );
}

function findStateField() {
  return (
    document.querySelector(
      'input[autocomplete="address-level1"]',
    ) ||
    fieldById('af-state') ||
    findFieldByLabel('state')
  );
}

function findPostalField() {
  return (
    document.querySelector(
      'input[autocomplete="postal-code"]',
    ) ||
    fieldById('af-postal') ||
    findFieldByLabel('postal code') ||
    findFieldByLabel('pin code')
  );
}

function setFieldValue(input, value) {
  if (!input || value == null || value === '') return;

  const prototype =
    input instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;

  const setter = Object.getOwnPropertyDescriptor(
    prototype,
    'value',
  )?.set;

  if (!setter) return;

  setter.call(input, String(value));

  input.dispatchEvent(
    new Event('input', {
      bubbles: true,
    }),
  );

  input.dispatchEvent(
    new Event('change', {
      bubbles: true,
    }),
  );
}

function ensureDropdown(input) {
  const host = input.parentElement;

  if (!host) return null;

  let menu = host.querySelector(
    '.lv-location-suggestions',
  );

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
  if (!menu) return;

  menu.hidden = true;
  menu.replaceChildren();
}

function invalidateRequests(input) {
  requestVersions.set(
    input,
    (requestVersions.get(input) || 0) + 1,
  );
}

async function fillFromPlace(
  placeId,
  menu,
  input,
) {
  if (!placeId) {
    close(menu);
    return;
  }

  const version =
    (requestVersions.get(input) || 0) + 1;

  requestVersions.set(
    input,
    version,
  );

  try {
    const details =
      await locationService.details(
        placeId,
      );

    if (
      requestVersions.get(input) !==
      version ||
      !document.body.contains(input)
    ) {
      return;
    }

    setFieldValue(
      findLine1Field(),
      details?.line1,
    );

    setFieldValue(
      findCityField(),
      details?.city,
    );

    setFieldValue(
      findStateField(),
      details?.state,
    );

    setFieldValue(
      findPostalField(),
      details?.postal_code,
    );

    close(menu);
  } catch {
    close(menu);
  }
}

function createSuggestion(
  item,
  menu,
  input,
) {
  const button =
    document.createElement('button');

  button.type = 'button';
  button.className =
    'lv-location-suggestion';
  button.setAttribute(
    'role',
    'option',
  );

  const title =
    document.createElement('strong');

  title.textContent =
    item?.name ||
    item?.address ||
    'Location';

  const subtitle =
    document.createElement('span');

  subtitle.textContent =
    item?.address || '';

  button.append(
    title,
    subtitle,
  );

  /*
   * Prevent the input blur handler from
   * closing the menu before the click.
   */
  button.addEventListener(
    'mousedown',
    (event) => {
      event.preventDefault();
    },
  );

  button.addEventListener(
    'click',
    () => {
      fillFromPlace(
        item?.place_id,
        menu,
        input,
      );
    },
  );

  return button;
}

function attach(input) {
  if (
    !input ||
    mounted.has(input)
  ) {
    return;
  }

  const menu =
    ensureDropdown(input);

  if (!menu) return;

  mounted.add(input);

  const search = async () => {
    const value =
      input.value.trim();

    close(menu);

    if (value.length < 2) {
      invalidateRequests(input);
      return;
    }

    const version =
      (requestVersions.get(input) || 0) + 1;

    requestVersions.set(
      input,
      version,
    );

    try {
      const result =
        await locationService.autocomplete(
          value,
        );

      if (
        requestVersions.get(input) !==
          version ||
        !document.body.contains(input)
      ) {
        return;
      }

      const items = Array.isArray(
        result?.items,
      )
        ? result.items
        : [];

      if (!items.length) return;

      menu.replaceChildren();

      items
        .slice(0, 8)
        .forEach((item) => {
          if (!item?.place_id) return;

          menu.appendChild(
            createSuggestion(
              item,
              menu,
              input,
            ),
          );
        });

      if (menu.children.length) {
        menu.hidden = false;
      }
    } catch {
      close(menu);
    }
  };

  const onInput = () => {
    window.clearTimeout(
      timers.get(input),
    );

    timers.set(
      input,
      window.setTimeout(
        search,
        350,
      ),
    );
  };

  const onFocus = () => {
    if (
      input.value.trim().length >= 2
    ) {
      search();
    }
  };

  const onBlur = () => {
    window.setTimeout(
      () => close(menu),
      180,
    );
  };

  input.addEventListener(
    'input',
    onInput,
  );

  input.addEventListener(
    'focus',
    onFocus,
  );

  input.addEventListener(
    'blur',
    onBlur,
  );

  cleanupHandlers.set(
    input,
    () => {
      window.clearTimeout(
        timers.get(input),
      );

      timers.delete(input);

      invalidateRequests(input);

      input.removeEventListener(
        'input',
        onInput,
      );

      input.removeEventListener(
        'focus',
        onFocus,
      );

      input.removeEventListener(
        'blur',
        onBlur,
      );

      close(menu);

      cleanupHandlers.delete(input);
      mounted.delete(input);
      requestVersions.delete(input);
    },
  );
}

export function installLocationAutocomplete() {
  if (
    typeof document === 'undefined'
  ) {
    return () => {};
  }

  const scan = () => {
    attach(findLine1Field());
    attach(findCityField());
  };

  scan();

  const observer =
    new MutationObserver(scan);

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true,
    },
  );

  return () => {
    observer.disconnect();

    document
      .querySelectorAll('input, textarea')
      .forEach((input) => {
        cleanupHandlers
          .get(input)
          ?.();
      });
  };
}