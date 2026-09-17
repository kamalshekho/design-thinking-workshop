import iconBluesky from '../assets/icons/icon_bluesky.svg';
import iconFacebook from '../assets/icons/icon_facebook.svg';
import iconInstagram from '../assets/icons/icon_instagram.svg';
import iconLinkedin from '../assets/icons/icon_linkedin.svg';
import iconTiktok from '../assets/icons/icon_tiktok.svg';
import { Footer } from '../components/ui/Footer/Footer';
import { Header } from '../components/ui/Header/Header';
import { HeroSection } from '../components/ui/HeroSection/HeroSection';
import { de as content } from '../content/de';
import { ApplicationForm } from '../features/application-form/ApplicationForm';
import styles from './App.module.css';

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function App() {
  const navItems = content.nav.items.map((label) => ({ label }));
  const socialLinks = [
    {
      label: content.footer.socialLabels.facebook,
      icon: iconFacebook,
    },
    {
      label: content.footer.socialLabels.instagram,
      icon: iconInstagram,
    },
    {
      label: content.footer.socialLabels.linkedin,
      icon: iconLinkedin,
    },
    {
      label: content.footer.socialLabels.bluesky,
      icon: iconBluesky,
    },
    {
      label: content.footer.socialLabels.tiktok,
      icon: iconTiktok,
    },
  ];
  const footerContent = {
    kontakt: {
      title: content.footer.kontakt.title,
      talkToUsLabel: content.footer.kontakt.talkToUs,
      address: [...content.footer.kontakt.address],
    },
    rechtliches: {
      title: content.footer.rechtliches.title,
      impressumLabel: content.footer.rechtliches.impressum,
      datenschutzLabel: content.footer.rechtliches.datenschutz,
    },
    donateLabel: content.footer.donateLabel,
    socialLinks,
    copyright: content.footer.copyright,
    backToTopLabel: content.footer.backToTopLabel,
  };

  return (
    <>
      <Header
        donateLabel={content.nav.donate}
        logoAlt={content.nav.logoAlt}
        menuCloseLabel={content.nav.menuCloseLabel}
        menuLabel={content.nav.menuLabel}
        navItems={navItems}
        searchLabel={content.nav.searchLabel}
      />
      <HeroSection tagline={content.hero.tagline} />
      <main className={styles.page}>
        <ApplicationForm />
      </main>
      <Footer content={footerContent} onBackToTop={scrollToTop} />
    </>
  );
}
