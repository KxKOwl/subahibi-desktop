// ═══════════════════════════════════════════════════════════════
// 音频播放器：播放列表、音量、频谱可视化
// ═══════════════════════════════════════════════════════════════

import { $, clamp, fmtTime, safeGetJSON, syncCanvasSize } from './utils';

interface Track {
    title: string;
    artist: string;
    src: string;
}

const PLAYLIST_KEY = 'subahibi-playlist';
const defaultTracks: Track[] = [
    { title: 'Tears', artist: 'FM-84', src: 'assets/track1.mp3' },
    { title: '夜の向日葵', artist: '松本文紀', src: 'assets/track2.mp3' },
    { title: '飞驰！明日之城', artist: 'The 1999', src: 'assets/track3.mp3' },
];

export class AudioPlayer {
    private readonly audio = $<HTMLAudioElement>('#audio');
    private readonly btnPlay = $<HTMLButtonElement>('#btn-play');
    private readonly btnPrev = $<HTMLButtonElement>('#btn-prev');
    private readonly btnNext = $<HTMLButtonElement>('#btn-next');
    private readonly seek = $<HTMLInputElement>('#seek');
    private readonly volume = $<HTMLInputElement>('#volume');
    private readonly timeCur = $<HTMLElement>('#time-current');
    private readonly timeTotal = $<HTMLElement>('#time-total');
    private readonly playStatus = $<HTMLElement>('#play-status');
    private readonly volIcon = $<HTMLElement>('#vol-icon-btn');
    private readonly volPct = $<HTMLElement>('#vol-pct');
    private readonly specCanvas = $<HTMLCanvasElement>('#spectrum');
    private readonly sctx = this.specCanvas.getContext('2d')!;

    private playlist: Track[] = [];
    private currentTrack = 0;
    private blobUrlCache: Record<string, string> = {};
    private audioCtx: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private phaseSpec = 0;

    init(): void {
        this.loadPlaylist();
        this.bindEvents();
        this.audio.volume = 0.7;
        this.volume.value = '70';
        this.updateVolIcon();
        this.drawSpectrum();
    }

    togglePlay(): void {
        if (!this.audio.src) {
            this.loadTrack(0);
            this.audio.play().catch(() => { });
            return;
        }
        if (this.audio.paused) this.audio.play().catch(() => { });
        else this.audio.pause();
    }

    seekBy(delta: number): void {
        if (!this.audio.duration) return;
        this.audio.currentTime = clamp(this.audio.currentTime + delta, 0, this.audio.duration);
    }

    changeVolume(delta: number): void {
        this.audio.volume = clamp(this.audio.volume + delta, 0, 1);
        this.volume.value = String(Math.round(this.audio.volume * 100));
        this.updateVolIcon();
    }

    toggleMute(): void {
        this.audio.muted = !this.audio.muted;
        this.updateVolIcon();
    }

    private loadPlaylist(): void {
        const saved = safeGetJSON<Track[] | null>(PLAYLIST_KEY, null);
        this.playlist = saved && saved.length ? saved : [...defaultTracks];
        this.currentTrack = Math.min(this.currentTrack, this.playlist.length - 1);
    }

    private loadTrack(i: number): void {
        if (i < 0 || i >= this.playlist.length) return;
        this.currentTrack = i;
        const t = this.playlist[i];
        $('#track-title').textContent = t.title;
        $('#track-artist').textContent = t.artist;
        this.audio.src = this.resolveAudioSrc(t.src);
        this.btnPlay.textContent = '▶';
        this.timeCur.textContent = '0:00';
        this.seek.value = '0';
        this.playStatus.textContent = '⟳ Loading...';
        this.audio.load();
    }

    private resolveAudioSrc(src: string): string {
        if (!src.startsWith('data:')) return src;
        if (this.blobUrlCache[src]) return this.blobUrlCache[src];
        try {
            const comma = src.indexOf(',');
            const head = src.slice(0, comma);
            const b64 = src.slice(comma + 1);
            const mime = (head.match(/data:(.*?);/) || ['', 'audio/mpeg'])[1];
            const raw = atob(b64);
            const arr = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
            const url = URL.createObjectURL(new Blob([arr], { type: mime }));
            this.blobUrlCache[src] = url;
            return url;
        } catch (e) {
            console.warn('Blob conversion failed, falling back to data URI', e);
            return src;
        }
    }

