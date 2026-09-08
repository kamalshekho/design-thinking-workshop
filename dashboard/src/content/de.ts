/**
 * Every German string a Staff member reads. The dashboard UI is German (`A6`,
 * ADR-0003); code, documents and the glossary stay English. This is the only
 * file in `dashboard/` allowed to hold applicant- or staff-facing German.
 */

import type {
  ApplicationStatus,
  ApplicationView,
  WeeklyTime,
} from '@/domain/application';
import { STALE_AFTER_DAYS } from '@/domain/application';

export const de = {
  association: 'ichbinhier',

  overview: {
    welcome: (name: string) => `Willkommen, ${name}!`,
    subtitle:
      'Hier siehst du alle Anfragen zur Vereinsarbeit und sonstigen Anfragen auf einen Blick.',
    stats: {
      new: {
        title: 'Neue Anfragen',
        hint: 'Noch nicht bearbeitet',
      },
      unassigned: {
        title: 'Ohne Zuständigkeit',
        hint: 'Warten auf eine zuständige Person',
      },
      stale: {
        title: 'Lange offen',
        hint: (days: number) => `Länger als ${String(days)} Tage offen`,
      },
    },
    openApplications: {
      title: 'Offene Anfragen',
      searchPlaceholder: 'Name oder E-Mail suchen',
      ownerLabel: 'Zuständigkeit',
      allCategories: 'Alle Kategorien',
      allOwners: 'Alle Zuständigen',
      empty: 'Keine offenen Anfragen.',
      noMatches: 'Keine passenden Anfragen.',
      count: (shown: number, total: number) =>
        `${String(shown)} von ${String(total)} offenen Anfragen`,
      viewAll: 'Alle offenen Anfragen ansehen',
    },
  },

  navigation: {
    label: 'Hauptnavigation',
    overview: 'Übersicht',
    applications: 'Anfragen',
    categories: 'Kategorien',
    /** The fourth screen: Discarded Applications (`A16`). */
    discarded: 'Aussortiert',
    collapse: 'Navigation einklappen',
    expand: 'Navigation ausklappen',
    openMenu: 'Navigationsmenü öffnen',
    closeMenu: 'Navigationsmenü schließen',
  },

  account: {
    menu: 'Kontomenü',
    viewProfile: 'Profil ansehen',
    settings: 'Einstellungen',
    signOut: 'Abmelden',
  },

  auth: {
    title: 'Anmelden',
    subtitle: 'Melde dich an, um die Anfragen aus dem Formular zu sehen.',
    emailLabel: 'E-Mail',
    emailPlaceholder: 'name@ichbinhier.example',
    passwordLabel: 'Passwort',
    submit: 'Anmelden',

    emailRequired: 'Bitte gib deine E-Mail-Adresse ein.',
    emailInvalid: 'Diese E-Mail-Adresse ist unvollständig.',
    passwordRequired: 'Bitte gib dein Passwort ein.',
    unknownAccount: 'Zu dieser E-Mail-Adresse gibt es kein Konto.',

    /**
     * Stated instead of a "Passwort vergessen?" link, because there is no
     * reset flow behind such a link — issue #16 owns the one that will be.
     */
    passwordResetHint:
      'Konten legt der Vorstand an, und er setzt auch Passwörter zurück.',
  },

  fields: {
    /** The password input's own visibility toggle, in every form. */
    togglePassword: 'Passwort anzeigen oder verbergen',
  },

  applications: {
    eyebrow: 'Engagement',
    title: 'Anfragen',
    subtitle: 'Anfragen aus dem Formular, nach Eingang sortiert.',
    count: (shown: number, total: number) =>
      `${String(shown)} von ${String(total)} Anfragen`,
    /**
     * Not "löschen": the action takes the Application out of the working list
     * and leaves it on the fourth screen (`A16`), and only the button there
     * really deletes. Names the Applicant, because every row carries this one
     * button and one label repeated eight times tells a screen reader nothing
     * about which row it is on.
     */
    discardOne: (name: string) => `Anfrage von ${name} aussortieren`,
    /** Bare while nothing is checked, counted once the selection is non-empty. */
    discardSelected: (count: number) =>
      count === 0 ? 'Aussortieren' : `Aussortieren (${String(count)})`,
    /**
     * Only the bulk action asks. A single row is one click from being back —
     * the fourth screen is the undo — while ticking rows and hitting the bar
     * moves several at once.
     */
    confirmDiscardSelected: (count: number) =>
      count === 1
        ? '1 markierte Anfrage aussortieren?'
        : `${String(count)} markierte Anfragen aussortieren?`,
  },

  discarded: {
    eyebrow: 'Ablage',
    title: 'Aussortierte Anfragen',
    subtitle:
      'Anfragen, die aus der Arbeitsliste aussortiert wurden. Sie bleiben mit Status, Zuständigkeit und Kategorie auf Ablage, bis sie wiederhergestellt oder endgültig gelöscht werden.',
    count: (shown: number, total: number) =>
      `${String(shown)} von ${String(total)} aussortierten Anfragen`,

    restore: 'Wiederherstellen',
    restoreOne: (name: string) => `Anfrage von ${name} wiederherstellen`,
    /** Bare while nothing is checked, counted once the selection is non-empty. */
    restoreSelected: (count: number) =>
      count === 0 ? 'Wiederherstellen' : `Wiederherstellen (${String(count)})`,

    erase: 'Endgültig löschen',
    eraseOne: (name: string) => `Anfrage von ${name} endgültig löschen`,
    eraseSelected: (count: number) =>
      count === 0
        ? 'Endgültig löschen'
        : `Endgültig löschen (${String(count)})`,
    /**
     * Both confirmations name the consequence: this is the only action in the
     * dashboard that erases what a person wrote, and there is no undo behind
     * it (`A16`).
     */
    confirmEraseOne: (name: string) =>
      `Anfrage von ${name} endgültig löschen? Das lässt sich nicht rückgängig machen.`,
    confirmEraseSelected: (count: number) =>
      count === 1
        ? '1 markierte Anfrage endgültig löschen? Das lässt sich nicht rückgängig machen.'
        : `${String(count)} markierte Anfragen endgültig löschen? Das lässt sich nicht rückgängig machen.`,

    empty: 'Nichts aussortiert.',
    emptyHint:
      'Hier liegen die Anfragen, die in „Anfragen“ aussortiert wurden.',
    noMatches: 'Keine aussortierte Anfrage entspricht dieser Suche.',
    noMatchesHint:
      'Suche zurücksetzen, um alle aussortierten Anfragen zu sehen.',
  },

  categories: {
    eyebrow: 'Formular',
    title: 'Kategorien',
    subtitle:
      'Die Auswahl, die Interessierte im Formular sehen. Eine Änderung hier wirkt sofort auf das Formular.',
    count: (shown: number, total: number) =>
      `${String(shown)} von ${String(total)} Kategorien`,

    summary: {
      total: 'Kategorien insgesamt',
      totalHint: 'Angelegt, aktiv oder nicht',
      active: 'Im Formular wählbar',
      activeHint: 'Aktive Kategorien',
      unused: 'Ohne Anfragen',
      unusedHint: 'Bisher nie ausgewählt',
    },

    views: {
      all: 'Alle',
      active: 'Aktiv',
      inactive: 'Inaktiv',
    },

    columns: {
      order: 'Reihenfolge',
      name: 'Kategorie',
      status: 'Im Formular',
      usage: 'Anfragen',
      actions: 'Aktionen',
    },

    tableTitle: 'Reihenfolge im Formular',
    tableDescription:
      'Interessierte sehen die aktiven Kategorien in genau dieser Reihenfolge.',

    add: 'Kategorie hinzufügen',
    edit: 'Bearbeiten',
    editOne: (name: string) => `${name} bearbeiten`,
    delete: 'Löschen',
    deleteOne: (name: string) => `${name} löschen`,
    confirmDelete: (name: string) => `Kategorie „${name}“ wirklich löschen?`,

    moveUp: 'Nach oben',
    moveDown: 'Nach unten',
    moveUpOne: (name: string) => `${name} nach oben schieben`,
    moveDownOne: (name: string) => `${name} nach unten schieben`,
    /** Reordering needs the whole list; search and the tabs hide part of it. */
    moveBlocked: 'Reihenfolge nur in der Ansicht „Alle“ ohne Suche änderbar',

    active: 'Aktiv',
    inactive: 'Inaktiv',
    toggleOne: (name: string) => `${name} im Formular anzeigen`,

    noDescription: 'Keine Beschreibung',
    usageCount: (count: number) =>
      count === 1 ? '1 Anfrage' : `${String(count)} Anfragen`,
    /** A Category behind Applications is deactivated, never deleted (`A15`). */
    deleteBlocked: (count: number) =>
      count === 1
        ? 'Nicht löschbar: 1 Anfrage nutzt diese Kategorie. Stattdessen deaktivieren.'
        : `Nicht löschbar: ${String(count)} Anfragen nutzen diese Kategorie. Stattdessen deaktivieren.`,

    empty: 'Noch keine Kategorie angelegt.',
    emptyHint:
      'Lege die erste Kategorie an, damit das Formular eine Auswahl anbieten kann.',
    noMatches: 'Keine Kategorie entspricht dieser Auswahl.',
    noMatchesHint: 'Andere Ansicht wählen oder die Suche zurücksetzen.',

    dialog: {
      createTitle: 'Neue Kategorie',
      createSubtitle:
        'Sobald sie aktiv ist, erscheint sie unten im Formular zur Auswahl.',
      editTitle: 'Kategorie bearbeiten',
      editSubtitle:
        'Änderungen gelten für das Formular und für alle bestehenden Anfragen.',
      name: 'Name',
      namePlaceholder: 'z. B. Social Media',
      nameHint: 'So steht die Kategorie im Formular.',
      description: 'Beschreibung',
      descriptionPlaceholder: 'Kurz erklärt, wofür diese Kategorie steht.',
      descriptionHint: 'Optional, eine Zeile unter dem Namen.',
      activeLabel: 'Im Formular anzeigen',
      activeHint:
        'Inaktive Kategorien bleiben erhalten, sind aber nicht wählbar.',
      preview: 'So sieht es im Formular aus',
      previewInactive: 'Inaktiv — im Formular derzeit ausgeblendet.',
      create: 'Anlegen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      close: 'Schließen',
      nameRequired: 'Bitte einen Namen angeben.',
      nameTaken: 'Es gibt bereits eine Kategorie mit diesem Namen.',
      remaining: (count: number) => `Noch ${String(count)} Zeichen`,
    },
  },

  /**
   * The pager under a table. The clone ships these strings in English inside
   * the component; they are copy a Staff member reads, so they live here and
   * `PaginationCardDefault` takes them from this file.
   */
  pagination: {
    previous: 'Zurück',
    next: 'Weiter',
    /**
     * The narrow-screen counter, where the numbered pages do not fit. Kept as
     * one sentence with placeholders rather than three fragments the component
     * concatenates — the pager sets both numbers in medium weight, and it is
     * the sentence, not the code, that decides where they sit.
     */
    position: 'Seite {page} von {total}',
    /** Accessible name of a numbered page button. */
    page: (page: number) => `Seite ${String(page)}`,
  },

  views: {
    all: 'Alle',
    unassigned: 'Nicht zugewiesen',
    stale: `Älter als ${String(STALE_AFTER_DAYS)} Tage`,
  } satisfies Record<ApplicationView, string>,

  filters: {
    search: 'Suche',
    category: 'Kategorie',
    status: 'Status',
    all: 'Alle',
    filter: 'Filter',
    apply: 'Anwenden',
    reset: 'Filter zurücksetzen',
  },

  columns: {
    submittedAt: 'Eingegangen',
    name: 'Name',
    email: 'E-Mail',
    category: 'Kategorie',
    weeklyTime: 'Verfügbarkeit',
    status: 'Status',
    owner: 'Zuständig',
    actions: 'Aktionen',
  },

  statuses: {
    NEW: 'Neu',
    IN_REVIEW: 'In Prüfung',
    INTRO_BOOKED: 'Info-Runde gebucht',
    ACTIVE: 'Aktiv',
    WAITLISTED: 'Warteliste',
    DECLINED: 'Abgelehnt',
  } satisfies Record<ApplicationStatus, string>,

  /**
   * The four time bands the form offers, worded as the form words them
   * (`frontend/src/content/de.ts`) so a Staff member reads what the Applicant
   * picked. They carry no "pro Woche" suffix: `IRREGULAR` is not a quantity,
   * and the Verfügbarkeit column and the drawer's chip already say which
   * question these answer.
   */
  weeklyTimes: {
    HOURS_1_2: '1–2 Stunden',
    HOURS_3_5: '3–5 Stunden',
    HOURS_5_PLUS: 'mehr als 5 Stunden',
    IRREGULAR: 'unregelmäßig, projektweise',
  } satisfies Record<WeeklyTime, string>,

  application: {
    unassigned: 'Nicht zugewiesen',
    daysAgo: (days: number) =>
      days === 0
        ? 'Heute'
        : days === 1
          ? 'Gestern'
          : `vor ${String(days)} Tagen`,
  },

  detail: {
    title: 'Anfrage',
    close: 'Schließen',
    /** Heading over the two controls that change the Application itself. */
    workflow: 'Workflow',
    about: 'Nachricht',
    internalNotes: 'Interne Notizen',
    /** Stated as a hint, not as placeholder text, so it survives the first keystroke. */
    notesHint: 'Nur für Mitarbeitende sichtbar',
    notesPlaceholder: 'Notiz hinzufügen …',
    consent: 'Einwilligung',
    consentAt: 'Erteilt am',
    consentTextVersion: 'Datenschutzerklärung',
    consentTextVersionValue: (version: string) => `Version ${version}`,
    owner: 'Zuständig',
    status: 'Status',
    writeMail: 'E-Mail schreiben',
    copyMail: 'E-Mail-Adresse kopieren',
    /** The footer button's visible label; `copyMail` stays its accessible name. */
    copyMailShort: 'Kopieren',
    copied: 'Kopiert',
  },
} as const;
