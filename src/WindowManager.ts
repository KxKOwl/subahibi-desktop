// ═══════════════════════════════════════════════════════════════
// 窗口管理：聚焦 / 关闭 / 拖动 / 编辑 / 布局持久化
// ═══════════════════════════════════════════════════════════════

import { $, $$, safeGetJSON } from './utils';

interface CustomWindowData {
    id?: string;
    title?: string;
    body?: string;
    css?: string;
    background?: string;
}

interface WindowSnapshot {
    key: string;
    custom: string | null;
    type: 'text' | 'image';
    title: string;
    body: string;
    background: string;
    css: string;
    zoom: string;
    deleted: boolean;
    image: string;
}

const LAYOUT_KEY = 'sunny-desktop-layout';

export class WindowManager {
    private readonly desktop = $('#desktop');
    private readonly dock = $('#dock');
    private readonly editor = $('#editor');
    private readonly editButton = $('#edit-toggle');
    private readonly zoom = $<HTMLInputElement>('#window-zoom');
    private readonly imagePicker = $<HTMLInputElement>('#image-picker');

    private topZ = 20;
    private selectedWindow: HTMLElement | null = null;
    private customIndex = 0;
    private readonly zoomTimers = new WeakMap<HTMLElement, number>();

    init(): void {
        this.bindBaseWindows();
        this.bindDock();
        this.bindEditor();
        this.restoreLayout();
    }

    toggleEditor(force?: boolean): void {
        const on = force ?? !this.desktop.classList.contains('edit-mode');
        this.desktop.classList.toggle('edit-mode', on);
        this.editor.classList.toggle('open', on);
        this.editButton.classList.toggle('active', on);
        if (!on) {
            $$<HTMLElement>('[contenteditable]').forEach(x => { x.contentEditable = 'false'; });
            $$<HTMLElement>('.window').forEach(w => w.classList.remove('selected'));
            this.selectedWindow = null;
        }
    }

    private bindBaseWindows(): void {
        $$<HTMLElement>('.window').forEach(win => {
            win.addEventListener('pointerdown', () => this.focusWindow(win));
            $<HTMLButtonElement>('header button', win).addEventListener('click', e => {
                e.stopPropagation();
                win.classList.add('closed');
            });
            this.makeDraggable(win, false);
        });
    }

