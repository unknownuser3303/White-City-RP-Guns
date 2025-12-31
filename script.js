let allWeapons = [];

// Damage ranges (display only)
const DAMAGE_RANGES = {
  S: "21–24",
  A: "23–26",
  B: "25–28",
  F: "27–36"
};

function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function makeCard(w) {
  const card = document.createElement("div");
  card.className = "weapon-card tier-" + w.tier;

  const dmgRange = DAMAGE_RANGES[w.tier] || "—";

  card.innerHTML = `
    <h3>${escapeHtml(w.name)}</h3>
    <div class="meta">
      Tier: <b>${escapeHtml(w.tier)}</b><br/>
      Damage: ${dmgRange}<br/>
      Fire Rate: ${escapeHtml(w.fireRate)}
    </div>
  `;
  return card;
}

function renderWeapons(weapons) {
  const container = document.getElementById("weapons");
  if (!container) return;
  container.innerHTML = "";
  weapons.forEach(w => container.appendChild(makeCard(w)));
}

function renderDrop(drop) {
  const container = document.getElementById("dropResult");
  if (!container) return;
  container.innerHTML = "";
  drop.forEach(w => container.appendChild(makeCard(w)));
}

// Weighted unique selection (no duplicates)
function weightedPickUnique(items, count, weightFn) {
  const picked = [];
  const pool = [...items];

  while (picked.length < count && pool.length > 0) {
    const weights = pool.map(weightFn);
    const total = weights.reduce((a, b) => a + b, 0);

    let r = Math.random() * total;
    let idx = 0;

    for (; idx < pool.length; idx++) {
      r -= weights[idx];
      if (r <= 0) break;
    }

    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return picked;
}

// ----- Tier rules -----
function getTierDrop(tierName) {
  let pool = [];
  let count = 1;

  switch (tierName) {
    case "Test Drops":
      // 2 guns from S/A
      pool = allWeapons.filter(w => w.tier === "S" || w.tier === "A");
      count = 2;
      return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    case "Tier 1":
      // ✅ NO B guns allowed. ONLY S/A.
      // Boost Glock19 Foregrip only.
      pool = allWeapons.filter(w => w.tier === "S" || w.tier === "A");
      count = 4;

      return weightedPickUnique(pool, count, (w) => {
        if (w.name === "Glock19 Foregrip") return 6; // BOOST ONLY THIS
        return 1;
      });

    case "Tier 1.5":
      // 4 guns from F/B
      pool = allWeapons.filter(w => w.tier === "F" || w.tier === "B");
      count = 4;
      return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    case "Tier 2":
      // 6 guns all tiers
      pool = [...allWeapons];
      count = 6;
      return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    case "Refill":
      // 1 gun all tiers
      pool = [...allWeapons];
      count = 1;
      return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    default:
      pool = [...allWeapons];
      return [...pool].sort(() => 0.5 - Math.random()).slice(0, 1);
  }
}

// ===== CSGO STYLE SPIN =====
function playCsgoSpin(finalDrop) {
  const track = document.getElementById("spinTrack");
  const wrapper = document.querySelector(".spin-area");

  if (!track || !wrapper) {
    renderDrop(finalDrop);
    return;
  }

  const winner = finalDrop[0];
  const preCount = 40;
  const postCount = 10;

  const pre = [...allWeapons].sort(() => 0.5 - Math.random()).slice(0, preCount);
  const post = [...allWeapons].sort(() => 0.5 - Math.random()).slice(0, postCount);
  const roll = [...pre, winner, ...post];

  track.innerHTML = "";
  roll.forEach(w => track.appendChild(makeCard(w)));

  track.style.transition = "none";
  track.style.transform = "translateX(0)";
  track.offsetHeight;

  const cards = track.querySelectorAll(".weapon-card");
  const winnerCard = cards[preCount];

  const centerOffset = (wrapper.clientWidth / 2) - (winnerCard.clientWidth / 2);
  const winnerLeft = winnerCard.offsetLeft;

  let target = winnerLeft - centerOffset;
  target += Math.floor(Math.random() * 40) - 20;
  target = Math.max(0, target);

  track.style.transition = "transform 4.2s cubic-bezier(.08,.85,.12,1)";
  track.style.transform = `translateX(-${target}px)`;

  setTimeout(() => renderDrop(finalDrop), 4300);
}

// ----- Load weapons -----
function loadWeapons() {
  setStatus("Loading weapons...");
  fetch("weapons.json?" + Date.now())
    .then(res => res.json())
    .then(data => {
      allWeapons = data;
      renderWeapons(allWeapons);
      setStatus(`Loaded ${allWeapons.length} weapons.`);
    })
    .catch(err => {
      console.error(err);
      setStatus("Failed to load weapons.json.");
    });
}

// ----- UI -----
function wireUI() {
  const btn = document.getElementById("randomizeBtn");
  const tierSelect = document.getElementById("tierSelect");
  const search = document.getElementById("search");

  if (btn && tierSelect) {
    btn.addEventListener("click", () => {
      if (!allWeapons.length) return;
      const tier = tierSelect.value;
      const drop = getTierDrop(tier);
      playCsgoSpin(drop);
      setStatus(`Dropped ${drop.length} weapon(s) from ${tier}.`);
    });
  }

  if (search) {
    search.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      renderWeapons(allWeapons.filter(w => w.name.toLowerCase().includes(q)));
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  wireUI();
  loadWeapons();
});
