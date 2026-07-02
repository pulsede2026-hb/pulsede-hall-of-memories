# PulseDE V1B Leitzentrale

V1B ist eine eigenständige Steuer- und Übersichtsseite neben der bestehenden Hall of Memories. Die vorhandenen Hall-Dateien werden ausschließlich über relative Pfade eingebettet und nicht verändert.

## Lokal starten

Da `catalog.json` per `fetch` geladen wird, muss das Repository über einen lokalen Webserver bereitgestellt werden:

```powershell
python -m http.server 8000
```

Danach `http://localhost:8000/v1b/` öffnen. Unter GitHub Pages funktioniert derselbe relative Aufbau ohne Anpassung.

## Module

- `app.js` startet Katalog, Status und Hall-Bridge.
- `catalog-service.js` lädt und validiert den lesenden Bestand.
- `hm-bridge.js` vermittelt das bestehende `HM_*`-Nachrichtenprotokoll.
- `state.js` hält den flüchtigen Zustand.
- `ui.js` rendert Katalog, Filter und Navigation.

## Bestehende Hall-Komponenten

- `../PulseDE_HM_PLAYER_LINKS_A1_V4.html`
- `../PulseDE_HM_SONGTEXT_RECHTS_A1_V4.html`
- `../PulseDE_HM_EXPLORER_TEST_V1.html`

Stufe 1 ist lesend. Es gibt keine Upload-, Lösch-, Umbenennungs- oder Katalog-Schreibfunktion.
