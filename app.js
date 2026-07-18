/**
 * GDT Viewer – client-side parser for German Gerätedatentransfer files.
 * Files never leave the browser.
 */

const FIELD_LABELS = {
  "8000": "Satzidentifikation",
  "8001": "Version GDT",
  "8100": "Satzlänge",
  "8315": "GDT-ID Empfänger",
  "8316": "GDT-ID Sender",
  "9206": "Zeichensatz",
  "9218": "GDT-Version",
  "3000": "Patientennummer / ID",
  "3100": "Namenszusatz",
  "3101": "Name (Nachname)",
  "3102": "Vorname",
  "3103": "Geburtsdatum",
  "3104": "Titel",
  "3105": "Versichertennummer",
  "3106": "Wohnort",
  "3107": "Straße",
  "3108": "Versichertenart",
  "3110": "Geschlecht",
  "3622": "Größe (cm)",
  "3623": "Gewicht (kg)",
  "2002": "Tag der Erhebung",
  "2003": "Uhrzeit der Erhebung",
  "6200": "Befund",
  "6220": "Ergebnis-Text / Kommentar",
  "6227": "Dateiinhalt / Anhang",
  "6302": "Dateiformat",
  "6303": "Dateiname",
  "6304": "Dateiinhaltsbeschreibung",
  "6305": "Dateigröße",
  "8410": "Test-Ident / Kennung",
  "8411": "Testbezeichnung",
  "8420": "Ergebnis-Wert",
  "8421": "Einheit",
  "8432": "Probenmaterial",
  "8480": "Ergebnis-Text",
  "8490": "Normalwert-Text",
  "8501": "Befundart",
  "8504": "Ergebnis-Status",
};

const $ = (id) => document.getElementById(id);

const dropzone = $("dropzone");
const fileInput = $("fileInput");
const browseBtn = $("browseBtn");
const toolbar = $("toolbar");
const summary = $("summary");
const results = $("results");
const tableBody = $("tableBody");
const raw = $("raw");
const rawText = $("rawText");
const errorBox = $("error");
const fileNameEl = $("fileName");
const fileInfoEl = $("fileInfo");
const showRaw = $("showRaw");
const copyBtn = $("copyBtn");
const downloadBtn = $("downloadBtn");
const clearBtn = $("clearBtn");
const formatSelect = $("formatSelect");
const generateBtn = $("generateBtn");
const downloadGenBtn = $("downloadGenBtn");
const formatHint = $("formatHint");

let lastRecords = [];
let lastRaw = "";
let lastFileName = "export.gdt";
let lastGenerated = null;

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

/**
 * Parse a single GDT line.
 * Standard: first 3 digits = total line length (incl. CR/LF), next 4 = field ID.
 * Also accepts bare "FFFFcontent" lines without length prefix.
 */
function parseLine(line, lineNumber) {
  const cleaned = line.replace(/\r$/, "");
  if (!cleaned.trim()) return null;

  // Full form: LLLffffcontent
  if (/^\d{7}/.test(cleaned)) {
    const declaredLen = parseInt(cleaned.slice(0, 3), 10);
    const fieldId = cleaned.slice(3, 7);
    const content = cleaned.slice(7);
    return {
      line: lineNumber,
      fieldId,
      content,
      label: FIELD_LABELS[fieldId] || "Unbekanntes Feld",
      declaredLen,
      raw: cleaned,
    };
  }

  // Fallback: ffffcontent
  if (/^\d{4}/.test(cleaned)) {
    const fieldId = cleaned.slice(0, 4);
    const content = cleaned.slice(4);
    return {
      line: lineNumber,
      fieldId,
      content,
      label: FIELD_LABELS[fieldId] || "Unbekanntes Feld",
      declaredLen: null,
      raw: cleaned,
    };
  }

  return {
    line: lineNumber,
    fieldId: "—",
    content: cleaned,
    label: "Freitext / nicht erkannt",
    declaredLen: null,
    raw: cleaned,
  };
}

function parseGdt(text) {
  const normalized = text.replace(/^\uFEFF/, "");
  const lines = normalized.split(/\r\n|\n|\r/);
  const records = [];

  lines.forEach((line, idx) => {
    const rec = parseLine(line, idx + 1);
    if (rec) records.push(rec);
  });

  return { records, raw: normalized };
}

