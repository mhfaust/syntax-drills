import { describe, expect, it } from 'vitest';
import { nextThemeChoice, resolveTheme } from '@/app/theme';

describe('resolveTheme', () => {
  it('follows the system setting for "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('ignores the system setting for an explicit choice', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('nextThemeChoice', () => {
  it('cycles system → light → dark → system', () => {
    expect(nextThemeChoice('system')).toBe('light');
    expect(nextThemeChoice('light')).toBe('dark');
    expect(nextThemeChoice('dark')).toBe('system');
  });
});
