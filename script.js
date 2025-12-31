// ====== EDIT THIS LIST if you want ======
// IMPORTANT: these paths must exist in your repo under /images/weapons/
const weapons = [
  { name: "1911", tier: "A", fireRate: "Low", img: "images/weapons/1911.webp", stars: 1 },
  { name: "CanikTP9", tier: "S", fireRate: "Medium", img: "images/weapons/CanikTP9.webp", stars: 2 },
  { name: "Glock45", tier: "S", fireRate: "Medium", img: "images/weapons/Glock45.webp", stars: 2 },
  { name: "Glock19x", tier: "S", fireRate: "Medium", img: "images/weapons/Glock19x.webp", stars: 2 },
  { name: "Fn57", tier: "A", fireRate: "High", img: "images/weapons/Fn57.png", stars: 1 },
  { name: "GlockG17Gen5", tier: "S", fireRate: "Medium", img: "images/weapons/GlockG17Gen5.webp", stars: 2 },
  { name: "Glock19", tier: "S", fireRate: "Medium", img: "images/weapons/Glock19.webp", stars: 2 },
  { name: "Glock43", tier: "S", fireRate: "Low", img: "images/weapons/Glock43.webp", stars: 2 },
  { name: "Glock23", tier: "S", fireRate: "Medium", img: "images/weapons/Glock23.webp", stars: 2 },
  { name: "G45", tier: "A", fireRate: "Medium", img: "images/weapons/G45.webp", stars: 1 },

  { name: "HK45", tier: "S", fireRate: "Low", img: "images/weapons/HK45.webp", stars: 2 },
  { name: "Glock19 Foregrip", tier: "B", fireRate: "Medium", img: "images/weapons/Glock19 Foregrip.webp", stars: 4 },
  { name: "OliveGlock17", tier: "S", fireRate: "Medium", img: "images/weapons/OliveGlock17.webp", stars: 2 },
  { name: "OliveGlock19x", tier: "S", fireRate: "Medium", img: "images/weapons/OliveGlock19x.webp", stars: 2 },
  { name: "Walther P88", tier: "S", fireRate: "Medium", img: "images/weapons/Walther P88.webp", stars: 2 },
  { name: "SigP320", tier: "S", fireRate: "Medium", img: "images/weapons/SigP320.webp", stars: 1 },

  { name: "Glock 19 switch", tier: "B", fireRate: "Very High", img: "images/weapons/Glock 19 switch.png", stars: 4 },
  { name: "Glock43mos", tier: "B", fireRate: "Low", img: "images/weapons/Glock43mos.webp", stars: 4 },
  { name: "Glock45MOS", tier: "B", fireRate: "Medium", img: "images/weapons/Glock45MOS.webp", stars: 4 },
  { name: "Glock19Switch", tier: "B", fireRate: "Very High", img: "images/weapons/Glock19Switch.webp", stars: 4 },

  { name: "Fn57 (B)", tier: "B", fireRate: "High", img: "images/weapons/Fn57 (B).webp", stars: 4 },
  { name: "Fnx45", tier: "B", fireRate: "Medium", img: "images/weapons/Fnx45.webp", stars: 4 },
  { name: "G26 Switch", tier: "B", fireRate: "Very High", img: "images/weapons/G26 Switch.webp", stars: 4 },
  { name: "G20 Switch", tier: "B", fireRate: "Very High", img: "images/weapons/G20 Switch.webp", stars: 4 },

  { name: "ArpBinary", tier: "F", fireRate: "Very High", img: "images/weapons/ArpBinary.webp", stars: 5 },
  { name: "OliveDraco", tier: "F", fireRate: "High", img: "images/weapons/OliveDraco.webp", stars: 5 },
  { name: "Draco", tier: "F", fireRate: "High", img: "images/weapons/Draco.webp", stars: 5 },
  { name: "KrissVector", tier: "F", fireRate: "Very High", img: "images/weapons/KrissVector.webp", stars: 5 },
  { name: "MAC10", tier: "F", fireRate: "Very High", img: "images/weapons/MAC10.webp", stars: 4 },
  { name: "SigMCX", tier: "F", fireRate: "High", img: "images/weapons/SigMCX.webp", stars: 5 }
];

const $ = (id) => document.getElementById(id);

function setStatus(msg) { $("status").textContent = msg; }

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function makeCard(w, extraClass = "") {
  const div = document.createElement("div");
  div.className = `card tier-${w.tier} ${extraClass}`.trim();

  div.innerHTML = `
    <div class="cardName">${escapeHtml(w.name)}</div>
    <div class="cardImgWrap">
      <img src="${escapeHtml(w.img)}" alt="${escapeHtml(w.name)}">
    </div>
    <div class="cardStars">${"★".repeat(w.stars || 0)}</div>
  `;
  return div;
}

