import './styles.css';
import { installSiteLocale, translate } from './siteI18n';

installSiteLocale();

const menuButton = document.querySelector<HTMLButtonElement>('[data-menu-button]');
const navigation = document.querySelector<HTMLElement>('[data-navigation]');

function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  navigation?.removeAttribute('data-open');
}

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  navigation?.toggleAttribute('data-open', !open);
});

navigation?.addEventListener('click', (event) => {
  if ((event.target as HTMLElement).closest('a')) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 760) closeMenu();
});

document.querySelectorAll<HTMLElement>('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

document.querySelectorAll<HTMLButtonElement>('[data-copy-deploy-prompt]').forEach((button) => {
  const promptId = button.dataset.copyDeployPrompt;
  const prompt = promptId ? document.getElementById(promptId) : null;
  const status = document.getElementById('deploy-copy-status');
  const defaultLabelKey = button.dataset.i18n;
  let resetTimer: number | undefined;
  const updateStatus = (message: string) => {
    if (status) status.textContent = message;
  };

  button.addEventListener('click', async () => {
    const promptText = prompt?.textContent?.trim();
    if (!promptText) {
      updateStatus(translate('deploy.copyUnavailable'));
      return;
    }

    try {
      await navigator.clipboard.writeText(promptText);
      button.textContent = translate('deploy.copySuccess');
      updateStatus(translate('deploy.copySuccessStatus'));
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        button.textContent = defaultLabelKey ? translate(defaultLabelKey) : translate('deploy.copyAction');
      }, 2400);
    } catch {
      updateStatus(translate('deploy.copyFailure'));
      prompt?.focus();
    }
  });
});
