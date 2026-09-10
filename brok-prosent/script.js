/* =====================================================
   BRØK, DESIMAL OG PROSENT – finn feilen
   -----------------------------------------------------
   Toppsirkelen viser alltid den forkortede brøken (alltid
   riktig). De fire boksene under viser samme verdi som en
   ny brøk med annen nevner, desimaltall, prosent og en
   visuell 10×10-rutenett-modell. Fire påstander beskriver
   forhold ved verdien (dobbel, halv, tilsvarende brøk,
   komplement til det hele). Nøyaktig én boks og én påstand
   er feil – spilleren skal finne begge.

   All beregning skjer internt som "hundredeler" (1–99), et
   heltall som tilsvarer prosentverdien. Det garanterer rene
   desimaltall og hele prosenter uansett hvilken "pen" nevner
   som trekkes.
===================================================== */

const ANTALL_RUNDER = 5;
const MAKS_STJERNER_PER_RUNDE = 2;

const REPRESENTASJONSTYPER = ["brok", "desimal", "prosent", "visuell"];
const REPRESENTASJONSNAVN = {
  brok: "Ny brøk (annen nevner)",
  desimal: "Desimaltall",
  prosent: "Prosent",
  visuell: "Visuell modell",
};

let runder = [];
let aktivIndeks = 0;

/* -----------------------------------------------------
   1. HJELPEFUNKSJONER FOR TALL OG BRØK
----------------------------------------------------- */

function tilfeldigHeltall(min, maks) {
  return Math.floor(Math.random() * (maks - min + 1)) + min;
}

function storsteFellesFaktor(a, b) {
  return b === 0 ? a : storsteFellesFaktor(b, a % b);
}

function reduser(teller, nevner) {
  const f = storsteFellesFaktor(teller, nevner);
  return { teller: teller / f, nevner: nevner / f };
}

// Lager en tilfeldig, "pen" verdi mellom 1 og 99 hundredeler.
// Verdien trekkes fra en nevner-familie som deler 100 jevnt
// (halvdeler, kvarter, femtedeler, tidels, tjuedels osv.), slik
// at desimaltall og prosent alltid blir rene.
function tilfeldigHundredel() {
  const granulariteter = [50, 25, 20, 10, 5, 4, 2];
  const g = granulariteter[tilfeldigHeltall(0, granulariteter.length - 1)];
  const maksK = 100 / g - 1;
  const k = tilfeldigHeltall(1, maksK);
  return g * k;
}

// En annen, tilfeldig "utvidet" (ikke-forkortet) brøk med samme
// verdi som hundredeler-tallet, brukt i boksen "ny brøk".
function utvidetBrok(hundredeler) {
  const redusert = reduser(hundredeler, 100);
  const faktor = tilfeldigHeltall(2, 4);
  return { teller: redusert.teller * faktor, nevner: redusert.nevner * faktor };
}

// Desimaltall med komma, alltid så kort som mulig (1 eller 2 desimaler).
function formatDesimalFraHundredeler(hundredeler) {
  const heltall = Math.floor(hundredeler / 100);
  const rest = hundredeler % 100;
  let restTekst;
  if (rest === 0) restTekst = "0";
  else if (rest % 10 === 0) restTekst = String(rest / 10);
  else restTekst = String(rest).padStart(2, "0");
  return `${heltall},${restTekst}`;
}

// Formaterer et prosenttall (kan ha ,5 fra halvering) med komma.
function formatProsentTall(verdi) {
  return String(verdi).replace(".", ",");
}

/* -----------------------------------------------------
   2. FEILGENERERING
----------------------------------------------------- */

function lagAvvikendeHundredel(sann) {
  const avvik = [-20, -15, -10, -5, 5, 10, 15, 20];
  for (let forsok = 0; forsok < 50; forsok++) {
    const d = avvik[tilfeldigHeltall(0, avvik.length - 1)];
    const ny = sann + d;
    if (ny >= 1 && ny <= 99 && ny !== sann) return ny;
  }
  return sann === 50 ? 40 : 50;
}

function lagAvvikProsentverdi(sannVerdi) {
  const avvik = [-15, -10, -8, -5, 5, 8, 10, 15];
  for (let forsok = 0; forsok < 20; forsok++) {
    const d = avvik[tilfeldigHeltall(0, avvik.length - 1)];
    let ny = sannVerdi + d;
    if (ny < 0) ny = Math.abs(ny) + 5;
    if (ny !== sannVerdi) return ny;
  }
  return sannVerdi + 5;
}

/* -----------------------------------------------------
   3. BYGGE PRESENTASJONSFORMENE (4 bokser)
----------------------------------------------------- */