function renderAll(list) {
  const root = $("allWeapons");
  root.innerHTML = "";
  list.forEach(w => root.appendChild(makeCard(w, "dropCard")));
}

function renderDrops(list) {
  const root = $("drops");
  root.innerHTML = "";
  list.forEach(w => root.appendChild(makeCard(w, "dropCard")));
}

// ===== Tier Rules (edit if you want) =====
function pickRandomFrom(list, n) {
  const pool = [...list];
  const out = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

function getDropList(tierName) {
  // You can change these rules anytime
  if (tierName === "Test Drops") {
    return pickRandomFrom(weapons.filter(w => ["S","A"].includes(w.tier)), 2);
  }
  if (tierName === "Tier 1") {
    // 4 drops from S/A only
    return pickRandomFrom(weapons.filter(w => ["S","A"].includes(w.tier)), 4);
  }
  if (tierName === "Tier 1.5") {
    return pickRandomFrom(weapons.filter(w => ["F","B"].includes(w.tier)), 4);
  }
  if (tierName === "Tier 2") {
    return pickRandomFrom(weapons, 6);
  }
  if (tierName === "Refill") {
    return pickRandomFrom(weapons, 1);
  }
  return pickRandomFrom(weapons, 1);
}

// ===== REAL CS:GO ROLL =====
// Builds a long strip of items and animates translateX until the WINNER is under the center marker.
function csgoRollOnce(winner, poolForVisual) {
  const strip = $("strip");
  const mask = document.querySelector(".stripMask");

  // How many items in strip
  const PRE = 40;   // items before winner
  const POST = 12;  // items after winner
  const TOTAL = PRE + 1 + POST;

  // Build strip list
  const rollItems = [];
  for (let i = 0; i < PRE; i++) {
    rollItems.push(poolForVisual[Math.floor(Math.random() * poolForVisual.length)]);
  }
  rollItems.push(winner);
  for (let i = 0; i < POST; i++) {
    rollItems.push(poolForVisual[Math.floor(Math.random() * poolForVisual.length)]);
  }

  // Render
  strip.innerHTML = "";
  rollItems.forEach(w => strip.appendChild(makeCard(w)));

  // Reset transform instantly
  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";
  strip.offsetHeight; // force reflow

  // Find winner card position
  const cards = strip.querySelectorAll(".card");
  const winnerCard = cards[PRE];

  const maskCenter = mask.clientWidth / 2;
  const winnerCenter = winnerCard.offsetLeft + (winnerCard.clientWidth / 2);

  // Target translateX so winnerCenter lines up with maskCenter (+ little jitter like CS:GO)
  const jitter = (Math.random() * 40) - 20; // -20..+20
  const target = Math.max(0, (winnerCenter - maskCenter) + jitter);

  // Animate (CS:GO-ish easing)
  strip.style.transition = "transform 4.6s cubic-bezier(.08,.85,.12,1)";
  strip.style.transform = `translateX(-${target}px)`;

  return new Promise((resolve) => setTimeout(resolve, 4700));
}

// ===== Wire UI =====
function init() {
  renderAll(weapons);

  $("search").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return renderAll(weapons);
    renderAll(weapons.filter(w => w.name.toLowerCase().includes(q)));
  });

  $("randomizeBtn").addEventListener("click", async () => {
    const btn = $("randomizeBtn");
    btn.disabled = true;

    const tierName = $("tierSelect").value;
    setStatus(`Rolling: ${tierName}...`);

    // Choose your drops based on tier rules
    const drops = getDropList(tierName);

    // Pool used for visuals (so roll looks correct to chosen tier)
    const visualPool = (() => {
      if (tierName === "Tier 1") return weapons.filter(w => ["S","A"].includes(w.tier));
      if (tierName === "Test Drops") return weapons.filter(w => ["S","A"].includes(w.tier));
      if (tierName === "Tier 1.5") return weapons.filter(w => ["F","B"].includes(w.tier));
      return weapons;
    })();

    // Roll animation lands on FIRST drop (winner). Then show all drops.
    await csgoRollOnce(drops[0], visualPool);

    renderDrops(drops);
    setStatus(`Dropped ${drops.length} weapon(s) from ${tierName}.`);
    btn.disabled = false;
  });

  setStatus("Ready.");
}

window.addEventListener("DOMContentLoaded", init);
