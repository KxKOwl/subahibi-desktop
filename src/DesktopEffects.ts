// ═══════════════════════════════════════════════════════════════
// 桌面装饰效果：数字雨、信号条、控制台日志、进程、网络波、魔方
// ═══════════════════════════════════════════════════════════════

import { $, $$, pad2, syncCanvasSize } from './utils';

const services = [
    'Event Log', 'Event System', 'Network Location Awareness', 'DHCP Client',
    'Local Client', 'ENS Client', 'Network Connection Broker', 'Windows Update',
    'COM+ Event System', 'Task Scheduler',
];

const tasks = [
    'explorer', 'Application Frame Host', 'Service Host: Local Broker', 'Runtime Broker',
    'Windows Audio', 'Shell Infrastructure Host', 'Desktop Window Manager', 'CTF Loader',
    'Spooler SubSystem',
];

export class DesktopEffects {
    private readonly numbers = $('#numbers');
    private readonly bars = $('#bars');
    private readonly logEl = $('#logs');
    private readonly net = $<HTMLCanvasElement>('#network');
    private readonly nctx = this.net.getContext('2d')!;
    private readonly cube = $('#cube');

    private barEls: HTMLElement[] = [];
    private svcOff = 0;
    private phaseNet = 0;
    private cubeSpeed = 9;
    private cubePaused = false;
    private cubeClicks = 0;

    init(): void {
        this.buildNumbers();
        this.buildBars();
        this.updateLogs();
        this.updateProcess();
        this.bindCube();
        this.drawNet();

        setInterval(() => this.animateNumbers(), 1200);
        setInterval(() => this.animateBars(), 500);
        setInterval(() => this.rotateLogs(), 2500);
        setInterval(() => this.updateProcess(), 2000);
    }

    private buildNumbers(): void {
        this.numbers.innerHTML = Array.from(
            { length: 30 },
            () => `<span>${Math.floor(10000000 + Math.random() * 89999999)}</span>`
        ).join('');
    }

    private animateNumbers(): void {
        const cells = $$<HTMLElement>('span', this.numbers);
        if (!cells.length) return;
        for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) {
            const el = cells[Math.floor(Math.random() * cells.length)];
            el.style.opacity = '.3';
            el.textContent = String(Math.floor(10000000 + Math.random() * 89999999));
            setTimeout(() => { el.style.opacity = '1'; }, 80 + Math.random() * 120);
        }
    }

    private buildBars(): void {
        this.bars.innerHTML = Array.from(
            { length: 11 },
            (_, i) => `<i style="height:${18 + i * 7}%"></i>`
        ).join('');
        this.barEls = $$<HTMLElement>('i', this.bars);
    }

    private animateBars(): void {
        this.barEls.forEach(b => {
            b.style.height = (14 + Math.random() * 78) + '%';
            b.style.transition = 'height .35s ease-out';
        });
    }

    private updateLogs(): void {
        const n = Math.min(7, Math.floor(this.logEl.clientHeight / 22));
        this.logEl.innerHTML = services.slice(0, n)
            .map((x, i) => `<div style="opacity:${1 - i * .08}">${x}</div>`)
            .join('');
    }

    private rotateLogs(): void {
        this.svcOff = (this.svcOff + 1) % services.length;
        const r = services.slice(this.svcOff).concat(services.slice(0, this.svcOff));
        const n = Math.floor(this.logEl.clientHeight / 22) || 6;
        this.logEl.innerHTML = r.slice(0, n)
            .map((x, i) => `<div style="opacity:${1 - i * .08}">${x}</div>`)
            .join('');
    }

    private updateProcess(): void {
        const d = new Date();
        const h = pad2(d.getHours());
        const m = pad2(d.getMinutes());
        $('#process').textContent = Array.from({ length: 6 }, (_, i) => {
            const sec = (d.getSeconds() - i * 3 + 60) % 60;
            return `${h}:${m}:${pad2(sec)}   ${102100 + i * 17}   ${tasks[(i + Math.floor(d.getSeconds() / 10)) % tasks.length]}`;
        }).join('\n');
    }

    private drawNet = (): void => {
        this.phaseNet += 0.06;
        const { width: W, height: H } = syncCanvasSize(this.net);
        const ctx = this.nctx;
        ctx.save();
        ctx.scale(devicePixelRatio, devicePixelRatio);
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = '#4ADE80';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < W; x++) {
            const spike = Math.max(0, Math.sin(x * .06 + this.phaseNet * 2)) ** 18;
            const y = H * .85 - spike * H * .65 - Math.random() * 3;
            x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
        requestAnimationFrame(this.drawNet);
    };

    private bindCube(): void {
        this.cube.addEventListener('click', () => {
            this.cubeClicks++;
            if (this.cubeClicks % 3 === 0) {
                this.cubePaused = !this.cubePaused;
                this.cube.style.animationPlayState = this.cubePaused ? 'paused' : 'running';
            } else if (this.cubeClicks % 3 === 1) {
                this.cubeSpeed = Math.max(2, this.cubeSpeed - 2);
                this.cube.style.animationDuration = this.cubeSpeed + 's';
            } else {
                this.cubeSpeed = Math.min(20, this.cubeSpeed + 2);
                this.cube.style.animationDuration = this.cubeSpeed + 's';
            }
            this.cube.style.filter = 'brightness(1.6)';
            setTimeout(() => { this.cube.style.filter = ''; }, 150);
        });
    }
}
