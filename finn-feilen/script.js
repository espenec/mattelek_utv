/* =====================================================
   FINN FEILEN – et tallforståelsesspill
   -----------------------------------------------------
   Et tresifret tall vises på fem ulike måter, og med fem
   påstander om tallet. Nøyaktig én presentasjonsform og
   nøyaktig én påstand er feil. Spilleren skal finne begge.
===================================================== */

const ANTALL_RUNDER = 5;
const MAKS_STJERNER_PER_RUNDE = 2;

const REPRESENTASJONSTYPER = ["utvidet", "tallord", "plassverdi", "tellebrikker"];
const REPRESENTASJONSNAVN = {
  utvidet: "Utvidet form",
  tallord: "Tallord",
  plassverdi: "Plassverdi",
  tellebrikker: "Tellebrikker",
};

let runder = [];
let aktivIndeks = 0;

/* -----------------------------------------------------
   1. NORSK TALLORD (0–999)
----------------------------------------------------- */

const ENERE = ["", "en", "to", "tre", "fire", "fem", "seks", "syv", "åtte", "ni"];
const TEENS = ["ti", "elleve", "tolv", "tretten", "fjorten", "femten", "seksten", "sytten", "atten", "nitten"];
const TIERE = ["tjue", "tretti", "førti", "femti", "seksti", "sytti", "åtti", "nitti"];

function toSifferOrd(rest) {
  if (rest === 0) return "";
  if (rest < 10) return ENERE[rest];
  if (rest < 20) return TEENS[rest - 10];
  const tiere = Math.floor(rest / 10);
  const enere = rest % 10;
  return TIERE[tiere - 2] + (enere > 0 ? ENERE[enere] : "");
}

function tallTilOrd(n) {
  if (n === 0) return "null";
  const hundrere = Math.floor(n / 100);
  const rest = n % 100;
  let ord = "";
  if (hundrere > 0) {
    ord += ENERE[hundrere] + "hundre";
    if (rest > 0) ord += "og";
  }
  ord += toSifferOrd(rest);
  return ord;
}

/* -----------------------------------------------------
   2. HJELPEFUNKSJONER
----------------------------------------------------- */

function tilfeldigHeltall(min, maks) {
  return Math.floor(Math.random() * (maks - min + 1)) + min;
}

function tilfeldigAvvik() {
  const muligheter = [-3, -2, -1, 1, 2, 3];
  return muligheter[tilfeldigHeltall(0, muligheter.length - 1)];
}

// Lager en feilaktig versjon av sifrene (h,t,e) ved å endre ett av
// dem til et annet siffer. Hundretallssifferet holdes mellom 1–9 så
// tallet fortsatt er tresifret.
function lagFeilSiffer(h, t, e) {
  const plass = ["h", "t", "e"][tilfeldigHeltall(0, 2)];
  if (plass === "h") {
    let nyH = h;
    while (nyH === h) nyH = tilfeldigHeltall(1, 9);
    return { h: nyH, t, e };
  }
  if (plass === "t") {
    let nyT = t;
    while (nyT === t) nyT = tilfeldigHeltall(0, 9);
    return { h, t: nyT, e };
  }
  let nyE = e;
  while (nyE === e) nyE = tilfeldigHeltall(0, 9);
  return { h, t, e: nyE };
}

/* -----------------------------------------------------
   4. BYGGE PRESENTASJONSFORMENE
----------------------------------------------------- */

function byggInnhold(type, h, t, e) {
  const verdi = h * 100 + t * 10 + e;
  switch (type) {
    case "utvidet": {
      const ledd = [];
      if (h > 0) ledd.push(`${h * 100}`);
      if (t > 0) ledd.push(`${t * 10}`);
      if (e > 0) ledd.push(`${e}`);
      return { tekst: ledd.length ? ledd.join(" + ") : "0" };
    }
    case "tallord":
      return { tekst: tallTilOrd(verdi) };
    case "plassverdi":
      return { tekst: `${h} hundrere + ${t} tiere + ${e} enere` };
    case "tellebrikker":
      return { brikker: { h, t, e } };
    default:
      return { tekst: "" };
  }
}

