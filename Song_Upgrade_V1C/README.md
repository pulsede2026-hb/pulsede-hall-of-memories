# PulseDE Song Upgrade V1C

## Projektgrundsätze

- So einfach wie möglich.
- So hilfreich wie nötig.
- Dauerhaft kostenlos.
- Für Menschen mit und ohne Behinderung.

Song_Upgrade_V1C ist ein internes Prüfmodul für genau ein neues Songpaket. Es erkennt Pflichtangaben, übernimmt den Songtitel aus den vorhandenen Dateien, analysiert den TXT-Inhalt für begründete HM-Vorschläge und schlägt sichere, einheitliche Zieldateinamen vor.

## Projektstand 01.07.2026

- Arbeitsabschnitt 3 abgeschlossen: Baseline, Nummern, Indizes, Dateien und Kollisionen analysiert.
- Arbeitsabschnitt 4 abgeschlossen: Song 59 in einer isolierten Testkopie integriert und praktisch validiert.
- erster vollständiger Praxistest erfolgreich.
- lokaler Testserver und GoFullPage-Nachweis vorhanden.
- Arbeitsabschnitt 5 abgeschlossen: wiederverwendbarer Generator, Testkopie und Ausgabepakete fertiggestellt.
- keine GitHub-, Google-Sites- oder Produktivänderung durchgeführt.

## Aktueller Umfang

- ein Songtitel
- ein JPG beziehungsweise JPEG
- eine MP3
- eine nicht leere TXT-Datei
- mindestens eine HM-Zuordnung 01–06
- Ja/Nein für „Behinderung / Lebenserfahrung“
- Ampelstatus: 🟢 vollständig oder 🔴 unvollständig
- Zielnamenvorschlag im Format `NN_Titel.ext`
- automatische Titelpriorität: Titel-Zeile, TXT-Dateiname, JPG-Dateiname, MP3-Dateiname
- manuelle Titelkorrektur mit Wiederherstellung des Vorschlags
- HM-Vorschläge ausschließlich aus dem Songtext
- sichtbare Trefferbegründung für jeden HM-Vorschlag
- getrennte manuelle HM-Auswahl und zwingende Bestätigung durch Harald
- kompakte Exportzeile als Vorschau

Nicht enthalten sind automatische Veröffentlichung, Mehrfachpakete oder TTS.

Die Referenzintegration aus Arbeitsabschnitt 4 bleibt unter `test-integration-song-59/` erhalten. Der automatische Referenzlauf aus Arbeitsabschnitt 5 liegt unter `runs/song-59-das-wir-gewinnt/`.

## Einpflege starten

Am einfachsten `START_EINPFLEGE.cmd` doppelklicken. Dadurch startet ausschließlich lokal die Song-Leitzentrale V2 im Browser. Es gibt keine Konsoleneingaben mehr.

In der V2 wird nur ein Songordner gewählt. Er muss genau eine MP3-, eine JPG/JPEG- und eine TXT-Datei enthalten. Titel, Dateien, nächste sichere Nummer und HM-Vorschläge werden automatisch erkannt. Der Benutzer bestätigt lediglich die HM-Auswahl und – als nicht zuverlässig aus dem Text ableitbare Sicherheitsangabe – den Sternstatus.

Alternativ in der Konsole:

    node tools/song-upgrade.mjs --input "C:\Pfad\zum\Songpaket" --title "Neuer Titel" --hm "01,03,05" --featured ja

Der Generator liest die Baseline bei jedem Lauf neu. Bis einschließlich Nummer 59 verwendet er zuerst die kleinste vollständig freie Lückennummer; danach wird ab 60 fortlaufend die nächste freie Nummer gewählt. Eine Nummer gilt bereits als belegt, wenn sie im Katalog, in dessen Dateiverweisen, in Player oder Coverliste, in einem Explorer-Label oder in einem MP3-/JPG-/TXT-Dateinamen vorkommt. Bei einem Konflikt oder einer abweichend erzwungenen Nummer wird ohne Ausgabe abgebrochen.

Jeder erfolgreiche Lauf erzeugt ausschließlich unter `runs/` eine Testkopie, ein GitHub-Paket, ein lokales Upload-Paket, einen Integrationsbericht und eine SHA-256-Dateiliste. Nichts wird automatisch veröffentlicht, hochgeladen oder committed.

Die lokale Bedienbrücke `tools/v2-server.mjs` bindet nur an `127.0.0.1`, akzeptiert ausschließlich lokale Browseraufrufe und reicht bestätigte Eingaben an denselben Generator weiter. Sie enthält keine zweite Generatorlogik.

## Lokal starten

Die Anwendung verwendet ES-Module und muss über einen lokalen HTTP-Server geöffnet werden:

    python -m http.server 8000

Danach:

- Anwendung: http://127.0.0.1:8000/Song_Upgrade_V1C/
- Tests: http://127.0.0.1:8000/Song_Upgrade_V1C/tests/test-runner.html

## Prüfregeln

Ein Paket ist nur 🟢 vollständig, wenn:

