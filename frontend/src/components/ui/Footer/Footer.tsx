import iconArrowUp from '../../../assets/icons/icon_arrow_up.svg';
import iconHeart from '../../../assets/icons/icon_heart_footer.png';
import iconPig from '../../../assets/icons/icon_pig.png';
import iconRecurring from '../../../assets/icons/icon_recurring.png';
import { cx } from '../../../lib/cx';
import tapTargetStyles from '../tapTarget.module.css';
import styles from './Footer.module.css';

interface FooterKontakt {
  title: string;
  talkToUsLabel: string;
  talkToUsHref?: string;
  address: string[];
}

interface FooterRechtliches {
  title: string;
  impressumLabel: string;
  impressumHref?: string;
  datenschutzLabel: string;
  datenschutzHref?: string;
}

interface FooterContent {
  kontakt: FooterKontakt;
  rechtliches: FooterRechtliches;
  donateLabel: string;
  donateHref?: string;
  copyright: string;
  backToTopLabel: string;
}

interface FooterProps {
  content: FooterContent;
  onBackToTop: () => void;
}

/**
 * Domain-free site footer matching the Figma Footer component.
 *
 * Every destination is optional: without one, the item keeps its look but
 * leads nowhere, which is how the prototype shows it.
 */
export function Footer({ content, onBackToTop }: FooterProps) {
  const {
    kontakt,
    rechtliches,
    donateLabel,
    donateHref,
    copyright,
    backToTopLabel,
  } = content;
  const linkClassName = cx(styles.link, tapTargetStyles.tapTarget);
  const donateClassName = cx(styles.donateRow, tapTargetStyles.tapTarget);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <div className={styles.column}>
            <p className={styles.title}>{kontakt.title}</p>
            <a className={linkClassName} href={kontakt.talkToUsHref}>
              {kontakt.talkToUsLabel}
            </a>
            <address className={styles.address}>
              {kontakt.address.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          </div>

          <div className={styles.column}>
            <p className={styles.title}>{rechtliches.title}</p>
            <a className={linkClassName} href={rechtliches.impressumHref}>
              {rechtliches.impressumLabel}
            </a>
            <a className={linkClassName} href={rechtliches.datenschutzHref}>
              {rechtliches.datenschutzLabel}
            </a>
          </div>

          <div className={styles.aside}>
            <a className={donateClassName} href={donateHref}>
              <span className={styles.donateLabel}>{donateLabel}</span>
              <img alt="" className={styles.donateIcon} src={iconHeart} />
              <img alt="" className={styles.donateIcon} src={iconPig} />
              <img alt="" className={styles.donateIcon} src={iconRecurring} />
            </a>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottomRow}>
          <p className={styles.copyright}>{copyright}</p>
          <button
            aria-label={backToTopLabel}
            className={styles.backToTop}
            onClick={onBackToTop}
            type="button"
          >
            <img alt="" className={styles.backToTopIcon} src={iconArrowUp} />
          </button>
        </div>
      </div>
    </footer>
  );
}
