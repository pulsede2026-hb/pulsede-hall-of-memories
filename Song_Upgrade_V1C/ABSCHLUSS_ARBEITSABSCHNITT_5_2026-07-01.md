# PulseDE – Abschluss Arbeitsabschnitt 5

Datum: 01.07.2026  
Projekt: `Song_Upgrade_V1C`  
Status: technisch abgeschlossen, produktive Freigabe weiterhin offen

## Ergebnis

Das wiederverwendbare Song_Upgrade-Einpflege-Modul ist fertiggestellt. `tools/song-upgrade.mjs` liest den aktuellen Projektbestand, ermittelt die nächste sichere Songnummer und den nächsten Playlist-Index, prüft Kollisionen und erzeugt eine isolierte Testkopie sowie zwei getrennte Ausgabepakete. Der einfache Windows-Einstieg ist `START_EINPFLEGE.cmd`.

## Erfüllte Pflichtfunktionen

1. Dynamische Baseline aus Katalog, benötigten Hall-HTML-Dateien und Medienbestand.
2. Automatische Nummer nach Lückenregel: zuerst die kleinste vollständig freie Nummer bis einschließlich 59, danach ab 60 fortlaufend.
3. Kollisionserkennung für Titel, Nummern, Katalogdateien und Projektdateien; Konflikte führen zum sicheren Abbruch.
4. Neue Testkopie je Lauf; Originaldateien werden nur gelesen.
5. Ergänzung von Player, Coverliste, Sternliste, Explorer/HM und V1B-Katalog ohne Layoutumbau.
6. `github-paket/` enthält upload-/commit-vorbereitete Dateien, veröffentlicht aber nichts.
7. `lokales-upload-paket/` enthält die einheitlich benannten MP3-, JPG- und TXT-Dateien.
8. `integrationsbericht.json` und `DATEILISTE.json` dokumentieren Lauf, Sicherheit, Größen und SHA-256-Werte.

## Bedienung

1. Eingabeordner mit genau einer MP3, einer JPG/JPEG und einer nicht leeren TXT-Datei anlegen.
2. `START_EINPFLEGE.cmd` doppelklicken.
3. Eingabeordner, Titel, bestätigte HM-Nummern und Sternstatus eingeben.
4. Den neu erzeugten Ordner unter `runs/` öffnen.
5. In `testkopie/` über `START_LOKALTEST.cmd` prüfen.
6. Erst nach erfolgreicher praktischer Prüfung und ausdrücklicher Freigabe das `github-paket/` verwenden.

## Referenztest Song 59

Ausgabe: `runs/song-59-das-wir-gewinnt/`

- Baseline: 54 Songs
- automatisch vorgeschlagen: Nummer 59, Index 54, ID `song-55`
- HM: 01, 02, 03, 04, 05; Stern: Ja
- Testkatalog: 55 Songs
- Explorer: fünf Einträge, jeweils Index 54
- V1B: `55 von 55 Songs` und `Das WIR gewinnt` sichtbar
- Generatorprüfungen: 12 erfolgreich
- Dublettentest mit `Bleib bei mir`: korrekt abgebrochen

Dieser Referenzlauf entstand vor der anschließend beschlossenen Lückenregel und bleibt als technischer Integrationstest erhalten.

## Ergänzung: verbindliche Lückenregel

Nach vollständiger Prüfung des aktuellen produktiven Bestands lautet die derzeitige Vorschlagsreihenfolge:

`12 → 14 → 20 → 54 → 59 → 60`

Jeder neue Lauf liest den Bestand erneut. Eine Lücke wird nur verwendet, wenn die Nummer weder im Katalog und seinen Dateiverweisen noch in Player, Coverliste, Explorer oder einem MP3-/JPG-/TXT-Dateinamen aktiv vorkommt. Eine manuell abweichende Nummer wird abgelehnt. Der isolierte Nachweis liegt unter `runs/song-12-lueckenregel-testlauf/`; 14 Generatorprüfungen sind erfolgreich.

Die Browserumgebung meldete einmal einen `MutationObserver`-Fehler. Diese API kommt in keiner V1B-Projektdatei vor; die Anwendung lud Katalog und Song 59 vollständig. Der Befund ist daher als browserseitige Begleitmeldung dokumentiert.

## Geänderte oder neue Moduldateien

- `tools/song-upgrade.mjs`
- `START_EINPFLEGE.cmd`
- `tests/generator-tests.mjs`
- `README.md`
- diese Abschlussdokumentation
- Referenzlauf unter `runs/song-59-das-wir-gewinnt/`

## Sicherheitsstatus

- produktive Stammdateien und produktives `v1b/`: unverändert
- GitHub und Google Sites: unverändert
- Commit: keiner
- alle erzeugten Änderungen liegen unter `Song_Upgrade_V1C/`

Das `github-paket/` ist nur eine Vorbereitung. Es darf erst nach Haralds ausdrücklicher Freigabe übernommen, hochgeladen oder committed werden.
