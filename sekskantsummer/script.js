/* =====================================================
   SEKSKANTREGNING
   -----------------------------------------------------
   Seks sekskanter i en ring. Hver sekskant har et måltall
   i midten og seks tall rundt. Nøyaktig to av tallene gir
   måltallet med regnearten. Eleven trykker på de to.

   Fire regnearter (+, −, ×, ÷), eller "blandet", og tre
   nivåer som styrer hvor store tallene er.
===================================================== */

const ANTALL_SEKSKANTER = 6;
const ANTALL_FELT = 6;
const BLINK_MS = 700;
const SVG_NS = "http://www.w3.org/2000/svg";

/* -----------------------------------------------------
   1. REGNEARTER
   -----------------------------------------------------
   beregn(a, b) gir resultatet for to tall, eller null hvis
   paret ikke gir noe gyldig svar. Rekkefølgen på tallene
   spiller ingen rolle: ved subtraksjon og divisjon brukes
   alltid det største tallet først.
----------------------------------------------------- */

const OPERASJONER = {
  addisjon: {
    symbol: "+",
    navn: "Addisjon",
    oppgave: "Finn de to tallene som til sammen blir tallet i midten.",
    beregn: (a, b) => a + b,
    uttrykk: (a, b) => `${a} + ${b}`,
  },
  subtraksjon: {
    symbol: "−",
    navn: "Subtraksjon",
    oppgave: "Finn de to tallene der differansen (største minus minste) er tallet i midten.",
    beregn: (a, b) => Math.abs(a - b),
    uttrykk: (a, b) => `${Math.max(a, b)} − ${Math.min(a, b)}`,
  },
  multiplikasjon: {
    symbol: "×",
    navn: "Multiplikasjon",
    oppgave: "Finn de to tallene som ganget sammen blir tallet i midten.",
    beregn: (a, b) => a * b,
    uttrykk: (a, b) => `${a} × ${b}`,
  },
  divisjon: {
    symbol: "÷",
    navn: "Divisjon",
    oppgave: "Finn de to tallene der det største delt på det minste blir tallet i midten.",
    beregn: (a, b) => {
      const stor = Math.max(a, b);
      const liten = Math.min(a, b);
      return stor % liten === 0 ? stor / liten : null;
    },
    uttrykk: (a, b) => `${Math.max(a, b)} ÷ ${Math.min(a, b)}`,
  },
};

const REGNEARTER = Object.keys(OPERASJONER);

/* -----------------------------------------------------
   2. NIVÅER
   -----------------------------------------------------
   tall:      området tallene i sekskanten hentes fra
   mal:       området måltallet må ligge i (valgfritt)
   divisor / kvotient (kun divisjon): størrelsen på tallene
              i løsningsparet. Måltallet er kvotienten.
----------------------------------------------------- */

const NIVAER = {
  enkel: {
    navn: "Enkel",
    addisjon: { tall: [1, 15], mal: [10, 25] },
    subtraksjon: { tall: [1, 20], mal: [2, 12] },
    multiplikasjon: { tall: [2, 10] },
    divisjon: { divisor: [2, 6], kvotient: [2, 9], tall: [2, 54] },
  },
  middels: {
    navn: "Middels",
    addisjon: { tall: [10, 99], mal: [50, 150] },
    subtraksjon: { tall: [10, 99], mal: [5, 60] },
    multiplikasjon: { tall: [3, 15] },
    divisjon: { divisor: [3, 12], kvotient: [2, 12], tall: [2, 144] },
  },
  vanskelig: {
    navn: "Vanskelig",
    addisjon: { tall: [100, 999], mal: [300, 1400] },
    subtraksjon: { tall: [100, 999], mal: [20, 500] },
    multiplikasjon: { tall: [11, 30] },
    divisjon: { divisor: [6, 25], kvotient: [3, 20], tall: [2, 500] },
  },
};

const innstillinger = { regneart: "addisjon", nivaa: "enkel" };

let runde = null;
let meldingTekst = "";
let meldingKlasse = "";

/* -----------------------------------------------------
   3. HJELPEFUNKSJONER
----------------------------------------------------- */

function tilfeldigHeltall(min, maks) {
  return Math.floor(Math.random() * (maks - min + 1)) + min;
}

function tilfeldigFra([min, maks]) {
  return tilfeldigHeltall(min, maks);
}

function stokk(liste) {
  const kopi = [...liste];
  for (let i = kopi.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopi[i], kopi[j]] = [kopi[j], kopi[i]];
  }
  return kopi;
}

