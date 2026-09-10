/* =====================================================
   TALLMÅL – et regnespill
   -----------------------------------------------------
   Spillet gir deg 6 tall og et måltall. Du kombinerer to
   og to tall med +, −, × eller ÷ helt til du (helst)
   treffer måltallet. Fem oppgaver per runde, opptil
   3 stjerner per oppgave.
===================================================== */

const ANTALL_OPPGAVER = 5;
const MAKS_STJERNER_PER_OPPGAVE = 3;

// De tre vanskelighetsgradene. "operatorer" styrer både hvilke
// regneoperasjoner generatoren bruker for å lage løsbare oppgaver,
// og hvilke operator-knapper som vises for spilleren.
const NIVAER = {
  enkel: {
    navn: "Enkel",
    antallGrunntall: 4,
    grunntallMin: 0,
    grunntallMax: 100,
    operatorer: ["+", "−"],
    maltallMin: 5,
    maltallMaks: 200,
  },
  middels: {
    navn: "Middels",
    antallGrunntall: 6,
    grunntallMin: 1,
    grunntallMax: 20,
    operatorer: ["+", "−", "×", "÷"],
    maltallMin: 50,
    maltallMaks: 999,
  },
  vanskelig: {
    navn: "Vanskelig",
    antallGrunntall: 6,
    grunntallMin: 1,
    grunntallMax: 100,
    operatorer: ["+", "−", "×", "÷"],
    maltallMin: 200,
    maltallMaks: 999,
  },
};

let tileIdTeller = 0;
let oppgaver = [];
let aktivIndeks = 0;
let aktivtNivaNokkel = null;

/* -----------------------------------------------------
   1. PUSLESPILL-GENERERING
   Vi bygger baklengs: start med tilfeldige grunntall,
   slå dem sammen to og to med regneoperasjonene som er
   tillatt på nivået, til vi sitter igjen med ett tall.
   Det tallet blir måltallet, så vi vet sikkert at
   oppgaven kan løses.
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

// Prøv å finne en gyldig utregning mellom to tall, begrenset til
// operatorene som er tillatt på det valgte nivået.
// Returnerer et tall eller null hvis ingen tillatt operasjon passer.
function finnGyldigUtregning(a, b, tillatteOperatorer) {
  const kandidater = [];

  if (tillatteOperatorer.includes("+")) {
    kandidater.push(a + b);
  }

  if (tillatteOperatorer.includes("−") && a !== b) {
    kandidater.push(Math.abs(a - b));
  }

  if (tillatteOperatorer.includes("×")) {
    const produkt = a * b;
    if (produkt <= 5000) {
      kandidater.push(produkt);
    }
  }

  if (tillatteOperatorer.includes("÷")) {
    const [storst, minst] = a > b ? [a, b] : [b, a];
    if (minst > 1 && storst % minst === 0) {
      kandidater.push(storst / minst);
    }
  }

  if (kandidater.length === 0) return null;
  return kandidater[tilfeldigHeltall(0, kandidater.length - 1)];
}

function lagEnOppgave(niva) {
  for (let forsok = 0; forsok < 300; forsok++) {
    const grunntall = Array.from({ length: niva.antallGrunntall }, () =>
      tilfeldigHeltall(niva.grunntallMin, niva.grunntallMax)
    );
    let arbeidstall = [...grunntall];

    while (arbeidstall.length > 1) {
      const rekkefolge = stokk(arbeidstall.map((_, i) => i));
      const i = rekkefolge[0];
      const j = rekkefolge[1];
      const a = arbeidstall[i];
      const b = arbeidstall[j];
      const resultat = finnGyldigUtregning(a, b, niva.operatorer);

      if (resultat === null) continue;

      arbeidstall = arbeidstall.filter((_, idx) => idx !== i && idx !== j);
      arbeidstall.push(resultat);
    }

    const maltall = arbeidstall[0];
    if (
      maltall >= niva.maltallMin &&
      maltall <= niva.maltallMaks &&
      Number.isInteger(maltall)
    ) {
      return { maltall, grunntall };
    }
  }

  // Reserveløsning i det (svært) usannsynlige tilfellet at vi ikke
  // fant en oppgave innenfor det ønskede området i tide.
  const reserveGrunntall = Array.from({ length: niva.antallGrunntall }, () =>
    tilfeldigHeltall(niva.grunntallMin, niva.grunntallMax)
  );
  const reserveMaltall = reserveGrunntall.reduce((sum, tall) => sum + tall, 0);
  return { maltall: reserveMaltall || 1, grunntall: reserveGrunntall };
}

function lagNyttSett(niva) {
  oppgaver = Array.from({ length: ANTALL_OPPGAVER }, () => {
    const { maltall, grunntall } = lagEnOppgave(niva);
    return lagOppgavetilstand(maltall, grunntall);
  });
}

function lagOppgavetilstand(maltall, grunntall) {
  return {
    maltall,
    original: grunntall,
    pool: grunntall.map((verdi) => lagBrikke(verdi, false)),
    historikk: [],
    angreStabel: [],
    valgtForste: null,
    valgtOperator: null,
    lost: false,
    ferdig: false,
    stjerner: null,
  };
}

function lagBrikke(verdi, erResultat) {
  tileIdTeller += 1;
  return { id: tileIdTeller, verdi, erResultat };
}

/* -----------------------------------------------------
   2. TILSTANDSHJELPERE
----------------------------------------------------- */

