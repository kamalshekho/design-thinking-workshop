/**
 * One Application, in the shape the width allows (issue #109): from 1024 px
 * the drawer beside the list, below it a page of its own (`ApplicationPage`)
 * that puts becoming the Owner and changing the Status first (`A29`).
 */

import { useBreakpoint } from '@/hooks/use-breakpoint';

import type { ApplicationDrawerProps } from './ApplicationDrawer';
import { ApplicationDrawer } from './ApplicationDrawer';
import { ApplicationPage } from './ApplicationPage';

export type ApplicationDetailProps = ApplicationDrawerProps & {
  /** The signed-in Staff member, whom "Übernehmen" makes the Owner. */
  staffMemberId: string;
};

export function ApplicationDetail({
  staffMemberId,
  ...props
}: ApplicationDetailProps) {
  const lg = useBreakpoint('lg');

  return lg ? (
    <ApplicationDrawer {...props} />
  ) : (
    <ApplicationPage {...props} staffMemberId={staffMemberId} />
  );
}
