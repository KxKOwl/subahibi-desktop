// ═══════════════════════════════════════════════════════════════
// 主题管理：深色 / 晴日切换与持久化
// ═══════════════════════════════════════════════════════════════

import { $ } from './utils';

export type Theme = 'dark' | 'sunny';

const THEME_KEY = 'subahibi-theme';

export class ThemeManager {
    private theme: Theme = 'dark';
    private readonly toggle = $<HTMLButtonElement>('#theme-toggle');

    init(): void {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'sunny') this.apply(saved);
        this.toggle.addEventListener('click', () => {
            this.apply(this.theme === 'dark' ? 'sunny' : 'dark');
        });
    }

    private apply(theme: Theme): void {
        this.theme = theme;
        document.documentElement.dataset.theme = theme;
        this.toggle.textContent = theme === 'dark' ? '☀' : '☾';
        localStorage.setItem(THEME_KEY, theme);
    }
}
