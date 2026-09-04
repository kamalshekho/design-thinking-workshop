import iconBluesky from '../assets/icons/icon_bluesky.svg';
import iconFacebook from '../assets/icons/icon_facebook.svg';
import iconInstagram from '../assets/icons/icon_instagram.svg';
import iconLinkedin from '../assets/icons/icon_linkedin.svg';
import iconTiktok from '../assets/icons/icon_tiktok.svg';
import { Footer } from '../components/ui/Footer/Footer';
import { Header } from '../components/ui/Header/Header';
import { HeroSection } from '../components/ui/HeroSection/HeroSection';
import { de } from '../content/de';
import { links } from '../content/links';
import { ApplicationForm } from '../features/application-form/ApplicationForm';
import styles from './App.module.css';

const navItems = [
  { label: de.nav.items[0], href: links.nav.about },
  { label: de.nav.items[1], href: links.nav.engagement },
  { label: de.nav.items[2], href: links.nav.education },
  { label: de.nav.items[3], href: links.nav.news },
  { label: de.nav.items[4], href: links.nav.events },
];

const socialLinks = [
  {
    label: de.footer.socialLabels.facebook,
    href: links.footer.social.facebook,
    icon: iconFacebook,
  },
  {
    label: de.footer.socialLabels.instagram,
    href: links.footer.social.instagram,
    icon: iconInstagram,
  },
  {
    label: de.footer.socialLabels.linkedin,
    href: links.footer.social.linkedin,
    icon: iconLinkedin,
  },
  {
    label: de.footer.socialLabels.bluesky,
    href: links.footer.social.bluesky,
    icon: iconBluesky,
  },
  {
    label: de.footer.socialLabels.tiktok,
    href: links.footer.social.tiktok,
    icon: iconTiktok,
  },
];

const footerContent = {
  kontakt: {
    title: de.footer.kontakt.title,
    talkToUsLabel: de.footer.kontakt.talkToUs,
    talkToUsHref: links.footer.talkToUs,
    address: [...de.footer.kontakt.address],
  },
  rechtliches: {
    title: de.footer.rechtliches.title,
    impressumLabel: de.footer.rechtliches.impressum,
    impressumHref: links.footer.impressum,
    datenschutzLabel: de.footer.rechtliches.datenschutz,
    datenschutzHref: links.privacyPolicy,
  },
  donateLabel: de.footer.donateLabel,
  donateHref: links.footer.donate,
  socialLinks,
  copyright: de.footer.copyright,
  backToTopLabel: de.footer.backToTopLabel,
};

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function App() {
  return (
    <>
      <Header
        donateHref={links.nav.donate}
        donateLabel={de.nav.donate}
        homeHref={links.home}
        logoAlt={de.nav.logoAlt}
        menuCloseLabel={de.nav.menuCloseLabel}
        menuLabel={de.nav.menuLabel}
        navItems={navItems}
        searchLabel={de.nav.searchLabel}
      />
      <HeroSection tagline={de.hero.tagline} />
      <main className={styles.page}>
        <ApplicationForm />
      </main>
      <Footer content={footerContent} onBackToTop={scrollToTop} />
    </>
  );
}
