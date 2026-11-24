import type { Meta, StoryObj } from '@storybook/react-vite';

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

export const Desktop: Story = {
  args: {
    content: {
      contact: {
        title: de.footer.contact.title,
        talkToUsLabel: de.footer.contact.talkToUs,
        address: [...de.footer.contact.address],
      },
      legal: {
        title: de.footer.legal.title,
        imprintLabel: de.footer.legal.imprint,
        privacyLabel: de.footer.legal.privacy,
      },
      donateLabel: de.footer.donateLabel,
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
