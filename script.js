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
let damageMin = 0;
let damageMax = 100;

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

function setStatus(msg){ if(statusEl) statusEl.textContent = msg; }

async function loadWeapons(){
  const res = await fetch("./weapons.json", { cache: "no-store" });
  weapons = await res.json();

  // Compute min/max damage for scaling bar
  const dmgVals = weapons.map(w => Number(w.damage)).filter(v => Number.isFinite(v));
  if (dmgVals.length) {
    damageMin = Math.min(...dmgVals);
    damageMax = Math.max(...dmgVals);
  } else {
    damageMin = 0;
    damageMax = 100;
  }
}

/* ---- Always fetch the “real” weapon stats from weapons.json ---- */
function canonicalName(name){
  return String(name || "").trim().toLowerCase();
}

function getWeaponByName(name){
  const key = canonicalName(name);
  return weapons.find(w => canonicalName(w.name) === key) || null;
}

/* -------- Image resolver -------- */
function slug(n){
  return n.toLowerCase()
    .replace(/\(b\)/g, "b")
    .replace(/[()]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function imageCandidates(name){
  const baseSlug = slug(name);
  const baseRaw  = name.replace(/\(B\)/g,"").replace(/\(b\)/g,"").trim();
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

function starsHTML(stars){ return "★".repeat(stars || 0); }

/* -------- Damage bar helpers -------- */
function clamp01(x){ return Math.max(0, Math.min(1, x)); }
function damagePct(dmg){
  const v = Number(dmg);
  if (!Number.isFinite(v)) return 0;
  if (damageMax === damageMin) return 1;
  return clamp01((v - damageMin) / (damageMax - damageMin));
}

function ensureDamageBar(){
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
      <div id="damageBarMin">0</div>
      <div id="damageBarMax">100</div>
    </div>
  `;

  const top = document.querySelector(".modalTop");
  if (top && top.parentElement) top.parentElement.insertBefore(barWrap, top.nextSibling);

  barFill = document.getElementById("damageBarFill");
  barVal  = document.getElementById("damageBarValue");
  barMin  = document.getElementById("damageBarMin");
  barMax  = document.getElementById("damageBarMax");
}

/* -------- Inspect modal (ALWAYS uses weapons.json stats) -------- */
function openInspect(anyWeaponObj){
  ensureDamageBar();

  // ✅ Lookup real weapon from JSON by name
  const real = getWeaponByName(anyWeaponObj?.name) || anyWeaponObj;

  inspectModal.classList.add("show");
  inspectModal.setAttribute("aria-hidden","false");

  modalTier.textContent = `Tier ${real.tier ?? "?"}`;
  modalTier.className = `modalTier tier-${real.tier ?? "S"}`;
  modalName.textContent = real.name ?? "Unknown";

  // ✅ Pull from weapons.json (real.damage, real.fireRate)
  const dmg = Number.isFinite(Number(real.damage)) ? Number(real.damage) : null;
  const fr  = real.fireRate ? String(real.fireRate) : null;

  modalStats.textContent =
    `Damage: ${dmg !== null ? dmg : "N/A"} • Fire Rate: ${fr ?? "N/A"}`;

  modalStars.textContent = starsHTML(real.stars || 0);

  // ✅ Update bar with real.damage
  const pct = damagePct(dmg);
  if (barFill) barFill.style.width = `${Math.round(pct * 100)}%`;
  if (barVal)  barVal.textContent = (dmg !== null ? String(dmg) : "N/A");
  if (barMin)  barMin.textContent = String(damageMin);
  if (barMax)  barMax.textContent = String(damageMax);

  // image
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

function closeInspect(){
  inspectModal.classList.remove("show");
  inspectModal.setAttribute("aria-hidden","true");
}

modalClose.addEventListener("click", closeInspect);
modalX.addEventListener("click", closeInspect);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeInspect(); });

/* -------- Cards / Rendering -------- */
function makeCard(w){
  const div = document.createElement("div");
  div.className = `card tier-${w.tier}`;
  div.innerHTML = `
    <div class="cardName">${w.name}</div>
    <div class="cardImgWrap">
      <img alt="${w.name}">
      <div class="missing" style="display:none;"></div>
    </div>
    <div class="cardStars">${starsHTML(w.stars || 0)}</div>
  `;

  const img = div.querySelector("img");
  const miss = div.querySelector(".missing");
  const candidates = imageCandidates(w.name);

  let i = 0;
  const tryNext = () => {
    if (i >= candidates.length) {
      img.style.display = "none";
      miss.style.display = "flex";
      miss.textContent = `MISSING:\n${w.name}`;
      return;
    }
    img.src = candidates[i++];
  };

  img.onerror = tryNext;
  tryNext();

  // ✅ Click uses openInspect which looks up stats in weapons.json
  div.addEventListener("click", () => openInspect(w));
  return div;
}

function renderGrid(targetEl, list){
  targetEl.innerHTML = "";
  list.forEach(w => targetEl.appendChild(makeCard(w)));
}

function pickRandom(list){
  return list[Math.floor(Math.random() * list.length)];
}

/* -------- Tier rules -------- */
function tierConfig(tierName){
  const SA = weapons.filter(w => ["S","A"].includes(w.tier));
  const BF = weapons.filter(w => ["B","F"].includes(w.tier));

  if (tierName === "Test Drops") return { count: 2, mode: "normal", pool: SA, visual: SA };
  if (tierName === "Tier 1")     return { count: 4, mode: "normal", pool: SA, visual: SA };

  // Tier 1.5: mostly BF, small SA
  if (tierName === "Tier 1.5")   return { count: 4, mode: "weighted", SA, BF, pSA: 0.15, visual: BF.concat(SA) };

  // Tier 2: ONLY BF
  if (tierName === "Tier 2")     return { count: 6, mode: "normal", pool: BF, visual: BF };

  if (tierName === "Refill")     return { count: 1, mode: "normal", pool: weapons, visual: weapons };
  return { count: 1, mode: "normal", pool: weapons, visual: weapons };
}

function pickWinner(cfg){
  if (cfg.mode === "weighted") return (Math.random() < cfg.pSA) ? pickRandom(cfg.SA) : pickRandom(cfg.BF);
  return pickRandom(cfg.pool);
}

/* -------- CS:GO roll once -------- */
async function rollOnce(winner, visualPool){
  const PRE = 40, POST = 12;
  const roll = [];

  for(let i=0;i<PRE;i++) roll.push(pickRandom(visualPool));
  roll.push(winner);
  for(let i=0;i<POST;i++) roll.push(pickRandom(visualPool));

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

function addDrop(w){ dropsDiv.appendChild(makeCard(w)); }

/* -------- Filters -------- */
function filterT1(){ return weapons.filter(w => ["S","A"].includes(w.tier)); }
function filterT15(){ return weapons.filter(w => ["B","F"].includes(w.tier)); }
function filterT2(){ return weapons.filter(w => ["B","F"].includes(w.tier)); }
function filterAll(){ return weapons; }

/* -------- Transition helpers -------- */
function setActiveButton(btn){
  [showT1Btn, showT15Btn, showT2Btn, showAllBtn].forEach(b => b?.classList.remove("is-active"));
  btn?.classList.add("is-active");
}

function switchGrid(list, activeBtn){
  if (activeBtn) setActiveButton(activeBtn);
  allWeaponsDiv.classList.add("is-switching");
  setTimeout(() => {
    renderGrid(allWeaponsDiv, list);
    requestAnimationFrame(() => allWeaponsDiv.classList.remove("is-switching"));
  }, 220);
}

/* -------- Button listeners -------- */
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

    setStatus(`Rolling ${i+1}/${count}...`);
    await rollOnce(winner, visualPool);
    addDrop(winner);
  }

  setStatus(`Done! Dropped ${count} weapon(s) from ${tier}.`);
  spinBtn.disabled = false;
});

showT1Btn.addEventListener("click", () => switchGrid(filterT1(), showT1Btn));
showT15Btn.addEventListener("click", () => switchGrid(filterT15(), showT15Btn));
showT2Btn.addEventListener("click", () => switchGrid(filterT2(), showT2Btn));
showAllBtn.addEventListener("click", () => switchGrid(filterAll(), showAllBtn));

searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) return switchGrid(filterAll(), showAllBtn);
  switchGrid(weapons.filter(w => String(w.name).toLowerCase().includes(q)), null);
});

/* -------- Init -------- */
(async function init(){
  await loadWeapons();
  renderGrid(allWeaponsDiv, weapons);
  setActiveButton(showAllBtn);
  setStatus("Ready.");
})();
