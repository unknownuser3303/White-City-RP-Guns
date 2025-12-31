const strip = document.getElementById("strip");
const dropsDiv = document.getElementById("drops");
const statusEl = document.getElementById("status");
const tierSelect = document.getElementById("tierSelect");
const spinBtn = document.getElementById("spinBtn");

let weapons = [];

function setStatus(msg){ if(statusEl) statusEl.textContent = msg; }

async function loadWeapons(){
  // if you already use weapons.json, keep it. If not, comment this out.
  try {
    const res = await fetch("./weapons.json", { cache: "no-store" });
    weapons = await res.json();
  } catch {
    // fallback (only if weapons.json not used)
    weapons = [];
  }
}

// ===== filename helpers =====
function slug(n){
  return n.toLowerCase()
    .replace(/\(b\)/g, "b")
    .replace(/[()]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// tries many variants to match your repo filenames
function imageCandidates(name){
  const baseSlug = slug(name);
  const baseRaw  = name.replace(/\(B\)/g,"").replace(/\(b\)/g,"").trim();

  // IMPORTANT: repo folder shown in screenshot is "images/weapons"
  const dir = "./images/weapons/";

  // Common variants seen in your repo screenshot:
  // - Capitalized names
  // - Double extensions .webp.png / .png.png
  // - Switch images maybe png
  const list = [
    `${dir}${baseSlug}.webp`,
    `${dir}${baseSlug}.png`,

    `${dir}${baseSlug}.webp.png`,
    `${dir}${baseSlug}.png.png`,

    `${dir}${baseRaw}.webp`,
    `${dir}${baseRaw}.png`,

    `${dir}${baseRaw}.webp.png`,
    `${dir}${baseRaw}.png.png`,

    // Special cases from your list:
    `${dir}fn57.webp.png`,
    `${dir}fn57.webp`,
    `${dir}fn57.png`,
    `${dir}fn57-b.webp`,
    `${dir}glock-19-switch.png.png`,
    `${dir}glock-19-switch.png`,
  ];

  // remove duplicates
  return [...new Set(list)];
}

function starsHTML(stars){
  return "★".repeat(stars || 0);
}

function makeCard(w){
  const div = document.createElement("div");
  div.className = `card tier-${w.tier || w.t || "S"}`;

  div.innerHTML = `
    <div class="cardName">${w.name || w.n}</div>
    <div class="cardImgWrap">
      <img alt="${w.name || w.n}">
      <div class="missing" style="display:none;">MISSING</div>
    </div>
    <div class="cardStars">${starsHTML(w.stars || w.s)}</div>
  `;

  const img = div.querySelector("img");
  const miss = div.querySelector(".missing");
  const candidates = imageCandidates(w.name || w.n);

  let i = 0;
  const tryNext = () => {
    if (i >= candidates.length) {
      img.style.display = "none";
      miss.style.display = "flex";
      miss.textContent = `MISSING: ${(w.name || w.n)}`;
      return;
    }
    img.src = candidates[i++];
  };

  img.onerror = tryNext;
  tryNext();

  return div;
}

function pickRandom(list){
  return list[Math.floor(Math.random() * list.length)];
}

function getTierConfig(tier){
  const all = weapons;
  const SA = all.filter(w => ["S","A"].includes(w.tier || w.t));
  const BF = all.filter(w => ["B","F"].includes(w.tier || w.t));

  if (tier === "Test Drops") return { count: 2, pool: SA, visual: SA };
  if (tier === "Tier 1") return { count: 4, pool: SA, visual: SA };
  if (tier === "Tier 1.5") return { count: 4, pool: BF, visual: BF };
  if (tier === "Tier 2") return { count: 6, pool: all, visual: all };
  if (tier === "Refill") return { count: 1, pool: all, visual: all };
  return { count: 1, pool: all, visual: all };
}

async function rollOnce(winner, visualPool){
  const PRE=40, POST=12;
  const roll=[];

  for(let i=0;i<PRE;i++) roll.push(pickRandom(visualPool));
  roll.push(winner);
  for(let i=0;i<POST;i++) roll.push(pickRandom(visualPool));

  strip.innerHTML = "";
  roll.forEach(w => strip.appendChild(makeCard(w)));

  // reset
  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";
  strip.offsetHeight;

  const mask = document.querySelector(".mask") || document.querySelector(".stripMask") || document.body;
  const winnerEl = strip.children[PRE];

  const center = mask.clientWidth/2;
  const winnerCenter = winnerEl.offsetLeft + winnerEl.offsetWidth/2;
  const jitter = (Math.random()*40)-20;
  const target = Math.max(0, (winnerCenter - center) + jitter);

  strip.style.transition = "transform 4.6s cubic-bezier(.08,.85,.12,1)";
  strip.style.transform = `translateX(-${target}px)`;

  await new Promise(r => setTimeout(r, 4700));
}

function addDrop(w){
  dropsDiv.appendChild(makeCard(w));
}

spinBtn.onclick = async () => {
  spinBtn.disabled = true;
  dropsDiv.innerHTML = "";

  const tier = tierSelect.value;
  const cfg = getTierConfig(tier);

  if (!cfg.pool.length) {
    setStatus("weapons.json not loaded or empty.");
    spinBtn.disabled = false;
    return;
  }

  for (let i=0; i<cfg.count; i++){
    setStatus(`Rolling ${i+1}/${cfg.count}...`);
    let win = pickRandom(cfg.pool);
    await rollOnce(win, cfg.visual);
    addDrop(win);
  }

  setStatus(`Done! (${cfg.count} roll(s))`);
  spinBtn.disabled = false;
};

(async function init(){
  await loadWeapons();
  setStatus("Ready.");
})();

// add missing style
const style = document.createElement("style");
style.textContent = `
  .missing{
    width:100%;
    height:110px;
    display:flex;
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
