/**
 * Test fixtures, and nothing else (`README.md`, "How `src/` is laid out").
 *
 * These were the dashboard's data until the screens read the backend (issue
 * #37); what is left of them is what a test renders a screen with. They are
 * shaped exactly like the wire, so a fixture cannot pass a test that the real
 * response would fail.
 *
 * Volumes are deliberately small. The association receives Applications in
 * dozens, not thousands — the roughly thousand emails the client described
 * (`C2`) are the Backlog, which the dashboard does not touch.
 */

import type { Application, Category, Owner } from '@/domain/application';
import type { StaffMember } from '@/domain/staffMember';
import { MILLISECONDS_PER_DAY } from '@/utils/dates';

/** The Staff member a test signs in as; `mockOwners` knows them as `staff-1`. */
export const mockStaffMember: StaffMember = {
  id: 'staff-1',
  name: 'Ashton Blackwell',
  email: 'ashton.blackwell@ichbinhier.online',
};

/**
 * The four Categories `A7` records, in the order the form offers them. The
 * descriptions are ours, not the association's — `A15` says why they exist and
 * what they are for.
 */
export const mockCategories: Category[] = [
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Kommentare moderieren, Kampagnen begleiten, Kanäle betreuen.',
    active: true,
  },
  {
    id: 'editorial',
    name: 'Redaktion / Öffentlichkeitsarbeit',
    description: 'Texte schreiben, redigieren und Pressearbeit unterstützen.',
    active: true,
  },
  {
    id: 'legal',
    name: 'Rechtliche Unterstützung',
    description: 'Fragen zu Persönlichkeitsrecht und Strafanzeigen einordnen.',
    active: true,
  },
  {
    id: 'other',
    name: 'Etwas anderes',
    description: 'Für alle, die noch nicht wissen, wo sie helfen möchten.',
    active: true,
  },
];

/** `staff-1` is `mockStaffMember`, the Staff member a test signs in as. */
export const mockOwners: Owner[] = [
  { id: 'staff-1', name: 'Ashton Blackwell' },
  { id: 'staff-2', name: 'Samuel Adeyemi' },
];

type Seed = Omit<
  Application,
  'id' | 'submittedAt' | 'consentAt' | 'consentTextVersion' | 'discardedAt'
> & {
  /** Whole days before the reference date the Application arrived. */
  daysAgo: number;
};

const seeds: Seed[] = [
  {
    name: 'Mara Weber',
    email: 'mara.weber@example.org',
    categoryId: 'social-media',
    weeklyTime: 'HOURS_3_5',
    status: 'NEW',
    ownerId: null,
    about:
      'Ich arbeite seit zwei Jahren in der Social-Media-Redaktion eines Vereins und würde gern bei euch mithelfen.',
    internalNotes: '',
    daysAgo: 0,
  },
  {
    name: 'Jonas Krüger',
    email: 'j.krueger@example.org',
    categoryId: 'legal',
    weeklyTime: 'HOURS_1_2',
    status: 'NEW',
    ownerId: null,
    about:
      'Ich bin Volljurist und kann euch bei Fragen zu Persönlichkeitsrecht unterstützen.',
    internalNotes: '',
    daysAgo: 1,
  },
  {
    name: 'Lea Fischer',
    email: 'lea.fischer@example.org',
    categoryId: 'editorial',
    weeklyTime: 'HOURS_5_PLUS',
    status: 'IN_REVIEW',
    ownerId: 'staff-1',
    about: 'Ich schreibe gern und hätte Zeit für die Öffentlichkeitsarbeit.',
    internalNotes: 'Schreibprobe angefragt.',
    daysAgo: 3,
  },
  {
    name: 'Tobias Hoffmann',
    email: 'tobias.hoffmann@example.org',
    categoryId: 'social-media',
    weeklyTime: 'HOURS_3_5',
    status: 'INTRO_BOOKED',
    ownerId: 'staff-2',
    about: 'Ich bin über Instagram auf euch gestoßen.',
    internalNotes: 'Info-Runde am 12.09.',
    daysAgo: 5,
  },
  {
    name: 'Aylin Demir',
    email: 'aylin.demir@example.org',
    categoryId: 'other',
    weeklyTime: 'IRREGULAR',
    status: 'NEW',
    ownerId: null,
    about: 'Ich weiß noch nicht genau, wo ich helfen kann.',
    internalNotes: '',
    daysAgo: 9,
  },
  {
    name: 'Peter Schmitt',
    email: 'p.schmitt@example.org',
    categoryId: 'editorial',
    weeklyTime: 'HOURS_3_5',
    status: 'WAITLISTED',
    ownerId: 'staff-1',
    about: 'Ich bin Rentner und habe viel Zeit.',
    internalNotes: 'Warteliste, bis die Redaktion wieder Kapazität hat.',
    daysAgo: 12,
  },
  {
    name: 'Nina Baumann',
    email: 'nina.baumann@example.org',
    categoryId: 'social-media',
    weeklyTime: 'HOURS_5_PLUS',
    status: 'ACTIVE',
    ownerId: 'staff-2',
    about: 'Ich möchte die Aktionsgruppe bei Kampagnen unterstützen.',
    internalNotes: 'Onboarding abgeschlossen, betreut von Nina H.',
    daysAgo: 18,
  },
  {
    name: 'Christoph Vogel',
    email: 'c.vogel@example.org',
    categoryId: 'legal',
    weeklyTime: 'HOURS_1_2',
    status: 'DECLINED',
    ownerId: 'staff-1',
    about: 'Ich hätte Interesse an einer bezahlten Stelle.',
    internalNotes: 'Kein Ehrenamt gesucht — abgelehnt und weiterverwiesen.',
    daysAgo: 21,
  },
];

/**
 * Builds the mock set relative to a reference date, so the stale view has
 * something to show whenever the prototype is opened.
 */
export function createMockApplications(now: Date): Application[] {
  return seeds.map(({ daysAgo, ...seed }, index) => {
    const submittedAt = new Date(
      now.getTime() - daysAgo * MILLISECONDS_PER_DAY,
    ).toISOString();

    return {
      ...seed,
      id: `application-${String(index + 1)}`,
      submittedAt,
      // Every seed is in the working list; discarding happens in the session
      // (`A16`), so nothing here is stamped as discarded.
      discardedAt: null,
      consentAt: submittedAt,
      consentTextVersion: '2026-09',
    };
  });
}
