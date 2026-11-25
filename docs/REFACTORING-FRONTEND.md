# Drei Refactorings im Frontend

| # | Problem | Vorher | Nachher |
|---|---|---|---|
| 1 | Bildschirme hängen voneinander ab | 17 | 0 Importe |
| 2 | Daten ungeprüft übernommen | 24 | 0 `as` |
| 3 | Code doppelt | 10 | 0 Klone |

Stand `origin/main` bei `43c2a87`, 25.11.2026. Details in
[`REFACTORING.md`](./REFACTORING.md).

## 1. Bildschirme unabhängig machen

**Problem:** Änderst du Anfragen, gehen drei andere Bildschirme kaputt.

**Lösung:** Geteilte Teile in eine gemeinsame Schicht (`14ec1f0`).

```mermaid
flowchart LR
    subgraph V["Vorher"]
        direction TB
        V1["Übersicht"] --> VA["Anfragen<br/>+ Liste, Drawer, Suche"]
        V2["Aussortiert"] --> VA
        V3["Kategorien"] --> VA
    end
    subgraph N["Nachher"]
        direction TB
        N1["Übersicht"] --> NS["Gemeinsame Schicht<br/>Liste, Drawer, Suche"]
        N0["Anfragen"] --> NS
        N2["Aussortiert"] --> NS
        N3["Kategorien"] --> NS
    end
    V ~~~ N

    classDef bad fill:#fde2e2,stroke:#c0392b,color:#000
    classDef good fill:#e3f6e8,stroke:#27ae60,color:#000
    class VA bad
    class NS good
```

**Besser:** Jeder Bildschirm steht für sich. ESLint verhindert den Rückfall.

## 2. Daten prüfen statt vertrauen

**Problem:** `as` glaubt dem Server blind. Falsche Daten stürzen erst später ab.

**Lösung:** Zod prüft jede Antwort beim Ankommen (`0764e9f`, `ea757c9`).

```mermaid
flowchart LR
    subgraph V["Vorher"]
        direction LR
        VS["Server"] --> VA["as<br/>keine Prüfung"] --> VK["Komponente"] --> VX["Absturz"]
    end
    subgraph N["Nachher"]
        direction LR
        NS["Server"] --> NZ{"Zod<br/>prüft"}
        NZ -->|ok| NK["Komponente"]
        NZ -->|falsch| NF["klare Fehlermeldung"]
    end
    V ~~~ N

    classDef bad fill:#fde2e2,stroke:#c0392b,color:#000
    classDef good fill:#e3f6e8,stroke:#27ae60,color:#000
    class VA,VX bad
    class NZ,NF good
```

**Besser:** Der Fehler zeigt sich dort, wo er entsteht. ESLint verbietet `as`.

## 3. Einmal schreiben statt kopieren

**Problem:** Button, Drawer und Dialog standen in zwei Bildschirmen doppelt.

**Lösung:** Ein gemeinsames Teil für beide (`9c53480`, `c4d9484`, `07b46ec`).

```mermaid
flowchart LR
    subgraph V["Vorher"]
        direction TB
        VA["Anfragen"] --- VC1["Button + Drawer + Dialog"]
        VO["Übersicht"] --- VC2["Button + Drawer + Dialog"]
    end
    subgraph N["Nachher"]
        direction TB
        NA["Anfragen"] --> NC["ApplicationActionControls"]
        NO["Übersicht"] --> NC
    end
    V ~~~ N

    classDef bad fill:#fde2e2,stroke:#c0392b,color:#000
    classDef good fill:#e3f6e8,stroke:#27ae60,color:#000
    class VC1,VC2 bad
    class NC good
```

**Besser:** Eine Änderung wirkt überall. `jscpd` meldet jeden neuen Klon.

## Das Muster hinter allen drei

```mermaid
flowchart LR
    A["Werkzeug findet<br/>das Problem"] --> B["Refactoring<br/>Verhalten gleich"] --> C["Tests grün"] --> D["Werkzeug in CI<br/>kein Rückfall"]

    classDef good fill:#e3f6e8,stroke:#27ae60,color:#000
    class D good
```
