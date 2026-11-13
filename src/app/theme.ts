import { useSyncExternalStore } from 'react';

/*
 * Light/dark theme. The learner picks system, light or dark; the resolved theme goes on
 * <html data-theme>, which global.css reads. index.html runs the same resolution inline
 * before first paint, so a light-mode page never flashes dark: keep the two in step.
 */

export type ThemeChoice = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'syntax-drills/theme';
export const THEME_CHOICES: ThemeChoice[] = ['system', 'light', 'dark'];

export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): Theme {
  if (choice === 'system') return systemPrefersDark ? 'dark' : 'light';
  return choice;
}

/** The choice after this one, for a button that cycles through them. */
export function nextThemeChoice(choice: ThemeChoice): ThemeChoice {
  return THEME_CHOICES[(THEME_CHOICES.indexOf(choice) + 1) % THEME_CHOICES.length]!;
}

/* ---------------------------------------------------------------- browser store
   Module-level so the system-setting listener lives as long as the page, not just
   while some screen with the toggle is mounted. startTheme() sets it up. */

const listeners = new Set<() => void>();
let systemDark: MediaQueryList | undefined;
let current: ThemeChoice = 'system';

function readChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* Storage can be blocked; fall back to the system setting. */
  }
  return 'system';
}

function apply() {
  document.documentElement.dataset.theme = resolveTheme(current, systemDark?.matches ?? true);
}

function setChoice(choice: ThemeChoice) {
  current = choice;
  try {
    if (choice === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    /* Not saved; the choice still applies until the page reloads. */
  }
  apply();
  listeners.forEach((notify) => notify());
}

/** Call once at startup: applies the saved choice and follows system changes. */
export function startTheme() {
  systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  current = readChoice();
  apply();
  systemDark.addEventListener('change', apply);
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

export function useTheme() {
  const choice = useSyncExternalStore(subscribe, () => current);
  return { choice, cycle: () => setChoice(nextThemeChoice(current)) };
}