function findField(records, id) {
  const hit = records.find((r) => r.fieldId === id && r.content.trim());
  return hit ? hit.content.trim() : null;
}

function formatDate(value) {
  if (!value) return null;
  // DDMMYYYY or YYYYMMDD
  if (/^\d{8}$/.test(value)) {
    if (parseInt(value.slice(0, 2), 10) > 31) {
      // YYYYMMDD
      return `${value.slice(6, 8)}.${value.slice(4, 6)}.${value.slice(0, 4)}`;
    }
    return `${value.slice(0, 2)}.${value.slice(2, 4)}.${value.slice(4, 8)}`;
  }
  return value;
}

function buildSummary(records) {
  const lastName = findField(records, "3101");
  const firstName = findField(records, "3102");
  const patient =
    [lastName, firstName].filter(Boolean).join(", ") ||
    findField(records, "3000") ||
    "—";

  const birth = formatDate(findField(records, "3103")) || "—";
  const sexRaw = findField(records, "3110");
  const sexMap = { "1": "männlich", "2": "weiblich", M: "männlich", W: "weiblich", m: "männlich", w: "weiblich" };
  const sex = (sexRaw && (sexMap[sexRaw] || sexRaw)) || "—";
  const date = formatDate(findField(records, "2002")) || "—";
  const satz = findField(records, "8000") || "—";

  return [
    { label: "Patient", value: patient },
    { label: "Geburtsdatum", value: birth },
    { label: "Geschlecht", value: sex },
    { label: "Erhebungsdatum", value: date },
    { label: "Satzart", value: satz },
    { label: "Felder", value: String(records.length) },
  ];
}

function render(records, rawContent, fileMeta) {
  lastRecords = records;
  lastRaw = rawContent;
  lastFileName = fileMeta.name || "export.gdt";

  fileNameEl.textContent = lastFileName;
  const size = fileMeta.size != null ? fileMeta.size : new Blob([rawContent]).size;
  const kb = (size / 1024).toFixed(size < 1024 ? 2 : 1);
  const extra = fileMeta.extraInfo ? ` · ${fileMeta.extraInfo}` : "";
  fileInfoEl.textContent = `${kb} KB · ${records.length} Felder${extra}`;

  const cards = buildSummary(records);
  summary.innerHTML = cards
    .map(
      (c) => `
      <div class="summary-card">
        <span class="label">${escapeHtml(c.label)}</span>
        <span class="value">${escapeHtml(c.value)}</span>
      </div>`
    )
    .join("");

  tableBody.innerHTML = records
    .map(
      (r) => `
      <tr>
        <td class="col-line">${r.line}</td>
        <td class="col-id">${escapeHtml(r.fieldId)}</td>
        <td class="col-label">${escapeHtml(r.label)}</td>
        <td class="col-value">${escapeHtml(r.content)}</td>
      </tr>`
    )
    .join("");

  rawText.textContent = rawContent;

  toolbar.classList.remove("hidden");
  summary.classList.remove("hidden");
  results.classList.remove("hidden");
  raw.classList.toggle("hidden", !showRaw.checked);
  dropzone.classList.add("hidden");
  if (downloadBtn) downloadBtn.disabled = false;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function initFormatSelect() {
  if (!formatSelect || typeof listGdtFormats !== "function") return;
  for (const fmt of listGdtFormats()) {
    const opt = document.createElement("option");
    opt.value = fmt.id;
    opt.textContent = fmt.label;
    formatSelect.appendChild(opt);
  }
  updateFormatHint();
}

function updateFormatHint() {
  if (!formatHint || typeof GDT_FORMATS === "undefined") return;
  const id = formatSelect?.value;
  if (!id || id === "random") {
    formatHint.textContent =
      "Wählt zufällig eines der Formate und eine Satzart (6301 / 6302 / 6310).";
    return;
  }
  const fmt = GDT_FORMATS[id];
  formatHint.textContent = fmt ? fmt.description : "";
}

function runGenerate() {
  clearError();
  if (typeof generateRandomGdt !== "function") {
    showError("Generator nicht geladen (generator.js).");
    return;
  }
  try {
    const formatId = formatSelect?.value || "random";
    const gen = generateRandomGdt(formatId);
    lastGenerated = gen;

    const { records, raw: rawContent } = parseGdt(gen.text);
    if (!records.length) {
      showError("Generator lieferte keine lesbaren Felder.");
      return;
    }

    if (downloadGenBtn) downloadGenBtn.disabled = false;
    formatHint.textContent = `Erzeugt: ${gen.format.label} · Satzart(en) ${gen.satzarten.join(", ")} · ${gen.patient.lastName}, ${gen.patient.firstName}`;

    render(records, rawContent, {
      name: gen.fileName,
      size: new Blob([gen.text]).size,
      extraInfo: gen.format.id,
    });
  } catch (err) {
    showError(`Generator-Fehler: ${err.message || err}`);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function handleFile(file) {
  clearError();
  if (!file) return;

  const name = file.name.toLowerCase();
  if (!name.endsWith(".gdt") && !name.endsWith(".txt") && file.type && !file.type.startsWith("text")) {
    // still try – many GDT files have empty MIME
  }

  try {
    // Prefer Windows-1252 / ISO-8859-1 common in German medical exports; fallback UTF-8
    let text = await readAsText(file, "windows-1252");
    if (looksLikeMojibake(text)) {
      text = await readAsText(file, "utf-8");
    }

    const { records, raw: rawContent } = parseGdt(text);
    if (!records.length) {
      showError("Keine GDT-Felder erkannt. Ist die Datei leer oder im falschen Format?");
      return;
    }
    render(records, rawContent, file);
  } catch (err) {
    showError(`Datei konnte nicht gelesen werden: ${err.message || err}`);
  }
}

function looksLikeMojibake(text) {
  // Heuristic: lots of replacement chars
  return (text.match(/\uFFFD/g) || []).length > 2;
}

function readAsText(file, encoding) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Lesefehler"));
    reader.readAsText(file, encoding);
  });
}