1. der bereinigte Titel nicht leer ist,
2. JPG/JPEG, MP3 und TXT vorhanden und nicht leer sind,
3. JPG und MP3 erkennbare Dateisignaturen besitzen,
4. TXT sichtbaren Text enthält,
5. mindestens eine gültige HM-Kategorie gewählt wurde,
6. die HM-Auswahl ausdrücklich durch Harald bestätigt wurde,
7. die Ja/Nein-Kennzeichnung gesetzt ist.

.jpeg wird als JPEG erkannt und kann vollständig sein; der vorgeschlagene Zielstandard bleibt .jpg. Umlaute und Leerzeichen bleiben erhalten. Für Windows unzulässige Dateinamenzeichen werden aus dem Zielnamen entfernt.

## Titelautomatik

Die Priorität lautet:

1. Titel: oder Songtitel: innerhalb der TXT-Datei
2. TXT-Dateiname
3. JPG-Dateiname
4. MP3-Dateiname

Die erste Liedzeile wird nicht als Titel interpretiert. Das sichtbare Titelfeld bleibt als Korrekturmöglichkeit erhalten. Eine manuelle Änderung wird nicht durch spätere Dateiereignisse überschrieben.

## HM-Vorschläge und Bestätigung

Die Themenregeln stehen transparent in data/hm-rules.json. Die Analyse verwendet ausschließlich den TXT-Inhalt und niemals den Songtitel. Bereits ein eindeutiger Themenbegriff kann einen Vorschlag auslösen; der erkannte Themenbegriff wird als Begründung angezeigt.

Vorschläge markieren keine endgültige Zuordnung. Harald muss sie übernehmen oder manuell korrigieren und anschließend ausdrücklich bestätigen. Jede spätere Änderung der Auswahl hebt die Bestätigung wieder auf.

Nur ein vollständig geprüftes und bestätigtes Paket erhält eine Exportzeilen-Vorschau:

    59 Das WIR gewinnt * | HM: 010203

In diesem Arbeitsabschnitt wird daraus noch keine Download-Datei erzeugt.

## Module

- js/config.js: Startnummer, HM-Kategorien und erlaubte Endungen
- js/core/naming-service.js: Titelbereinigung und Zielnamen
- js/core/hm-service.js: gültige, sortierte HM-Auswahl und HM-Code
- js/core/package-validator.js: vollständige Paketprüfung
- js/core/title-service.js: Titelpriorität und Quellenkennzeichnung
- js/core/hm-suggestion-service.js: TXT-basierte HM-Vorschläge mit Treffern
- js/core/export-preview-service.js: kompakte Vorschauzeile
- data/hm-rules.json: transparente HM-Themenregeln
- js/app.js: Anbindung an die Arbeitsoberfläche
- tests/core-tests.js: neun ursprüngliche Kernfälle
- tests/title-service-tests.js: sechs Titeltests
- tests/hm-suggestion-tests.js: sieben HM- und Vorschautests

## Teststand

Am 29.06.2026 wurden 22 von 22 Tests erfolgreich ausgeführt. Alle neun Tests aus Arbeitsabschnitt 1 bestehen weiterhin. Titelpriorität, sechs HM-Bereiche, Trefferbegründung, Bestätigungspflicht und Exportzeilen-Vorschau sind abgedeckt. Die Oberfläche wurde zusätzlich im Browser geprüft. Es traten keine Browserwarnungen oder Skriptfehler auf.

Am 01.07.2026 bestanden zunächst 12 Generatorprüfungen und der Referenzlauf für Song 59. Nach Haralds neuer Lückenregel bestehen 14 Generatorprüfungen. Der aktuelle Bestand schlägt korrekt Nummer 12 vor; Nummer 60 wird abgelehnt, solange eine sichere Lücke bis 59 vorhanden ist.

Der V2-Referenztest bestätigte zusätzlich: automatische Baseline-Anzeige, Ablehnung eines unvollständigen API-Pakets, erfolgreicher Generatorlauf für Nummer 12, vollständige V1B-Anzeige mit 55 Songs und sechs fehlerfrei geladenen HM-Covern. Die V2-Startseite enthält genau eine Ordnerauswahl und keine einzelnen Datei-Inputs.

## Schutzregeln

Das Modul arbeitet ausschließlich im eigenen Ordner. Es verändert keine Hall-, Player-, Explorer-, Songtext-, Medien- oder V1B-Dateien und erstellt keine Commits.

## Gemeinsame Arbeitsweise

**Vorschlagen → Abstimmen → Freigabe → Umsetzen**

## Verbindlicher Standardablauf für neue Songs

1. MP3, JPG, TXT und Sternstatus übernehmen; Nummern, Namen und Kollisionen prüfen.
2. ausschließlich den Songtext für HM-Vorschläge analysieren und Haralds Bestätigung einholen.
3. eine isolierte Testkopie mit Player, Cover, Songtext, Explorer und V1B-Katalog erzeugen.
4. den vollständigen lokalen Pflichtest über HTTP durchführen.
5. GitHub erst nach erfolgreichem Lokaltest und Haralds ausdrücklicher Freigabe vorbereiten.
6. Google Sites anschließend neu laden und praktisch kontrollieren.