function aktivOppgave() {
  return oppgaver[aktivIndeks];
}

function taOgreSnapshot(oppgave) {
  oppgave.angreStabel.push({
    pool: oppgave.pool.map((b) => ({ ...b })),
    historikk: [...oppgave.historikk],
    lost: oppgave.lost,
    ferdig: oppgave.ferdig,
    stjerner: oppgave.stjerner,
  });
}

function nullstillValg(oppgave) {
  oppgave.valgtForste = null;
  oppgave.valgtOperator = null;
}

function beregnStjerner(diff) {
  if (diff === 0) return 3;
  if (diff <= 10) return 2;
  if (diff <= 25) return 1;
  return 0;
}

function naermesteAvstand(oppgave) {
  return oppgave.pool.reduce(
    (minsteAvstand, brikke) =>
      Math.min(minsteAvstand, Math.abs(brikke.verdi - oppgave.maltall)),
    Infinity
  );
}

/* -----------------------------------------------------
   3. SPILL-LOGIKK (brukerhandlinger)
----------------------------------------------------- */

function velgBrikke(id) {
  const oppgave = aktivOppgave();
  if (oppgave.ferdig) return;

  if (oppgave.valgtForste === null) {
    oppgave.valgtForste = id;
    visMelding("Velg en regneoperasjon.");
  } else if (oppgave.valgtForste === id) {
    nullstillValg(oppgave);
    visMelding("Velg et tall for å starte.");
  } else if (oppgave.valgtOperator === null) {
    oppgave.valgtForste = id;
    visMelding("Velg en regneoperasjon.");
  } else {
    utforUtregning(oppgave, oppgave.valgtForste, oppgave.valgtOperator, id);
    return; // utforUtregning kaller selv renderAlt()
  }

  renderAlt();
}

function velgOperator(op) {
  const oppgave = aktivOppgave();
  if (oppgave.ferdig || oppgave.valgtForste === null) return;

  oppgave.valgtOperator = oppgave.valgtOperator === op ? null : op;
  visMelding(
    oppgave.valgtOperator
      ? "Velg det andre tallet."
      : "Velg en regneoperasjon."
  );
  renderAlt();
}

function utforUtregning(oppgave, forsteId, operator, andreId) {
  const forste = oppgave.pool.find((b) => b.id === forsteId);
  const andre = oppgave.pool.find((b) => b.id === andreId);
  const a = forste.verdi;
  const b = andre.verdi;

  let resultat = null;
  let feilmelding = null;

  switch (operator) {
    case "+":
      resultat = a + b;
      break;
    case "×":
      resultat = a * b;
      break;
    case "−":
      if (a === b) {
        feilmelding = "Tallene er like – resultatet ville blitt 0, som ikke er tillatt.";
      } else if (a < b) {
        feilmelding = `Resultatet kan ikke bli negativt. Bytt rekkefølge: velg ${b} først, deretter ${a}.`;
      } else {
        resultat = a - b;
      }
      break;
    case "÷":
      if (a % b === 0 && a / b !== a) {
        resultat = a / b;
      } else if (a / b === a) {
        feilmelding = "Å dele på 1 gir ingen ny informasjon – velg noe annet.";
      } else {
        feilmelding = `${a} lar seg ikke dele på ${b} uten rest.`;
      }
      break;
  }

  if (feilmelding) {
    visMelding(feilmelding, "error");
    nullstillValg(oppgave);
    renderAlt();
    return;
  }

  taOgreSnapshot(oppgave);

  const symbolForHistorikk = operator;
  oppgave.historikk.push(`${a} ${symbolForHistorikk} ${b} = ${resultat}`);
  oppgave.pool = oppgave.pool.filter(
    (brikke) => brikke.id !== forsteId && brikke.id !== andreId
  );
  oppgave.pool.push(lagBrikke(resultat, true));
  nullstillValg(oppgave);

  if (resultat === oppgave.maltall) {
    oppgave.lost = true;
    oppgave.ferdig = true;
    oppgave.stjerner = MAKS_STJERNER_PER_OPPGAVE;
    visMelding(`Du traff måltallet ${oppgave.maltall}! ${"⭐".repeat(MAKS_STJERNER_PER_OPPGAVE)}`, "success");
  } else if (oppgave.pool.length === 1) {
    visMelding("Bare ett tall igjen. Avslutt oppgaven, eller start på nytt for å prøve en annen vei.");
  } else {
    visMelding("Velg neste tall for å fortsette.");
  }

  renderAlt();
}

