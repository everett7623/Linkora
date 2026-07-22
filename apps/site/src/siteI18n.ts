import {
  DEFAULT_SITE_LOCALE,
  SITE_LOCALE_STORAGE_KEY,
  siteLocales,
  siteMessages,
  type SiteLocale,
} from './siteMessages';

let activeLocale: SiteLocale = DEFAULT_SITE_LOCALE;

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

export function setSiteLocale(locale: SiteLocale, persist = true) {
  activeLocale = locale;
  const metadata = siteLocales.find((item) => item.code === locale) ?? siteLocales[0];
  document.documentElement.lang = metadata.htmlLang;
  document.title = translate(document.body.dataset.pageTitle ?? 'meta.homeTitle');
  localizeElements();
  document.querySelectorAll<HTMLSelectElement>('[data-site-locale]').forEach((control) => {
    control.value = locale;
  });

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
  document.querySelectorAll<HTMLSelectElement>('[data-site-locale]').forEach((control) => {
    control.replaceChildren(
      ...siteLocales.map((locale) => {
        const option = document.createElement('option');
        option.value = locale.code;
        option.textContent = locale.label;
        return option;
      })
    );
    control.addEventListener('change', () => setSiteLocale(control.value as SiteLocale));
  });

  setSiteLocale(readInitialLocale(), false);
}
