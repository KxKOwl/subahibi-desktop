// ═══════════════════════════════════════════════════════════════
// 公共工具：DOM 查询、格式化、本地存储、Canvas 尺寸同步
// ═══════════════════════════════════════════════════════════════

export const $ = <T extends Element = HTMLElement>(q: string, s: ParentNode = document): T =>
    s.querySelector(q) as T;

export const $$ = <T extends Element = HTMLElement>(q: string, s: ParentNode = document): T[] =>
    Array.from(s.querySelectorAll(q)) as T[];

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export const clamp = (v: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, v));

export const fmtTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${pad2(sec)}`;
};

export const esc = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const splitDuration = (totalSeconds: number) => {
    const s = Math.floor(totalSeconds);
    return {
        w: Math.floor(s / 604800),
        d: Math.floor((s % 604800) / 86400),
        h: Math.floor((s % 86400) / 3600),
        m: Math.floor((s % 3600) / 60),
        s: s % 60,
    };
};

export const safeGetJSON = <T>(key: string, fallback: T): T => {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
        return fallback;
    }
};

export const safeSetJSON = (key: string, value: unknown): boolean => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
};

export const syncCanvasSize = (canvas: HTMLCanvasElement): { width: number; height: number } => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * devicePixelRatio || canvas.height !== height * devicePixelRatio) {
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
    }
    return { width, height };
};
