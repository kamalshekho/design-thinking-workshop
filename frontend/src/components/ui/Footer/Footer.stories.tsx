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
