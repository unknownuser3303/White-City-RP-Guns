let allWeapons = [];


fetch('weapons.json')
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
#randomBtn {
  display: block;
  margin: 10px auto;
  padding: 10px 20px;
  font-size: 16px;
  background: #444;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

#randomBtn:hover {
  background: #666;
}

#randomResult {
  text-align: center;
  margin: 15px;
  font-size: 18px;
}

