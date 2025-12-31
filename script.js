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
  weapons.forEach((w) => container.appendChild(makeCard(w)));
}

function renderDrop(drop) {
  const container = document.getElementById("dropResult");
  if (!container) return;
  container.innerHTML = "";
  drop.forEach((w) => container.appendChild(makeCard(w)));
}

// Pick unique items with weights (higher weight = more likely)
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
    pool.splice(idx, 1); // remove to keep unique
  }

  return picked;
}

// ----- Tier rules -----
function getTierDrop(tierName) {
  let pool = [];
  let count = 1;

  switch (tierName) {
    case "Test Drops":
      pool = allWeapons.filter((w) => w.tier === "S" || w.tier === "A");
      count = 2;
      return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    case "Tier 1":
      // Tier 1: S/A/B, but B is low luck AND MGlock19 is boosted
      pool = allWeapons.filter((w) => ["S", "A", "B"].includes(w.tier));
      count = 4;

      return weightedPickUnique(pool, count, (w) => {
        if (w.name === "MGlock19") return 6; // BOOST MGlock19 (raise to 8/10 if you want more)
        if (w.tier === "B") return 0.6;      // LOW LUCK B
        return 1;                             // normal
      });

    case "Tier 1.5":
      pool = allWeapons.filter((w) => ["F", "B"].includes(w.tier));
      count = 4;
      return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    case "Tier 2":
      pool = [...allWeapons];
      count = 6;
      return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    case "Refill":
      pool = [...allWeapons];
      count = 1;
      return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    default:
      pool = [...allWeapons];
      count = 1;
      return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);
  }
}

// ===== REAL CSGO STYLE SPIN =====
// Lands on first item in the drop under the center marker line
function playCsgoSpin(finalDrop) {
  const track = document.getElementById("spinTrack");
  const wrapper = document.querySelector(".spin-area");

  // If spin area missing, just show results
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

  // Small jitter so it feels more natural
  const jitter = Math.floor(Math.random() * 40) - 20; // -20..+19
  target = Math.max(0, target + jitter);

  track.style.transition = "transform 4.2s cubic-bezier(.08,.85,.12,1)";
  track.style.transform = `translateX(-${target}px)`;

  // Reveal full drop after spin finishes
  setTimeout(() => {
    renderDrop(finalDrop);
  }, 4300);
}

// ----- Load weapons.json (cache bust) -----
function loadWeapons() {
  setStatus("Loading weapons...");
  fetch("weapons.json?" + Date.now())
    .then((res) => res.json())
    .then((data) => {
      allWeapons = data;
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
      const filtered = allWeapons.filter((w) =>
        w.name.toLowerCase().includes(q)
      );
      renderWeapons(filtered);
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  wireUI();
  loadWeapons();
});
