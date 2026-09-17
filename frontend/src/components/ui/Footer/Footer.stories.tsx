import type { Meta, StoryObj } from '@storybook/react-vite';

import iconBluesky from '../../../assets/icons/icon_bluesky.svg';
import iconFacebook from '../../../assets/icons/icon_facebook.svg';
import iconInstagram from '../../../assets/icons/icon_instagram.svg';
import iconLinkedin from '../../../assets/icons/icon_linkedin.svg';
import iconTiktok from '../../../assets/icons/icon_tiktok.svg';
import { de } from '../../../content/de';
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
    icon: iconFacebook,
  },
  {
    label: de.footer.socialLabels.instagram,
    icon: iconInstagram,
  },
  {
    label: de.footer.socialLabels.linkedin,
    icon: iconLinkedin,
  },
  {
    label: de.footer.socialLabels.bluesky,
    icon: iconBluesky,
  },
  {
    label: de.footer.socialLabels.tiktok,
    icon: iconTiktok,
  },
];

export const Desktop: Story = {
  args: {
    content: {
      kontakt: {
        title: de.footer.kontakt.title,
        talkToUsLabel: de.footer.kontakt.talkToUs,
        address: [...de.footer.kontakt.address],
      },
      rechtliches: {
        title: de.footer.rechtliches.title,
        impressumLabel: de.footer.rechtliches.impressum,
        datenschutzLabel: de.footer.rechtliches.datenschutz,
      },
      donateLabel: de.footer.donateLabel,
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