function angreSisteTrekk() {
  const oppgave = aktivOppgave();
  if (oppgave.angreStabel.length === 0) return;

  const forrige = oppgave.angreStabel.pop();
  oppgave.pool = forrige.pool;
  oppgave.historikk = forrige.historikk;
  oppgave.lost = forrige.lost;
  oppgave.ferdig = forrige.ferdig;
  oppgave.stjerner = forrige.stjerner;
  nullstillValg(oppgave);
  visMelding("Trekket ble angret.");
  renderAlt();
}

function startPaaNytt() {
  const oppgave = aktivOppgave();
  oppgave.pool = oppgave.original.map((verdi) => lagBrikke(verdi, false));
  oppgave.historikk = [];
  oppgave.angreStabel = [];
  oppgave.lost = false;
  oppgave.ferdig = false;
  oppgave.stjerner = null;
  nullstillValg(oppgave);
  visMelding("Oppgaven er nullstilt. Velg et tall for å starte.");
  renderAlt();
}

function avsluttOppgave() {
  const oppgave = aktivOppgave();
  if (oppgave.ferdig) return;

  const diff = naermesteAvstand(oppgave);
  oppgave.stjerner = beregnStjerner(diff);
  oppgave.ferdig = true;
  nullstillValg(oppgave);

  if (oppgave.stjerner > 0) {
    visMelding(
      `Oppgave avsluttet: ${"⭐".repeat(oppgave.stjerner)}${"☆".repeat(MAKS_STJERNER_PER_OPPGAVE - oppgave.stjerner)} (avstand til måltall: ${diff})`,
      "success"
    );
  } else {
    visMelding(`Oppgave avsluttet uten stjerner (avstand til måltall: ${diff}).`, "error");
  }

  renderAlt();
}

function byttOppgave(indeks) {
  aktivIndeks = indeks;
  visMelding(
    aktivOppgave().ferdig
      ? "Denne oppgaven er allerede avsluttet. Start på nytt for å prøve igjen."
      : "Velg et tall for å starte."
  );
  renderAlt();
}

/* -----------------------------------------------------
   4. VISNING (rendering)
----------------------------------------------------- */

let meldingKlasse = "";
let meldingTekst = "Velg et tall for å starte.";

function visMelding(tekst, klasse = "") {
  meldingTekst = tekst;
  meldingKlasse = klasse;
}

function renderAlt() {
  renderFaner();
  renderOppgave();
  renderPoengtavle();
}

function renderFaner() {
  const fanerEl = document.getElementById("tabs");
  fanerEl.innerHTML = "";

  oppgaver.forEach((oppgave, indeks) => {
    const knapp = document.createElement("button");
    knapp.type = "button";
    knapp.className = "tab" + (indeks === aktivIndeks ? " active" : "") + (oppgave.ferdig ? " solved" : "");
    knapp.setAttribute("aria-selected", indeks === aktivIndeks ? "true" : "false");

    const tittel = document.createElement("span");
    tittel.textContent = `Oppgave ${indeks + 1}`;
    knapp.appendChild(tittel);

    const stjerneRad = document.createElement("span");
    stjerneRad.className = "tab-stars";
    stjerneRad.textContent = oppgave.ferdig
      ? "⭐".repeat(oppgave.stjerner) + "☆".repeat(MAKS_STJERNER_PER_OPPGAVE - oppgave.stjerner)
      : "· · ·";
    knapp.appendChild(stjerneRad);

    knapp.addEventListener("click", () => byttOppgave(indeks));
    fanerEl.appendChild(knapp);
  });
}

function renderOppgave() {
  const oppgave = aktivOppgave();

  document.getElementById("targetNumber").textContent = oppgave.maltall;
  document.getElementById("targetRing").classList.toggle("hit", oppgave.lost);

  renderBrikker(oppgave);
  renderOperatorer(oppgave);
  renderNaermesteHint(oppgave);
  renderHistorikk(oppgave);
  renderMelding();
  renderKontroller(oppgave);
}

