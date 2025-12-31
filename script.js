const strip = document.getElementById("strip");
const dropsDiv = document.getElementById("drops");
const allWeaponsDiv = document.getElementById("allWeapons");
const statusEl = document.getElementById("status");
const tierSelect = document.getElementById("tierSelect");
const spinBtn = document.getElementById("spinBtn");
const searchInput = document.getElementById("search");

const showT1Btn = document.getElementById("showT1Btn");
const showT15Btn = document.getElementById("showT15Btn");
const showT2Btn = document.getElementById("showT2Btn");
const showAllBtn = document.getElementById("showAllBtn");

let weapons = [];

/* ---- Inspect Modal elements ---- */
const inspectModal = document.getElementById("inspectModal");
const modalClose = document.getElementById("modalClose");
const modalX = document.getElementById("modalX");
const modalTier = document.getElementById("modalTier");
const modalName = document.getElementById("modalName");
const modalStats = document.getElementById("modalStats");
const modalImg = document.getElementById("modalImg");
const modalStars = document.getElementById("modalStars");

/* ---- Damage bar nodes (injected) ---- */
let barWrap = null;
let barFill = null;
let barVal = null;
let barMin = null;
let barMax = null;

function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

/* =========================================================
   0) Animated background (canvas gradient + drifting particles)
   ========================================================= */
