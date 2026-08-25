// ═══════════════════════════════════════════════════════════════
// 时间统一管理：时钟、世界时钟、日历、倒计时、重置倒计时
// ═══════════════════════════════════════════════════════════════

import { $, pad2, splitDuration } from './utils';

const BIRTHDAY = new Date(2027, 6, 20);

export class ClockManager {
    private readonly now = new Date();
    private calOffset = 0;

    init(): void {
        this.updateClocks();
        this.updateCalendar();
        this.updateCountdown();
        this.updateReset();
        this.bindCalendarNav();

        setInterval(() => this.updateClocks(), 1000);
        setInterval(() => this.updateCountdown(), 1000);
        setInterval(() => this.updateReset(), 1000);
    }

    private updateClocks(): void {
        const d = new Date();
        $('#hour').textContent = pad2(d.getHours());
        $('#minute').textContent = pad2(d.getMinutes());
        $('#second').textContent = pad2(d.getSeconds());
        $('#day').textContent = String(d.getDate());
        $('#month').textContent = d.toLocaleString('en', { month: 'long' });

        const bogH = (d.getUTCHours() + 19) % 24;
        const tkyH = (d.getUTCHours() + 9) % 24;
        $('#bog').textContent = `${pad2(bogH)}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
        $('#mat').textContent = `${pad2(tkyH)}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
    }

    private updateCalendar(): void {
        const dim = new Date(this.now.getFullYear(), this.now.getMonth() + 1, 0).getDate();
        $('#dates').textContent = Array.from({ length: dim }, (_, i) => pad2(i + 1)).join(' ');
    }

    private bindCalendarNav(): void {
        ['cal-prev', 'cal-next', 'cal-stop', 'cal-ff'].forEach(id => {
            $(`#${id}`)?.addEventListener('click', () => {
                if (id === 'cal-prev') this.calOffset--;
                else if (id === 'cal-next') this.calOffset++;
                else if (id === 'cal-stop') this.calOffset = 0;
                else this.calOffset += 12;

                const d = new Date(this.now.getFullYear(), this.now.getMonth() + this.calOffset, 1);
                const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                $('#month').textContent = d.toLocaleString('en', { month: 'long' });
                $('#day').textContent = String(this.calOffset === 0 ? this.now.getDate() : 1);
                $('#dates').textContent = Array.from({ length: dim }, (_, i) => pad2(i + 1)).join(' ');
            });
        });
    }

    private updateCountdown(): void {
        const now = new Date();
        const diff = BIRTHDAY.getTime() - now.getTime();
        if (diff <= 0) {
            $('#countdown').textContent = 'Happy Birthday!';
            $('#countdown-secondary').textContent = '🎂';
            return;
        }

        const main = splitDuration(diff / 1000);
        $('#countdown').textContent = `${main.w}w ${main.d}d ${main.h}h ${main.m}m ${main.s}s`;

        const yr = now.getFullYear();
        let next = new Date(yr, 6, 20);
        if (now > next) next = new Date(yr + 1, 6, 20);
        const secondary = splitDuration((next.getTime() - now.getTime()) / 1000);
        $('#countdown-secondary').textContent =
            `${secondary.w}w ${secondary.d}d ${secondary.h}h ${secondary.m}m ${secondary.s}s`;
    }

    private updateReset(): void {
        const now = new Date();
        const mid = new Date(now);
        mid.setHours(24, 0, 0, 0);
        const diff = mid.getTime() - now.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        $('#next-reset').textContent = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    }
}
