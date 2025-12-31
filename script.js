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

function setStatus(msg){ if(statusEl) statusEl.textContent = msg; }

async function loadWeapons(){
  const res = await fetch("./weapons.json", { cache: "no-store" });
  weapons = await res.json();
}

/* -------- Image resolver (handles your filename mess) -------- */
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

function starsHTML(stars){ return "★".repeat(stars || 0); }

/* -------- Inspect modal -------- */
function openInspect(w){
  inspectModal.classList.add("show");
  inspectModal.setAttribute("aria-hidden","false");

  modalTier.textContent = `Tier ${w.tier}`;
  modalTier.className = `modalTier tier-${w.tier}`;
  modalName.textContent = w.name;

  // if you ever add stats later, it will show; otherwise blank
  const statLine = [];
  if (w.damage != null) statLine.push(`Damage: ${w.damage}`);
  if (w.fireRate) statLine.push(`Fire Rate: ${w.fireRate}`);
  modalStats.textContent = statLine.join(" • ") || " ";

  modalStars.textContent = starsHTML(w.stars || 0);

  const candidates = imageCandidates(w.name);
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

  // click to inspect
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

/* -------- Tier rules --------
   Test Drops: 2 rolls (S+A)
   Tier 1:     4 rolls (S+A)
   Tier 1.5:   4 rolls (B+F)
   Tier 2:     6 rolls (B+F)  ✅ per your request
   Refill:     1 roll  (ALL)
*/
function tierConfig(tierName){
  const SA = weapons.filter(w => ["S","A"].includes(w.tier));
  const BF = weapons.filter(w => ["B","F"].includes(w.tier));

  if (tierName === "Test Drops") return { count: 2, pool: SA, visual: SA };
  if (tierName === "Tier 1")     return { count: 4, pool: SA, visual: SA };
  if (tierName === "Tier 1.5")   return { count: 4, pool: BF, visual: BF };
  if (tierName === "Tier 2")     return { count: 6, pool: BF, visual: BF }; // ✅ ONLY B+F
  if (tierName === "Refill")     return { count: 1, pool: weapons, visual: weapons };
  return { count: 1, pool: weapons, visual: weapons };
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

function addDrop(w){
  dropsDiv.appendChild(makeCard(w));
}

/* -------- Filters -------- */
function filterT1(){ return weapons.filter(w => ["S","A"].includes(w.tier)); }
function filterT15(){ return weapons.filter(w => ["B","F"].includes(w.tier)); }
function filterT2(){ return weapons.filter(w => ["B","F"].includes(w.tier)); } // ✅ ONLY B+F
function filterAll(){ return weapons; }

/* -------- Transition helpers for Show section -------- */
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

  if (!cfg.pool.length) {
    setStatus("weapons.json not loaded or empty.");
    spinBtn.disabled = false;
    return;
  }

  setStatus(`Rolling ${cfg.count} time(s) for ${tier}...`);

  const used = new Set();
  for (let i = 0; i < cfg.count; i++) {
    let winner = pickRandom(cfg.pool);
    let tries = 0;
    while (used.has(winner.name) && tries < 25) {
      winner = pickRandom(cfg.pool);
      tries++;
    }
    used.add(winner.name);

    setStatus(`Rolling ${i+1}/${cfg.count}...`);
    await rollOnce(winner, cfg.visual);
    addDrop(winner);
  }

  setStatus(`Done! Dropped ${cfg.count} weapon(s) from ${tier}.`);
  spinBtn.disabled = false;
});

showT1Btn.addEventListener("click", () => switchGrid(filterT1(), showT1Btn));
showT15Btn.addEventListener("click", () => switchGrid(filterT15(), showT15Btn));
showT2Btn.addEventListener("click", () => switchGrid(filterT2(), showT2Btn));
showAllBtn.addEventListener("click", () => switchGrid(filterAll(), showAllBtn));

searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) return switchGrid(filterAll(), showAllBtn);
  switchGrid(weapons.filter(w => w.name.toLowerCase().includes(q)), null);
});

/* -------- Init -------- */
(async function init(){
  await loadWeapons();
  renderGrid(allWeaponsDiv, weapons);
  setActiveButton(showAllBtn);
  setStatus("Ready.");
})();
