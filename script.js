const strip = document.getElementById("strip");
const dropsDiv = document.getElementById("drops");
const statusEl = document.getElementById("status");
const tierSelect = document.getElementById("tierSelect");
const spinBtn = document.getElementById("spinBtn");

let weapons = [];

function setStatus(msg){ if(statusEl) statusEl.textContent = msg; }

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

async function loadWeapons(){
  const res = await fetch("./weapons.json", { cache: "no-store" });
  weapons = await res.json();
}

function makeCardHTML(w){
  const stars = "★".repeat(w.stars || 0);
  const webp = w.img;
  const png = w.img.replace(/\.webp$/i, ".png");

  return `
    <div class="card tier-${escapeHtml(w.tier)}">
      <div class="cardName">${escapeHtml(w.name)}</div>

      <div class="cardImgWrap">
        <img src="./${escapeHtml(webp)}" data-png="./${escapeHtml(png)}" alt="${escapeHtml(w.name)}">
        <div class="missing" style="display:none;">MISSING<br>${escapeHtml(webp)}</div>
      </div>

      <div class="cardStars">${stars}</div>
    </div>
  `;
}

function wireFallbacks(container){
  container.querySelectorAll("img").forEach(img => {
    img.addEventListener("error", () => {
      const png = img.getAttribute("data-png");
      if (img.src.endsWith(".webp")) {
        img.src = png;
      } else {
        img.style.display = "none";
        const miss = img.parentElement.querySelector(".missing");
        if (miss) miss.style.display = "flex";
      }
    });
  });
}

function pickRandom(list, n){
  const pool=[...list], out=[];
  while(out.length<n && pool.length){
    out.push(pool.splice(Math.floor(Math.random()*pool.length), 1)[0]);
  }
  return out;
}

function getDrops(tier){
  if (tier==="Test Drops") return pickRandom(weapons.filter(w=>["S","A"].includes(w.tier)), 2);
  if (tier==="Tier 1") return pickRandom(weapons.filter(w=>["S","A"].includes(w.tier)), 4);
  if (tier==="Tier 1.5") return pickRandom(weapons.filter(w=>["B","F"].includes(w.tier)), 4);
  if (tier==="Tier 2") return pickRandom(weapons, 6);
  if (tier==="Refill") return pickRandom(weapons, 1);
  return pickRandom(weapons, 1);
}

async function rollOnce(winner, pool){
  const PRE=40, POST=12;
  const roll=[];

  for(let i=0;i<PRE;i++) roll.push(pool[Math.floor(Math.random()*pool.length)]);
  roll.push(winner);
  for(let i=0;i<POST;i++) roll.push(pool[Math.floor(Math.random()*pool.length)]);

  strip.innerHTML = roll.map(makeCardHTML).join("");
  wireFallbacks(strip);

  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";
  strip.offsetHeight;

  const mask = document.querySelector(".mask") || document.body;
  const winnerEl = strip.children[PRE];

  const center = mask.clientWidth/2;
  const winnerCenter = winnerEl.offsetLeft + winnerEl.offsetWidth/2;
  const jitter = (Math.random()*40)-20;
  const target = Math.max(0, (winnerCenter - center) + jitter);

  strip.style.transition = "transform 4.6s cubic-bezier(.08,.85,.12,1)";
  strip.style.transform = `translateX(-${target}px)`;

  await new Promise(r=>setTimeout(r, 4700));
}

spinBtn.onclick = async () => {
  spinBtn.disabled = true;
  dropsDiv.innerHTML = "";
  setStatus("Rolling...");

  const tier = tierSelect.value;
  const drops = getDrops(tier);

  const visualPool =
    (tier==="Tier 1" || tier==="Test Drops") ? weapons.filter(w=>["S","A"].includes(w.tier)) :
    (tier==="Tier 1.5") ? weapons.filter(w=>["B","F"].includes(w.tier)) :
    weapons;

  await rollOnce(drops[0], visualPool);

  dropsDiv.innerHTML = drops.map(makeCardHTML).join("");
  wireFallbacks(dropsDiv);

  setStatus(`Dropped ${drops.length} weapon(s) from ${tier}.`);
  spinBtn.disabled = false;
};

(async function init(){
  await loadWeapons();
  setStatus("Ready.");
})();