function byggInnhold(type, hundredeler) {
  switch (type) {
    case "brok":
      return { brok: utvidetBrok(hundredeler) };
    case "desimal":
      return { tekst: formatDesimalFraHundredeler(hundredeler) };
    case "prosent":
      return { tekst: `${hundredeler} %` };
    case "visuell":
      return { rutenett: hundredeler };
    default:
      return { tekst: "" };
  }
}

function lagRepresentasjonSett(hundredeler) {
  const feilIndeks = tilfeldigHeltall(0, REPRESENTASJONSTYPER.length - 1);
  const feilHundredeler = lagAvvikendeHundredel(hundredeler);

  const representasjoner = REPRESENTASJONSTYPER.map((type, i) => {
    const brukHundredeler = i === feilIndeks ? feilHundredeler : hundredeler;
    return {
      type,
      navn: REPRESENTASJONSNAVN[type],
      riktig: i !== feilIndeks,
      innhold: byggInnhold(type, brukHundredeler),
    };
  });

  return { representasjoner, feilIndeks };
}

/* -----------------------------------------------------
   4. BYGGE PÅSTANDENE (4 bokser)
----------------------------------------------------- */

function lagPastandSett(hundredeler) {
  const brokForPastand = utvidetBrok(hundredeler);

  const korrekte = [
    { id: "dobbel", tekst: `Dobbelt så stor andel er ${formatProsentTall(hundredeler * 2)} %.` },
    { id: "halvpart", tekst: `Halvparten er ${formatProsentTall(hundredeler / 2)} %.` },
    { id: "tilsvarende-brok", tekst: `En tilsvarende brøk er ${brokForPastand.teller}/${brokForPastand.nevner}.` },
    { id: "komplement", tekst: `Det som mangler opp til det hele er ${formatProsentTall(100 - hundredeler)} %.` },
  ];

  const feilIndeks = tilfeldigHeltall(0, korrekte.length - 1);

  const pastander = korrekte.map((p, i) => {
    if (i !== feilIndeks) return { ...p, riktig: true };
    return { ...lagFeilPastand(p, hundredeler, brokForPastand), riktig: false };
  });

  return { pastander, feilIndeks };
}

function lagFeilPastand(pastand, hundredeler, brokForPastand) {
  switch (pastand.id) {
    case "dobbel": {
      const feil = lagAvvikProsentverdi(hundredeler * 2);
      return { ...pastand, tekst: `Dobbelt så stor andel er ${formatProsentTall(feil)} %.` };
    }
    case "halvpart": {
      const feil = lagAvvikProsentverdi(hundredeler / 2);
      return { ...pastand, tekst: `Halvparten er ${formatProsentTall(feil)} %.` };
    }
    case "tilsvarende-brok": {
      let feilTeller = brokForPastand.teller;
      while (feilTeller === brokForPastand.teller || feilTeller < 1) {
        feilTeller = brokForPastand.teller + (tilfeldigHeltall(0, 1) === 0 ? -1 : 1) * tilfeldigHeltall(1, 2);
      }
      return { ...pastand, tekst: `En tilsvarende brøk er ${feilTeller}/${brokForPastand.nevner}.` };
    }
    case "komplement": {
      const feil = lagAvvikProsentverdi(100 - hundredeler);
      return { ...pastand, tekst: `Det som mangler opp til det hele er ${formatProsentTall(feil)} %.` };
    }
    default:
      return pastand;
  }
}

/* -----------------------------------------------------
   5. RUNDE-GENERERING
----------------------------------------------------- */

function lagRunde() {
  const hundredeler = tilfeldigHundredel();
  const anker = reduser(hundredeler, 100);

  const { representasjoner, feilIndeks: feilReprIndeks } = lagRepresentasjonSett(hundredeler);
  const { pastander, feilIndeks: feilPastandIndeks } = lagPastandSett(hundredeler);

  return {
    hundredeler,
    anker,
    representasjoner,
    feilReprIndeks,
    pastander,
    feilPastandIndeks,
    valgtRepr: null,
    valgtPastand: null,
    ferdig: false,
    stjerner: null,
  };
}

function lagNyttSett() {
  runder = Array.from({ length: ANTALL_RUNDER }, () => lagRunde());
}

function aktivRunde() {
  return runder[aktivIndeks];
}

/* -----------------------------------------------------
   6. SPILLERHANDLINGER
----------------------------------------------------- */

function velgRepresentasjon(indeks) {
  const runde = aktivRunde();
  if (runde.ferdig) return;
  runde.valgtRepr = indeks;
  oppdaterMelding(runde);
  renderRunde();
}

