/**
 * Random GDT file generator – produces format-conformant Gerätedatentransfer
 * data in several common encoding / layout variants.
 */

const GDT_FORMATS = {
  gdt21_crlf: {
    id: "gdt21_crlf",
    label: "GDT 2.1 (CRLF, mit Längenpräfix)",
    description: "Klassisch: 3-stellige Länge inkl. CR+LF, Windows-Zeilenenden",
    lineEnding: "\r\n",
    withLength: true,
    charset: "ISO8859-1",
    version: "02.10",
  },
  gdt21_lf: {
    id: "gdt21_lf",
    label: "GDT 2.1 (LF, mit Längenpräfix)",
    description: "Wie 2.1, aber Unix-Zeilenenden (LF); Länge zählt 1 Byte Ende",
    lineEnding: "\n",
    withLength: true,
    charset: "ISO8859-1",
    version: "02.10",
  },
  gdt21_utf8: {
    id: "gdt21_utf8",
    label: "GDT 2.1 (CRLF, UTF-8 / Umlaute)",
    description: "Zeichensatz-Feld UTF-8, Inhalte mit Umlauten",
    lineEnding: "\r\n",
    withLength: true,
    charset: "UTF-8",
    version: "02.10",
    preferUmlauts: true,
  },
  gdt_bare: {
    id: "gdt_bare",
    label: "Ohne Längenpräfix (Feld-ID + Inhalt)",
    description: "Manche Exporte: nur 4-stellige Feldkennung + Inhalt",
    lineEnding: "\r\n",
    withLength: false,
    charset: "ISO8859-1",
    version: "02.10",
  },
  gdt_multi: {
    id: "gdt_multi",
    label: "Mehrere Sätze (6301 + 6310)",
    description: "Stammdaten und Messergebnis in einer Datei",
    lineEnding: "\r\n",
    withLength: true,
    charset: "ISO8859-1",
    version: "02.10",
    multiSatz: true,
  },
  gdt_no_8100: {
    id: "gdt_no_8100",
    label: "Ohne Feld 8100 (Satzlänge)",
    description: "Konforme Felder, aber ohne optionale Satzlängen-Angabe",
    lineEnding: "\r\n",
    withLength: true,
    charset: "ISO8859-1",
    version: "02.10",
    omitSatzlaenge: true,
  },
};

const LAST_NAMES = [
  "Mueller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner",
  "Becker", "Schulz", "Hoffmann", "Koch", "Richter", "Klein", "Wolf",
  "Neumann", "Schwarz", "Zimmermann", "Braun", "Krueger", "Hofmann",
];

const LAST_NAMES_UMLAUT = [
  "Müller", "Schröder", "Böhm", "Gärtner", "Kühn", "Jäger", "Bäcker",
  "Händler", "König", "Groß", "Weiß", "Strauß", "Fröhlich", "Döring",
];

const FIRST_M = ["Max", "Paul", "Leon", "Felix", "Jonas", "Lukas", "Tim", "Noah", "Ben", "Elias"];
const FIRST_W = ["Anna", "Emma", "Mia", "Sophia", "Hannah", "Lina", "Marie", "Lea", "Clara", "Erika"];
const FIRST_UMLAUT_M = ["Jürgen", "Björn", "Günter", "Rüdiger", "Sören"];
const FIRST_UMLAUT_W = ["Renate", "Gabi", "Sigrid", "Käte", "Inge"];

const STREETS = [
  "Hauptstrasse 12", "Bahnhofstrasse 3", "Gartenweg 7", "Lindenallee 22",
  "Schulstrasse 5", "Ringstrasse 18", "Am Markt 1", "Bergweg 9",
];

const STREETS_UMLAUT = [
  "Mühlenstraße 4", "Königsweg 11", "Bäckerstraße 8", "Grüner Weg 2",
];

const CITIES = [
  "10115 Berlin", "80331 Muenchen", "50667 Koeln", "20095 Hamburg",
  "60311 Frankfurt", "70173 Stuttgart", "01067 Dresden", "04109 Leipzig",
];

const CITIES_UMLAUT = [
  "80331 München", "50667 Köln", "90402 Nürnberg", "99084 Erfurt",
];