// Antall par (to ulike felt) som gir "mal" med regnearten.
function antallLosninger(tall, mal, regneart) {
  const beregn = OPERASJONER[regneart].beregn;
  let antall = 0;
  for (let i = 0; i < tall.length; i++) {
    for (let j = i + 1; j < tall.length; j++) {
      if (beregn(tall[i], tall[j]) === mal) antall++;
    }
  }
  return antall;
}

/* -----------------------------------------------------
   4. GENERERING
   -----------------------------------------------------
   1. Trekk et løsningspar (a, b) og regn ut måltallet.
   2. Fyll opp med fire andre tall, ett om gangen, og behold
      bare de som ikke skaper en ekstra løsning.
   Alle seks tall er ulike.
----------------------------------------------------- */

function trekkLosningspar(regneart, cfg) {
  if (regneart === "divisjon") {
    const divisor = tilfeldigFra(cfg.divisor);
    const kvotient = tilfeldigFra(cfg.kvotient);
    return { a: divisor * kvotient, b: divisor, mal: kvotient };
  }
  const a = tilfeldigFra(cfg.tall);
  const b = tilfeldigFra(cfg.tall);
  if (a === b) return null;
  return { a, b, mal: OPERASJONER[regneart].beregn(a, b) };
}

function lagSekskant(regneart, cfg, brukteMal) {
  const nokkel = (mal) => `${regneart}:${mal}`;

  for (let forsok = 0; forsok < 4000; forsok++) {
    const par = trekkLosningspar(regneart, cfg);
    if (par === null) continue;
    const { a, b, mal } = par;

    if (cfg.mal && (mal < cfg.mal[0] || mal > cfg.mal[1])) continue;
    // Prøv først å unngå måltall som allerede er brukt i runden.
    if (forsok < 2500 && brukteMal.has(nokkel(mal))) continue;

    const tall = [a, b];
    for (let trekk = 0; trekk < 300 && tall.length < ANTALL_FELT; trekk++) {
      const x = tilfeldigFra(cfg.tall);
      if (tall.includes(x)) continue;
      if (antallLosninger([...tall, x], mal, regneart) === 1) tall.push(x);
    }
    if (tall.length < ANTALL_FELT) continue;

    const blandet = stokk(tall);
    const losning = [blandet.indexOf(a), blandet.indexOf(b)].sort((p, q) => p - q);
    brukteMal.add(nokkel(mal));
    return { regneart, mal, tall: blandet, losning, lost: false, funnet: [] };
  }

  throw new Error(`Fant ikke en gyldig sekskant (${regneart}).`);
}

function lagRunde() {
  const cfgNivaa = NIVAER[innstillinger.nivaa];

  let regnearter;
  if (innstillinger.regneart === "blandet") {
    // Alle fire regnearter er med, pluss to tilfeldige til.
    const ekstra = [0, 1].map(() => REGNEARTER[tilfeldigHeltall(0, REGNEARTER.length - 1)]);
    regnearter = stokk([...REGNEARTER, ...ekstra]);
  } else {
    regnearter = Array(ANTALL_SEKSKANTER).fill(innstillinger.regneart);
  }

  const brukteMal = new Set();
  const sekskanter = regnearter.map((r) => lagSekskant(r, cfgNivaa[r], brukteMal));

  return { sekskanter, valgt: null, feil: 0, laast: false, blink: null };
}

/* -----------------------------------------------------
   5. SPILLERHANDLINGER
----------------------------------------------------- */

function velgFelt(hexIdx, feltIdx) {
  if (runde.laast) return;
  const hex = runde.sekskanter[hexIdx];
  if (hex.lost) return;

  const valgt = runde.valgt;

  // Første valg, eller bytte til en annen sekskant
  if (valgt === null || valgt.hex !== hexIdx) {
    runde.valgt = { hex: hexIdx, felt: feltIdx };
    visMelding(`Valgt ${hex.tall[feltIdx]}. Trykk på det andre tallet.`);
    render({ hex: hexIdx, felt: feltIdx });
    return;
  }

  // Trykk på samme felt igjen: fjern valget
  if (valgt.felt === feltIdx) {
    runde.valgt = null;
    visMelding("Valget er fjernet.");
    render({ hex: hexIdx, felt: feltIdx });
    return;
  }

  // To felt valgt i samme sekskant: sjekk svaret
  const op = OPERASJONER[hex.regneart];
  const a = hex.tall[valgt.felt];
  const b = hex.tall[feltIdx];
  const svar = op.beregn(a, b);
  const uttrykk = op.uttrykk(a, b);

  if (svar === hex.mal) {
    hex.lost = true;
    hex.funnet = [valgt.felt, feltIdx];
    runde.valgt = null;

    if (runde.sekskanter.every((s) => s.lost)) {
      visMelding(
        runde.feil === 0
          ? "Alle sekskantene er løst – uten én eneste feil!"
          : `Alle sekskantene er løst! Antall feil underveis: ${runde.feil}.`,
        "success"
      );
    } else {
      visMelding(`Riktig! ${uttrykk} = ${hex.mal}.`, "success");
    }
    render();
    return;
  }

  // Feil: vis kort, tell feil, fjern valget
  runde.feil += 1;
  runde.laast = true;
  runde.blink = { hex: hexIdx, felt: [valgt.felt, feltIdx] };
  visMelding(
    svar === null
      ? `${uttrykk} går ikke opp. Prøv igjen.`
      : `${uttrykk} = ${svar}, ikke ${hex.mal}. Prøv igjen.`,
    "error"
  );
  render();

  setTimeout(() => {
    runde.valgt = null;
    runde.laast = false;
    runde.blink = null;
    render();
  }, BLINK_MS);
}