    private bindEvents(): void {
        this.audio.addEventListener('canplay', () => {
            if (this.btnPlay.textContent === '▶') this.playStatus.textContent = '▶ Ready';
        });
        this.audio.addEventListener('error', () => {
            this.playStatus.textContent = '⚠ Playback error';
            this.btnPlay.textContent = '▶';
            console.warn('Audio error:', this.audio.error);
        });
        this.audio.addEventListener('loadedmetadata', () => {
            this.timeTotal.textContent = fmtTime(this.audio.duration);
            this.seek.max = String(Math.floor(this.audio.duration));
        });
        this.audio.addEventListener('timeupdate', () => {
            if (!this.audio.duration) return;
            this.seek.value = String(Math.floor(this.audio.currentTime));
            this.timeCur.textContent = fmtTime(this.audio.currentTime);
        });
        this.audio.addEventListener('play', () => {
            this.btnPlay.textContent = '⏸';
            this.playStatus.textContent = '▶ Playing';
        });
        this.audio.addEventListener('pause', () => {
            this.btnPlay.textContent = '▶';
            this.playStatus.textContent = '❚❚ Paused';
        });
        this.audio.addEventListener('ended', () => {
            this.btnPlay.textContent = '▶';
            this.playStatus.textContent = '■ Stopped';
            const next = (this.currentTrack + 1) % this.playlist.length;
            this.loadTrack(next);
            this.audio.play().catch(() => { });
        });

        this.btnPlay.addEventListener('touchend', e => {
            e.preventDefault();
            this.btnPlay.click();
        });
        this.btnPlay.addEventListener('click', () => this.togglePlay());
        this.btnPrev.addEventListener('click', () => {
            const i = (this.currentTrack - 1 + this.playlist.length) % this.playlist.length;
            this.loadTrack(i);
            this.audio.play().catch(() => { });
        });
        this.btnNext.addEventListener('click', () => {
            const i = (this.currentTrack + 1) % this.playlist.length;
            this.loadTrack(i);
            this.audio.play().catch(() => { });
        });
        this.seek.addEventListener('input', () => {
            if (this.audio.duration) this.audio.currentTime = Number(this.seek.value);
        });
        this.volume.addEventListener('input', () => {
            this.audio.volume = Number(this.volume.value) / 100;
            this.updateVolIcon();
        });
        this.volIcon.addEventListener('click', () => {
            this.audio.muted = !this.audio.muted;
            this.volume.value = this.audio.muted ? '0' : String(Math.round(this.audio.volume * 100));
            this.updateVolIcon();
        });

        document.addEventListener('pointerdown', this.initAudioCtx, { once: true });
        document.addEventListener('keydown', this.initAudioCtx, { once: true });
    }

    private updateVolIcon(): void {
        const v = this.audio.muted ? 0 : this.audio.volume;
        if (this.audio.muted || v === 0) this.volIcon.textContent = '🔇';
        else if (v < 0.33) this.volIcon.textContent = '🔈';
        else if (v < 0.66) this.volIcon.textContent = '🔉';
        else this.volIcon.textContent = '🔊';

        const pct = Math.round(v * 100);
        this.volPct.textContent = pct + '%';
        document.documentElement.style.setProperty('--vol-pct', pct + '%');
    }

    private initAudioCtx = (): void => {
        if (this.audioCtx) return;
        const Ctor = window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new Ctor();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.75;
        const source = this.audioCtx.createMediaElementSource(this.audio);
        source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
    };

    private drawSpectrum = (): void => {
        this.phaseSpec += 0.04;
        const { width: W, height: H } = syncCanvasSize(this.specCanvas);
        const ctx = this.sctx;
        ctx.save();
        ctx.scale(devicePixelRatio, devicePixelRatio);
        ctx.clearRect(0, 0, W, H);

        let data: number[];
        if (this.analyser && !this.audio.paused) {
            const buf = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(buf);
            data = Array.from(buf).slice(0, 64).map(v => v / 255);
        } else {
            data = Array.from({ length: 64 }, (_, i) => (
                .1 + Math.abs(Math.sin(i * .33 + this.phaseSpec)) * Math.random() * .85
            ));
        }

        const count = data.length;
        const barW = W / count;
        for (let i = 0; i < count; i++) {
            const h = Math.max(2, data[i] * H * .95);
            const hue = i % 7 === 0 ? 50 : 160;
            ctx.fillStyle = `hsl(${hue},70%,${45 + h / H * 50}%)`;
            ctx.fillRect(i * barW + 1, H - h, barW * .6, h);
        }
        ctx.restore();
        requestAnimationFrame(this.drawSpectrum);
    };
}
