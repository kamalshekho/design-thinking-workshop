import styles from './HeroSection.module.css';

interface HeroSectionProps {
  tagline: string;
}

/**
 * Domain-free brand strip matching the Figma Hero Section (node 59:142).
 *
 * The client asked for a neutral presentation, so the illustration this
 * section used to carry (halftone dots, megaphone, hearts) is gone; a plain
 * placeholder box fills the same frame at the same size and position. The
 * frame keeps the Figma layout's 1413:482 aspect ratio.
 */
export function HeroSection({ tagline }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.frame}>
        <span aria-hidden="true" className={styles.placeholderLabel}>
          Banner
        </span>
        <p className={styles.tagline}>{tagline}</p>
      </div>
    </section>
  );
}