function nyRunde() {
  runde = lagRunde();
  visMelding("Trykk på de to tallene i hver sekskant som passer.");
  render();
}

function settRegneart(regneart) {
  if (regneart === innstillinger.regneart) return;
  innstillinger.regneart = regneart;
  nyRunde();
}

function settNivaa(nivaa) {
  if (nivaa === innstillinger.nivaa) return;
  innstillinger.nivaa = nivaa;
  nyRunde();
}

/* -----------------------------------------------------
   6. VISNING (SVG)
----------------------------------------------------- */

// Geometri (enheter i SVG-ens koordinatsystem). Sekskanten har
// spiss opp, med omkrets-radius R = 100.
const R = 100;
const FELT_AVSTAND = 63;
const FELT_RADIUS = 20;
const MAL_RADIUS = 27;
const MERKE_RADIUS = 10;

function svg(navn, attributter = {}) {
  const e = document.createElementNS(SVG_NS, navn);
  Object.entries(attributter).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

function vinkelPunkt(grader, avstand) {
  const rad = (grader * Math.PI) / 180;
  return [avstand * Math.cos(rad), avstand * Math.sin(rad)];
}

function sekskantPunkter() {
  return [-90, -30, 30, 90, 150, 210]
    .map((g) => vinkelPunkt(g, R).map((v) => v.toFixed(2)).join(","))
    .join(" ");
}

// Større tall får litt mindre skrift, så de passer i sirkelen.
function siffer(klasse, verdi, fra) {
  const antall = String(verdi).length;
  return antall >= fra ? `${klasse} d${antall}` : klasse;
}

function byggSekskant(hex, hexIdx) {
  const op = OPERASJONER[hex.regneart];
  const s = svg("svg", {
    viewBox: "-87 -100 174 200",
    class: "hex-svg",
    role: "group",
    "aria-label": `Sekskant ${hexIdx + 1}: ${op.navn} med måltall ${hex.mal}`,
  });
  const g = svg("g", { class: "hex" + (hex.lost ? " lost" : "") });

  g.appendChild(svg("polygon", { class: "hex-form", points: sekskantPunkter() }));
  g.appendChild(svg("circle", { class: "mal-ring", cx: 0, cy: 0, r: MAL_RADIUS }));

  const malTekst = svg("text", { class: siffer("mal-tekst", hex.mal, 3), x: 0, y: 1 });
  malTekst.textContent = hex.mal;
  g.appendChild(malTekst);

  // Regnetegnet i gapet mellom to tallfelt
  const [mx, my] = [-(FELT_AVSTAND - 2), 0];
  g.appendChild(svg("circle", { class: "op-merke", cx: mx, cy: my, r: MERKE_RADIUS }));
  const opTekst = svg("text", { class: "op-tekst", x: mx, y: my + 1 });
  opTekst.textContent = op.symbol;
  g.appendChild(opTekst);

  hex.tall.forEach((verdi, feltIdx) => {
    const [cx, cy] = vinkelPunkt(-90 + 60 * feltIdx, FELT_AVSTAND);

    let klasse = "felt";
    if (hex.funnet.includes(feltIdx)) klasse += " riktig";
    if (runde.valgt && runde.valgt.hex === hexIdx && runde.valgt.felt === feltIdx) klasse += " valgt";
    if (runde.blink && runde.blink.hex === hexIdx && runde.blink.felt.includes(feltIdx)) klasse += " feil";

    const felt = svg("g", {
      class: klasse,
      role: "button",
      tabindex: hex.lost ? "-1" : "0",
      "aria-label": `${verdi}`,
      "aria-disabled": hex.lost ? "true" : "false",
      "data-hex": hexIdx,
      "data-felt": feltIdx,
    });
    felt.appendChild(svg("circle", { class: "felt-sirkel", cx: cx.toFixed(2), cy: cy.toFixed(2), r: FELT_RADIUS }));
    const t = svg("text", { class: siffer("felt-tekst", verdi, 3), x: cx.toFixed(2), y: (cy + 1).toFixed(2) });
    t.textContent = verdi;
    felt.appendChild(t);

    felt.addEventListener("click", () => velgFelt(hexIdx, feltIdx));
    felt.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        velgFelt(hexIdx, feltIdx);
      }
    });

    g.appendChild(felt);
  });

  s.appendChild(g);
  return s;
}

