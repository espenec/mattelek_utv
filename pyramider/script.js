/* =====================================================
   REGNEPYRAMIDER
   -----------------------------------------------------
   Hvert tall i pyramiden er regnet ut fra de to tallene rett
   under (venstre og høyre). Eleven fyller inn tallene som mangler.

   Regneart:   addisjon, subtraksjon eller multiplikasjon
   Størrelse:  3, 4 eller 5 nivåer
   Vanskelighetsgrad:
     enkel     – hele bunnen er gitt
     middels   – noen tall mangler "her og der", også i bunnen
     vanskelig – færrest mulig tall er gitt
   Alle pyramider kan løses ved å regne ut ett tall om gangen
   (to kjente tall i en "trekant" gir det tredje).
===================================================== */

// Ingen celle skal ha flere enn fire siffer (det er plass til i feltene).
const MAKS_VERDI = 9999;

// Tallområder. Multiplikasjon vokser raskt, så der er områdene små,
// og enda mindre jo flere nivåer pyramiden har.
//   bunn:        tallene i bunnen trekkes herfra (addisjon, multiplikasjon)
//   topp / fri:  pyramiden lages ovenfra og ned (subtraksjon).
//                "topp" er øverste tall, "fri" er det høyre tallet
//                på hvert nivå, som velges fritt.
const OMRADER = {
  addisjon: { bunn: [1, 10] },
  subtraksjon: { topp: [1, 5], fri: [1, 4] },
  multiplikasjon: {
    3: { bunn: [2, 6] },
    4: { bunn: [1, 4] },
    5: { bunn: [1, 3] },
  },
};

const VANSKELIGHETER = {
  enkel: {
    navn: "Enkel",
    info: "Alle tallene i bunnen er gitt. Fyll inn resten.",
  },
  middels: {
    navn: "Middels",
    info: "Noen tall mangler her og der, også i bunnen. Tenk ut hva som mangler.",
    // Omtrent så stor andel av rutene utover det minste nødvendige som beholdes
    ekstraAndel: 0.45,
  },
  vanskelig: {
    navn: "Vanskelig",
    info: "Så få tall som mulig er gitt. Regn deg frem ett tall om gangen.",
    ekstraAndel: 0,
  },
};

const innstillinger = { regneart: "addisjon", hoyde: 4, vanskelighet: "enkel" };

let pyramide = null;
let meldingTekst = "";
let meldingKlasse = "";

/* -----------------------------------------------------
   1. HJELPEFUNKSJONER
   Rutene adresseres (k, i): k = nivå fra bunnen (0 = bunnen),
   i = plass fra venstre. Nivå k har (hoyde - k) ruter, og
   ruten (k, i) er summen av (k-1, i) og (k-1, i+1).
----------------------------------------------------- */

function tilfeldigHeltall(min, maks) {
  return Math.floor(Math.random() * (maks - min + 1)) + min;
}

function stokk(liste) {
  const kopi = [...liste];
  for (let i = kopi.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopi[i], kopi[j]] = [kopi[j], kopi[i]];
  }
  return kopi;
}

function alleRuter(hoyde) {
  const ruter = [];
  for (let k = 0; k < hoyde; k++) {
    for (let i = 0; i < hoyde - k; i++) ruter.push([k, i]);
  }
  return ruter;
}

function lagRutenett(hoyde, verdi) {
  return Array.from({ length: hoyde }, (_, k) =>
    Array.from({ length: hoyde - k }, () => (typeof verdi === "function" ? verdi() : verdi))
  );
}

/* -----------------------------------------------------
   2. GENERERING
----------------------------------------------------- */

// Bygger pyramiden nedenfra og opp: hver rute regnes ut fra de to under.
function byggNedenfra(bunn, beregn) {
  const losning = [bunn];
  for (let k = 1; k < bunn.length; k++) {
    const forrige = losning[k - 1];
    losning.push(forrige.slice(0, -1).map((v, i) => beregn(v, forrige[i + 1])));
  }
  return losning;
}

// Bygger pyramiden ovenfra og ned. Toppen og det høyre tallet på hvert
// nivå velges fritt, og resten følger: er "forelder = venstre ∘ høyre",
// så er "venstre = forelder ∘' høyre". Slik blir alle tall hele og
// positive, og det går alltid opp.
function byggOvenfra(hoyde, omrade, finnVenstre) {
  const losning = lagRutenett(hoyde, 0);
  losning[hoyde - 1][0] = tilfeldigFra(omrade.topp);
  for (let k = hoyde - 2; k >= 0; k--) {
    const antall = hoyde - k;
    losning[k][antall - 1] = tilfeldigFra(omrade.fri);
    for (let i = antall - 2; i >= 0; i--) {
      losning[k][i] = finnVenstre(losning[k + 1][i], losning[k][i + 1]);
    }
  }
  return losning;
}

