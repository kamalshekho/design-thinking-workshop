import heart from '../../../assets/icons/heart.png';
import dots from '../../../assets/icons/icon_dots.svg';
import speaker from '../../../assets/icons/speaker.png';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  tagline: string;
}

const HEART_CLASSES = [
  styles.heart1,
  styles.heart2,
  styles.heart3,
  styles.heart4,
  styles.heart5,
  styles.heart6,
  styles.heart7,
];

/**
 * Domain-free brand strip matching the Figma Hero Section (node 59:142).
 *
 * The frame keeps the Figma layout's 1413:482 aspect ratio and every child
 * is positioned as a percentage of that frame, so the composition scales as
 * one unit instead of drifting apart at other widths.
 */
export function HeroSection({ tagline }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.frame}>
        <img alt="" className={styles.dots} src={dots} />
        <img alt="" className={styles.megaphone} src={speaker} />
        {HEART_CLASSES.map((heartClass) => (
          <img
            alt=""
            className={[styles.heart, heartClass].join(' ')}
            key={heartClass}
            src={heart}
          />
        ))}
        <p className={styles.tagline}>{tagline}</p>
      </div>
    </section>
  );
}
