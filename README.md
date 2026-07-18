# GDT Viewer

Einfache Website zum **Hochladen und Lesen von GDT-Dateien** (Gerätedatentransfer) im Browser.

## Features

- Drag & Drop oder Dateiauswahl (`.gdt` / `.txt`)
- Anzeige als Tabelle (Feld-ID, Bedeutung, Inhalt)
- Kurze Zusammenfassung (Patient, Geburtsdatum, …)
- Rohtext optional
- **Zufällige GDT erzeugen** in mehreren konformen Formaten (Download als `.gdt`)
- **100 % clientseitig** – Dateien werden nicht auf einen Server geladen

### Generator-Formate

| Format | Beschreibung |
|--------|--------------|
| GDT 2.1 CRLF / LF / UTF-8 | Satzlänge Feld **8100**, Version `02.10` |
| GDT 3.0 CRLF | Satzlänge Feld **8004**, Version `03.00` |
| GDT 3.1 CRLF / LF / UTF-8 | **8004**, `03.10`, E-Mail/Mobil, `6200` als YYYYMMDD |
| GDT 3.1 Mehrere Sätze | 6301 + 6310 mit 3.1-Feldern |
| Ohne Längenpräfix | nur Feld-ID + Inhalt |
| GDT 2.1 Mehrere Sätze | 6301 + 6310 |
| Ohne Feld 8100 | ohne optionale Satzlänge (2.1) |

Satzarten: **6301** (Stammdaten), **6302** (Anforderung), **6310** (Ergebnisse).

**2.x vs 3.x (kurz):** In 3.x steht die Satzlänge in Feld `8004` (statt `8100`), die Version in `9218` ist `03.00`/`03.10`, Feldlängen sind variabel, und u. a. `3618`/`3619` (Mobil/E-Mail) sowie getrennte PLZ/Ort (`3112`/`3113`) sind üblich.

## Lokal starten

Beliebigen statischen Server nutzen, z. B.:

```bash
cd gdt-viewer
python3 -m http.server 8080
```

Dann im Browser: <http://localhost:8080>

Oder einfach `index.html` öffnen (manche Browser schränken `file://` leicht ein – Server ist zuverlässiger).

## Online (GitHub Pages)

Nach dem Push ins öffentliche Repo:

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / Folder: `/ (root)`
4. Speichern – die Seite ist unter  
   `https://<user>.github.io/gdt-viewer/` erreichbar

## Hinweis Datenschutz

GDT-Dateien können Patientendaten enthalten. Die App speichert und überträgt nichts – trotzdem nur mit Dateien arbeiten, die du freigeben darfst.

## Lizenz

MIT
