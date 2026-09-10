import iconBluesky from '../assets/icons/icon_bluesky.svg';
import iconFacebook from '../assets/icons/icon_facebook.svg';
import iconInstagram from '../assets/icons/icon_instagram.svg';
import iconLinkedin from '../assets/icons/icon_linkedin.svg';
import iconTiktok from '../assets/icons/icon_tiktok.svg';
import { Footer } from '../components/ui/Footer/Footer';
import { Header } from '../components/ui/Header/Header';
import { HeroSection } from '../components/ui/HeroSection/HeroSection';
import { links } from '../content/links';
import { useLocale } from '../content/useLocale';
import { ApplicationForm } from '../features/application-form/ApplicationForm';
import styles from './App.module.css';

const NAV_HREFS = [
  links.nav.about,
  links.nav.engagement,
  links.nav.education,
  links.nav.news,
  links.nav.events,
];

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function App() {
  const { content, locale, setLocale } = useLocale();
  const navItems = content.nav.items.map((label, index) => ({
    label,
    href: NAV_HREFS[index] ?? links.home,
  }));
  const socialLinks = [
    {
      label: content.footer.socialLabels.facebook,
      href: links.footer.social.facebook,
      icon: iconFacebook,
    },
    {
      label: content.footer.socialLabels.instagram,
      href: links.footer.social.instagram,
      icon: iconInstagram,
    },
    {
      label: content.footer.socialLabels.linkedin,
      href: links.footer.social.linkedin,
      icon: iconLinkedin,
    },
    {
      label: content.footer.socialLabels.bluesky,
      href: links.footer.social.bluesky,
      icon: iconBluesky,
    },
    {
      label: content.footer.socialLabels.tiktok,
      href: links.footer.social.tiktok,
      icon: iconTiktok,
    },
  ];
  const footerContent = {
    kontakt: {
      title: content.footer.kontakt.title,
      talkToUsLabel: content.footer.kontakt.talkToUs,
      talkToUsHref: links.footer.talkToUs,
      address: [...content.footer.kontakt.address],
    },
    rechtliches: {
      title: content.footer.rechtliches.title,
      impressumLabel: content.footer.rechtliches.impressum,
      impressumHref: links.footer.impressum,
      datenschutzLabel: content.footer.rechtliches.datenschutz,
      datenschutzHref: links.privacyPolicy,
    },
    donateLabel: content.footer.donateLabel,
    donateHref: links.footer.donate,
    socialLinks,
    copyright: content.footer.copyright,
    backToTopLabel: content.footer.backToTopLabel,
  };

  return (
    <>
      <Header
        donateHref={links.nav.donate}
        donateLabel={content.nav.donate}
        homeHref={links.home}
        logoAlt={content.nav.logoAlt}
        menuCloseLabel={content.nav.menuCloseLabel}
        menuLabel={content.nav.menuLabel}
        navItems={navItems}
        language={locale}
        languageLabel={content.nav.languageLabel}
        onLanguageChange={setLocale}
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