function tilfeldigFra([min, maks]) {
  return tilfeldigHeltall(min, maks);
}

/* -----------------------------------------------------
   Regnearter. "beregn" regner ut en rute fra venstre og høyre
   rute under den. "lag" gir en tilfeldig pyramide, eller null
   hvis den ble for stor (da prøver vi på nytt).
----------------------------------------------------- */

const OPERASJONER = {
  addisjon: {
    navn: "Addisjon",
    regel: "Hvert tall er summen av de to tallene rett under.",
    beregn: (venstre, hoyre) => venstre + hoyre,
    lag: (hoyde) => {
      const bunn = Array.from({ length: hoyde }, () => tilfeldigFra(OMRADER.addisjon.bunn));
      return byggNedenfra(bunn, (a, b) => a + b);
    },
  },
  subtraksjon: {
    navn: "Subtraksjon",
    regel: "Hvert tall er tallet nede til venstre minus tallet nede til høyre.",
    beregn: (venstre, hoyre) => venstre - hoyre,
    lag: (hoyde) => byggOvenfra(hoyde, OMRADER.subtraksjon, (forelder, hoyre) => forelder + hoyre),
  },
  multiplikasjon: {
    navn: "Multiplikasjon",
    regel: "Hvert tall er de to tallene rett under ganget med hverandre.",
    beregn: (venstre, hoyre) => venstre * hoyre,
    lag: (hoyde) => {
      const omrade = OMRADER.multiplikasjon[hoyde];
      const bunn = Array.from({ length: hoyde }, () => tilfeldigFra(omrade.bunn));
      return byggNedenfra(bunn, (a, b) => a * b);
    },
  },
};

// Sjekker om hele pyramiden kan regnes ut fra de gitte rutene, ved å
// gjenta: "kjenner jeg to av tre i en trekant, kjenner jeg den tredje".
function kanLoses(gitt, hoyde) {
  const kjent = gitt.map((rad) => [...rad]);
  let endret = true;
  while (endret) {
    endret = false;
    for (let k = 1; k < hoyde; k++) {
      for (let i = 0; i < hoyde - k; i++) {
        const trekant = [[k, i], [k - 1, i], [k - 1, i + 1]];
        const antallKjent = trekant.filter(([a, b]) => kjent[a][b]).length;
        if (antallKjent === 2) {
          trekant.forEach(([a, b]) => { kjent[a][b] = true; });
          endret = true;
        }
      }
    }
  }
  return kjent.every((rad) => rad.every(Boolean));
}

function lagGitt(hoyde, vanskelighet) {
  const gitt = lagRutenett(hoyde, false);

  if (vanskelighet === "enkel") {
    gitt[0] = gitt[0].map(() => true);
    return gitt;
  }

  // Start med alle ruter gitt, og fjern dem i tilfeldig rekkefølge så lenge
  // pyramiden fortsatt kan løses. Middels stopper på et høyere antall gitte
  // ruter enn vanskelig, som fjerner så mange som mulig.
  const ruter = alleRuter(hoyde);
  ruter.forEach(([k, i]) => { gitt[k][i] = true; });

  const minst = hoyde;
  const onsket = minst + Math.round((ruter.length - minst) * VANSKELIGHETER[vanskelighet].ekstraAndel);

  let antallGitt = ruter.length;
  for (const [k, i] of stokk(ruter)) {
    if (antallGitt <= onsket) break;
    gitt[k][i] = false;
    if (kanLoses(gitt, hoyde)) antallGitt--;
    else gitt[k][i] = true;
  }
  return gitt;
}

function lagPyramide() {
  const { regneart, hoyde, vanskelighet } = innstillinger;

  // 1) Tallene: prøv til alle rutene holder seg under grensen
  let losning = null;
  for (let forsok = 0; forsok < 5000 && !losning; forsok++) {
    const kandidat = OPERASJONER[regneart].lag(hoyde);
    if (Math.max(...kandidat.flat()) <= MAKS_VERDI) losning = kandidat;
  }
  if (!losning) throw new Error("Fant ikke en gyldig pyramide.");

  // 2) Hvilke ruter som er gitt. På middels og vanskelig skal minst ett
  //    tall i bunnen mangle, ellers blir det det samme som enkel.
  let gitt = null;
  for (let forsok = 0; forsok < 500 && !gitt; forsok++) {
    const kandidat = lagGitt(hoyde, vanskelighet);
    if (vanskelighet === "enkel" || !kandidat[0].every(Boolean)) gitt = kandidat;
  }
  if (!gitt) throw new Error("Fant ikke et gyldig utvalg av gitte tall.");

  return {
    regneart,
    hoyde,
    vanskelighet,
    losning,
    gitt,
    verdier: lagRutenett(hoyde, ""),
    status: lagRutenett(hoyde, null), // null | "riktig" | "feil" | "fasit"
    ferdig: false,
    fasitVist: false,
    sjekket: 0,
  };
}