const DEVICES = [
  { id: "RR_SYS", name: "Blutdruck systolisch", unit: "mmHg", min: 100, max: 160, decimals: 0 },
  { id: "RR_DIA", name: "Blutdruck diastolisch", unit: "mmHg", min: 60, max: 100, decimals: 0 },
  { id: "HF", name: "Herzfrequenz", unit: "1/min", min: 50, max: 110, decimals: 0 },
  { id: "SPO2", name: "Sauerstoffsaettigung", unit: "%", min: 92, max: 100, decimals: 0 },
  { id: "TEMP", name: "Koerpertemperatur", unit: "C", min: 36.1, max: 38.5, decimals: 1 },
  { id: "GLU", name: "Blutzucker", unit: "mg/dl", min: 70, max: 180, decimals: 0 },
  { id: "GEW", name: "Gewicht", unit: "kg", min: 50, max: 120, decimals: 1 },
  { id: "GRO", name: "Groesse", unit: "cm", min: 150, max: 195, decimals: 0 },
];

const SENDER_IDS = ["PRAXIS01", "LABOR_NW", "KARDIO_A", "HAUSARZT", "GERAET_X"];
const RECEIVER_IDS = ["PVS_MAIN", "EMPFANG1", "ARCHIV", "ZENTRALE"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

/** DDMMYYYY */
function randomBirthDate() {
  const year = randInt(1940, 2010);
  const month = randInt(1, 12);
  const day = randInt(1, 28);
  return `${pad2(day)}${pad2(month)}${year}`;
}

/** DDMMYYYY today-ish */
function randomExamDate() {
  const year = 2026;
  const month = randInt(1, 7);
  const day = randInt(1, 28);
  return `${pad2(day)}${pad2(month)}${year}`;
}

function randomTime() {
  return `${pad2(randInt(7, 18))}${pad2(randInt(0, 59))}`;
}

function randomPatientId() {
  return `P-${randInt(1000, 9999)}`;
}

function randomPatient(preferUmlauts) {
  const female = Math.random() < 0.5;
  const lasts = preferUmlauts ? LAST_NAMES_UMLAUT : LAST_NAMES;
  const firsts = preferUmlauts
    ? female
      ? FIRST_UMLAUT_W.concat(FIRST_W)
      : FIRST_UMLAUT_M.concat(FIRST_M)
    : female
      ? FIRST_W
      : FIRST_M;

  return {
    id: randomPatientId(),
    lastName: pick(lasts),
    firstName: pick(firsts),
    birth: randomBirthDate(),
    sex: female ? "2" : "1",
    street: pick(preferUmlauts ? STREETS_UMLAUT : STREETS),
    city: pick(preferUmlauts ? CITIES_UMLAUT : CITIES),
  };
}

/**
 * Encode one GDT field line.
 * Length (when used) = 3 (len digits) + 4 (field id) + content + lineEnding length.
 */
function encodeField(fieldId, content, format) {
  const id = String(fieldId).padStart(4, "0");
  const value = content == null ? "" : String(content);
  const ending = format.lineEnding;

  if (!format.withLength) {
    return id + value + ending;
  }

  const totalLen = 3 + 4 + value.length + ending.length;
  if (totalLen > 999) {
    throw new Error(`Feld ${id} zu lang (${totalLen})`);
  }
  return pad3(totalLen) + id + value + ending;
}

/**
 * Build a sentence (Satz) from ordered field pairs [id, content].
 * Optionally inserts 8100 with total sentence length as second field.
 */
function buildSentence(fields, format) {
  const with8100 = !format.omitSatzlaenge;
  let ordered = fields.slice();

  if (with8100) {
    // Placeholder; recalculate after encoding
    const without = fields.filter(([id]) => id !== "8100");
    // Build once without 8100 to compute size, then insert 8100 after 8000
    const probe = without.map(([id, val]) => encodeField(id, val, format)).join("");
    // 8100 line itself must be counted: typical content is 5 digits for total length
    // Iterate: total = probe + length of 8100 field line
    let satzLen = probe.length;
    let lenStr = String(satzLen);
    // Refine: adding 8100 increases total
    for (let i = 0; i < 4; i++) {
      const line8100 = encodeField("8100", lenStr, format);
      const total = probe.length + line8100.length;
      const next = String(total);
      if (next === lenStr && total === satzLen) break;
      // When digit count of length changes, recompute
      lenStr = String(probe.length + encodeField("8100", next, format).length);
      satzLen = probe.length + encodeField("8100", lenStr, format).length;
      lenStr = String(satzLen);
    }

    ordered = [];
    let inserted = false;
    for (const pair of without) {
      ordered.push(pair);
      if (pair[0] === "8000" && !inserted) {
        ordered.push(["8100", lenStr]);
        inserted = true;
      }
    }
    if (!inserted) ordered.unshift(["8100", lenStr]);
  }

  return ordered.map(([id, val]) => encodeField(id, val, format)).join("");
}

function headerFields(format, satzart, patient) {
  const fields = [
    ["8000", satzart],
    ["9218", format.version],
    ["8315", pick(RECEIVER_IDS)],
    ["8316", pick(SENDER_IDS)],
    ["9206", format.charset],
    ["3000", patient.id],
    ["3101", patient.lastName],
    ["3102", patient.firstName],
    ["3103", patient.birth],
    ["3110", patient.sex],
  ];

  if (Math.random() < 0.7) {
    fields.push(["3107", patient.street]);
    fields.push(["3106", patient.city]);
  }

  return fields;
}

/** Satz 6301 – Stammdaten / Patient */
function buildSatz6301(format, patient) {
  const fields = headerFields(format, "6301", patient);
  fields.push(["2002", randomExamDate()]);
  fields.push(["2003", randomTime()]);
  if (Math.random() < 0.5) {
    fields.push(["3622", String(randInt(155, 195))]);
    fields.push(["3623", (randInt(500, 1100) / 10).toFixed(1)]);
  }
  return buildSentence(fields, format);
}

/** Satz 6302 – Untersuchungsanforderung */
function buildSatz6302(format, patient) {
  const fields = headerFields(format, "6302", patient);
  fields.push(["2002", randomExamDate()]);
  fields.push(["2003", randomTime()]);
  fields.push(["8410", pick(DEVICES).id]);
  fields.push(["8411", pick(DEVICES).name]);
  fields.push(["6220", "Bitte Messung durchfuehren."]);
  return buildSentence(fields, format);
}

/** Satz 6310 – Messergebnisse */
function buildSatz6310(format, patient) {
  const fields = headerFields(format, "6310", patient);
  fields.push(["2002", randomExamDate()]);
  fields.push(["2003", randomTime()]);

  const count = randInt(2, 4);
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let dev = pick(DEVICES);
    let guard = 0;
    while (used.has(dev.id) && guard++ < 10) dev = pick(DEVICES);
    used.add(dev.id);

    const raw = dev.min + Math.random() * (dev.max - dev.min);
    const value =
      dev.decimals === 0 ? String(Math.round(raw)) : raw.toFixed(dev.decimals);

    fields.push(["8410", dev.id]);
    fields.push(["8411", dev.name]);
    fields.push(["8420", value]);
    fields.push(["8421", dev.unit]);
  }

  const comments = [
    "Messung unauffaellig.",
    "Werte im Referenzbereich.",
    "Kontrolle in 3 Monaten empfohlen.",
    "Technisch einwandfreie Messung.",
  ];
  fields.push(["6220", pick(comments)]);
  return buildSentence(fields, format);
}

