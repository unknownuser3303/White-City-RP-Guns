let allWeapons = [];

// Always fetch latest JSON from GitHub Pages
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
      setStatus("Failed to load weapons.json (check JSON + file name).");
    });
}

function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}

function renderWeapons(weapons) {
  const container = document.getElementById("weapons");
  if (!container) return;
  container.innerHTML = "";
  weapons.forEach((w) => container.appendChild(makeCard(w)));
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

// ---- Tier drop rules ----
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

  // Tier 1: low luck B (max 1 B)
  if (tierName === "Tier 1") {
    const nonB = shuffled.filter((w) => w.tier !== "B");
    const bOnly = shuffled.filter((w) => w.tier === "B");
    const combined = nonB.concat(bOnly.slice(0, 1));
    return combined.slice(0, count);
  }

  return shuffled.slice(0, count);
}

function renderDrop(drop) {
  const container = document.getElementById("dropResult");
  if (!container) return;
  container.innerHTML = "";
  drop.forEach((w) => container.appendChild(makeCard(w)));
}

// ---- Spin animation ----
function playSpinAnimation(finalDrop) {
  const track = document.getElementById("spinTrack");
  const wrapper = track ? track.parentElement : null;

  // If spin area not in HTML, just show results normally
  if (!track || !wrapper) {
    renderDrop(finalDrop);
    return;
  }

  track.innerHTML = "";

  // Fake scroll items
  const fakePool = [...allWeapons].sort(() => 0.5 - Math.random()).slice(0, 20);
  fakePool.forEach((w) => track.appendChild(makeCard(w)));

  // Add the final drop at the end so it "lands" on them
  finalDrop.forEach((w) => track.appendChild(makeCard(w)));

  // Reset position
  track.style.transition = "none";
  track.style.transform = "translateX(0)";
  track.offsetHeight; // force reflow

  // Animate across
  track.style.transition = "transform 2.6s cubic-bezier(.12,.75,.18,1)";
  const shift = track.scrollWidth - wrapper.clientWidth;
  track.style.transform = `translateX(-${Math.max(0, shift)}px)`;

  setTimeout(() => renderDrop(finalDrop), 2700);
}

// ---- UI wiring ----
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
      playSpinAnimation(drop);
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

// Simple HTML escape
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

// Start AFTER page loads
window.addEventListener("DOMContentLoaded", () => {
  wireUI();
  loadWeapons();
});