function byggMidtBrikke(antallLost) {
  const s = svg("svg", { viewBox: "-87 -100 174 200", class: "hex-svg", "aria-hidden": "true" });
  s.appendChild(svg("polygon", { class: "midt-form", points: sekskantPunkter() }));
  const tall = svg("text", { class: "midt-tall", x: 0, y: -4 });
  tall.textContent = `${antallLost}/${ANTALL_SEKSKANTER}`;
  const etikett = svg("text", { class: "midt-etikett", x: 0, y: 26 });
  etikett.textContent = "løst";
  s.append(tall, etikett);
  return s;
}

function visMelding(tekst, klasse = "") {
  meldingTekst = tekst;
  meldingKlasse = klasse;
}

function tallomradeTekst() {
  if (innstillinger.regneart === "blandet") return "Alle fire regneartene, med tall tilpasset nivået.";
  const cfg = NIVAER[innstillinger.nivaa][innstillinger.regneart];
  const [lav, hoy] = cfg.tall;
  return innstillinger.regneart === "divisjon"
    ? `Tall opp til ${hoy}.`
    : `Tall fra ${lav} til ${hoy}.`;
}

function oppdaterValg() {
  document.querySelectorAll("[data-regneart]").forEach((k) => {
    const aktiv = k.dataset.regneart === innstillinger.regneart;
    k.classList.toggle("active", aktiv);
    k.setAttribute("aria-pressed", String(aktiv));
  });
  document.querySelectorAll("[data-nivaa]").forEach((k) => {
    const aktiv = k.dataset.nivaa === innstillinger.nivaa;
    k.classList.toggle("active", aktiv);
    k.setAttribute("aria-pressed", String(aktiv));
  });

  document.getElementById("valgInfo").textContent = tallomradeTekst();
  document.getElementById("oppgaveTekst").textContent =
    innstillinger.regneart === "blandet"
      ? "Se på regnetegnet ved siden av tallet i midten, og finn de to tallene som passer."
      : OPERASJONER[innstillinger.regneart].oppgave;
}

function render(fokus = null) {
  const ring = document.getElementById("ring");
  ring.innerHTML = "";

  runde.sekskanter.forEach((hex, idx) => {
    const wrap = document.createElement("div");
    wrap.className = `hex-wrap hex-${idx}`;
    wrap.appendChild(byggSekskant(hex, idx));
    ring.appendChild(wrap);
  });

  const antallLost = runde.sekskanter.filter((s) => s.lost).length;

  const midt = document.createElement("div");
  midt.className = "hex-wrap hex-midt";
  midt.appendChild(byggMidtBrikke(antallLost));
  ring.appendChild(midt);

  oppdaterValg();

  document.getElementById("losteTall").textContent = `${antallLost} / ${ANTALL_SEKSKANTER}`;
  document.getElementById("feilTall").textContent = runde.feil;

  const meldingEl = document.getElementById("message");
  meldingEl.textContent = meldingTekst;
  meldingEl.className = "message" + (meldingKlasse ? ` ${meldingKlasse}` : "");

  // Behold tastaturfokus på feltet som ble trykket på
  if (fokus) {
    const felt = ring.querySelector(`.felt[data-hex="${fokus.hex}"][data-felt="${fokus.felt}"]`);
    if (felt) felt.focus();
  }
}

/* -----------------------------------------------------
   7. OPPSTART
----------------------------------------------------- */

function initSpill() {
  document.getElementById("nyRundeBtn").addEventListener("click", nyRunde);
  document.querySelectorAll("[data-regneart]").forEach((k) =>
    k.addEventListener("click", () => settRegneart(k.dataset.regneart))
  );
  document.querySelectorAll("[data-nivaa]").forEach((k) =>
    k.addEventListener("click", () => settNivaa(k.dataset.nivaa))
  );
  nyRunde();
}

document.addEventListener("DOMContentLoaded", initSpill);