function velgPastand(indeks) {
  const runde = aktivRunde();
  if (runde.ferdig) return;
  runde.valgtPastand = indeks;
  oppdaterMelding(runde);
  renderRunde();
}

function oppdaterMelding(runde) {
  if (runde.valgtRepr === null) {
    visMelding("Klikk på formen du tror er feil.");
  } else if (runde.valgtPastand === null) {
    visMelding("Klikk på påstanden du tror er feil.");
  } else {
    visMelding("Trykk «Sjekk svar» når du er klar.");
  }
}

function sjekkSvar() {
  const runde = aktivRunde();
  if (runde.valgtRepr === null || runde.valgtPastand === null) return;

  const reprRiktig = runde.valgtRepr === runde.feilReprIndeks;
  const pastandRiktig = runde.valgtPastand === runde.feilPastandIndeks;

  runde.stjerner = (reprRiktig ? 1 : 0) + (pastandRiktig ? 1 : 0);
  runde.ferdig = true;

  if (reprRiktig && pastandRiktig) {
    visMelding("Kjempebra! Du fant både feil presentasjonsform og feil påstand. ⭐⭐", "success");
  } else if (reprRiktig) {
    visMelding("Du fant feil presentasjonsform, men bommet på påstanden. ⭐", "success");
  } else if (pastandRiktig) {
    visMelding("Du fant feil påstand, men bommet på presentasjonsformen. ⭐", "success");
  } else {
    visMelding("Denne gangen fant du verken feil form eller feil påstand. Se hva som var galt under.", "error");
  }

  renderAlt();
}

function proveIgjen() {
  runder[aktivIndeks] = lagRunde();
  visMelding("Nytt tall! Klikk på formen du tror er feil.");
  renderAlt();
}

function byttRunde(indeks) {
  aktivIndeks = indeks;
  oppdaterMelding(aktivRunde());
  renderAlt();
}

function nyttSett() {
  lagNyttSett();
  aktivIndeks = 0;
  visMelding("Klikk på formen du tror er feil.");
  renderAlt();
}

/* -----------------------------------------------------
   7. VISNING
----------------------------------------------------- */

let meldingTekst = "Klikk på formen og påstanden du tror er feil, og trykk «Sjekk svar».";
let meldingKlasse = "";

function visMelding(tekst, klasse = "") {
  meldingTekst = tekst;
  meldingKlasse = klasse;
}

function renderAlt() {
  renderFaner();
  renderRunde();
  renderPoengtavle();
}

function renderFaner() {
  const fanerEl = document.getElementById("tabs");
  fanerEl.innerHTML = "";

  runder.forEach((runde, indeks) => {
    const knapp = document.createElement("button");
    knapp.type = "button";
    knapp.className = "tab" + (indeks === aktivIndeks ? " active" : "") + (runde.ferdig ? " solved" : "");

    const tittel = document.createElement("span");
    tittel.textContent = `Runde ${indeks + 1}`;
    knapp.appendChild(tittel);

    const stjerneRad = document.createElement("span");
    stjerneRad.className = "tab-stars";
    stjerneRad.textContent = runde.ferdig
      ? "⭐".repeat(runde.stjerner) + "☆".repeat(MAKS_STJERNER_PER_RUNDE - runde.stjerner)
      : "· ·";
    knapp.appendChild(stjerneRad);

    knapp.addEventListener("click", () => byttRunde(indeks));
    fanerEl.appendChild(knapp);
  });
}

function renderRunde() {
  const runde = aktivRunde();

  const numberValueEl = document.getElementById("numberValue");
  numberValueEl.innerHTML = "";
  numberValueEl.appendChild(byggBrokVisning(runde.anker));

  renderRepresentasjoner(runde);
  renderPastander(runde);
  renderMelding();
  renderKontroller(runde);
}

function byggBrokVisning({ teller, nevner }) {
  const wrapper = document.createElement("span");
  wrapper.className = "brok";

  const t = document.createElement("span");
  t.className = "brok-teller";
  t.textContent = teller;

  const strek = document.createElement("span");
  strek.className = "brok-strek";

  const n = document.createElement("span");
  n.className = "brok-nevner";
  n.textContent = nevner;

  wrapper.append(t, strek, n);
  return wrapper;
}

function byggRutenettVisning(fylt) {
  const grid = document.createElement("span");
  grid.className = "rutenett-100";
  for (let i = 0; i < 100; i++) {
    const rute = document.createElement("span");
    rute.className = "rute" + (i < fylt ? " fylt" : "");
    grid.appendChild(rute);
  }
  return grid;
}