    private bindDock(): void {
        $$<HTMLElement>('[data-restore]').forEach(b => b.addEventListener('click', () => {
            const w = $(`[data-window="${b.dataset.restore}"]`) as HTMLElement | null;
            if (!w) return;
            w.classList.remove('closed');
            w.classList.add('focused');
            w.style.zIndex = String(++this.topZ);
        }));

        $('#fullscreen').addEventListener('click', () =>
            document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
    }

    private bindEditor(): void {
        this.desktop.addEventListener('pointerdown', e => {
            const win = (e.target as HTMLElement).closest('.window');
            if (win) this.selectWindow(win as HTMLElement);
        });

        this.editButton.addEventListener('click', () => this.toggleEditor());
        $('#editor-close').addEventListener('click', () => this.toggleEditor(false));
        this.zoom.addEventListener('input', () => this.applyZoom());

        $('#add-text').addEventListener('click', () => this.createWindow('text'));
        $('#add-image').addEventListener('click', () => {
            this.createWindow('image', { body: '' });
            this.imagePicker.click();
        });
        $('#duplicate-window').addEventListener('click', () => this.duplicateSelected());
        $('#delete-window').addEventListener('click', () => this.deleteSelected());
        $('#edit-content').addEventListener('click', () => this.toggleEditContent());
        $('#replace-image').addEventListener('click', () => {
            if (!this.selectedWindow) return alert('请先选择一个窗口');
            this.imagePicker.click();
        });
        this.imagePicker.addEventListener('change', e => this.onImagePicked(e));
        $('#save-layout').addEventListener('click', () => this.saveLayout());
        $('#reset-layout').addEventListener('click', () => {
            localStorage.removeItem(LAYOUT_KEY);
            location.reload();
        });
    }

    private focusWindow(win: HTMLElement): void {
        $$<HTMLElement>('.window').forEach(w => w.classList.remove('focused'));
        win.classList.add('focused');
        win.style.zIndex = String(++this.topZ);
    }

    private makeDraggable(win: HTMLElement, editorMode: boolean): void {
        const bar = $<HTMLElement>('header', win);
        let moving = false;
        let dx = 0;
        let dy = 0;

        bar.addEventListener('pointerdown', e => {
            const target = e.target as HTMLElement;
            if (target.closest('button')) return;
            if (!editorMode) {
                if (target.closest('input') || innerWidth < 900) return;
            } else if (!this.desktop.classList.contains('edit-mode')) {
                return;
            }
            moving = true;
            dx = e.clientX - win.offsetLeft;
            dy = e.clientY - win.offsetTop;
            bar.setPointerCapture(e.pointerId);
        });

        bar.addEventListener('pointermove', e => {
            if (!moving) return;
            if (editorMode) {
                win.style.left = Math.max(0, e.clientX - dx) + 'px';
                win.style.top = Math.max(0, e.clientY - dy) + 'px';
            } else {
                win.style.left = Math.max(0, Math.min(innerWidth - win.offsetWidth, e.clientX - dx)) + 'px';
                win.style.top = Math.max(0, Math.min(innerHeight - win.offsetHeight, e.clientY - dy)) + 'px';
            }
        });

        bar.addEventListener('pointerup', () => { moving = false; });
        bar.addEventListener('pointerlost', () => { moving = false; });
    }

    private selectWindow(win: HTMLElement): void {
        if (!this.desktop.classList.contains('edit-mode')) return;
        $$<HTMLElement>('.window').forEach(w => w.classList.remove('selected'));
        this.selectedWindow = win;
        win.classList.add('selected');
        $('#selected-name').textContent =
            ($<HTMLElement>('header span', win) as HTMLElement | null)?.textContent || '窗口';
        const z = Number(win.dataset.zoom || 100);
        this.zoom.value = String(z);
        $('#zoom-output').textContent = z + '%';
    }

    private applyZoom(): void {
        const selected = this.selectedWindow;
        if (!selected) return;
        const z = Number(this.zoom.value);
        selected.dataset.zoom = String(z);
        selected.classList.add('zooming');
        selected.style.transform = `scale(${z / 100})`;
        $('#zoom-output').textContent = z + '%';

        const timer = this.zoomTimers.get(selected);
        if (timer !== undefined) clearTimeout(timer);
        this.zoomTimers.set(selected, window.setTimeout(() => selected.classList.remove('zooming'), 200));
    }

    private createWindow(type: 'text' | 'image', data: CustomWindowData = {}): HTMLElement {
        const win = document.createElement('section');
        const id = data.id || `custom-${Date.now()}-${this.customIndex++}`;
        win.className = `window custom-window ${type === 'image' ? 'image-window' : ''}`;
        win.dataset.custom = id;
        win.style.cssText = data.css ||
            `left:${120 + this.customIndex * 24}px;top:${90 + this.customIndex * 20}px;width:330px;height:230px;z-index:${++this.topZ}`;
        win.innerHTML = `<header><span>${data.title || (type === 'image' ? '新图片' : '新文字')}</span><button aria-label="close">×</button></header><div class="editable-body">${data.body || '点击"编辑文字内容"后修改这里。'}</div>`;
        if (data.background) $<HTMLElement>('.editable-body', win).style.backgroundImage = data.background;
        this.desktop.insertBefore(win, this.dock);
        this.makeDraggable(win, true);
        this.selectWindow(win);
        return win;
    }

    private duplicateSelected(): void {
        const selected = this.selectedWindow;
        if (!selected) return alert('请先选择一个窗口');
        if (selected.dataset.custom) {
            const body = $<HTMLElement>('.editable-body', selected);
            this.createWindow(selected.classList.contains('image-window') ? 'image' : 'text', {
                title: $<HTMLElement>('header span', selected).textContent || '',
                body: body.innerHTML,
                background: body.style.backgroundImage,
            });
        } else {
            const copy = selected.cloneNode(true) as HTMLElement;
            copy.dataset.custom = `custom-${Date.now()}`;
            copy.classList.add('custom-window');
            copy.style.left = selected.offsetLeft + 28 + 'px';
            copy.style.top = selected.offsetTop + 28 + 'px';
            copy.querySelectorAll('canvas').forEach(c => c.remove());
            this.desktop.insertBefore(copy, this.dock);
            this.makeDraggable(copy, true);
            this.selectWindow(copy);
        }
    }

    private deleteSelected(): void {
        const selected = this.selectedWindow;
        if (!selected) return alert('请先选择一个窗口');
        selected.classList.add('editor-deleted');
        selected.classList.remove('selected');
        this.selectedWindow = null;
        $('#selected-name').textContent = '未选择窗口';
    }

    private toggleEditContent(): void {
        const selected = this.selectedWindow;
        if (!selected) return alert('请先选择一个窗口');
        const nodes = $$<HTMLElement>(
            'header span,.editable-body,.counter span,.counter strong,.track b,.track span,.service div,.number-grid span',
            selected
        );
        nodes.forEach(n => { n.contentEditable = n.contentEditable === 'true' ? 'false' : 'true'; });
        nodes[0]?.focus();
    }

    private onImagePicked = (e: Event): void => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        const selected = this.selectedWindow;
        if (!file || !selected) return;
        const target = $<HTMLElement>('.editable-body,.crt-image,.avatar-image,.eye-image,.album', selected);
        if (!target) return alert('该窗口没有可替换的图片区域');
        const reader = new FileReader();
        reader.onload = () => {
            target.style.backgroundImage = `url('${reader.result}')`;
            target.dataset.userImage = String(reader.result);
        };
        reader.readAsDataURL(file);
        input.value = '';
    };

