/* =====================================================
   DEN ENDELØSE LANDEVEI – steg 1 og 2
   -----------------------------------------------------
   Steg 1: Kaster fem terninger (1–6) og viser dem visuelt
   med vanlig prikkmønster.

   Steg 2: En knapp søker gjennom alle måter å kombinere et
   utvalg av de fem terningverdiene (hver brukt høyst én
   gang) med de fire regneartene og potens, og viser en
   løsning for tallrekken 1, 2, 3, … helt til ingen løsning
   finnes.
===================================================== */

const STANDARD_ANTALL_TERNINGER = 5;
let antallTerninger = STANDARD_ANTALL_TERNINGER;

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
  return Array.from({ length: antallTerninger }, tilfeldigTerningverdi);
}

// Endrer hvor mange terninger som brukes, og kaster umiddelbart på
// nytt siden et endret antall gjør det forrige kastet ugyldig.
function settAntallTerninger(nytt) {
  if (nytt === antallTerninger) return;
  antallTerninger = nytt;

  document.querySelectorAll(".terningvalg-knapp").forEach((knapp) => {
    knapp.classList.toggle("active", Number(knapp.dataset.antall) === antallTerninger);
  });

  kastTerninger();
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
   3. LØSERSØK (steg 2)
   -----------------------------------------------------
   Prøver å finne et regneuttrykk som er lik måltallet.
   Går gjennom antall terninger i stigende rekkefølge:
   først alle par (2 terninger), så alle trillinger (3),
   så 4, og til slutt alle 5 – og bruker alltid den første
   (enkleste) løsningen som blir funnet. Et "utvalg" på
   størrelse k kombineres alltid helt ned til ett tall, slik
   at akkurat k terninger inngår i uttrykket – aldri færre.
----------------------------------------------------- */

const MAKS_MELLOMVERDI = 100000;

function pakkUttrykk(element) {
  return element.enkel ? element.uttrykk : `(${element.uttrykk})`;
}

// Finner alle gyldige enkeltoperasjoner mellom to elementer.
// Både a-b/b-a og a÷b/b÷a prøves siden rekkefølgen betyr noe.
function beregnMuligheter(a, b) {
  const muligheter = [];
  const A = pakkUttrykk(a);
  const B = pakkUttrykk(b);

  muligheter.push({ verdi: a.verdi + b.verdi, uttrykk: `${A} + ${B}`, enkel: false });

  const produkt = a.verdi * b.verdi;
  if (produkt <= MAKS_MELLOMVERDI) {
    muligheter.push({ verdi: produkt, uttrykk: `${A} × ${B}`, enkel: false });
  }

  if (a.verdi > b.verdi) {
    muligheter.push({ verdi: a.verdi - b.verdi, uttrykk: `${A} − ${B}`, enkel: false });
  } else if (b.verdi > a.verdi) {
    muligheter.push({ verdi: b.verdi - a.verdi, uttrykk: `${B} − ${A}`, enkel: false });
  }

  if (a.verdi % b.verdi === 0 && a.verdi / b.verdi !== a.verdi) {
    muligheter.push({ verdi: a.verdi / b.verdi, uttrykk: `${A} ÷ ${B}`, enkel: false });
  }
  if (b.verdi % a.verdi === 0 && b.verdi / a.verdi !== b.verdi) {
    muligheter.push({ verdi: b.verdi / a.verdi, uttrykk: `${B} ÷ ${A}`, enkel: false });
  }

  if (b.verdi >= 2 && b.verdi <= 6) {
    const p1 = Math.pow(a.verdi, b.verdi);
    if (p1 <= MAKS_MELLOMVERDI && p1 !== a.verdi) {
      muligheter.push({ verdi: p1, uttrykk: `${A}^${B}`, enkel: false });
    }
  }
  if (a.verdi >= 2 && a.verdi <= 6) {
    const p2 = Math.pow(b.verdi, a.verdi);
    if (p2 <= MAKS_MELLOMVERDI && p2 !== b.verdi) {
      muligheter.push({ verdi: p2, uttrykk: `${B}^${A}`, enkel: false });
    }
  }

  return muligheter;
}

// Alle måter å velge ut k elementer fra arr på (uten hensyn til rekkefølge).
function kombinasjoner(arr, k) {
  const resultat = [];
  function velg(start, valgt) {
    if (valgt.length === k) {
      resultat.push([...valgt]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      valgt.push(arr[i]);
      velg(i + 1, valgt);
      valgt.pop();
    }
  }
  velg(0, []);
  return resultat;
}

// Prøver å kombinere HELE listen (alle elementene) ned til ett tall som
// er lik "mal". Siden alle elementene må være med i den ene resterende
// verdien til slutt, bruker et funnet uttrykk nøyaktig så mange
// terninger som listen inneholdt fra start.
function kombinerAlt(liste, mal) {
  if (liste.length === 1) {
    return liste[0].verdi === mal ? liste[0].uttrykk : null;
  }

  for (let i = 0; i < liste.length; i++) {
    for (let j = i + 1; j < liste.length; j++) {
      const rest = liste.filter((_, idx) => idx !== i && idx !== j);
      const muligheter = beregnMuligheter(liste[i], liste[j]);
      for (const m of muligheter) {
        const funnet = kombinerAlt([...rest, m], mal);
        if (funnet) return funnet;
      }
    }
  }
  return null;
}

// Prøver å finne et uttrykk lik "mal", og forsøker først med 2
// terninger, så 3, så 4, så alle 5 – og returnerer det første
// (enkleste) uttrykket som blir funnet, eller null hvis ingenting
// virker selv med alle fem terningene.
function finnLosning(tall, mal) {
  for (let k = 2; k <= tall.length; k++) {
    for (const delmengde of kombinasjoner(tall, k)) {
      const startListe = delmengde.map((v) => ({ verdi: v, uttrykk: String(v), enkel: true }));
      const funnet = kombinerAlt(startListe, mal);
      if (funnet) return funnet;
    }
  }
  return null;
}

/* -----------------------------------------------------
   4. LANDEVEIEN – tallrekken og løsningsknappen
----------------------------------------------------- */

let gjeldendeMaal = 1;
let veiHistorikk = [];
let veiStoppet = false;

function nullstillVeien() {
  gjeldendeMaal = 1;
  veiHistorikk = [];
  veiStoppet = false;
}

function renderVeiHistorikk() {
  const listeEl = document.getElementById("veiHistorikk");
  listeEl.innerHTML = "";
  veiHistorikk.forEach(({ tall, uttrykk }) => {
    const linje = document.createElement("p");
    linje.className = "vei-linje";
    linje.textContent = `${tall} = ${uttrykk}`;
    listeEl.appendChild(linje);
  });
  listeEl.scrollTop = listeEl.scrollHeight;
}

function renderVei(melding, klasse = "") {
  document.getElementById("veiMaal").textContent = veiStoppet ? "–" : gjeldendeMaal;
  renderVeiHistorikk();

  const meldingEl = document.getElementById("veiMelding");
  meldingEl.textContent = melding;
  meldingEl.className = "vei-melding" + (klasse ? ` ${klasse}` : "");

  document.getElementById("visLosningBtn").disabled = veiStoppet;
}

function visNesteLosning() {
  if (veiStoppet) return;

  const uttrykk = finnLosning(terningverdier, gjeldendeMaal);

  if (uttrykk === null) {
    veiStoppet = true;
    renderVei(`Veien stopper her – fant ingen løsning for ${gjeldendeMaal}. Kast terningene på nytt for å prøve igjen.`, "error");
    return;
  }

  veiHistorikk.push({ tall: gjeldendeMaal, uttrykk });
  gjeldendeMaal += 1;
  renderVei(`Klikk «Vis neste tall» for å fortsette til ${gjeldendeMaal}.`);
}

/* -----------------------------------------------------
   5. KAST TERNINGENE (med et lite "rulle"-flimmer)
----------------------------------------------------- */

function kastTerninger() {
  const reduserBevegelse = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sluttverdier = nyeTerningkast();

  if (reduserBevegelse) {
    terningverdier = sluttverdier;
    renderTerninger();
    nullstillVeien();
    renderVei("Klikk «Vis neste tall» for å starte på tallet 1.");
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
      nullstillVeien();
      renderVei("Klikk «Vis neste tall» for å starte på tallet 1.");
      document.getElementById("kastBtn").disabled = false;
    }
  }, 70);
}

/* -----------------------------------------------------
   6. OPPSTART
----------------------------------------------------- */

function settOppKnapper() {
  document.getElementById("kastBtn").addEventListener("click", kastTerninger);
  document.getElementById("visLosningBtn").addEventListener("click", visNesteLosning);

  document.querySelectorAll(".terningvalg-knapp").forEach((knapp) => {
    knapp.addEventListener("click", () => settAntallTerninger(Number(knapp.dataset.antall)));
  });
}

function initSpill() {
  settOppKnapper();
  kastTerninger();
}

document.addEventListener("DOMContentLoaded", initSpill);
