# Subahibi Desktop v2

《美好的每一天～不连续存在～》主题桌面页（水上由岐 ver.）。

## 文件结构

```
subahibi-desktop-v2.html  主页面（所有图片/音频均引用 assets/ 下外部文件）
assets/
  hero.jpg       主视觉背景图
  eye.png        眼睛卡片图
  avatar.jpg     角色头像
  track1.mp3     Tears (FM-84)
  track2.mp3     夜の向日葵 (松本文紀)
  track3.mp3     飞驰！明日之城 (The 1999)
README.md
```

## 如何修改

直接编辑 `subahibi-desktop-v2.html` 即可。想替换图片或音乐：

1. 把新文件放进 `assets/` 目录
2. 在 HTML 中找到对应引用（`url('assets/xxx.jpg')` 或 `src:'assets/xxx.mp3'`），把文件名改成你的新文件
3. 刷新页面即可看到效果

## 在线预览

在仓库 Settings → Pages 中启用 GitHub Pages 后，可通过
`https://<用户名>.github.io/<仓库名>/subahibi-desktop-v2.html` 访问。

> 注：原 v2 页面把图片和音乐以 base64 硬编码在 HTML 里（19MB），本仓库已将其
> 提取为独立文件（HTML 仅 62KB），方便版本管理和协作修改。
