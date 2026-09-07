/**
 * Stateful mock data. Issue #10 chose mock data over waiting for the backend,
 * and issue #16 still owns the real contract.
 *
 * Volumes are deliberately small. The association receives Applications in
 * dozens, not thousands — the roughly thousand emails the client described
 * (`C2`) are the Backlog, which the dashboard does not touch.
 */

import type { Application, Category, Owner } from '@/domain/application';
import ashtonBlackwell from '@/images/ashton-blackwell.webp';
import { MILLISECONDS_PER_DAY } from '@/utils/dates';

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
    name: 'Sonstiges',
    description: 'Für alle, die noch nicht wissen, wo sie helfen möchten.',
    active: true,
  },
];

/**
 * `staff-1` is the signed-in Staff member of `currentStaffMember.ts` and
 * carries the same photo; `staff-2` has none, which is the case the
 * Zuständigkeit column falls back to initials for.
 */
export const mockOwners: Owner[] = [
  { id: 'staff-1', name: 'Ashton Blackwell', avatar: ashtonBlackwell },
  { id: 'staff-2', name: 'Samuel Adeyemi' },
];

type Seed = Omit<
  Application,
  'id' | 'receivedAt' | 'consent' | 'discardedAt'
> & {
  /** Whole days before the reference date the Application arrived. */
  daysAgo: number;
};

const seeds: Seed[] = [
  {
    applicantName: 'Mara Weber',
    email: 'mara.weber@example.org',
    categoryId: 'social-media',
    weeklyAvailability: 4,
    status: 'new',
    ownerId: null,
    message:
      'Ich arbeite seit zwei Jahren in der Social-Media-Redaktion eines Vereins und würde gern bei euch mithelfen.',
    internalNotes: '',
    daysAgo: 0,
  },
  {
    applicantName: 'Jonas Krüger',
    email: 'j.krueger@example.org',
    categoryId: 'legal',
    weeklyAvailability: 2,
    status: 'new',
    ownerId: null,
    message:
      'Ich bin Volljurist und kann euch bei Fragen zu Persönlichkeitsrecht unterstützen.',
    internalNotes: '',
    daysAgo: 1,
  },
  {
    applicantName: 'Lea Fischer',
    email: 'lea.fischer@example.org',
    categoryId: 'editorial',
    weeklyAvailability: 6,
    status: 'in-review',
    ownerId: 'staff-1',
    message: 'Ich schreibe gern und hätte Zeit für die Öffentlichkeitsarbeit.',
    internalNotes: 'Schreibprobe angefragt.',
    daysAgo: 3,
  },
  {
    applicantName: 'Tobias Hoffmann',
    email: 'tobias.hoffmann@example.org',
    categoryId: 'social-media',
    weeklyAvailability: 3,
    status: 'intro-booked',
    ownerId: 'staff-2',
    message: 'Ich bin über Instagram auf euch gestoßen.',
    internalNotes: 'Info-Runde am 12.09.',
    daysAgo: 5,
  },
  {
    applicantName: 'Aylin Demir',
    email: 'aylin.demir@example.org',
    categoryId: 'other',
    weeklyAvailability: 1,
    status: 'new',
    ownerId: null,
    message: 'Ich weiß noch nicht genau, wo ich helfen kann.',
    internalNotes: '',
    daysAgo: 9,
  },
  {
    applicantName: 'Peter Schmitt',
    email: 'p.schmitt@example.org',
    categoryId: 'editorial',
    weeklyAvailability: 5,
    status: 'waitlisted',
    ownerId: 'staff-1',
    message: 'Ich bin Rentner und habe viel Zeit.',
    internalNotes: 'Warteliste, bis die Redaktion wieder Kapazität hat.',
    daysAgo: 12,
  },
  {
    applicantName: 'Nina Baumann',
    email: 'nina.baumann@example.org',
    categoryId: 'social-media',
    weeklyAvailability: 8,
    status: 'active',
    ownerId: 'staff-2',
    message: 'Ich möchte die Aktionsgruppe bei Kampagnen unterstützen.',
    internalNotes: 'Onboarding abgeschlossen, betreut von Nina H.',
    daysAgo: 18,
  },
  {
    applicantName: 'Christoph Vogel',
    email: 'c.vogel@example.org',
    categoryId: 'legal',
    weeklyAvailability: 2,
    status: 'declined',
    ownerId: 'staff-1',
    message: 'Ich hätte Interesse an einer bezahlten Stelle.',
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
    const receivedAt = new Date(
      now.getTime() - daysAgo * MILLISECONDS_PER_DAY,
    ).toISOString();

    return {
      ...seed,
      id: `application-${String(index + 1)}`,
      receivedAt,
      // Every seed is in the working list; discarding happens in the session
      // (`A16`), so nothing here is stamped as discarded.
      discardedAt: null,
      consent: {
        givenAt: receivedAt,
        privacyPolicyVersion: '2026-05',
      },
    };
  });
}
