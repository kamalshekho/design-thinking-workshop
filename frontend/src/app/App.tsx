import { Footer } from '../components/ui/Footer/Footer';
import { Header } from '../components/ui/Header/Header';
import { HeroSection } from '../components/ui/HeroSection/HeroSection';
import { de as content } from '../content/de';
import { links } from '../content/links';
import { ApplicationForm } from '../features/application-form/ApplicationForm';
import { OnboardingChecklist } from '../features/onboarding/OnboardingChecklist';
import { extractOnboardingToken } from '../lib/onboarding';
import styles from './App.module.css';

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function App() {
  const onboardingToken = extractOnboardingToken(window.location.pathname);
  const navItems = content.nav.items.map((label) => ({ label }));

  const footerContent = {
    contact: {
      title: content.footer.contact.title,
      talkToUsLabel: content.footer.contact.talkToUs,
      talkToUsHref: '#',
      address: [...content.footer.contact.address],
    },
    legal: {
      title: content.footer.legal.title,
      imprintLabel: content.footer.legal.imprint,
      imprintHref: '#',
      privacyLabel: content.footer.legal.privacy,
      privacyHref: links.privacyPolicy,
    },
    donateLabel: content.footer.donateLabel,
    donateHref: '#',
    copyright: content.footer.copyright(new Date().getFullYear()),
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
        {onboardingToken !== null ? (
          <OnboardingChecklist token={onboardingToken} />
        ) : (
          <ApplicationForm />
        )}
      </main>
      <Footer content={footerContent} onBackToTop={scrollToTop} />
    </>
  );
}
