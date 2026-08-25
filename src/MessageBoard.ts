// ═══════════════════════════════════════════════════════════════
// 留言板：消息读写、渲染、本地存储
// ═══════════════════════════════════════════════════════════════

import { $, esc, pad2, safeGetJSON } from './utils';

interface Message {
    name: string;
    text: string;
    time: number;
}

const MSG_KEY = 'subahibi-messages';

export class MessageBoard {
    private readonly list = $('#msg-list') as HTMLElement | null;
    private readonly nameEl = $('#msg-name') as HTMLInputElement | null;
    private readonly textEl = $('#msg-text') as HTMLInputElement | null;
    private messages: Message[] = [];

    init(): void {
        this.messages = safeGetJSON<Message[]>(MSG_KEY, []);
        this.renderMessages();
        this.restoreName();
        $('#msg-send')?.addEventListener('click', () => this.sendMessage());
        this.textEl?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    private renderMessages(): void {
        const list = this.list;
        if (!list) return;
        if (!this.messages.length) {
            list.innerHTML = '<div class="msg-empty">No messages yet. Be the first.</div>';
            return;
        }
        list.innerHTML = this.messages.slice(-50).map(m => {
            const d = new Date(m.time);
            const ts = pad2(d.getHours()) + ':' + pad2(d.getMinutes()) +
                ' ' + String(d.getMonth() + 1) + '/' + String(d.getDate());
            return `<div class="msg-item"><div class="msg-meta"><b>${esc(m.name)}</b><span>${ts}</span></div><div class="msg-body">${esc(m.text)}</div></div>`;
        }).join('');
        list.scrollTop = list.scrollHeight;
    }

    private sendMessage(): void {
        const name = (this.nameEl?.value?.trim()) || 'Guest';
        const text = (this.textEl?.value?.trim()) || '';
        if (!text) return;
        this.messages.push({ name: name.slice(0, 16), text: text.slice(0, 200), time: Date.now() });
        if (this.messages.length > 200) this.messages = this.messages.slice(-200);
        try { localStorage.setItem(MSG_KEY, JSON.stringify(this.messages)); } catch { /* ignore quota */ }
        this.renderMessages();
        if (this.textEl) {
            this.textEl.value = '';
            this.textEl.focus();
        }
        try { localStorage.setItem('subahibi-msg-name', name); } catch { /* ignore quota */ }
    }

    private restoreName(): void {
        try {
            const saved = localStorage.getItem('subahibi-msg-name');
            if (saved && this.nameEl) this.nameEl.value = saved;
        } catch { /* ignore */ }
    }
}