function listFormats() {
  return Object.values(GDT_FORMATS);
}

/**
 * Generate a random GDT file.
 * @param {string} [formatId] - specific format id, or "random" / omit for random
 * @returns {{ text: string, format: object, fileName: string, satzarten: string[] }}
 */
function generateRandomGdt(formatId) {
  let format;
  if (!formatId || formatId === "random") {
    format = pick(Object.values(GDT_FORMATS));
  } else {
    format = GDT_FORMATS[formatId];
    if (!format) throw new Error(`Unbekanntes Format: ${formatId}`);
  }

  const patient = randomPatient(!!format.preferUmlauts);
  let text = "";
  const satzarten = [];

  if (format.multiSatz) {
    text += buildSatz6301(format, patient);
    text += buildSatz6310(format, patient);
    satzarten.push("6301", "6310");
  } else {
    const builders = [
      { art: "6301", fn: buildSatz6301 },
      { art: "6302", fn: buildSatz6302 },
      { art: "6310", fn: buildSatz6310 },
    ];
    const choice = pick(builders);
    text += choice.fn(format, patient);
    satzarten.push(choice.art);
  }

  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const fileName = `gdt_${format.id}_${patient.id}_${stamp}.gdt`;

  return {
    text,
    format,
    fileName,
    satzarten,
    patient,
  };
}

// Export for browser (global) and optional module use
if (typeof window !== "undefined") {
  window.GDT_FORMATS = GDT_FORMATS;
  window.generateRandomGdt = generateRandomGdt;
  window.listGdtFormats = listFormats;
}
