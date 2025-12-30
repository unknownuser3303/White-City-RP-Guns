let allWeapons = [];

// Fetch weapons.json with cache-busting
function loadWeapons() {
  fetch('weapons.json?' + new Date().getTime())
    .then(res => res.json())
    .then(data => {
      allWeapons = data;
      renderWeapons(data);
    })
    .catch(err => console.error('Error loading weapons.json:', err));
}

// Render weapon cards
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

// Single random weapon
const randomBtn = document.getElementById('randomBtn');
const randomResult = document.getElementById('randomResult');

randomBtn.addEventListener('click', () => {
  if (!allWeapons.length) return;
  const weapon = allWeapons[Math.floor(Math.random() * allWeapons.length)];
  randomResult.innerHTML = `
    <div class="weapon-card tier-${weapon.tier}">
      <h3>${weapon.name}</h3>
      <span>Tier: ${weapon.tier}</span><br>
      <span>Damage: ${weapon.damage}</span><br>
      <span>Fire Rate: ${weapon.fireRate}</span>
    </div>
  `;
});

// Multi-random
const multiRandomBtn = document.getElementById('multiRandomBtn');
const randomCountInput = document.getElementById('randomCount');
const multiRandomResult = document.getElementById('multiRandomResult');

multiRandomBtn.addEventListener('click', () => {
  if (!allWeapons.length) return;
  let count = Math.min(parseInt(randomCountInput.value), allWeapons.length);
  const shuffled = [...allWeapons].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);
  multiRandomResult.innerHTML = '';
  selected.forEach(w => {
    const div = document.createElement('div');
    div.className = 'weapon-card tier-' + w.tier;
    div.innerHTML = `
      <h3>${w.name}</h3>
      <span>Tier: ${w.tier}</span><br>
      <span>Damage: ${w.damage}</span><br>
      <span>Fire Rate: ${w.fireRate}</span>
    `;
    multiRandomResult.appendChild(div);
  });
});

// Search filter
const search = document.getElementById('search');
search.addEventListener('input', e => {
  const filtered = allWeapons.filter(w =>
    w.name.toLowerCase().includes(e.target.value.toLowerCase())
  );
  renderWeapons(filtered);
});

// Load weapons on page load
loadWeapons();
