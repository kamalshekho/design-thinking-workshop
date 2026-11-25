import type { Meta, StoryObj } from '@storybook/react-vite';

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

export const Desktop: Story = {
  args: {
    content: {
      contact: {
        title: de.footer.contact.title,
        talkToUsLabel: de.footer.contact.talkToUs,
        talkToUsHref: '#',
        address: [...de.footer.contact.address],
      },
      legal: {
        title: de.footer.legal.title,
        imprintLabel: de.footer.legal.imprint,
        imprintHref: '#',
        privacyLabel: de.footer.legal.privacy,
        privacyHref: links.privacyPolicy,
      },
      donateLabel: de.footer.donateLabel,
      donateHref: '#',
      copyright: de.footer.copyright(new Date().getFullYear()),
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
