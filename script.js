let allWeapons = [];

ffetch('weapons.json?' + new Date().getTime())
  .then(res => res.json())
  .then(data => {
    allWeapons = data;
    renderWeapons(data);
  });
function renderWeapons(weapons) {
const container = document.getElementById('weapons');
container.innerHTML = '';


weapons.forEach(w => {
const card = document.createElement('div');
card.className = 'weapon-card';
card.innerHTML = `
<h3>${w.name}</h3>
<span>Tier: ${w.tier}</span><br />
<span>Damage: ${w.damage}</span><br />
<span>Fire Rate: ${w.fireRate}</span>
`;
container.appendChild(card);
});
}
const search = document.getElementById('search');
search.addEventListener('input', e => {
const value = e.target.value.toLowerCase();
const filtered = allWeapons.filter(w =>
w.name.toLowerCase().includes(value)
);
renderWeapons(filtered);
});
const randomBtn = document.getElementById('randomBtn');
const randomResult = document.getElementById('randomResult');

randomBtn.addEventListener('click', () => {
  if (allWeapons.length === 0) return; // <-- if empty, nothing happens

  const randomIndex = Math.floor(Math.random() * allWeapons.length);
  const weapon = allWeapons[randomIndex];

  randomResult.innerHTML = `
    <strong>Random Weapon:</strong><br>
    ${weapon.name}<br>
    Tier: ${weapon.tier}<br>
    Damage: ${weapon.damage}<br>
    Fire Rate: ${weapon.fireRate}
  `;
});
const multiRandomBtn = document.getElementById('multiRandomBtn');
const randomCountInput = document.getElementById('randomCount');
const multiRandomResult = document.getElementById('multiRandomResult');

multiRandomBtn.addEventListener('click', () => {
  if (allWeapons.length === 0) return;

  let count = parseInt(randomCountInput.value);
  count = Math.min(count, allWeapons.length);

  // Copy array so we don’t modify original
  const shuffled = [...allWeapons].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  multiRandomResult.innerHTML = '';

  selected.forEach(w => {
    const div = document.createElement('div');
    div.className = 'weapon-card';
    div.innerHTML = `
      <h3>${w.name}</h3>
      <span>Tier: ${w.tier}</span><br>
      <span>Damage: ${w.damage}</span><br>
      <span>Fire Rate: ${w.fireRate}</span>
    `;
    multiRandomResult.appendChild(div);
  });
});



