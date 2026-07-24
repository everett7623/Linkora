import {
  DEFAULT_SITE_LOCALE,
  SITE_LOCALE_STORAGE_KEY,
  siteLocales,
  siteMessages,
  type SiteLocale,
} from './siteMessages';

let activeLocale: SiteLocale = DEFAULT_SITE_LOCALE;

function closeLanguageMenu(menu: HTMLElement, restoreFocus = false) {
  const trigger = menu.querySelector<HTMLButtonElement>('[data-language-trigger]');
  const options = menu.querySelector<HTMLElement>('[data-language-options]');
  if (!trigger || !options) return;

  options.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
  if (restoreFocus) trigger.focus();
}

function closeOtherLanguageMenus(currentMenu: HTMLElement) {
  document.querySelectorAll<HTMLElement>('[data-language-menu]').forEach((menu) => {
    if (menu !== currentMenu) closeLanguageMenu(menu);
  });
}

function focusLocaleOption(options: HTMLElement, locale = activeLocale) {
  options.querySelector<HTMLButtonElement>(`[data-site-locale-option="${locale}"]`)?.focus();
}

function openLanguageMenu(menu: HTMLElement) {
  const trigger = menu.querySelector<HTMLButtonElement>('[data-language-trigger]');
  const options = menu.querySelector<HTMLElement>('[data-language-options]');
  if (!trigger || !options) return;

  closeOtherLanguageMenus(menu);
  options.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  window.requestAnimationFrame(() => focusLocaleOption(options));
}

function isSiteLocale(value: string | null): value is SiteLocale {
  return siteLocales.some((locale) => locale.code === value);
}

function readInitialLocale(): SiteLocale {
  const queryLocale = new URLSearchParams(window.location.search).get('lang');
  if (isSiteLocale(queryLocale)) return queryLocale;

  try {
    const savedLocale = window.localStorage.getItem(SITE_LOCALE_STORAGE_KEY);
    if (isSiteLocale(savedLocale)) return savedLocale;
  } catch {
    return DEFAULT_SITE_LOCALE;
  }

  return DEFAULT_SITE_LOCALE;
}

export function translate(key: string): string {
  return siteMessages[activeLocale][key as keyof (typeof siteMessages)['en']] ?? key;
}

function localizeElements() {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    element.textContent = translate(element.dataset.i18n ?? '');
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((element) => {
    element.innerHTML = translate(element.dataset.i18nHtml ?? '');
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', translate(element.dataset.i18nAriaLabel ?? ''));
  });
  document.querySelectorAll<HTMLMetaElement>('[data-i18n-content]').forEach((element) => {
    element.content = translate(element.dataset.i18nContent ?? '');
  });
}

function syncLanguageMenus(locale: SiteLocale) {
  const metadata = siteLocales.find((item) => item.code === locale) ?? siteLocales[0];
  const accessibleLabel = `${translate('nav.language')}: ${metadata.label}`;
  document.querySelectorAll<HTMLButtonElement>('[data-language-trigger]').forEach((trigger) => {
    trigger.setAttribute('aria-label', accessibleLabel);
    trigger.title = accessibleLabel;
  });
  document.querySelectorAll<HTMLButtonElement>('[data-site-locale-option]').forEach((option) => {
    option.setAttribute('aria-checked', String(option.dataset.siteLocaleOption === locale));
  });
}

export function setSiteLocale(locale: SiteLocale, persist = true) {
  activeLocale = locale;
  const metadata = siteLocales.find((item) => item.code === locale) ?? siteLocales[0];
  document.documentElement.lang = metadata.htmlLang;
  document.title = translate(document.body.dataset.pageTitle ?? 'meta.homeTitle');
  localizeElements();
  syncLanguageMenus(locale);

  if (persist) {
    try {
      window.localStorage.setItem(SITE_LOCALE_STORAGE_KEY, locale);
    } catch {
      // The site remains usable when browser storage is unavailable.
    }
  }

  window.dispatchEvent(new CustomEvent('linketry:localechange', { detail: locale }));
}

export function installSiteLocale() {
  document.querySelectorAll<HTMLElement>('[data-language-menu]').forEach((menu) => {
    const trigger = menu.querySelector<HTMLButtonElement>('[data-language-trigger]');
    const options = menu.querySelector<HTMLElement>('[data-language-options]');
    if (!trigger || !options) return;

    options.replaceChildren(
      ...siteLocales.map((locale) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.role = 'menuitemradio';
        option.tabIndex = -1;
        option.dataset.siteLocaleOption = locale.code;
        option.setAttribute('aria-checked', 'false');
        option.lang = locale.htmlLang;
        option.textContent = locale.label;
        option.addEventListener('click', () => {
          setSiteLocale(locale.code);
          closeLanguageMenu(menu, true);
        });
        return option;
      })
    );

    trigger.addEventListener('click', () => {
      if (trigger.getAttribute('aria-expanded') === 'true') closeLanguageMenu(menu);
      else openLanguageMenu(menu);
    });
    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      openLanguageMenu(menu);
    });
    options.addEventListener('keydown', (event) => {
      const choices = [...options.querySelectorAll<HTMLButtonElement>('[data-site-locale-option]')];
      const currentIndex = choices.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLanguageMenu(menu, true);
        return;
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

      event.preventDefault();
      const nextIndex =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? choices.length - 1
            : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) %
              choices.length;
      choices[nextIndex]?.focus();
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!(event.target instanceof Node)) return;
    document.querySelectorAll<HTMLElement>('[data-language-menu]').forEach((menu) => {
      if (!menu.contains(event.target as Node)) closeLanguageMenu(menu);
    });
  });

  setSiteLocale(readInitialLocale(), false);
}