(function startAnimatedBackground(){
  const cv = document.createElement("canvas");
  cv.id = "bgCanvas";
  cv.style.position = "fixed";
  cv.style.inset = "0";
  cv.style.zIndex = "-2";
  cv.style.pointerEvents = "none";
  document.body.prepend(cv);

  const ctx = cv.getContext("2d", { alpha: true });

  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  function resize(){
    cv.width = Math.floor(window.innerWidth * DPR);
    cv.height = Math.floor(window.innerHeight * DPR);
  }
  window.addEventListener("resize", resize);
  resize();

  const N = 100;
  const parts = [];
  for (let i=0;i<N;i++){
    parts.push({
      x: Math.random(),
      y: Math.random(),
      r: 0.7 + Math.random()*2.2,
      vx: (Math.random()*0.12 + 0.04) * (Math.random()<0.5?-1:1),
      vy: (Math.random()*0.09 + 0.02) * (Math.random()<0.5?-1:1),
      a: 0.07 + Math.random()*0.20
    });
  }

  let t0 = performance.now();

  function draw(now){
    const dt = Math.min(32, now - t0);
    t0 = now;

    const w = cv.width, h = cv.height;
    ctx.clearRect(0,0,w,h);

    const tt = now * 0.00008;
    const gx = (Math.sin(tt*2.1)*0.18 + 0.5) * w;
    const gy = (Math.cos(tt*1.7)*0.18 + 0.35) * h;

    const g = ctx.createRadialGradient(gx, gy, 0, w*0.55, h*0.55, Math.max(w,h)*0.85);
    g.addColorStop(0.0, "rgba(120,60,255,0.20)");
    g.addColorStop(0.42, "rgba(0,190,255,0.10)");
    g.addColorStop(0.72, "rgba(0,0,0,0.52)");
    g.addColorStop(1.0, "rgba(0,0,0,0.90)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    for (const p of parts){
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      if (p.x < -0.05) p.x = 1.05;
      if (p.x > 1.05) p.x = -0.05;
      if (p.y < -0.05) p.y = 1.05;
      if (p.y > 1.05) p.y = -0.05;

      const px = p.x * w;
      const py = p.y * h;

      ctx.beginPath();
      ctx.arc(px, py, p.r * DPR, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${p.a})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

/* =========================================================
   1) Audio (perfect tick timing) + Volume + Mute
   ========================================================= */
const AUDIO_KEY = "wc_audio_settings_v1";
const audioState = {
  muted: false,
  volume: 0.55 // 0..1
};

(function loadAudioSettings(){
  try{
    const saved = JSON.parse(localStorage.getItem(AUDIO_KEY) || "null");
    if (saved && typeof saved === "object") {
      if (typeof saved.muted === "boolean") audioState.muted = saved.muted;
      if (typeof saved.volume === "number") audioState.volume = Math.max(0, Math.min(1, saved.volume));
    }
  } catch {}
})();

function saveAudioSettings(){
  try{ localStorage.setItem(AUDIO_KEY, JSON.stringify(audioState)); } catch {}
}

let _audioUnlocked = false;
let _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function unlockAudioOnce() {
  if (_audioUnlocked) return;
  _audioUnlocked = true;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.01);
  } catch {}
}
document.addEventListener("pointerdown", unlockAudioOnce, { once: true });

function beep({ freq = 900, dur = 0.025, type = "square", vol = 0.05 } = {}) {
  if (audioState.muted) return;
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;

    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = type;
    o.frequency.setValueAtTime(freq, t);

    const v = Math.max(0.0001, vol * audioState.volume);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {}
}

function playTick(){
  // crisp “clack”
  beep({ freq: 1650, dur: 0.018, type: "square", vol: 0.040 });
  setTimeout(()=> beep({ freq: 980, dur: 0.012, type: "square", vol: 0.022 }), 6);
}

function playHit(tier){
  if (String(tier).toUpperCase() === "F") {
    beep({ freq: 520, dur: 0.09, type: "sawtooth", vol: 0.085 });
    setTimeout(()=> beep({ freq: 780, dur: 0.09, type: "triangle", vol: 0.075 }), 65);
    setTimeout(()=> beep({ freq: 1040, dur: 0.06, type: "triangle", vol: 0.06 }), 140);
  } else {
    beep({ freq: 520, dur: 0.07, type: "triangle", vol: 0.06 });
    setTimeout(()=> beep({ freq: 720, dur: 0.05, type: "triangle", vol: 0.045 }), 55);
  }
}

/* ---- Inject Volume UI into sidebar (no HTML edits needed) ---- */
(function injectAudioUI(){
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  const block = document.createElement("div");
  block.className = "panelBlock";
  block.innerHTML = `
    <div class="panelTitle">Audio</div>
    <div class="panelBody" style="gap:10px;">
      <button id="muteBtn" class="uiBtn ghost" style="justify-content:center;">
        ${audioState.muted ? "Unmute" : "Mute"}
      </button>

      <div style="display:flex; align-items:center; gap:10px;">
        <div style="font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.7);">Volume</div>
        <input id="volSlider" type="range" min="0" max="1" step="0.01" value="${audioState.volume}" style="flex:1;">
      </div>
    </div>
  `;

  // Put audio block after your Show Weapons panel (end of sidebar)
  sidebar.appendChild(document.createElement("div")).style.height = "10px";
  sidebar.appendChild(block);

  const muteBtn = block.querySelector("#muteBtn");
  const volSlider = block.querySelector("#volSlider");

  muteBtn.addEventListener("click", ()=>{
    unlockAudioOnce();
    audioState.muted = !audioState.muted;
    muteBtn.textContent = audioState.muted ? "Unmute" : "Mute";
    saveAudioSettings();
    if (!audioState.muted) playTick();
  });

  volSlider.addEventListener("input", ()=>{
    unlockAudioOnce();
    audioState.volume = parseFloat(volSlider.value);
    saveAudioSettings();
  });
})();

/* =========================================================
   2) Confetti + glow burst for Tier F
   ========================================================= */
function confettiBurst() {
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.pointerEvents = "none";
  root.style.zIndex = "9999";

  const originX = window.innerWidth * 0.5;
  const originY = window.innerHeight * 0.35;

  const count = 100;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 6;

    p.style.position = "absolute";
    p.style.left = originX + "px";
    p.style.top = originY + "px";
    p.style.width = size + "px";
    p.style.height = (size * 0.55) + "px";
    p.style.borderRadius = "2px";
    p.style.opacity = "0.98";
    p.style.transform = "translate(-50%,-50%)";
    p.style.background = "hsl(" + Math.floor(Math.random() * 360) + " 90% 60%)";
    p.style.filter = "drop-shadow(0 4px 8px rgba(0,0,0,.35))";

    const angle = Math.random() * Math.PI * 2;
    const dist = 160 + Math.random() * 460;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - (140 + Math.random() * 140);

    const rot = (Math.random() * 720 - 360);
    const dur = 900 + Math.random() * 800;

    p.animate(
      [
        { transform: "translate(-50%,-50%) translate(0px,0px) rotate(0deg)", opacity: 1 },
        { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 0.0 }
      ],
      { duration: dur, easing: "cubic-bezier(.12,.82,.2,1)", fill: "forwards" }
    );

    root.appendChild(p);
  }

  document.body.appendChild(root);
  setTimeout(() => root.remove(), 1900);
}

function glowBurst() {
  const rollArea = document.querySelector(".rollArea") || document.body;
  rollArea.classList.add("f-hit-glow");
  setTimeout(() => rollArea.classList.remove("f-hit-glow"), 950);
}

(function injectGlowCSS(){
  const id = "fHitGlowCSS";
  if (document.getElementById(id)) return;
  const st = document.createElement("style");
  st.id = id;
  st.textContent = `
    .f-hit-glow { position: relative; }
    .f-hit-glow::after{
      content:"";
      position:absolute;
      inset:-12px;
      border-radius:18px;
      pointer-events:none;
      background: radial-gradient(circle at 50% 40%,
        rgba(255,215,90,.65),
        rgba(255,50,200,.22) 42%,
        rgba(0,0,0,0) 72%);
      filter: blur(7px);
      animation: fglow .95s ease-out forwards;
    }
    @keyframes fglow{
      0%{ opacity:0; transform:scale(.98);}
      18%{ opacity:1; transform:scale(1);}
      100%{ opacity:0; transform:scale(1.04);}
    }
    input[type="range"]{
      accent-color: rgba(80,230,255,.85);
    }
  `;
  document.head.appendChild(st);
})();

/* =========================================================
   Helpers
   ========================================================= */
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function starsHTML(stars) { return "★".repeat(stars || 0); }

function canonicalName(name) { return String(name || "").trim().toLowerCase(); }
function getWeaponByName(name) {
  const key = canonicalName(name);
  return weapons.find(w => canonicalName(w.name) === key) || null;
}

/* ---------- Tier damage ranges ---------- */
const DAMAGE_RANGES = {
  S: { min: 21, max: 24 },
  A: { min: 23, max: 26 },
  B: { min: 25, max: 28 },
  F: { min: 30, max: 36 }
};

function generateDamageForTier(tier) {
  const r = DAMAGE_RANGES[tier] || { min: 20, max: 30 };
  return randInt(r.min, r.max);
}

/* ---------- Fire rate (RPM) by weapon type ---------- */
function classifyWeapon(name) {
  const n = canonicalName(name);
  if (n.includes("mac10") || n.includes("kriss") || n.includes("vector")) return "smg";
  if (n.includes("mcx") || n.includes("arp") || n.includes("draco")) return "rifle";
  if (n.includes("switch")) return "switch";
  return "pistol";
}

const RPM_RANGES = {
  pistol: { min: 280, max: 520 },
  rifle:  { min: 600, max: 850 },
  smg:    { min: 850, max: 1100 },
  switch: { min: 1100, max: 1600 }
};

function generateRPM(name) {
  const type = classifyWeapon(name);
  const r = RPM_RANGES[type] || RPM_RANGES.pistol;

  const n = canonicalName(name);
  if (type === "rifle" && n.includes("binary")) {
    return randInt(Math.max(r.min, 720), r.max);
  }
  return randInt(r.min, r.max);
}

/* ---------- Build stats ONCE per weapon (stable) ---------- */
function ensureGeneratedStats(w) {
  if (w._damage == null) w._damage = generateDamageForTier(w.tier);
  if (w._rpm == null) w._rpm = generateRPM(w.name);
  return w;
}

/* ---------- Determine bar min/max from your tier ranges ---------- */
const GLOBAL_MIN_DAMAGE = Math.min(...Object.values(DAMAGE_RANGES).map(x => x.min));
const GLOBAL_MAX_DAMAGE = Math.max(...Object.values(DAMAGE_RANGES).map(x => x.max));

function damagePct(dmg) {
  const v = Number(dmg);
  if (!Number.isFinite(v)) return 0;
  return clamp01((v - GLOBAL_MIN_DAMAGE) / (GLOBAL_MAX_DAMAGE - GLOBAL_MIN_DAMAGE));
}

/* -------- Load weapons.json -------- */
async function loadWeapons() {
  const res = await fetch("./weapons.json", { cache: "no-store" });
  weapons = await res.json();
  weapons = weapons.map(w => ensureGeneratedStats(w));
}

/* -------- Image resolver -------- */
function slug(n) {
  return String(n).toLowerCase()
    .replace(/\(b\)/g, "b")
    .replace(/[()]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function imageCandidates(name) {
  const baseSlug = slug(name);
  const baseRaw = String(name).replace(/\(B\)/g, "").replace(/\(b\)/g, "").trim();
  const dir = "./images/weapons/";

  const list = [
    `${dir}${baseSlug}.webp`,
    `${dir}${baseSlug}.png`,
    `${dir}${baseSlug}.webp.png`,
    `${dir}${baseSlug}.png.png`,

    `${dir}${baseRaw}.webp`,
    `${dir}${baseRaw}.png`,
    `${dir}${baseRaw}.webp.png`,
    `${dir}${baseRaw}.png.png`,

    `${dir}fn57.webp.png`,
    `${dir}fn57.webp`,
    `${dir}fn57.png`,
    `${dir}fn57-b.webp`,
    `${dir}glock-19-switch.png.png`,
    `${dir}glock-19-switch.png`
  ];
  return [...new Set(list)];
}

/* -------- Damage Bar (inject) -------- */
function ensureDamageBar() {
  if (barWrap) return;

  barWrap = document.createElement("div");
  barWrap.id = "damageBarWrap";
  barWrap.style.marginTop = "10px";
  barWrap.style.display = "grid";
  barWrap.style.gap = "8px";

  barWrap.innerHTML = `
    <div style="display:flex; justify-content:space-between; gap:12px; font-size:12px; letter-spacing:.14em; color:rgba(255,255,255,.72);">
      <div>Damage</div>
      <div id="damageBarValue" style="color:rgba(255,255,255,.92); font-weight:700;">0</div>
    </div>
    <div style="height:12px; border-radius:999px; border:1px solid rgba(255,255,255,.14); background:rgba(0,0,0,.35); overflow:hidden;">
      <div id="damageBarFill" style="height:100%; width:0%; background:linear-gradient(90deg, rgba(255,45,59,.85), rgba(255,200,90,.75));"></div>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:11px; letter-spacing:.12em; color:rgba(255,255,255,.55);">
      <div id="damageBarMin">${GLOBAL_MIN_DAMAGE}</div>
      <div id="damageBarMax">${GLOBAL_MAX_DAMAGE}</div>
    </div>
  `;

  const top = document.querySelector(".modalTop");
  if (top && top.parentElement) top.parentElement.insertBefore(barWrap, top.nextSibling);

  barFill = document.getElementById("damageBarFill");
  barVal = document.getElementById("damageBarValue");
  barMin = document.getElementById("damageBarMin");
  barMax = document.getElementById("damageBarMax");
}

/* -------- Inspect modal -------- */
function openInspect(anyWeaponObj) {
  ensureDamageBar();

  const real = ensureGeneratedStats(getWeaponByName(anyWeaponObj?.name) || anyWeaponObj);

  inspectModal.classList.add("show");
  inspectModal.setAttribute("aria-hidden", "false");

  modalTier.textContent = `Tier ${real.tier ?? "?"}`;
  modalTier.className = `modalTier tier-${real.tier ?? "S"}`;
  modalName.textContent = real.name ?? "Unknown";

  const dmg = real._damage;
  const rpm = real._rpm;

  modalStats.textContent = `Damage: ${dmg} • Fire Rate: ${rpm} RPM`;
  modalStars.textContent = starsHTML(real.stars || 0);

  const pct = damagePct(dmg);
  if (barFill) barFill.style.width = `${Math.round(pct * 100)}%`;
  if (barVal) barVal.textContent = String(dmg);
  if (barMin) barMin.textContent = String(GLOBAL_MIN_DAMAGE);
  if (barMax) barMax.textContent = String(GLOBAL_MAX_DAMAGE);

  const candidates = imageCandidates(real.name || "");
  let i = 0;
  const tryNext = () => {
    if (i >= candidates.length) {
      modalImg.removeAttribute("src");
      modalImg.alt = "Image missing";
      return;
    }
    modalImg.src = candidates[i++];
  };
  modalImg.onerror = tryNext;
  tryNext();
}

function closeInspect() {
  inspectModal.classList.remove("show");
  inspectModal.setAttribute("aria-hidden", "true");
}

modalClose.addEventListener("click", closeInspect);
modalX.addEventListener("click", closeInspect);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeInspect(); });

/* -------- Cards -------- */
function makeCard(w) {
  const real = ensureGeneratedStats(getWeaponByName(w?.name) || w);

  const div = document.createElement("div");
  div.className = `card tier-${real.tier}`;
  div.innerHTML = `
    <div class="cardName">${real.name}</div>
    <div class="cardImgWrap">
      <img alt="${real.name}">
      <div class="missing" style="display:none;"></div>
    </div>
    <div class="cardStars">${starsHTML(real.stars || 0)}</div>
  `;

  const img = div.querySelector("img");
  const miss = div.querySelector(".missing");
  const candidates = imageCandidates(real.name);

  let i = 0;
  const tryNext = () => {
    if (i >= candidates.length) {
      img.style.display = "none";
      miss.style.display = "flex";
      miss.style.whiteSpace = "pre-wrap";
      miss.textContent = `MISSING:\n${real.name}`;
      return;
    }
    img.src = candidates[i++];
  };

  img.onerror = tryNext;
  tryNext();

  div.addEventListener("click", () => openInspect(real));
  return div;
}

function renderGrid(targetEl, list) {
  targetEl.innerHTML = "";
  list.forEach(w => targetEl.appendChild(makeCard(w)));
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/* =========================================================
   Tier rules
   ========================================================= */
function tierConfig(tierName) {
  const SA = weapons.filter(w => ["S", "A"].includes(w.tier));
  const BF = weapons.filter(w => ["B", "F"].includes(w.tier));

  if (tierName === "Test Drops") return { count: 2, mode: "normal", pool: SA, visual: SA };
  if (tierName === "Tier 1") return { count: 4, mode: "normal", pool: SA, visual: SA };

  // T1.5: mostly BF, small SA
  if (tierName === "Tier 1.5") return { count: 4, mode: "weighted", SA, BF, pSA: 0.15, visual: BF.concat(SA) };

  // T2: ONLY BF
  if (tierName === "Tier 2") return { count: 6, mode: "normal", pool: BF, visual: BF };

  if (tierName === "Refill") return { count: 1, mode: "normal", pool: weapons, visual: weapons };
  return { count: 1, mode: "normal", pool: weapons, visual: weapons };
}

function pickWinner(cfg) {
  if (cfg.mode === "weighted") return (Math.random() < cfg.pSA) ? pickRandom(cfg.SA) : pickRandom(cfg.BF);
  return pickRandom(cfg.pool);
}

/* =========================================================
   PERFECT TICK TIMING (matches exact card crossings)
   We compute the exact time each card center passes the marker line.
   ========================================================= */
function easingCubicBezier(p1x, p1y, p2x, p2y) {
  // returns a function f(t) mapping t->[0..1] (ease)
  // and inverse to map progress->time using binary search.
  function cubic(a, b, c, d, t){
    const mt = 1 - t;
    return mt*mt*mt*a + 3*mt*mt*t*b + 3*mt*t*t*c + t*t*t*d;
  }
  function x(t){ return cubic(0, p1x, p2x, 1, t); }
  function y(t){ return cubic(0, p1y, p2y, 1, t); }

  function invX(xTarget){
    let lo = 0, hi = 1;
    for (let i=0;i<24;i++){
      const mid = (lo+hi)/2;
      const xm = x(mid);
      if (xm < xTarget) lo = mid; else hi = mid;
    }
    return (lo+hi)/2;
  }

  return {
    ease: (t)=> y(invX(t)),        // input time t in [0..1], output eased progress
    invEase: (p)=> invX(p)         // input progress p, output time t (approx)
  };
}

// matches your CSS transition: cubic-bezier(.08,.85,.12,1)
const EASE = easingCubicBezier(0.08, 0.85, 0.12, 1);

/* -------- CS:GO roll once (perfect tick + hit + F effects) -------- */
async function rollOnce(winner, visualPool) {
  const PRE = 40, POST = 12;
  const roll = [];

  for (let i = 0; i < PRE; i++) roll.push(pickRandom(visualPool));
  roll.push(winner);
  for (let i = 0; i < POST; i++) roll.push(pickRandom(visualPool));

  strip.innerHTML = "";
  roll.forEach(w => strip.appendChild(makeCard(w)));

  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";
  strip.offsetHeight;

  const mask = document.querySelector(".mask") || document.body;
  const markerX = mask.getBoundingClientRect().left + (mask.clientWidth / 2);

  const winnerEl = strip.children[PRE];

  // Find target translate
  const center = mask.clientWidth / 2;
  const winnerCenter = winnerEl.offsetLeft + (winnerEl.offsetWidth / 2);
  const jitter = (Math.random() * 40) - 20;
  const target = Math.max(0, (winnerCenter - center) + jitter);

  // Build tick schedule: time when each card center crosses marker line
  // At time t, strip translate is -target * ease(t)
  // A card center crosses marker when: (stripLeft + cardCenter - translate) == markerX
  const stripLeft = strip.getBoundingClientRect().left; // at translate 0
  const total = target; // positive number

  const tickTimes = [];
  for (let i = 0; i < strip.children.length; i++) {
    const el = strip.children[i];
    const cardCenterX = stripLeft + (el.offsetLeft + el.offsetWidth / 2);
    const neededTranslate = cardCenterX - markerX; // how far strip must move left to bring this center to marker
    if (neededTranslate <= 0) continue;
    if (neededTranslate >= total) continue;

    const progress = neededTranslate / total; // 0..1
    const timeT = EASE.invEase(progress);     // 0..1
    tickTimes.push(timeT);
  }

  tickTimes.sort((a,b)=>a-b);

  const DURATION = 4600;
  strip.style.transition = "transform 4.6s cubic-bezier(.08,.85,.12,1)";
  strip.style.transform = `translateX(-${target}px)`;

  // schedule ticks precisely
  unlockAudioOnce();
  let tickIndex = 0;
  const start = performance.now();

  // Use a tight raf loop to fire ticks at exact times
  let rafId = null;
  function tickLoop(now){
    const elapsed = now - start;
    const t = Math.min(1, elapsed / DURATION);

    while (tickIndex < tickTimes.length && t >= tickTimes[tickIndex]) {
      playTick();
      tickIndex++;
    }
    if (t < 1) rafId = requestAnimationFrame(tickLoop);
  }
  rafId = requestAnimationFrame(tickLoop);

  await new Promise(r => setTimeout(r, DURATION));
  if (rafId) cancelAnimationFrame(rafId);

  playHit(winner.tier);

  if (String(winner.tier).toUpperCase() === "F") {
    glowBurst();
    confettiBurst();
  }

  await new Promise(r => setTimeout(r, 140));
}

function addDrop(w) { dropsDiv.appendChild(makeCard(w)); }

/* =========================================================
   Tier section filters
   ========================================================= */
function filterT1() { return weapons.filter(w => ["S", "A"].includes(w.tier)); }
function filterT15() { return weapons.filter(w => ["B", "F"].includes(w.tier)); }
function filterT2() { return weapons.filter(w => ["B", "F"].includes(w.tier)); }
function filterAll() { return weapons; }

/* -------- Active button helpers -------- */
function setActiveButton(btn) {
  [showT1Btn, showT15Btn, showT2Btn, showAllBtn].forEach(b => b?.classList.remove("is-active"));
  btn?.classList.add("is-active");
}

/* =========================================================
   Tier filters + sort UI (injected next to search)
   ========================================================= */
let currentBaseList = [];
const state = {
  tierFilter: "ALL",
  sortBy: "TIER",
  sortDir: "DESC"
};

function tierRank(t){
  if (t === "S") return 4;
  if (t === "A") return 3;
  if (t === "B") return 2;
  if (t === "F") return 1;
  return 0;
}

function applyTierFilter(list){
  if (state.tierFilter === "ALL") return list;
  return list.filter(w => w.tier === state.tierFilter);
}

function applySearch(list){
  const q = (searchInput?.value || "").trim().toLowerCase();
  if (!q) return list;
  return list.filter(w => String(w.name).toLowerCase().includes(q));
}

function applySort(list){
  const dir = state.sortDir === "ASC" ? 1 : -1;
  const by = state.sortBy;

  const copy = [...list];
  copy.sort((a,b)=>{
    const A = ensureGeneratedStats(a);
    const B = ensureGeneratedStats(b);

    if (by === "NAME") return String(A.name).localeCompare(String(B.name)) * dir;

    if (by === "TIER") {
      const d = tierRank(A.tier) - tierRank(B.tier);
      if (d !== 0) return d * dir;
      return String(A.name).localeCompare(String(B.name)) * dir;
    }

    if (by === "DAMAGE") {
      const d = A._damage - B._damage;
      if (d !== 0) return d * dir;
      return (tierRank(A.tier) - tierRank(B.tier)) * dir;
    }

    if (by === "RPM") {
      const d = A._rpm - B._rpm;
      if (d !== 0) return d * dir;
      return (tierRank(A.tier) - tierRank(B.tier)) * dir;
    }

    return 0;
  });

  return copy;
}

function updateWeaponsGridWithFilters(){
  allWeaponsDiv.classList.add("is-switching");
  setTimeout(()=>{
    let list = currentBaseList.length ? currentBaseList : weapons;
    list = applySearch(list);
    list = applyTierFilter(list);
    list = applySort(list);
    renderGrid(allWeaponsDiv, list);
    requestAnimationFrame(()=> allWeaponsDiv.classList.remove("is-switching"));
  }, 180);
}

function injectFilterSortUI(){
  const row = document.querySelector(".sectionHead.rowHead");
  if (!row) return;

  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.flexWrap = "wrap";
  controls.style.gap = "10px";
  controls.style.alignItems = "center";
  controls.style.justifyContent = "flex-end";
  controls.style.marginLeft = "auto";

  const tierSel = document.createElement("select");
  tierSel.className = "uiSelect";
  tierSel.innerHTML = `
    <option value="ALL">All Tiers</option>
    <option value="S">Tier S</option>
    <option value="A">Tier A</option>
    <option value="B">Tier B</option>
    <option value="F">Tier F</option>
  `;
  tierSel.value = state.tierFilter;

  const sortSel = document.createElement("select");
  sortSel.className = "uiSelect";
  sortSel.innerHTML = `
    <option value="TIER">Sort: Tier</option>
    <option value="DAMAGE">Sort: Damage</option>
    <option value="RPM">Sort: RPM</option>
    <option value="NAME">Sort: Name</option>
  `;
  sortSel.value = state.sortBy;

  const dirBtn = document.createElement("button");
  dirBtn.className = "uiBtn ghost";
  dirBtn.textContent = state.sortDir === "ASC" ? "Asc ↑" : "Desc ↓";

  // move search into this control group
  if (searchInput) searchInput.style.minWidth = "220px";

  controls.appendChild(tierSel);
  controls.appendChild(sortSel);
  controls.appendChild(dirBtn);
  if (searchInput) controls.appendChild(searchInput);

  row.appendChild(controls);

  tierSel.addEventListener("change", ()=>{
    state.tierFilter = tierSel.value;
    updateWeaponsGridWithFilters();
  });

  sortSel.addEventListener("change", ()=>{
    state.sortBy = sortSel.value;
    updateWeaponsGridWithFilters();
  });

  dirBtn.addEventListener("click", ()=>{
    state.sortDir = (state.sortDir === "ASC") ? "DESC" : "ASC";
    dirBtn.textContent = state.sortDir === "ASC" ? "Asc ↑" : "Desc ↓";
    updateWeaponsGridWithFilters();
  });
}

/* section switching */
function switchSection(baseList, activeBtn){
  if (activeBtn) setActiveButton(activeBtn);
  currentBaseList = baseList;
  updateWeaponsGridWithFilters();
}

/* =========================================================
   Button listeners
   ========================================================= */
spinBtn.addEventListener("click", async () => {
  spinBtn.disabled = true;
  dropsDiv.innerHTML = "";

  const tier = tierSelect.value;
  const cfg = tierConfig(tier);

  const visualPool = cfg.visual || cfg.pool || weapons;
  const count = cfg.count || 1;

  if (!weapons.length) {
    setStatus("weapons.json not loaded or empty.");
    spinBtn.disabled = false;
    return;
  }

  setStatus(`Rolling ${count} time(s) for ${tier}...`);

  const used = new Set();
  for (let i = 0; i < count; i++) {
    let winner = pickWinner(cfg);

    let tries = 0;
    while (used.has(winner.name) && tries < 25) {
      winner = pickWinner(cfg);
      tries++;
    }
    used.add(winner.name);

    setStatus(`Rolling ${i + 1}/${count}...`);
    await rollOnce(winner, visualPool);
    addDrop(winner);
  }

  setStatus(`Done! Dropped ${count} weapon(s) from ${tier}.`);
  spinBtn.disabled = false;
});

showT1Btn.addEventListener("click", () => switchSection(filterT1(), showT1Btn));
showT15Btn.addEventListener("click", () => switchSection(filterT15(), showT15Btn));
showT2Btn.addEventListener("click", () => switchSection(filterT2(), showT2Btn));
showAllBtn.addEventListener("click", () => switchSection(filterAll(), showAllBtn));

searchInput.addEventListener("input", () => updateWeaponsGridWithFilters());

/* =========================================================
   Init
   ========================================================= */
(async function init() {
  await loadWeapons();
  currentBaseList = weapons;

  injectFilterSortUI();

  setActiveButton(showAllBtn);
  updateWeaponsGridWithFilters();

  setStatus("Ready.");
})();