function renderBrikker(oppgave) {
  const brikkeEl = document.getElementById("tiles");
  brikkeEl.innerHTML = "";

  oppgave.pool.forEach((brikke) => {
    const knapp = document.createElement("button");
    knapp.type = "button";
    knapp.className =
      "tile" +
      (brikke.erResultat ? " result" : "") +
      (oppgave.valgtForste === brikke.id ? " selected" : "");
    knapp.textContent = brikke.verdi;
    knapp.disabled = oppgave.ferdig;
    knapp.addEventListener("click", () => velgBrikke(brikke.id));
    brikkeEl.appendChild(knapp);
  });
}

function renderOperatorer(oppgave) {
  const niva = NIVAER[aktivtNivaNokkel];
  document.querySelectorAll(".op-btn").forEach((knapp) => {
    const op = knapp.dataset.op;
    const tillatt = niva.operatorer.includes(op);
    knapp.hidden = !tillatt;
    knapp.classList.toggle("selected", oppgave.valgtOperator === op);
    knapp.disabled = oppgave.ferdig || oppgave.valgtForste === null;
  });
}

function renderNaermesteHint(oppgave) {
  const hintEl = document.getElementById("closestHint");
  if (oppgave.ferdig) {
    hintEl.textContent = "";
    return;
  }
  const diff = naermesteAvstand(oppgave);
  if (diff === 0) {
    hintEl.textContent = "Måltallet er innen rekkevidde akkurat nå!";
  } else {
    const stjerner = beregnStjerner(diff);
    hintEl.textContent = `Nærmeste tall nå ligger ${diff} unna måltallet (${stjerner} stjerne${stjerner === 1 ? "" : "r"} hvis du avslutter her).`;
  }
}

function renderHistorikk(oppgave) {
  const historikkEl = document.getElementById("history");
  historikkEl.innerHTML = "";
  oppgave.historikk.forEach((linje) => {
    const el = document.createElement("li");
    el.textContent = linje;
    historikkEl.appendChild(el);
  });
  historikkEl.scrollTop = historikkEl.scrollHeight;
}

function renderMelding() {
  const meldingEl = document.getElementById("message");
  meldingEl.textContent = meldingTekst;
  meldingEl.className = "message" + (meldingKlasse ? ` ${meldingKlasse}` : "");
}

function renderKontroller(oppgave) {
  document.getElementById("undoBtn").disabled = oppgave.angreStabel.length === 0;
  document.getElementById("finishBtn").disabled = oppgave.ferdig;
}

function renderPoengtavle() {
  const totalStjerner = oppgaver.reduce((sum, o) => sum + (o.stjerner ?? 0), 0);
  const maksStjerner = ANTALL_OPPGAVER * MAKS_STJERNER_PER_OPPGAVE;
  const antallFerdig = oppgaver.filter((o) => o.ferdig).length;

  document.getElementById("totalStars").textContent =
    "⭐".repeat(totalStjerner) + "☆".repeat(maksStjerner - totalStjerner);
  document.getElementById("totalCount").textContent = `${antallFerdig} / ${ANTALL_OPPGAVER} oppgaver`;
}

/* -----------------------------------------------------
   5. OPPSTART
----------------------------------------------------- */

function settOppKnapper() {
  document.querySelectorAll(".op-btn").forEach((knapp) => {
    knapp.addEventListener("click", () => velgOperator(knapp.dataset.op));
  });
  document.getElementById("undoBtn").addEventListener("click", angreSisteTrekk);
  document.getElementById("resetBtn").addEventListener("click", startPaaNytt);
  document.getElementById("finishBtn").addEventListener("click", avsluttOppgave);

  document.querySelectorAll(".level-card").forEach((knapp) => {
    knapp.addEventListener("click", () => velgNiva(knapp.dataset.niva));
  });
  document.getElementById("changeLevelBtn").addEventListener("click", bytteNiva);
}

// Starter en ny runde på det valgte nivået og viser spillbrettet.
function velgNiva(nivaNokkel) {
  aktivtNivaNokkel = nivaNokkel;
  lagNyttSett(NIVAER[nivaNokkel]);
  aktivIndeks = 0;
  visMelding("Velg et tall for å starte.");

  document.getElementById("levelSelect").hidden = true;
  document.getElementById("board").hidden = false;

  renderAlt();
}

// Går tilbake til nivåvalget. Fremgangen i den pågående runden går tapt,
// så vi spør brukeren først.
function bytteNiva() {
  const bekreftet = window.confirm(
    "Bytte nivå starter en ny runde, og fremgangen i denne runden forsvinner. Fortsette?"
  );
  if (!bekreftet) return;

  document.getElementById("board").hidden = true;
  document.getElementById("levelSelect").hidden = false;
}

function initSpill() {
  settOppKnapper();
}

document.addEventListener("DOMContentLoaded", initSpill);