function renderRepresentasjoner(runde) {
  const gridEl = document.getElementById("reprGrid");
  gridEl.innerHTML = "";

  runde.representasjoner.forEach((repr, indeks) => {
    const kort = document.createElement("button");
    kort.type = "button";

    let klasser = "repr-card";
    if (runde.valgtRepr === indeks && !runde.ferdig) klasser += " selected";

    if (runde.ferdig) {
      const erFasit = indeks === runde.feilReprIndeks;
      const erValgt = indeks === runde.valgtRepr;
      if (erFasit) klasser += " feil-fasit";
      if (erValgt && erFasit) klasser += " valgt-riktig";
      if (erValgt && !erFasit) klasser += " valgt-feil";
    }

    kort.className = klasser;
    kort.disabled = runde.ferdig;

    const typeEl = document.createElement("span");
    typeEl.className = "repr-type";
    typeEl.textContent = repr.navn;
    kort.appendChild(typeEl);

    if (repr.innhold.brok) {
      kort.appendChild(byggBrokVisning(repr.innhold.brok));
    } else if (repr.innhold.rutenett !== undefined) {
      kort.appendChild(byggRutenettVisning(repr.innhold.rutenett));
    } else {
      const innholdEl = document.createElement("span");
      innholdEl.className = "repr-content";
      innholdEl.textContent = repr.innhold.tekst;
      kort.appendChild(innholdEl);
    }

    if (runde.ferdig && indeks === runde.feilReprIndeks) {
      const tag = document.createElement("span");
      tag.className = "repr-tag";
      tag.textContent = "Feil form";
      kort.appendChild(tag);
    }

    kort.addEventListener("click", () => velgRepresentasjon(indeks));
    gridEl.appendChild(kort);
  });
}

function renderPastander(runde) {
  const gridEl = document.getElementById("claimList");
  gridEl.innerHTML = "";

  runde.pastander.forEach((pastand, indeks) => {
    const kort = document.createElement("button");
    kort.type = "button";

    let klasser = "repr-card";
    if (runde.valgtPastand === indeks && !runde.ferdig) klasser += " selected";

    if (runde.ferdig) {
      const erFasit = indeks === runde.feilPastandIndeks;
      const erValgt = indeks === runde.valgtPastand;
      if (erFasit) klasser += " feil-fasit";
      if (erValgt && erFasit) klasser += " valgt-riktig";
      if (erValgt && !erFasit) klasser += " valgt-feil";
    }

    kort.className = klasser;
    kort.disabled = runde.ferdig;

    const innholdEl = document.createElement("span");
    innholdEl.className = "repr-content";
    innholdEl.textContent = pastand.tekst;
    kort.appendChild(innholdEl);

    if (runde.ferdig && indeks === runde.feilPastandIndeks) {
      const tag = document.createElement("span");
      tag.className = "repr-tag";
      tag.textContent = "Feil påstand";
      kort.appendChild(tag);
    }

    kort.addEventListener("click", () => velgPastand(indeks));
    gridEl.appendChild(kort);
  });
}

function renderMelding() {
  const meldingEl = document.getElementById("message");
  meldingEl.textContent = meldingTekst;
  meldingEl.className = "message" + (meldingKlasse ? ` ${meldingKlasse}` : "");
}

function renderKontroller(runde) {
  document.getElementById("checkBtn").disabled =
    runde.ferdig || runde.valgtRepr === null || runde.valgtPastand === null;
  document.getElementById("retryBtn").hidden = !runde.ferdig;
}

function renderPoengtavle() {
  const totalStjerner = runder.reduce((sum, r) => sum + (r.stjerner ?? 0), 0);
  const maksStjerner = ANTALL_RUNDER * MAKS_STJERNER_PER_RUNDE;
  const antallFerdig = runder.filter((r) => r.ferdig).length;

  document.getElementById("totalStars").textContent =
    "⭐".repeat(totalStjerner) + "☆".repeat(maksStjerner - totalStjerner);
  document.getElementById("totalCount").textContent = `${antallFerdig} / ${ANTALL_RUNDER} runder`;
}

/* -----------------------------------------------------
   8. OPPSTART
----------------------------------------------------- */

function settOppKnapper() {
  document.getElementById("checkBtn").addEventListener("click", sjekkSvar);
  document.getElementById("retryBtn").addEventListener("click", proveIgjen);
  document.getElementById("newSetBtn").addEventListener("click", nyttSett);
}

function initSpill() {
  lagNyttSett();
  aktivIndeks = 0;
  settOppKnapper();
  renderAlt();
}

document.addEventListener("DOMContentLoaded", initSpill);
