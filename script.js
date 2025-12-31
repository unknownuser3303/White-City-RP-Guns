const weapons = [
  { n:"1911", t:"A", s:1 },
  { n:"CanikTP9", t:"S", s:2 },
  { n:"Glock45", t:"S", s:2 },
  { n:"Glock19x", t:"S", s:2 },
  { n:"Fn57", t:"A", s:1 },
  { n:"GlockG17Gen5", t:"S", s:2 },
  { n:"Glock19", t:"S", s:2 },
  { n:"Glock43", t:"S", s:2 },
  { n:"Glock23", t:"S", s:2 },
  { n:"G45", t:"A", s:1 },
  { n:"HK45", t:"S", s:2 },
  { n:"Glock19 Foregrip", t:"B", s:4 },
  { n:"OliveGlock17", t:"S", s:2 },
  { n:"OliveGlock19x", t:"S", s:2 },
  { n:"Walther P88", t:"S", s:2 },
  { n:"SigP320", t:"S", s:1 },
  { n:"Glock 19 switch", t:"B", s:4 },
  { n:"Glock43mos", t:"B", s:4 },
  { n:"Glock45MOS", t:"B", s:4 },
  { n:"Glock19Switch", t:"B", s:4 },
  { n:"Fn57 (B)", t:"B", s:4 },
  { n:"Fnx45", t:"B", s:4 },
  { n:"G26 Switch", t:"B", s:4 },
  { n:"G20 Switch", t:"B", s:4 },
  { n:"ArpBinary", t:"F", s:5 },
  { n:"OliveDraco", t:"F", s:5 },
  { n:"Draco", t:"F", s:5 },
  { n:"KrissVector", t:"F", s:5 },
  { n:"MAC10", t:"F", s:4 },
  { n:"SigMCX", t:"F", s:5 }
];

const strip = document.getElementById("strip");
const dropsDiv = document.getElementById("drops");
const status = document.getElementById("status");

function slug(n){
  return n.toLowerCase()
    .replace("(b)","b")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-|-$/g,"");
}

function imgPath(w){
  return `images/weapons/${slug(w.n)}.${w.n.includes("switch") ? "png" : "webp"}`;
}

function card(w){
  return `
    <div class="card tier-${w.t}">
      <div class="cardName">${w.n}</div>
      <img src="${imgPath(w)}">
      <div class="cardStars">${"★".repeat(w.s)}</div>
    </div>
  `;
}

function pick(list,n){
  const a=[...list], o=[];
  while(o.length<n) o.push(a.splice(Math.random()*a.length|0,1)[0]);
  return o;
}

document.getElementById("spinBtn").onclick = async () => {
  strip.innerHTML="";
  dropsDiv.innerHTML="";
  status.textContent="Rolling...";

  const tier = document.getElementById("tierSelect").value;

  let pool = weapons;
  let count = 1;

  if(tier==="Test Drops"){ pool=weapons.filter(w=>w.t==="S"||w.t==="A"); count=2; }
  if(tier==="Tier 1"){ pool=weapons.filter(w=>w.t==="S"||w.t==="A"); count=4; }
  if(tier==="Tier 1.5"){ pool=weapons.filter(w=>w.t==="B"||w.t==="F"); count=4; }
  if(tier==="Tier 2"){ count=6; }

  const drops = pick(pool,count);

  const roll=[];
  for(let i=0;i<40;i++) roll.push(pool[Math.random()*pool.length|0]);
  roll.push(drops[0]);
  for(let i=0;i<12;i++) roll.push(pool[Math.random()*pool.length|0]);

  roll.forEach(w=>strip.insertAdjacentHTML("beforeend",card(w)));

  strip.style.transform="translateX(0)";
  strip.offsetHeight;

  const winner = strip.children[40];
  const center = document.querySelector(".mask").offsetWidth/2;
  const target = winner.offsetLeft + winner.offsetWidth/2 - center;

  strip.style.transform=`translateX(-${target}px)`;

  await new Promise(r=>setTimeout(r,4700));

  drops.forEach(w=>dropsDiv.insertAdjacentHTML("beforeend",card(w)));
  status.textContent=`Dropped ${drops.length} weapon(s)`;
};
