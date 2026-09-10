/* =====================================================
   DEN ENDELØSE LANDEVEI – steg 1: kast terningene
   -----------------------------------------------------
   Kaster fem terninger (1–6) og viser dem visuelt med
   vanlig prikkmønster. Verdiene ligger i den globale
   variabelen `terningverdier`, klar for steg 2, hvor en
   knapp skal foreslå en løsning for ett og ett tall ved
   hjelp av de fire regneartene og potensregning.
===================================================== */

const ANTALL_TERNINGER = 5;

// Standard prikkmønster for terningøyne 1–6, som en 3×3-rute
// (radvis fra øverst til venstre): 1 = prikk, 0 = tomt.
const PRIKKMONSTER = {
  1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  2: [1, 0, 0, 0, 0, 0, 0, 0, 1],
  3: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
  5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  6: [1, 0, 1, 1, 0, 1, 1, 0, 1],
};

// De gjeldende terningverdiene. Eksponert på toppnivå slik at
// steg 2 (løsningsknappen) kan lese dem direkte.
let terningverdier = [];

/* -----------------------------------------------------
   1. HJELPEFUNKSJONER
----------------------------------------------------- */

function tilfeldigHeltall(min, maks) {
  return Math.floor(Math.random() * (maks - min + 1)) + min;
}

function tilfeldigTerningverdi() {
  return tilfeldigHeltall(1, 6);
}

function nyeTerningkast() {
  return Array.from({ length: ANTALL_TERNINGER }, tilfeldigTerningverdi);
}

/* -----------------------------------------------------
   2. VISNING
----------------------------------------------------- */

function byggTerningVisning(verdi) {
  const terning = document.createElement("div");
  terning.className = "terning";
  terning.setAttribute("role", "img");
  terning.setAttribute("aria-label", `Terning som viser ${verdi}`);

  const monster = PRIKKMONSTER[verdi];
  for (let i = 0; i < 9; i++) {
    const prikk = document.createElement("span");
    prikk.className = "prikk" + (monster[i] ? " aktiv" : "");
    terning.appendChild(prikk);
  }
  return terning;
}

function tegnTerningverdier(verdier) {
  const rad = document.getElementById("terningRad");
  rad.innerHTML = "";
  verdier.forEach((verdi) => rad.appendChild(byggTerningVisning(verdi)));
}

function renderTerninger() {
  tegnTerningverdier(terningverdier);

  const tekstEl = document.getElementById("terningTekst");
  tekstEl.textContent = `Tallene dine: ${terningverdier.join(", ")}`;
}

/* -----------------------------------------------------
   3. KAST TERNINGENE (med et lite "rulle"-flimmer)
----------------------------------------------------- */

function kastTerninger() {
  const reduserBevegelse = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sluttverdier = nyeTerningkast();

  if (reduserBevegelse) {
    terningverdier = sluttverdier;
    renderTerninger();
    return;
  }

  document.getElementById("kastBtn").disabled = true;

  let flimmerTeller = 0;
  const antallFlimmer = 6;

  const intervall = setInterval(() => {
    flimmerTeller += 1;
    tegnTerningverdier(nyeTerningkast());
    document.querySelectorAll(".terning").forEach((el) => el.classList.add("ruller"));

    if (flimmerTeller >= antallFlimmer) {
      clearInterval(intervall);
      terningverdier = sluttverdier;
      renderTerninger();
      document.getElementById("kastBtn").disabled = false;
    }
  }, 70);
}

/* -----------------------------------------------------
   4. OPPSTART
----------------------------------------------------- */

function settOppKnapper() {
  document.getElementById("kastBtn").addEventListener("click", kastTerninger);
}

function initSpill() {
  settOppKnapper();
  kastTerninger();
}

document.addEventListener("DOMContentLoaded", initSpill);
