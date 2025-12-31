let allWeapons = [];

// Tier damage ranges
const DAMAGE_RANGES = {
  S: [21, 24],
  A: [23, 26],
  B: [25, 28],
  F: [27, 36],
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
  card.innerHTML = `
    <h3>${escapeHtml(w.name)}</h3>
    <div class="meta">
      Tier: <b>${escapeHtml(w.tier)}</b><br/>
      Damage: ${escapeHtml(String(w.damage))}<br/>
      Fire Rate: ${escapeHtml(w.fireRate)}
    </div>
  `;
  return card;
}

function renderWeapons(weapons) {
  const container = document.getElementById("weapons");
  if (!container) return;
  container.innerHTML = "";
  weapons.forEach((w) => container.appendChild(makeCard(w)));
}

function renderDrop(drop) {
  const container = document.getElementById("dropResult");
  if (!container) return;
  container.innerHTML = "";
  drop.forEach((w) => container.appendChild(makeCard(w)));
}

// Apply tier damage ranges ONCE per page load
function applyTierDamages(weapons) {
  return weapons.map(w => {
    const range = DAMAGE_RANGES[w.tier] || [20, 30];
    return {
      ...w,
      damage: randInt(range[0], range[1])
    };
  });
}

// ----- Tier rules -----
function getTierDrop(tierName) {
  let pool = [];
  let count = 1;

  switch (tierName) {
    case "Test Drops":
      pool = allWeapons.filter((w) => w.tier === "S" || w.tier === "A");
      count = 2;
      break;

    case "Tier 1":
      pool = allWeapons.filter((w) => ["S", "A", "B"].includes(w.tier));
      count = 4;
      break;

    case "Tier 1.5":
      pool = allWeapons.filter((w) => ["F", "B"].includes(w.tier));
      count = 4;
      break;

    case "Tier 2":
      pool = [...allWeapons];
      count = 6;
      break;

    case "Refill":
      pool = [...allWeapons];
      count = 1;
      break;

    default:
      pool = [...allWeapons];
      count = 1;
  }

  const shuffled = [...pool].sort(() => 0.5 - Math.random());

  // Tier 1: B is low luck -> max 1 B
  if (tierName === "Tier 1") {
    const nonB = shuffled.filter((w) => w.tier !== "B");
    const bOnly = shuffled.filter((w) => w.tier === "B");
    const combined = nonB.concat(bOnly.slice(0, 1));
    return combined.slice(0, count);
  }

  return shuffled.slice(0, count);
}

// ===== REAL CSGO STYLE SPIN =====
function playCsgoSpin(finalDrop) {
  const track = document.getElementById("spinTrack");
  const wrapper = document.querySelector(".spin-area");
  if (!track || !wrapper) {
    renderDrop(finalDrop);
    return;
  }

  // Winner = first item in the drop
  const winner = finalDrop[0];

  const preCount = 40;
  const postCount = 10;

  const pre = [...allWeapons].sort(() => 0.5 - Math.random()).slice(0, preCount);
  const post = [...allWeapons].sort(() => 0.5 - Math.random()).slice(0, postCount);

  const roll = [...pre, winner, ...post];

  track.innerHTML = "";
  roll.forEach((w) => track.appendChild(makeCard(w)));

  // Reset
  track.style.transition = "none";
  track.style.transform = "translateX(0)";
  track.offsetHeight;

  const cards = track.querySelectorAll(".weapon-card");
  const winnerIndex = preCount;
  const winnerCard = cards[winnerIndex];

  const centerOffset = (wrapper.clientWidth / 2) - (winnerCard.clientWidth / 2);
  const winnerLeft = winnerCard.offsetLeft;

  let target = winnerLeft - centerOffset;

  // jitter
  const jitter = Math.floor(Math.random() * 40) - 20;
  target = Math.max(0, target + jitter);

  track.style.transition = "transform 4.2s cubic-bezier(.08,.85,.12,1)";
  track.style.transform = `translateX(-${target}px)`;

  setTimeout(() => {
    renderDrop(finalDrop);
  }, 4300);
}

// ----- Load weapons.json (cache busted) -----
function loadWeapons() {
  setStatus("Loading weapons...");
  fetch("weapons.json?" + Date.now())
    .then((res) => res.json())
    .then((data) => {
      // apply tier-based damage ranges once
      allWeapons = applyTierDamages(data);

      renderWeapons(allWeapons);
      setStatus(`Loaded ${allWeapons.length} weapons.`);
    })
    .catch((err) => {
      console.error(err);
      setStatus("Failed to load weapons.json (check JSON).");
    });
}

// ----- UI wiring -----
function wireUI() {
  const btn = document.getElementById("randomizeBtn");
  const tierSelect = document.getElementById("tierSelect");
  const search = document.getElementById("search");

  if (btn && tierSelect) {
    btn.addEventListener("click", () => {
      if (!allWeapons.length) {
        setStatus("Weapons not loaded yet.");
        return;
      }
      const tier = tierSelect.value;
      const drop = getTierDrop(tier);

      playCsgoSpin(drop);
      setStatus(`Dropped ${drop.length} weapon(s) from ${tier}.`);
    });
  }

  if (search) {
    search.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = allWeapons.filter((w) => w.name.toLowerCase().includes(q));
      renderWeapons(filtered);
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  wireUI();
  loadWeapons();
});
