import type { ReactNode } from 'react';
import styles from '@/app/header/header.module.css';
import { useServices } from '@/app/services';
import { nextThemeChoice, useTheme, type ThemeChoice } from '@/app/theme';

/** Top-level destinations reachable from the header. */
export type Nav = {
  home(): void;
  skills(): void;
  reference(): void;
};

type Props = {
  nav: Nav;
  current?: 'skills' | 'reference';
  /** Extra controls at the end of the nav, such as the history menu on home. */
  children?: ReactNode;
};

export function AppHeader({ nav, current, children }: Props) {
  const { content } = useServices();
  const theme = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button
          className={styles.brand}
          onClick={nav.home}
        >
          <span
            className={styles.mark}
            aria-hidden="true"
          >
            &gt;_
          </span>
          syntax-drills
        </button>
        <span className={styles.language}>{content.languageName.toLowerCase()}</span>
        <nav
          className={styles.nav}
          aria-label="Main"
        >
          <button
            className={styles.navLink}
            aria-current={current === 'skills' ? 'page' : undefined}
            onClick={nav.skills}
          >
            Skills
          </button>
          <button
            className={styles.navLink}
            aria-current={current === 'reference' ? 'page' : undefined}
            onClick={nav.reference}
          >
            Reference
          </button>
          {children}
        </nav>
        <button
          className={styles.themeButton}
          aria-label={`Theme: ${THEME_LABEL[theme.choice]}. Switch to ${THEME_LABEL[nextThemeChoice(theme.choice)]}.`}
          title={`Theme: ${THEME_LABEL[theme.choice]}`}
          onClick={theme.cycle}
        >
          <ThemeIcon choice={theme.choice} />
        </button>
      </div>
    </header>
  );
}

const THEME_LABEL: Record<ThemeChoice, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

/* Lucide-style 24px stroke icons: monitor, sun, moon. */
const THEME_ICON: Record<ThemeChoice, ReactNode> = {
  system: (
    <>
      <rect
        x="2"
        y="3"
        width="20"
        height="14"
        rx="2"
      />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  light: (
    <>
      <circle
        cx="12"
        cy="12"
        r="4"
      />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  dark: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
};

function ThemeIcon({ choice }: { choice: ThemeChoice }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {THEME_ICON[choice]}
    </svg>
  );
}
