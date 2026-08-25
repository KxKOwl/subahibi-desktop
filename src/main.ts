// ═══════════════════════════════════════════════════════════════
// <<美好的每一天~不连续存在~>> // 水上由岐 - Desktop UI
// 入口：初始化各管理器并绑定全局快捷键
// ═══════════════════════════════════════════════════════════════

import { $ } from './utils';
import { ThemeManager } from './ThemeManager';
import { ClockManager } from './ClockManager';
import { AudioPlayer } from './AudioPlayer';
import { WindowManager } from './WindowManager';
import { DesktopEffects } from './DesktopEffects';
import { MessageBoard } from './MessageBoard';

setTimeout(() => $('#boot').classList.add('done'), 950);

const theme = new ThemeManager();
const player = new AudioPlayer();
const windows = new WindowManager();
const clocks = new ClockManager();
const effects = new DesktopEffects();
const board = new MessageBoard();

theme.init();
player.init();
windows.init();
clocks.init();
effects.init();
board.init();

document.addEventListener('keydown', e => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('[contenteditable="true"],input,textarea')) return;

    switch (e.key) {
        case ' ':
            e.preventDefault();
            player.togglePlay();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            player.seekBy(-5);
            break;
        case 'ArrowRight':
            e.preventDefault();
            player.seekBy(5);
            break;
        case 'ArrowUp':
            e.preventDefault();
            player.changeVolume(.05);
            break;
        case 'ArrowDown':
            e.preventDefault();
            player.changeVolume(-.05);
            break;
        case 'm':
            e.preventDefault();
            player.toggleMute();
            break;
        case 'f':
            e.preventDefault();
            $('#fullscreen').click();
            break;
        case 'e':
            if (!e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                windows.toggleEditor();
            }
            break;
    }
});

export {};
