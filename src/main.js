const $ = (q, s = document) => s.querySelector(q);
const $$ = (q, s = document) => Array.from(s.querySelectorAll(q));
setTimeout(() => $("#boot").classList.add("done"), 950);
let topZ = 20;
$$(".window").forEach((win) => {
  win.addEventListener("pointerdown", () => {
    $$(".window").forEach((w) => w.classList.remove("focused"));
    win.classList.add("focused");
    win.style.zIndex = String(++topZ);
  });
  $("header button", win).addEventListener("click", (e) => {
    e.stopPropagation();
    win.classList.add("closed");
  });
  const bar = $("header", win);
  let moving = false, dx = 0, dy = 0;
  bar.addEventListener("pointerdown", (e) => {
    const target = e.target;
    if (target.closest("button") || target.closest("input")) return;
    if (innerWidth < 900) return;
    moving = true;
    dx = e.clientX - win.offsetLeft;
    dy = e.clientY - win.offsetTop;
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener("pointermove", (e) => {
    if (!moving) return;
    win.style.left = Math.max(0, Math.min(innerWidth - win.offsetWidth, e.clientX - dx)) + "px";
    win.style.top = Math.max(0, Math.min(innerHeight - win.offsetHeight, e.clientY - dy)) + "px";
  });
  bar.addEventListener("pointerup", () => {
    moving = false;
  });
  bar.addEventListener("pointerlost", () => {
    moving = false;
  });
});
$$("[data-restore]").forEach((b) => b.addEventListener("click", () => {
  const w = $(`[data-window="${b.dataset.restore}"]`);
  if (!w) return;
  w.classList.remove("closed");
  w.classList.add("focused");
  w.style.zIndex = String(++topZ);
}));
$("#fullscreen").addEventListener("click", () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
let theme = "dark";
$("#theme-toggle").addEventListener("click", () => {
  theme = theme === "dark" ? "sunny" : "dark";
  document.documentElement.dataset.theme = theme;
  $("#theme-toggle").textContent = theme === "dark" ? "\u2600" : "\u263E";
  localStorage.setItem("subahibi-theme", theme);
});
const savedTheme = localStorage.getItem("subahibi-theme");
if (savedTheme) {
  theme = savedTheme === "sunny" ? "sunny" : "dark";
  document.documentElement.dataset.theme = theme;
  $("#theme-toggle").textContent = theme === "dark" ? "\u2600" : "\u263E";
}
const audio = $("#audio");
const btnPlay = $("#btn-play");
const btnPrev = $("#btn-prev");
const btnNext = $("#btn-next");
const seek = $("#seek");
const volume = $("#volume");
const timeCur = $("#time-current");
const timeTotal = $("#time-total");
const playStatus = $("#play-status");
const specCanvas = $("#spectrum");
const sctx = specCanvas.getContext("2d");
let playlist = [];
let currentTrack = 0;
const PLAYLIST_KEY = "subahibi-playlist";
const defaultTracks = [
  { title: "Tears", artist: "FM-84", src: "assets/track1.mp3" },
  { title: "\u591C\u306E\u5411\u65E5\u8475", artist: "\u677E\u672C\u6587\u7D00", src: "assets/track2.mp3" },
  { title: "\u98DE\u9A70\uFF01\u660E\u65E5\u4E4B\u57CE", artist: "The 1999", src: "assets/track3.mp3" }
];
function loadPlaylist() {
  try {
    const d = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || "null");
    if (d && d.length) playlist = d;
    else playlist = [...defaultTracks];
  } catch {
    playlist = [...defaultTracks];
  }
  currentTrack = Math.min(currentTrack, playlist.length - 1);
}
loadPlaylist();
function fmtTime(s) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return m + ":" + String(sec).padStart(2, "0");
}
const blobUrlCache = {};
function resolveAudioSrc(src) {
  if (!src.startsWith("data:")) return src;
  if (blobUrlCache[src]) return blobUrlCache[src];
  try {
    const comma = src.indexOf(",");
    const head = src.slice(0, comma);
    const b64 = src.slice(comma + 1);
    const mime = (head.match(/data:(.*?);/) || ["", "audio/mpeg"])[1];
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([arr], { type: mime }));
    blobUrlCache[src] = url;
    return url;
  } catch (e) {
    console.warn("Blob conversion failed, falling back to data URI", e);
    return src;
  }
}
function loadTrack(i) {
  if (i < 0 || i >= playlist.length) return;
  currentTrack = i;
  const t = playlist[i];
  $("#track-title").textContent = t.title;
  $("#track-artist").textContent = t.artist;
  audio.src = resolveAudioSrc(t.src);
  btnPlay.textContent = "\u25B6";
  timeCur.textContent = "0:00";
  seek.value = "0";
  playStatus.textContent = "\u27F3 Loading...";
  audio.load();
}
audio.addEventListener("canplay", () => {
  if (btnPlay.textContent === "\u25B6") playStatus.textContent = "\u25B6 Ready";
});
audio.addEventListener("error", () => {
  playStatus.textContent = "\u26A0 Playback error";
  btnPlay.textContent = "\u25B6";
  console.warn("Audio error:", audio.error);
});
btnPlay.addEventListener("touchend", (e) => {
  e.preventDefault();
  btnPlay.click();
});
audio.addEventListener("loadedmetadata", () => {
  timeTotal.textContent = fmtTime(audio.duration);
  seek.max = String(Math.floor(audio.duration));
});
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  seek.value = String(Math.floor(audio.currentTime));
  timeCur.textContent = fmtTime(audio.currentTime);
});
audio.addEventListener("play", () => {
  btnPlay.textContent = "\u23F8";
  playStatus.textContent = "\u25B6 Playing";
});
audio.addEventListener("pause", () => {
  btnPlay.textContent = "\u25B6";
  playStatus.textContent = "\u275A\u275A Paused";
});
audio.addEventListener("ended", () => {
  btnPlay.textContent = "\u25B6";
  playStatus.textContent = "\u25A0 Stopped";
  const next = (currentTrack + 1) % playlist.length;
  loadTrack(next);
  audio.play().catch(() => {
  });
});
btnPlay.addEventListener("click", () => {
  if (!audio.src) {
    loadTrack(0);
    audio.play().catch(() => {
    });
    return;
  }
  if (audio.paused) audio.play().catch(() => {
  });
  else audio.pause();
});
btnPrev.addEventListener("click", () => {
  const i = (currentTrack - 1 + playlist.length) % playlist.length;
  loadTrack(i);
  audio.play().catch(() => {
  });
});
btnNext.addEventListener("click", () => {
  const i = (currentTrack + 1) % playlist.length;
  loadTrack(i);
  audio.play().catch(() => {
  });
});
seek.addEventListener("input", () => {
  if (audio.duration) audio.currentTime = Number(seek.value);
});
volume.addEventListener("input", () => {
  audio.volume = Number(volume.value) / 100;
  updateVolIcon();
});
audio.volume = 0.7;
volume.value = "70";
function updateVolIcon() {
  const v = audio.muted ? 0 : audio.volume;
  const icon = document.querySelector("#vol-icon-btn");
  if (!icon) return;
  if (audio.muted || v === 0) icon.textContent = "\u{1F507}";
  else if (v < 0.33) icon.textContent = "\u{1F508}";
  else if (v < 0.66) icon.textContent = "\u{1F509}";
  else icon.textContent = "\u{1F50A}";
  const pct = document.querySelector("#vol-pct");
  if (pct) pct.textContent = Math.round(v * 100) + "%";
  document.documentElement.style.setProperty("--vol-pct", Math.round(v * 100) + "%");
}
updateVolIcon();
document.querySelector("#vol-icon-btn")?.addEventListener("click", () => {
  audio.muted = !audio.muted;
  volume.value = audio.muted ? "0" : String(Math.round(audio.volume * 100));
  updateVolIcon();
});
let audioCtx = null;
let analyser = null;
function initAudioCtx() {
  if (audioCtx) return;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  audioCtx = new Ctor();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.75;
  const source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
}
document.addEventListener("pointerdown", initAudioCtx, { once: true });
document.addEventListener("keydown", initAudioCtx, { once: true });
let phaseSpec = 0;
function drawSpectrum() {
  phaseSpec += 0.04;
  const W = specCanvas.clientWidth, H = specCanvas.clientHeight;
  if (specCanvas.width !== W * devicePixelRatio || specCanvas.height !== H * devicePixelRatio) {
    specCanvas.width = W * devicePixelRatio;
    specCanvas.height = H * devicePixelRatio;
  }
  sctx.save();
  sctx.scale(devicePixelRatio, devicePixelRatio);
  sctx.clearRect(0, 0, W, H);
  let data;
  if (analyser && !audio.paused) {
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buf);
    data = Array.from(buf).slice(0, 64).map((v) => v / 255);
  } else {
    data = Array.from({ length: 64 }, (_, i) => 0.1 + Math.abs(Math.sin(i * 0.33 + phaseSpec)) * Math.random() * 0.85);
  }
  const count = data.length, barW = W / count;
  for (let i = 0; i < count; i++) {
    const h = Math.max(2, data[i] * H * 0.95);
    const hue = i % 7 === 0 ? 50 : 160;
    sctx.fillStyle = `hsl(${hue},70%,${45 + h / H * 50}%)`;
    sctx.fillRect(i * barW + 1, H - h, barW * 0.6, h);
  }
  sctx.restore();
  requestAnimationFrame(drawSpectrum);
}
drawSpectrum();
const pad = (n) => String(n).padStart(2, "0");
function clocks() {
  const d = /* @__PURE__ */ new Date();
  $("#hour").textContent = pad(d.getHours());
  $("#minute").textContent = pad(d.getMinutes());
  $("#second").textContent = pad(d.getSeconds());
  $("#day").textContent = String(d.getDate());
  $("#month").textContent = d.toLocaleString("en", { month: "long" });
  const bogH = (d.getUTCHours() + 19) % 24, tkyH = (d.getUTCHours() + 9) % 24;
  $("#bog").textContent = `${pad(bogH)}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  $("#mat").textContent = `${pad(tkyH)}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
setInterval(clocks, 1e3);
clocks();
const now = /* @__PURE__ */ new Date();
const daysInMo = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
$("#dates").textContent = Array.from({ length: daysInMo }, (_, i) => pad(i + 1)).join(" ");
let calOffset = 0;
["cal-prev", "cal-next", "cal-stop", "cal-ff"].forEach((id) => {
  $("#" + id)?.addEventListener("click", () => {
    if (id === "cal-prev") calOffset--;
    else if (id === "cal-next") calOffset++;
    else if (id === "cal-stop") calOffset = 0;
    else calOffset += 12;
    const d = new Date(now.getFullYear(), now.getMonth() + calOffset, 1);
    const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    $("#month").textContent = d.toLocaleString("en", { month: "long" });
    $("#day").textContent = String(calOffset === 0 ? now.getDate() : 1);
    $("#dates").textContent = Array.from({ length: dim }, (_, i) => pad(i + 1)).join(" ");
  });
});
const BIRTHDAY = new Date(2027, 6, 20);
function updateCountdown() {
  const now2 = /* @__PURE__ */ new Date(), diff = BIRTHDAY.getTime() - now2.getTime();
  if (diff <= 0) {
    $("#countdown").textContent = "Happy Birthday!";
    $("#countdown-secondary").textContent = "\u{1F382}";
    return;
  }
  const ts = Math.floor(diff / 1e3);
  const w = Math.floor(ts / 604800);
  const d = Math.floor(ts % 604800 / 86400);
  const h = Math.floor(ts % 86400 / 3600);
  const m = Math.floor(ts % 3600 / 60);
  $("#countdown").textContent = `${w}w ${d}d ${h}h ${m}m ${ts % 60}s`;
  const yr = now2.getFullYear();
  let nb = new Date(yr, 6, 20);
  if (now2 > nb) nb = new Date(yr + 1, 6, 20);
  const ts2 = Math.floor((nb.getTime() - now2.getTime()) / 1e3);
  const w2 = Math.floor(ts2 / 604800);
  const d2 = Math.floor(ts2 % 604800 / 86400);
  const h2 = Math.floor(ts2 % 86400 / 3600);
  const m2 = Math.floor(ts2 % 3600 / 60);
  $("#countdown-secondary").textContent = `${w2}w ${d2}d ${h2}h ${m2}m ${ts2 % 60}s`;
}
setInterval(updateCountdown, 1e3);
updateCountdown();
function updateReset() {
  const now2 = /* @__PURE__ */ new Date(), mid = new Date(now2);
  mid.setHours(24, 0, 0, 0);
  const diff = mid.getTime() - now2.getTime();
  const h = Math.floor(diff / 36e5);
  const m = Math.floor(diff % 36e5 / 6e4);
  const s = Math.floor(diff % 6e4 / 1e3);
  $("#next-reset").textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
}
setInterval(updateReset, 1e3);
updateReset();
function buildNumbers() {
  $("#numbers").innerHTML = Array.from(
    { length: 30 },
    () => `<span>${Math.floor(1e7 + Math.random() * 89999999)}</span>`
  ).join("");
}
buildNumbers();
setInterval(() => {
  const cells = $$("span", $("#numbers"));
  if (!cells.length) return;
  for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) {
    const el = cells[Math.floor(Math.random() * cells.length)];
    el.style.opacity = ".3";
    el.textContent = String(Math.floor(1e7 + Math.random() * 89999999));
    setTimeout(() => {
      el.style.opacity = "1";
    }, 80 + Math.random() * 120);
  }
}, 1200);
const barsContainer = $("#bars");
barsContainer.innerHTML = Array.from(
  { length: 11 },
  (_, i) => `<i style="height:${18 + i * 7}%"></i>`
).join("");
const barEls = $$("i", barsContainer);
setInterval(() => {
  barEls.forEach((b) => {
    b.style.height = 14 + Math.random() * 78 + "%";
    b.style.transition = "height .35s ease-out";
  });
}, 500);
const services = [
  "Event Log",
  "Event System",
  "Network Location Awareness",
  "DHCP Client",
  "Local Client",
  "ENS Client",
  "Network Connection Broker",
  "Windows Update",
  "COM+ Event System",
  "Task Scheduler"
];
const logEl = $("#logs");
function updateLogs() {
  const n = Math.min(7, Math.floor(logEl.clientHeight / 22));
  logEl.innerHTML = services.slice(0, n).map((x, i) => `<div style="opacity:${1 - i * 0.08}">${x}</div>`).join("");
}
updateLogs();
let svcOff = 0;
setInterval(() => {
  svcOff = (svcOff + 1) % services.length;
  const r = services.slice(svcOff).concat(services.slice(0, svcOff));
  const n = Math.floor(logEl.clientHeight / 22) || 6;
  logEl.innerHTML = r.slice(0, n).map((x, i) => `<div style="opacity:${1 - i * 0.08}">${x}</div>`).join("");
}, 2500);
const tasks = [
  "explorer",
  "Application Frame Host",
  "Service Host: Local Broker",
  "Runtime Broker",
  "Windows Audio",
  "Shell Infrastructure Host",
  "Desktop Window Manager",
  "CTF Loader",
  "Spooler SubSystem"
];
function process() {
  const d = /* @__PURE__ */ new Date(), h = pad(d.getHours()), m = pad(d.getMinutes());
  $("#process").textContent = Array.from({ length: 6 }, (_, i) => {
    const sec = (d.getSeconds() - i * 3 + 60) % 60;
    return `${h}:${m}:${pad(sec)}   ${102100 + i * 17}   ${tasks[(i + Math.floor(d.getSeconds() / 10)) % tasks.length]}`;
  }).join("\n");
}
setInterval(process, 2e3);
process();
const net = $("#network");
const nctx = net.getContext("2d");
let phaseNet = 0;
function drawNet() {
  phaseNet += 0.06;
  const W = net.clientWidth, H = net.clientHeight;
  if (net.width !== W * devicePixelRatio || net.height !== H * devicePixelRatio) {
    net.width = W * devicePixelRatio;
    net.height = H * devicePixelRatio;
  }
  nctx.save();
  nctx.scale(devicePixelRatio, devicePixelRatio);
  nctx.clearRect(0, 0, W, H);
  nctx.strokeStyle = "#4ADE80";
  nctx.lineWidth = 1.5;
  nctx.beginPath();
  for (let x = 0; x < W; x++) {
    const spike = Math.max(0, Math.sin(x * 0.06 + phaseNet * 2)) ** 18;
    const y = H * 0.85 - spike * H * 0.65 - Math.random() * 3;
    x ? nctx.lineTo(x, y) : nctx.moveTo(x, y);
  }
  nctx.stroke();
  nctx.restore();
  requestAnimationFrame(drawNet);
}
drawNet();
const cube = $("#cube");
let cubeSpeed = 9, cubePaused = false, cubeClicks = 0;
cube.addEventListener("click", () => {
  cubeClicks++;
  if (cubeClicks % 3 === 0) {
    cubePaused = !cubePaused;
    cube.style.animationPlayState = cubePaused ? "paused" : "running";
  } else if (cubeClicks % 3 === 1) {
    cubeSpeed = Math.max(2, cubeSpeed - 2);
    cube.style.animationDuration = cubeSpeed + "s";
  } else {
    cubeSpeed = Math.min(20, cubeSpeed + 2);
    cube.style.animationDuration = cubeSpeed + "s";
  }
  cube.style.filter = "brightness(1.6)";
  setTimeout(() => {
    cube.style.filter = "";
  }, 150);
});
const editor = $("#editor");
const editButton = $("#edit-toggle");
const zoom = $("#window-zoom");
let selectedWindow = null;
let customIndex = 0;
const zoomTimers = /* @__PURE__ */ new WeakMap();
function selectWindow(win) {
  if (!$("#desktop").classList.contains("edit-mode")) return;
  $$(".window").forEach((w) => w.classList.remove("selected"));
  selectedWindow = win;
  win.classList.add("selected");
  $("#selected-name").textContent = $("header span", win)?.textContent || "\u7A97\u53E3";
  const z = Number(win.dataset.zoom || 100);
  zoom.value = String(z);
  $("#zoom-output").textContent = z + "%";
}
$("#desktop").addEventListener("pointerdown", (e) => {
  const win = e.target.closest(".window");
  if (win) selectWindow(win);
});
function toggleEditor(force) {
  const on = force ?? !$("#desktop").classList.contains("edit-mode");
  $("#desktop").classList.toggle("edit-mode", on);
  editor.classList.toggle("open", on);
  editButton.classList.toggle("active", on);
  if (!on) {
    $$("[contenteditable]").forEach((x) => {
      x.contentEditable = "false";
    });
    $$(".window").forEach((w) => w.classList.remove("selected"));
    selectedWindow = null;
  }
}
editButton.addEventListener("click", () => toggleEditor());
$("#editor-close").addEventListener("click", () => toggleEditor(false));
zoom.addEventListener("input", () => {
  if (!selectedWindow) return;
  const z = Number(zoom.value);
  selectedWindow.dataset.zoom = String(z);
  selectedWindow.classList.add("zooming");
  selectedWindow.style.transform = `scale(${z / 100})`;
  $("#zoom-output").textContent = z + "%";
  const timer = zoomTimers.get(selectedWindow);
  if (timer !== void 0) clearTimeout(timer);
  const win = selectedWindow;
  zoomTimers.set(win, setTimeout(() => win.classList.remove("zooming"), 200));
});
function editorDrag(win) {
  const bar = $("header", win);
  let moving = false, dx = 0, dy = 0;
  bar.addEventListener("pointerdown", (e) => {
    if (!$("#desktop").classList.contains("edit-mode") || e.target.closest("button")) return;
    moving = true;
    dx = e.clientX - win.offsetLeft;
    dy = e.clientY - win.offsetTop;
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener("pointermove", (e) => {
    if (!moving) return;
    win.style.left = Math.max(0, e.clientX - dx) + "px";
    win.style.top = Math.max(0, e.clientY - dy) + "px";
  });
  bar.addEventListener("pointerup", () => {
    moving = false;
  });
}
function createWindow(type, data = {}) {
  const win = document.createElement("section");
  const id = data.id || `custom-${Date.now()}-${customIndex++}`;
  win.className = `window custom-window ${type === "image" ? "image-window" : ""}`;
  win.dataset.custom = id;
  win.style.cssText = data.css || `left:${120 + customIndex * 24}px;top:${90 + customIndex * 20}px;width:330px;height:230px;z-index:${++topZ}`;
  win.innerHTML = `<header><span>${data.title || (type === "image" ? "\u65B0\u56FE\u7247" : "\u65B0\u6587\u5B57")}</span><button aria-label="close">\xD7</button></header><div class="editable-body">${data.body || '\u70B9\u51FB"\u7F16\u8F91\u6587\u5B57\u5185\u5BB9"\u540E\u4FEE\u6539\u8FD9\u91CC\u3002'}</div>`;
  if (data.background) $(".editable-body", win).style.backgroundImage = data.background;
  $("#desktop").insertBefore(win, $("#dock"));
  editorDrag(win);
  selectWindow(win);
  return win;
}
$("#add-text").addEventListener("click", () => createWindow("text"));
$("#add-image").addEventListener("click", () => {
  createWindow("image", { body: "" });
  $("#image-picker").click();
});
$("#duplicate-window").addEventListener("click", () => {
  if (!selectedWindow) return alert("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u7A97\u53E3");
  if (selectedWindow.dataset.custom) {
    const b = $(".editable-body", selectedWindow);
    createWindow(selectedWindow.classList.contains("image-window") ? "image" : "text", {
      title: $("header span", selectedWindow).textContent || "",
      body: b.innerHTML,
      background: b.style.backgroundImage
    });
  } else {
    const copy = selectedWindow.cloneNode(true);
    copy.dataset.custom = `custom-${Date.now()}`;
    copy.classList.add("custom-window");
    copy.style.left = selectedWindow.offsetLeft + 28 + "px";
    copy.style.top = selectedWindow.offsetTop + 28 + "px";
    copy.querySelectorAll("canvas").forEach((c) => c.remove());
    $("#desktop").insertBefore(copy, $("#dock"));
    editorDrag(copy);
    selectWindow(copy);
  }
});
$("#delete-window").addEventListener("click", () => {
  if (!selectedWindow) return alert("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u7A97\u53E3");
  selectedWindow.classList.add("editor-deleted");
  selectedWindow.classList.remove("selected");
  selectedWindow = null;
  $("#selected-name").textContent = "\u672A\u9009\u62E9\u7A97\u53E3";
});
$("#edit-content").addEventListener("click", () => {
  if (!selectedWindow) return alert("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u7A97\u53E3");
  const nodes = $$(
    "header span,.editable-body,.counter span,.counter strong,.track b,.track span,.service div,.number-grid span",
    selectedWindow
  );
  nodes.forEach((n) => {
    n.contentEditable = n.contentEditable === "true" ? "false" : "true";
  });
  nodes[0]?.focus();
});
$("#replace-image").addEventListener("click", () => {
  if (!selectedWindow) return alert("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u7A97\u53E3");
  $("#image-picker").click();
});
$("#image-picker").addEventListener("change", (e) => {
  const input = e.target;
  const file = input.files?.[0];
  if (!file || !selectedWindow) return;
  const target = $(".editable-body,.crt-image,.avatar-image,.eye-image,.album", selectedWindow);
  if (!target) return alert("\u8BE5\u7A97\u53E3\u6CA1\u6709\u53EF\u66FF\u6362\u7684\u56FE\u7247\u533A\u57DF");
  const reader = new FileReader();
  reader.onload = () => {
    target.style.backgroundImage = `url('${reader.result}')`;
    target.dataset.userImage = String(reader.result);
  };
  reader.readAsDataURL(file);
  input.value = "";
});
function snapshot() {
  return $$(".window").map((w) => ({
    key: w.dataset.window || w.dataset.custom || "",
    custom: w.dataset.custom || null,
    type: w.classList.contains("image-window") ? "image" : "text",
    title: $("header span", w)?.textContent || "",
    body: w.dataset.custom ? $(".editable-body", w)?.innerHTML : "",
    background: w.dataset.custom ? $(".editable-body", w)?.style.backgroundImage : "",
    css: `left:${w.offsetLeft}px;top:${w.offsetTop}px;width:${w.offsetWidth}px;height:${w.offsetHeight}px;z-index:${w.style.zIndex || 3};transform:${w.style.transform || "none"}`,
    zoom: w.dataset.zoom || "100",
    deleted: w.classList.contains("editor-deleted"),
    image: $(".crt-image,.avatar-image,.eye-image,.album", w)?.dataset.userImage || ""
  }));
}
function saveLayout() {
  try {
    localStorage.setItem("sunny-desktop-layout", JSON.stringify(snapshot()));
    $("#selected-name").textContent = "\u5E03\u5C40\u5DF2\u4FDD\u5B58";
  } catch {
    alert("\u56FE\u7247\u6587\u4EF6\u8FC7\u5927\uFF0C\u5E03\u5C40\u5C3A\u5BF8\u548C\u6587\u5B57\u53EF\u4FDD\u5B58\uFF0C\u4F46\u81EA\u5B9A\u4E49\u56FE\u7247\u65E0\u6CD5\u5B58\u5165\u6D4F\u89C8\u5668\u3002");
  }
}
$("#save-layout").addEventListener("click", saveLayout);
function restoreLayout() {
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem("sunny-desktop-layout") || "null");
  } catch {
  }
  if (!data) return;
  data.filter((x) => x.custom).forEach((x) => createWindow(x.type, x));
  data.filter((x) => !x.custom).forEach((x) => {
    const w = $(`[data-window="${x.key}"]`);
    if (!w) return;
    w.style.cssText = x.css;
    w.dataset.zoom = x.zoom;
    if (x.deleted) w.classList.add("editor-deleted");
    const title = $("header span", w);
    if (title) title.textContent = x.title;
    if (x.image) {
      const target = $(".crt-image,.avatar-image,.eye-image,.album", w);
      if (target) {
        target.style.backgroundImage = `url('${x.image}')`;
        target.dataset.userImage = x.image;
      }
    }
  });
}
restoreLayout();
$("#reset-layout").addEventListener("click", () => {
  localStorage.removeItem("sunny-desktop-layout");
  location.reload();
});
const MSG_KEY = "subahibi-messages";
let messages = [];
try {
  messages = JSON.parse(localStorage.getItem(MSG_KEY) || "[]");
} catch {
  messages = [];
}
function renderMessages() {
  const list = $("#msg-list");
  if (!list) return;
  if (!messages.length) {
    list.innerHTML = '<div class="msg-empty">No messages yet. Be the first.</div>';
    return;
  }
  list.innerHTML = messages.slice(-50).map((m) => {
    const d = new Date(m.time);
    const ts = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + " " + String(d.getMonth() + 1) + "/" + String(d.getDate());
    return `<div class="msg-item"><div class="msg-meta"><b>${esc(m.name)}</b><span>${ts}</span></div><div class="msg-body">${esc(m.text)}</div></div>`;
  }).join("");
  list.scrollTop = list.scrollHeight;
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function sendMessage() {
  const nameEl = $("#msg-name");
  const textEl = $("#msg-text");
  const name = nameEl?.value?.trim() || "Guest";
  const text = textEl?.value?.trim() || "";
  if (!text) return;
  messages.push({ name: name.slice(0, 16), text: text.slice(0, 200), time: Date.now() });
  if (messages.length > 200) messages = messages.slice(-200);
  try {
    localStorage.setItem(MSG_KEY, JSON.stringify(messages));
  } catch {
  }
  renderMessages();
  if (textEl) {
    textEl.value = "";
    textEl.focus();
  }
  try {
    localStorage.setItem("subahibi-msg-name", name);
  } catch {
  }
}
$("#msg-send")?.addEventListener("click", sendMessage);
$("#msg-text")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});
try {
  const saved = localStorage.getItem("subahibi-msg-name");
  if (saved) {
    const el = $("#msg-name");
    if (el) el.value = saved;
  }
} catch {
}
renderMessages();
document.addEventListener("keydown", (e) => {
  const target = e.target;
  if (target && target.closest('[contenteditable="true"],input,textarea')) return;
  switch (e.key) {
    case " ":
      e.preventDefault();
      btnPlay.click();
      break;
    case "ArrowLeft":
      e.preventDefault();
      if (audio.duration) audio.currentTime = Math.max(0, audio.currentTime - 5);
      break;
    case "ArrowRight":
      e.preventDefault();
      if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      break;
    case "ArrowUp":
      e.preventDefault();
      audio.volume = Math.min(1, audio.volume + 0.05);
      volume.value = String(audio.volume * 100);
      updateVolIcon();
      break;
    case "ArrowDown":
      e.preventDefault();
      audio.volume = Math.max(0, audio.volume - 0.05);
      volume.value = String(audio.volume * 100);
      updateVolIcon();
      break;
    case "m":
      e.preventDefault();
      audio.muted = !audio.muted;
      updateVolIcon();
      break;
    case "f":
      e.preventDefault();
      $("#fullscreen").click();
      break;
    case "e":
      if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleEditor();
      }
      break;
  }
});
