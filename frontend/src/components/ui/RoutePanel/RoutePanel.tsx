import { useId } from 'react';

import iconGroup from '../../../assets/icons/icon_group.png';
import iconHeart from '../../../assets/icons/icon_heart.png';
import { Button } from '../Button/Button';
import styles from './RoutePanel.module.css';

export type RoutePanelVariant = 'community' | 'supporting-member';

interface RoutePanelProps {
  variant: RoutePanelVariant;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}

/**
 * Domain-free direct-route outcome panel matching the Figma Route Panel.
 *
 * Callers provide the final copy and destination; the component only owns the
 * visual variant, matching exported icon and CTA presentation.
 */
export function RoutePanel({
  variant,
  title,
  body,
  actionLabel,
  actionHref,
}: RoutePanelProps) {
  const titleId = useId();
  const isCommunity = variant === 'community';
  const panelClassName = isCommunity
    ? styles.community
    : styles.supportingMember;
  const icon = isCommunity ? iconGroup : iconHeart;
  const buttonVariant = isCommunity ? 'route-blue' : 'route-purple';

  return (
    <section aria-labelledby={titleId} className={panelClassName}>
      <img alt="" className={styles.icon} src={icon} />
      <div className={styles.content}>
        <h2 className={styles.title} id={titleId}>
          {title}
        </h2>
        <p className={styles.body}>{body}</p>
        <Button href={actionHref} showArrow variant={buttonVariant}>
          {actionLabel}
        </Button>
      </div>
    </section>
  );
}
