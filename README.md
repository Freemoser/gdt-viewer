# GDT Viewer

Einfache Website zum **Hochladen und Lesen von GDT-Dateien** (Gerätedatentransfer) im Browser.

## Features

- Drag & Drop oder Dateiauswahl (`.gdt` / `.txt`)
- Anzeige als Tabelle (Feld-ID, Bedeutung, Inhalt)
- Kurze Zusammenfassung (Patient, Geburtsdatum, …)
- Rohtext optional
- **100 % clientseitig** – Dateien werden nicht auf einen Server geladen

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