function reset() {
  lastRecords = [];
  lastRaw = "";
  lastFileName = "export.gdt";
  lastGenerated = null;
  fileInput.value = "";
  tableBody.innerHTML = "";
  summary.innerHTML = "";
  rawText.textContent = "";
  toolbar.classList.add("hidden");
  summary.classList.add("hidden");
  results.classList.add("hidden");
  raw.classList.add("hidden");
  dropzone.classList.remove("hidden");
  if (downloadGenBtn) downloadGenBtn.disabled = !lastGenerated;
  if (downloadBtn) downloadBtn.disabled = true;
  clearError();
  updateFormatHint();
}

// Events
browseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  fileInput.click();
});

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) handleFile(file);
});

["dragenter", "dragover"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFile(file);
});

showRaw.addEventListener("change", () => {
  if (!lastRaw) return;
  raw.classList.toggle("hidden", !showRaw.checked);
});

clearBtn.addEventListener("click", reset);

copyBtn.addEventListener("click", async () => {
  if (!lastRecords.length) return;
  const tsv = [
    "Zeile\tFeld\tBedeutung\tInhalt",
    ...lastRecords.map((r) => `${r.line}\t${r.fieldId}\t${r.label}\t${r.content.replace(/\t/g, " ")}`),
  ].join("\n");
  try {
    await navigator.clipboard.writeText(tsv);
    copyBtn.textContent = "Kopiert!";
    setTimeout(() => {
      copyBtn.textContent = "Kopieren";
    }, 1500);
  } catch {
    showError("Zwischenablage nicht verfügbar.");
  }
});

if (downloadBtn) {
  downloadBtn.disabled = true;
  downloadBtn.addEventListener("click", () => {
    if (!lastRaw) return;
    downloadText(lastFileName.endsWith(".gdt") ? lastFileName : `${lastFileName}.gdt`, lastRaw);
  });
}

if (generateBtn) {
  generateBtn.addEventListener("click", runGenerate);
}

if (downloadGenBtn) {
  downloadGenBtn.addEventListener("click", () => {
    if (!lastGenerated) return;
    downloadText(lastGenerated.fileName, lastGenerated.text);
  });
}

if (formatSelect) {
  formatSelect.addEventListener("change", updateFormatHint);
}

initFormatSelect();

// Prevent browser from opening dropped files outside the zone
["dragover", "drop"].forEach((evt) => {
  window.addEventListener(evt, (e) => e.preventDefault());
});