/* -----------------------------------------------------
   3. SPILLERHANDLINGER
----------------------------------------------------- */

function tommeRuter() {
  return alleRuter(pyramide.hoyde).filter(([k, i]) => !pyramide.gitt[k][i]);
}

function sjekkSvar() {
  if (pyramide.ferdig || pyramide.fasitVist) return;
  pyramide.sjekket += 1;

  let riktig = 0;
  let feil = 0;
  let mangler = 0;
  const tomme = tommeRuter();

  tomme.forEach(([k, i]) => {
    if (pyramide.status[k][i] === "riktig") { riktig++; return; }
    const tekst = pyramide.verdier[k][i];
    if (tekst === "") { mangler++; pyramide.status[k][i] = null; return; }
    if (Number(tekst) === pyramide.losning[k][i]) { pyramide.status[k][i] = "riktig"; riktig++; }
    else { pyramide.status[k][i] = "feil"; feil++; }
  });

  if (riktig === tomme.length) {
    pyramide.ferdig = true;
    visMelding(
      pyramide.sjekket === 1
        ? "Riktig! Hele pyramiden er løst, og det på første sjekk."
        : "Riktig! Hele pyramiden er løst.",
      "success"
    );
  } else {
    const deler = [`${riktig} av ${tomme.length} riktige`];
    if (feil) deler.push(`${feil} feil`);
    if (mangler) deler.push(`${mangler} mangler`);
    visMelding(`${deler.join(", ")}.`, feil ? "error" : "");
  }

  render({ fokus: "feil" });
}

function visFasit() {
  if (pyramide.ferdig || pyramide.fasitVist) return;
  pyramide.fasitVist = true;
  tommeRuter().forEach(([k, i]) => {
    pyramide.verdier[k][i] = String(pyramide.losning[k][i]);
    if (pyramide.status[k][i] !== "riktig") pyramide.status[k][i] = "fasit";
  });
  visMelding("Fasit vist. Lag en ny pyramide for å prøve igjen.");
  render();
}

function nyPyramide() {
  pyramide = lagPyramide();
  visMelding("Fyll inn tallene som mangler, og trykk «Sjekk svar».");
  render();
}

function settRegneart(regneart) {
  if (regneart === innstillinger.regneart) return;
  innstillinger.regneart = regneart;
  nyPyramide();
}

function settHoyde(hoyde) {
  if (hoyde === innstillinger.hoyde) return;
  innstillinger.hoyde = hoyde;
  nyPyramide();
}

function settVanskelighet(vanskelighet) {
  if (vanskelighet === innstillinger.vanskelighet) return;
  innstillinger.vanskelighet = vanskelighet;
  nyPyramide();
}

/* -----------------------------------------------------
   4. VISNING
----------------------------------------------------- */

function visMelding(tekst, klasse = "") {
  meldingTekst = tekst;
  meldingKlasse = klasse;
}

function byggRute(k, i) {
  const p = pyramide;
  const navn = `Nivå ${k + 1}, rute ${i + 1}`;

  // Gitt tall: vises som fast tekst
  if (p.gitt[k][i]) {
    const celle = document.createElement("div");
    celle.className = "celle gitt";
    celle.textContent = p.losning[k][i];
    celle.setAttribute("aria-label", `${navn}: ${p.losning[k][i]}`);
    return celle;
  }

  // Tomt tall: innskrivingsfelt
  const status = p.status[k][i];
  const celle = document.createElement("div");
  celle.className = "celle" + (status ? ` ${status}` : "");

  const felt = document.createElement("input");
  felt.type = "text";
  felt.inputMode = "numeric";
  felt.autocomplete = "off";
  felt.maxLength = 4;
  felt.value = p.verdier[k][i];
  felt.dataset.k = k;
  felt.dataset.i = i;
  felt.setAttribute("aria-label", `${navn}, mangler`);
  felt.readOnly = status === "riktig" || status === "fasit" || p.ferdig;

  felt.addEventListener("input", () => {
    const rent = felt.value.replace(/\D/g, "").slice(0, 4);
    felt.value = rent;
    p.verdier[k][i] = rent;
    if (p.status[k][i] === "feil") {
      p.status[k][i] = null;
      celle.classList.remove("feil");
    }
  });

  felt.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      gaTilNeste(felt);
    }
  });

  celle.appendChild(felt);
  return celle;
}