    private snapshot(): WindowSnapshot[] {
        return $$<HTMLElement>('.window').map(w => {
            const body = $<HTMLElement>('.editable-body', w) as HTMLElement | null;
            const imageTarget = $<HTMLElement>('.crt-image,.avatar-image,.eye-image,.album', w) as HTMLElement | null;
            return {
                key: w.dataset.window || w.dataset.custom || '',
                custom: w.dataset.custom || null,
                type: w.classList.contains('image-window') ? 'image' : 'text',
                title: ($<HTMLElement>('header span', w) as HTMLElement | null)?.textContent || '',
                body: w.dataset.custom ? body?.innerHTML ?? '' : '',
                background: w.dataset.custom ? body?.style.backgroundImage ?? '' : '',
                css: `left:${w.offsetLeft}px;top:${w.offsetTop}px;width:${w.offsetWidth}px;height:${w.offsetHeight}px;z-index:${w.style.zIndex || 3};transform:${w.style.transform || 'none'}`,
                zoom: w.dataset.zoom || '100',
                deleted: w.classList.contains('editor-deleted'),
                image: imageTarget?.dataset.userImage || '',
            };
        });
    }

    private saveLayout(): void {
        try {
            localStorage.setItem(LAYOUT_KEY, JSON.stringify(this.snapshot()));
            $('#selected-name').textContent = '布局已保存';
        } catch {
            alert('图片文件过大，布局尺寸和文字可保存，但自定义图片无法存入浏览器。');
        }
    }

    private restoreLayout(): void {
        const data = safeGetJSON<WindowSnapshot[] | null>(LAYOUT_KEY, null);
        if (!data) return;

        data.filter(x => x.custom).forEach(x => this.createWindow(x.type, x));
        data.filter(x => !x.custom).forEach(x => {
            const w = $(`[data-window="${x.key}"]`) as HTMLElement | null;
            if (!w) return;
            w.style.cssText = x.css;
            w.dataset.zoom = x.zoom;
            if (x.deleted) w.classList.add('editor-deleted');
            const title = $<HTMLElement>('header span', w) as HTMLElement | null;
            if (title) title.textContent = x.title;
            if (x.image) {
                const target = $<HTMLElement>('.crt-image,.avatar-image,.eye-image,.album', w) as HTMLElement | null;
                if (target) {
                    target.style.backgroundImage = `url('${x.image}')`;
                    target.dataset.userImage = x.image;
                }
            }
        });
    }
}
