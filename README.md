# Subahibi Desktop v2

《美好的每一天～不连续存在～》主题桌面页（水上由岐 ver.）。

## 文件结构

```tree
index.html                主页面（加载 ./dist/main.js 与 ./dist/main.css）
src/
  main.ts                 入口：初始化各管理器、全局快捷键
  utils.ts                公共工具（DOM 查询、格式化、存储、Canvas）
  AudioPlayer.ts          音频播放器（播放列表、音量、频谱）
  ClockManager.ts         时间 / 世界时钟 / 日历 / 倒计时
  DesktopEffects.ts       数字雨、信号条、日志、网络波、魔方
  MessageBoard.ts         留言板
  ThemeManager.ts         深色 / 晴日主题切换
  WindowManager.ts        窗口聚焦 / 拖动 / 编辑 / 布局持久化
dist/                     构建产物（gitignore，不提交）
css/
  main.scss               SCSS 源码（页面样式）
.github/workflows/
  deploy.yml              GitHub Actions：构建并部署到 Pages
assets/
  hero.jpg       主视觉背景图
  eye.png        眼睛卡片图
  avatar.jpg     角色头像
  track1.mp3     Tears (FM-84)
  track2.mp3     夜の向日葵 (松本文紀)
  track3.mp3     飞驰！明日之城 (The 1999)
README.md
```

## 开发

脚本逻辑在 `src/main.ts` 中维护，样式在 `css/main.scss` 中维护；两者构建后统一输出到
`dist/`（该目录已加入 `.gitignore`）：

```bash
npm install
npm run build        # 检查类型，并编译 TS + SCSS 到 dist/
npm run styles       # 只编译 css/main.scss -> dist/main.css
npm run watch        # 监听 src/main.ts 改动并自动编译到 dist/
npm run watch:styles # 监听 css/main.scss 改动并自动编译到 dist/
npm run serve   # 本地预览 http://localhost:8000/
```

想替换图片或音乐：

1. 把新文件放进 `assets/` 目录
2. 在 HTML 或 `src/main.ts` 中找到对应引用（`url('assets/xxx.jpg')` 或 `src: 'assets/xxx.mp3'`），把文件名改成你的新文件
3. 重新编译（`npm run build`）后刷新页面

## 在线预览 / CI/CD

推送 `main` 分支后，GitHub Actions 会自动构建 TS/SCSS、把页面与资源组装成部署目录，
并发布到 GitHub Pages：

`https://<用户名>.github.io/subahibi-desktop/`

根路径直接显示 `index.html`。

首次部署前，在仓库 **Settings → Pages** 中将 Source 设置为 **GitHub Actions**，
之后每次 push 到 `main` 都会自动更新。
