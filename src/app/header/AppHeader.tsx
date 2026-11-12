import type { ReactNode } from 'react';
import styles from '@/app/header/header.module.css';
import { useServices } from '@/app/services';

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
      </div>
    </header>
  );
}