// Enter flytter til neste felt som kan skrives i. Er det ikke flere, sjekkes svaret.
function gaTilNeste(naaverende) {
  const felt = [...document.querySelectorAll("#pyramide input:not([readonly])")];
  const idx = felt.indexOf(naaverende);
  const neste = felt[idx + 1];
  if (neste) neste.focus();
  else sjekkSvar();
}

function render({ fokus = null } = {}) {
  const el = document.getElementById("pyramide");
  el.innerHTML = "";
  el.style.setProperty("--n", pyramide.hoyde);

  // Nivå 1 (bunnen) først i HTML-en, og snudd visuelt med CSS. Da følger
  // tastatur- og skjermleserrekkefølgen regnerekkefølgen nedenfra og opp.
  for (let k = 0; k < pyramide.hoyde; k++) {
    const rad = document.createElement("div");
    rad.className = "rad";
    rad.setAttribute("role", "group");
    rad.setAttribute("aria-label", `Nivå ${k + 1}`);
    for (let i = 0; i < pyramide.hoyde - k; i++) rad.appendChild(byggRute(k, i));
    el.appendChild(rad);
  }

  document.querySelectorAll("[data-regneart]").forEach((b) => {
    const aktiv = b.dataset.regneart === innstillinger.regneart;
    b.classList.toggle("active", aktiv);
    b.setAttribute("aria-pressed", String(aktiv));
  });
  document.getElementById("regelTekst").textContent = OPERASJONER[innstillinger.regneart].regel;

  document.querySelectorAll("[data-hoyde]").forEach((b) => {
    const aktiv = Number(b.dataset.hoyde) === innstillinger.hoyde;
    b.classList.toggle("active", aktiv);
    b.setAttribute("aria-pressed", String(aktiv));
  });
  document.querySelectorAll("[data-vanskelighet]").forEach((b) => {
    const aktiv = b.dataset.vanskelighet === innstillinger.vanskelighet;
    b.classList.toggle("active", aktiv);
    b.setAttribute("aria-pressed", String(aktiv));
  });
  document.getElementById("valgInfo").textContent = VANSKELIGHETER[innstillinger.vanskelighet].info;

  const tomme = tommeRuter();
  const losteRuter = tomme.filter(([k, i]) => pyramide.status[k][i] === "riktig").length;
  document.getElementById("lostTall").textContent = `${losteRuter} / ${tomme.length}`;
  document.getElementById("sjekkTall").textContent = pyramide.sjekket;

  const meldingEl = document.getElementById("message");
  meldingEl.textContent = meldingTekst;
  meldingEl.className = "message" + (meldingKlasse ? ` ${meldingKlasse}` : "");

  const ferdigMedSpillet = pyramide.ferdig || pyramide.fasitVist;
  document.getElementById("sjekkBtn").disabled = ferdigMedSpillet;
  document.getElementById("fasitBtn").disabled = ferdigMedSpillet;

  if (fokus === "feil") {
    const mal = el.querySelector(".celle.feil input") ||
      [...el.querySelectorAll("input:not([readonly])")].find((f) => f.value === "");
    if (mal) mal.focus();
  }
}

/* -----------------------------------------------------
   5. OPPSTART
----------------------------------------------------- */

function initSpill() {
  document.getElementById("sjekkBtn").addEventListener("click", sjekkSvar);
  document.getElementById("fasitBtn").addEventListener("click", visFasit);
  document.getElementById("nyBtn").addEventListener("click", nyPyramide);
  document.querySelectorAll("[data-regneart]").forEach((b) =>
    b.addEventListener("click", () => settRegneart(b.dataset.regneart))
  );
  document.querySelectorAll("[data-hoyde]").forEach((b) =>
    b.addEventListener("click", () => settHoyde(Number(b.dataset.hoyde)))
  );
  document.querySelectorAll("[data-vanskelighet]").forEach((b) =>
    b.addEventListener("click", () => settVanskelighet(b.dataset.vanskelighet))
  );
  nyPyramide();
}

document.addEventListener("DOMContentLoaded", initSpill);
