let allWeapons = [];

// Load weapons.json with cache-busting
function loadWeapons() {
  fetch('weapons.json?' + new Date().getTime())
    .then(res => res.json())
    .then(data => {
      allWeapons = data;
      renderWeapons(allWeapons);
    })
    .catch(err => console.error('Error loading weapons.json:', err));
}

// Render all weapons in the list
function renderWeapons(weapons) {
  const container = document.getElementById('weapons');
  container.innerHTML = '';
  weapons.forEach(w => {
    const card = document.createElement('div');
    card.className = 'weapon-card tier-' + w.tier;
    card.innerHTML = `
      <h3>${w.name}</h3>
      <span>Tier: ${w.tier}</span><br>
      <span>Damage: ${w.damage}</span><br>
      <span>Fire Rate: ${w.fireRate}</span>
    `;
    container.appendChild(card);
  });
}

// Get random guns by tier definition
function getRandomGunsByTier(tierName) {
  let pool = [];
  let count = 1;

  switch(tierName) {
    case "Test Drops":
      pool = allWeapons.filter(w => w.tier === "S" || w.tier === "A");
      count = 2;
      break;

    case "Tier 1":
      pool = allWeapons.filter(w => ["S","A","B"].includes(w.tier));
      count = 4;
      break;

    case "Tier 1.5":
      pool = allWeapons.filter(w => ["F","B"].includes(w.tier));
      count = 4;
      break;

    case "Tier 2":
      pool = [...allWeapons]; // all guns
      count = 6;
      break;

    case "Refill":
      pool = [...allWeapons]; // all guns
      count = 1;
      break;

    default:
      pool = [...allWeapons];
  }

  // Shuffle and pick `count` guns
  const shuffled = pool.sort(() => 0.5 - Math.random());

  // Optional: reduce probability for B-tier guns in Tier 1
  if (tierName === "Tier 1") {
    const filteredShuffled = shuffled.filter(w => w.tier !== "B").concat(
      shuffled.filter(w => w.tier === "B").slice(0, 1) // only 1 B-tier max
    );
    return filteredShuffled.slice(0, count);
  }

  return shuffled.slice(0, count);
}

// Handle tier-based randomizer
const tierSelect = document.getElementById('tierSelect');
const spinBtn = document.getElementById('spinBtn');
const spinResult = document.getElementById('spinResult');

spinBtn.addEventListener('click', () => {
  const tier = tierSelect.value;
  const selectedGuns = getRandomGunsByTier(tier);

  spinResult.innerHTML = '';
  selectedGuns.forEach(g => {
    const div = document.createElement('div');
    div.className = 'weapon-card tier-' + g.tier;
    div.innerHTML = `
      <h3>${g.name}</h3>
      <span>Tier: ${g.tier}</span><br>
      <span>Damage: ${g.damage}</span><br>
      <span>Fire Rate: ${g.fireRate}</span>
    `;
    spinResult.appendChild(div);
  });
});

// Old search functionality
const search = document.getElementById('search');
search.addEventListener('input', e => {
  const filtered = allWeapons.filter(w =>
    w.name.toLowerCase().includes(e.target.value.toLowerCase())
  );
  renderWeapons(filtered);
});

// Load weapons on page load
loadWeapons();
