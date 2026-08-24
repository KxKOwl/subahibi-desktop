# Subahibi Desktop v2

《美好的每一天～不连续存在～》主题桌面页（水上由岐 ver.）。

## 文件结构

```tree
subahibi-desktop-v2.html  主页面（加载 /src/main.js 与 /css/main.css）
src/
  main.ts                 TypeScript 源码（页面全部交互逻辑）
  main.js                 构建产物，由 tsc 从 main.ts 编译生成
css/
  main.css                页面样式
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

脚本逻辑在 `src/main.ts` 中维护，编辑后编译到 `src/main.js`（页面实际加载的入口）：

```bash
npm install
npm run build   # 编译 src/main.ts -> src/main.js
npm run watch   # 监听源码改动并自动编译
npm run serve   # 本地预览 http://localhost:8000/subahibi-desktop-v2.html
```

想替换图片或音乐：

1. 把新文件放进 `assets/` 目录
2. 在 HTML 或 `src/main.ts` 中找到对应引用（`url('assets/xxx.jpg')` 或 `src: 'assets/xxx.mp3'`），把文件名改成你的新文件
3. 重新编译（`npm run build`）后刷新页面

## 在线预览

在仓库 Settings → Pages 中启用 GitHub Pages 后，可通过
`https://<用户名>.github.io/<仓库名>/subahibi-desktop-v2.html` 访问。

> 注：原 v2 页面把图片和音乐以 base64 硬编码在 HTML 里（19MB），本仓库已将其
> 提取为独立文件（HTML 仅 62KB），方便版本管理和协作修改。