Der vollständige Abschluss von Arbeitsabschnitt 5 steht in `ABSCHLUSS_ARBEITSABSCHNITT_5_2026-07-01.md`.

## Lokaler Integrationscheck Song 12 am 02.07.2026

Eine vollständige isolierte Integrationskopie aus Mutterbestand und vorhandenem `github-paket` wurde unter `runs/song-12-das-wir-gewinnt/lokale-integrationskopie/` aufgebaut. Medien, HOME, Player, Explorer, Songtext und Katalog sind gemeinsam vorhanden.

Der Praxistest ist noch nicht bestanden: Explorer und Katalog verweisen auf Playlist-Index 54, der erzeugte Player enthält durch ein doppeltes Komma jedoch eine leere Arrayposition 54 und legt Song 12 auf Position 55. Die Reparatur bleibt bis zu Haralds ausdrücklicher Freigabe offen. Einzelheiten: `runs/song-12-das-wir-gewinnt/LOKALE_INTEGRATION_2026-07-02.md`.

Nach ausdrücklicher Freigabe wurden die beiden Array-Trennzeichen ausschließlich in der isolierten Integrationskopie korrigiert. Der lokale Nachtest ist bestanden: Song 12 wird in HM 01 erkannt, Player und Cover verwenden Index 54, die MP3 wird geladen und der vollständige TXT-Songtext erscheint rechts. Der Generator und der Projektstamm sind weiterhin unverändert. Vor einer späteren Übernahme muss die Ursache noch dauerhaft im Generator korrigiert, getestet und ein neues Übergabepaket erzeugt werden.

## Dauerhafte Umsetzung am 02.07.2026

- Array-Ergänzung im Generator dauerhaft korrigiert; keine leere Playlist-/Coverposition mehr.
- Generatorprüfungen dynamisch auf die jeweilige Baseline umgestellt: 29 erfolgreich.
- Dauerhafte Reservierungsdatei `data/reservations.json` ergänzt; aktive Reservierungen fließen in die Nummernprüfung ein.
- Song 12 ist reserviert; nächste sichere Nummer ist 14.
- Freigabevorschau zeigt Song, sämtliche HM-Bereiche und neun getrennte Statusstufen.
- HM-Bestätigung bleibt manuell; Reservierung, Stammübernahme und GitHub-Freigabe bleiben getrennt.
- `*` kennzeichnet ausschließlich Songs über Behinderung oder Songs mit Lebenserfahrung.
- Song 12 wurde nach vollständigem Lokaltest gemeinsam mit MP3, JPG, TXT, Player, Explorer, Songtext und Katalog in den lokalen Projektstamm übernommen.
- Projektstamm: 55 Songs; Song 12 auf Playlist-Index 54; HM 01, 02, 03, 04 und 06.
- 22 von 22 Kerntests und 29 Generatorprüfungen erfolgreich; Browseroberfläche ohne Projektfehler.

Reproduzierbare große Laufordner unter `runs/` bleiben lokal und werden nicht nach GitHub übertragen.

GitHub wurde am 02.07.2026 erfolgreich aktualisiert. Hauptcommit: `b604cea744b894ba7882317047910da4d8f3ea82`. Google Sites selbst wurde nicht bearbeitet; der abschließende Hard-Reload-Test erfolgt durch Harald.

## Stabilisierung am 03.07.2026

Die Ursache des falschen ersten Titels bei „Gesamten Ordner abspielen“ lag ausschließlich in der sichtbaren HTML-Reihenfolge: Neue Explorer-Einträge werden oberhalb der Bestandsliste angezeigt und wurden bisher in genau dieser Reihenfolge an den Player übergeben. Eine besondere Neu-, Run- oder Freigabemarkierung war nicht beteiligt.

`getSelectedIndexes()` sortiert die ausgewählten Playlist-Indizes jetzt numerisch aufsteigend, bevor die Warteschlange an den Player gesendet wird. Die optische Position neuer Songs bleibt unverändert. Im isolierten Regressionstest stand der neue Testtitel oben mit Index 55; HM 01 startete trotzdem korrekt mit `01 Nordlichter` und Index 0.

Die vorhandene Freigabevorschau wurde ohne Architekturumbau um eine dauerhaft sichtbare Schritt-für-Schritt-Führung ergänzt. Sie zeigt erledigte Schritte, den aktuell offenen Schritt, den Folgeschritt und den vollständigen Abschluss. Beim Start wird eine noch nicht abgeschlossene Reservierung wieder aufgenommen. Im aktuellen Stand erkennt sie Song 14 korrekt als offenen Vorgang: Stammübernahme freigegeben, Stammübernahme noch auszuführen.

Prüfstand: 29 Generatorprüfungen und 22 von 22 Kerntests erfolgreich. Die vorhandenen Nutzeränderungen an Songtext 12 und der Reservierung von Song 14 wurden bewahrt.
