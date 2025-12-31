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
   0) Animated background (canvas gradient + particles)
   ========================================================= */
(function startAnimatedBackground(){
  // Create a fixed canvas behind everything
  const cv = document.createElement("canvas");
  cv.id = "bgCanvas";
  cv.style.position = "fixed";
  cv.style.inset = "0";
  cv.style.zIndex = "-2";
  cv.style.pointerEvents = "none";
  cv.style.opacity = "1";
  document.body.prepend(cv);

  const ctx = cv.getContext("2d", { alpha: true });

  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  function resize(){
    cv.width = Math.floor(window.innerWidth * DPR);
    cv.height = Math.floor(window.innerHeight * DPR);
  }
  window.addEventListener("resize", resize);
  resize();

  // Particles
  const N = 90;
  const parts = [];
  for (let i=0;i<N;i++){
    parts.push({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random()*1.8,
      vx: (Math.random()*0.12 + 0.04) * (Math.random()<0.5?-1:1),
      vy: (Math.random()*0.09 + 0.02) * (Math.random()<0.5?-1:1),
      a: 0.10 + Math.random()*0.22
    });
  }

  let t0 = performance.now();

  function draw(now){
    const dt = Math.min(32, now - t0);
    t0 = now;

    const w = cv.width, h = cv.height;
    ctx.clearRect(0,0,w,h);

    // Moving gradient
    const tt = now * 0.00008;
    const gx = (Math.sin(tt*2.1)*0.18 + 0.5) * w;
    const gy = (Math.cos(tt*1.7)*0.18 + 0.35) * h;

    const g = ctx.createRadialGradient(gx, gy, 0, w*0.55, h*0.55, Math.max(w,h)*0.85);
    g.addColorStop(0.0, "rgba(120,60,255,0.20)");
    g.addColorStop(0.42, "rgba(0,190,255,0.10)");
    g.addColorStop(0.72, "rgba(0,0,0,0.50)");
    g.addColorStop(1.0, "rgba(0,0,0,0.88)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // Soft vignette overlay
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0,0,w,h);

    // Particles (drifting + slight parallax)
    for (const p of parts){
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;

      // Wrap
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

    // known messy ones
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

  // T2: ONLY BF (B & F)
  if (tierName === "Tier 2") return { count: 6, mode: "normal", pool: BF, visual: BF };

  if (tierName === "Refill") return { count: 1, mode: "normal", pool: weapons, visual: weapons };
  return { count: 1, mode: "normal", pool: weapons, visual: weapons };
}

function pickWinner(cfg) {
  if (cfg.mode === "weighted") return (Math.random() < cfg.pSA) ? pickRandom(cfg.SA) : pickRandom(cfg.BF);
  return pickRandom(cfg.pool);
}

/* -------- CS:GO roll once -------- */
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
  const winnerEl = strip.children[PRE];

  const center = mask.clientWidth / 2;
  const winnerCenter = winnerEl.offsetLeft + (winnerEl.offsetWidth / 2);
  const jitter = (Math.random() * 40) - 20;
  const target = Math.max(0, (winnerCenter - center) + jitter);

  strip.style.transition = "transform 4.6s cubic-bezier(.08,.85,.12,1)";
  strip.style.transform = `translateX(-${target}px)`;

  await new Promise(r => setTimeout(r, 4700));
}

function addDrop(w) { dropsDiv.appendChild(makeCard(w)); }

/* =========================================================
   Tier section filters
   ========================================================= */
function filterT1() { return weapons.filter(w => ["S", "A"].includes(w.tier)); }
function filterT15() { return weapons.filter(w => ["B", "F"].includes(w.tier)); }
function filterT2() { return weapons.filter(w => ["B", "F"].includes(w.tier)); }
function filterAll() { return weapons; }

/* -------- Transition helpers -------- */
function setActiveButton(btn) {
  [showT1Btn, showT15Btn, showT2Btn, showAllBtn].forEach(b => b?.classList.remove("is-active"));
  btn?.classList.add("is-active");
}

/* =========================================================
   1) Tier filters + sort UI (injected next to search bar)
   ========================================================= */
let currentBaseList = []; // whatever section you’re viewing (T1/T1.5/T2/All/Search)
let activeSectionBtn = showAllBtn;

const state = {
  tierFilter: "ALL",         // ALL, S, A, B, F
  sortBy: "TIER",            // TIER, DAMAGE, RPM, NAME
  sortDir: "DESC",           // ASC, DESC
  search: ""                 // string
};

function tierRank(t){
  // Higher rank = rarer/higher
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
  const q = (state.search || "").trim().toLowerCase();
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

    if (by === "NAME"){
      return String(A.name).localeCompare(String(B.name)) * dir;
    }
    if (by === "TIER"){
      // S > A > B > F
      const d = (tierRank(A.tier) - tierRank(B.tier));
      if (d !== 0) return d * dir;
      // tiebreak
      return String(A.name).localeCompare(String(B.name)) * dir;
    }
    if (by === "DAMAGE"){
      const d = (A._damage - B._damage);
      if (d !== 0) return d * dir;
      return (tierRank(A.tier) - tierRank(B.tier)) * dir;
    }
    if (by === "RPM"){
      const d = (A._rpm - B._rpm);
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

    // keep in sync with search input
    state.search = (searchInput?.value || "");

    list = applySearch(list);
    list = applyTierFilter(list);
    list = applySort(list);

    renderGrid(allWeaponsDiv, list);
    requestAnimationFrame(()=> allWeaponsDiv.classList.remove("is-switching"));
  }, 180);
}

function injectFilterSortUI(){
  // Find the row that has Weapons + search input
  const row = document.querySelector(".sectionHead.rowHead");
  if (!row) return;

  // Create controls container
  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.flexWrap = "wrap";
  controls.style.gap = "10px";
  controls.style.alignItems = "center";
  controls.style.justifyContent = "flex-end";
  controls.style.marginLeft = "auto";

  // Tier filter
  const tierSel = document.createElement("select");
  tierSel.className = "uiSelect";
  tierSel.id = "tierFilterSelect";
  tierSel.innerHTML = `
    <option value="ALL">All Tiers</option>
    <option value="S">Tier S</option>
    <option value="A">Tier A</option>
    <option value="B">Tier B</option>
    <option value="F">Tier F</option>
  `;
  tierSel.value = state.tierFilter;

  // Sort by
  const sortSel = document.createElement("select");
  sortSel.className = "uiSelect";
  sortSel.id = "sortBySelect";
  sortSel.innerHTML = `
    <option value="TIER">Sort: Tier</option>
    <option value="DAMAGE">Sort: Damage</option>
    <option value="RPM">Sort: RPM</option>
    <option value="NAME">Sort: Name</option>
  `;
  sortSel.value = state.sortBy;

  // Sort dir
  const dirBtn = document.createElement("button");
  dirBtn.className = "uiBtn ghost";
  dirBtn.id = "sortDirBtn";
  dirBtn.textContent = state.sortDir === "ASC" ? "Asc ↑" : "Desc ↓";

  // Place controls BEFORE the search input, but in the same row
  // We’ll move the search input into the controls group.
  const search = searchInput;
  if (search){
    search.style.minWidth = "220px";
  }

  controls.appendChild(tierSel);
  controls.appendChild(sortSel);
  controls.appendChild(dirBtn);
  if (search) controls.appendChild(search);

  // Remove search from its original spot, then add controls
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

  // Search already has an input listener below; this makes sure it re-renders with filters+sort
}

/* =========================================================
   2) Section switching (now goes through filters+sort)
   ========================================================= */
function switchSection(baseList, activeBtn){
  activeSectionBtn = activeBtn || null;
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

    // avoid duplicates if possible
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

searchInput.addEventListener("input", () => {
  // Search applies on top of current section + tier filter + sort
  updateWeaponsGridWithFilters();
});

/* =========================================================
   Init
   ========================================================= */
(async function init() {
  await loadWeapons();

  // Default: show all weapons
  currentBaseList = weapons;

  // Inject tier filter + sort UI
  injectFilterSortUI();

  // First render
  setActiveButton(showAllBtn);
  updateWeaponsGridWithFilters();

  setStatus("Ready.");
})();
