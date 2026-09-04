import type { Meta, StoryObj } from '@storybook/react-vite';

import iconBluesky from '../../../assets/icons/icon_bluesky.svg';
import iconFacebook from '../../../assets/icons/icon_facebook.svg';
import iconInstagram from '../../../assets/icons/icon_instagram.svg';
import iconLinkedin from '../../../assets/icons/icon_linkedin.svg';
import iconTiktok from '../../../assets/icons/icon_tiktok.svg';
import { de } from '../../../content/de';
import { links } from '../../../content/links';
import { Footer } from './Footer';

const meta = {
  title: 'UI/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

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

export const Desktop: Story = {
  args: {
    content: {
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
    },
    onBackToTop: () => {},
  },
};

export const Mobile: Story = {
  args: Desktop.args,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