function lagRepresentasjonSett(h, t, e) {
  const feilIndeks = tilfeldigHeltall(0, REPRESENTASJONSTYPER.length - 1);
  const feilSiffer = lagFeilSiffer(h, t, e);

  const representasjoner = REPRESENTASJONSTYPER.map((type, i) => {
    const brukSiffer = i === feilIndeks ? feilSiffer : { h, t, e };
    return {
      type,
      navn: REPRESENTASJONSNAVN[type],
      riktig: i !== feilIndeks,
      innhold: byggInnhold(type, brukSiffer.h, brukSiffer.t, brukSiffer.e),
    };
  });

  return { representasjoner, feilIndeks };
}

/* -----------------------------------------------------
   5. BYGGE PÅSTANDENE
----------------------------------------------------- */

function lagPastandSett(tall) {
  const erPartall = tall % 2 === 0;

  const korrekte = [
    { id: "paritet", tekst: `Tallet er et ${erPartall ? "partall" : "oddetall"}.` },
    { id: "ti-mer", tekst: `10 mer enn tallet er ${tall + 10}.` },
    { id: "ti-mindre", tekst: `10 mindre enn tallet er ${tall - 10}.` },
    { id: "fem-mer", tekst: `5 mer enn tallet er ${tall + 5}.` },
    { id: "fem-mindre", tekst: `5 mindre enn tallet er ${tall - 5}.` },
  ];

  const feilIndeks = tilfeldigHeltall(0, korrekte.length - 1);

  const pastander = korrekte.map((p, i) => {
    if (i !== feilIndeks) return { ...p, riktig: true };
    return { ...lagFeilPastand(p, tall, erPartall), riktig: false };
  });

  return { pastander, feilIndeks };
}

function lagFeilPastand(pastand, tall, erPartall) {
  switch (pastand.id) {
    case "paritet":
      return { ...pastand, tekst: `Tallet er et ${erPartall ? "oddetall" : "partall"}.` };
    case "ti-mer":
      return { ...pastand, tekst: `10 mer enn tallet er ${tall + 10 + tilfeldigAvvik()}.` };
    case "ti-mindre":
      return { ...pastand, tekst: `10 mindre enn tallet er ${tall - 10 + tilfeldigAvvik()}.` };
    case "fem-mer":
      return { ...pastand, tekst: `5 mer enn tallet er ${tall + 5 + tilfeldigAvvik()}.` };
    case "fem-mindre":
      return { ...pastand, tekst: `5 mindre enn tallet er ${tall - 5 + tilfeldigAvvik()}.` };
    default:
      return pastand;
  }
}

/* -----------------------------------------------------
   6. RUNDE-GENERERING
----------------------------------------------------- */

function lagRunde() {
  const tall = tilfeldigHeltall(100, 999);
  const h = Math.floor(tall / 100);
  const t = Math.floor((tall % 100) / 10);
  const e = tall % 10;

  const { representasjoner, feilIndeks: feilReprIndeks } = lagRepresentasjonSett(h, t, e);
  const { pastander, feilIndeks: feilPastandIndeks } = lagPastandSett(tall);

  return {
    tall,
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
   7. SPILLERHANDLINGER
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
   8. VISNING
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

  document.getElementById("numberValue").textContent = runde.tall;

  renderRepresentasjoner(runde);
  renderPastander(runde);
  renderMelding();
  renderKontroller(runde);
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

    if (repr.innhold.brikker) {
      kort.appendChild(byggBrikkeVisning(repr.innhold.brikker));
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

function byggBrikkeVisning({ h, t, e }) {
  const wrapper = document.createElement("span");
  wrapper.className = "repr-content";

  const grupper = [
    { antall: h, klasse: "brikke-hundre", etikett: "Hundrere" },
    { antall: t, klasse: "brikke-ti", etikett: "Tiere" },
    { antall: e, klasse: "brikke-en", etikett: "Enere" },
  ];

  grupper.forEach(({ antall, klasse, etikett }) => {
    const gruppe = document.createElement("span");
    gruppe.className = "brikke-gruppe";

    const etikettEl = document.createElement("span");
    etikettEl.className = "brikke-etikett";
    etikettEl.textContent = etikett;
    gruppe.appendChild(etikettEl);

    const rad = document.createElement("span");
    rad.className = "brikke-rad";
    for (let i = 0; i < antall; i++) {
      const brikke = document.createElement("span");
      brikke.className = klasse;
      rad.appendChild(brikke);
    }
    gruppe.appendChild(rad);

    wrapper.appendChild(gruppe);
  });

  return wrapper;
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
   9. OPPSTART
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
