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
const statusEl = document.getElementById("status");
const tierSelect = document.getElementById("tierSelect");
const spinBtn = document.getElementById("spinBtn");

function setStatus(msg){ if(statusEl) statusEl.textContent = msg; }

// name -> safe filename
function slug(n){
  return n.toLowerCase()
    .replace(/\(b\)/g, "b")     // (B) -> b
    .replace(/[()]/g, "")       // remove parentheses
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// IMPORTANT: ./ makes it work even if your site is in a subfolder
function imgBase(w){
  // Fn57 (B) should be fn57-b
  if (w.n === "Fn57 (B)") return "fn57-b";
  return slug(w.n);
}

function makeCardHTML(w){
  const base = imgBase(w);
  const stars = "★".repeat(w.s || 0);

  // Try WEBP first. If it fails, JS swaps to PNG automatically.
  // If PNG fails too, it shows a visible "MISSING" label.
  return `
    <div class="card tier-${w.t}">
      <div class="cardName">${w.n}</div>

      <div class="cardImgWrap">
        <img
          src="./images/weapons/${base}.webp"
          data-webp="./images/weapons/${base}.webp"
          data-png="./images/weapons/${base}.png"
          alt="${w.n}"
          loading="lazy"
        />
        <div class="missing" style="display:none;">MISSING: ${base}</div>
      </div>

      <div class="cardStars">${stars}</div>
    </div>
  `;
}

function wireImageFallbacks(container){
  const imgs = container.querySelectorAll("img");
  imgs.forEach(img => {
    img.addEventListener("error", () => {
      const webp = img.getAttribute("data-webp");
      const png  = img.getAttribute("data-png");

      // If webp failed, try png
      if (img.src.endsWith(".webp")) {
        img.src = png;
        return;
      }

      // If png failed too, show missing label
      const wrap = img.parentElement;
      img.style.display = "none";
      const missing = wrap.querySelector(".missing");
      if (missing) missing.style.display = "flex";
    });
  });
}

function pick(list,n){
  const a=[...list], o=[];
  while(o.length<n && a.length){
    o.push(a.splice(Math.random()*a.length|0,1)[0]);
  }
  return o;
}

async function rollOnce(winner, visualPool){
  const PRE = 40, POST = 12;

  const roll=[];
  for(let i=0;i<PRE;i++) roll.push(visualPool[Math.random()*visualPool.length|0]);
  roll.push(winner);
  for(let i=0;i<POST;i++) roll.push(visualPool[Math.random()*visualPool.length|0]);

  strip.innerHTML = roll.map(makeCardHTML).join("");
  wireImageFallbacks(strip);

  // reset
  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";
  strip.offsetHeight;

  // find winner card and compute center
  const winnerEl = strip.children[PRE];
  const mask = document.querySelector(".mask") || document.querySelector(".stripMask") || document.body;
  const center = mask.clientWidth / 2;

  const winnerCenter = winnerEl.offsetLeft + winnerEl.offsetWidth / 2;
  const jitter = (Math.random()*40)-20;
  const target = Math.max(0, (winnerCenter - center) + jitter);

  strip.style.transition = "transform 4.6s cubic-bezier(.08,.85,.12,1)";
  strip.style.transform = `translateX(-${target}px)`;

  await new Promise(r=>setTimeout(r,4700));
}

function getDropList(tierName){
  if(tierName==="Test Drops") return pick(weapons.filter(w=>["S","A"].includes(w.t)),2);
  if(tierName==="Tier 1")    return pick(weapons.filter(w=>["S","A"].includes(w.t)),4);
  if(tierName==="Tier 1.5")  return pick(weapons.filter(w=>["B","F"].includes(w.t)),4);
  if(tierName==="Tier 2")    return pick(weapons,6);
  if(tierName==="Refill")    return pick(weapons,1);
  return pick(weapons,1);
}

spinBtn.onclick = async () => {
  dropsDiv.innerHTML = "";
  setStatus("Rolling...");

  const tier = tierSelect.value;
  const drops = getDropList(tier);

  const visualPool =
    (tier==="Tier 1" || tier==="Test Drops") ? weapons.filter(w=>["S","A"].includes(w.t)) :
    (tier==="Tier 1.5") ? weapons.filter(w=>["B","F"].includes(w.t)) :
    weapons;

  spinBtn.disabled = true;
  await rollOnce(drops[0], visualPool);

  dropsDiv.innerHTML = drops.map(makeCardHTML).join("");
  wireImageFallbacks(dropsDiv);

  setStatus(`Dropped ${drops.length} weapon(s) from ${tier}.`);
  spinBtn.disabled = false;
};

// OPTIONAL: show missing-box styling nicely
const style = document.createElement("style");
style.textContent = `
  .missing{
    width:100%;
    height:110px;
    align-items:center;
    justify-content:center;
    color:#fff;
    font-size:12px;
    text-align:center;
    padding:10px;
    background: rgba(0,0,0,.35);
    border: 1px dashed rgba(255,255,255,.35);
    border-radius: 10px;
  }
`;
document.head.appendChild(style);

setStatus("Ready.");
