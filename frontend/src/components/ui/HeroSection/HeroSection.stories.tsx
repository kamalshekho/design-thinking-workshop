import type { Meta, StoryObj } from '@storybook/react-vite';

import { de } from '../../../content/de';
import { HeroSection } from './HeroSection';

const meta = {
  title: 'UI/HeroSection',
  component: HeroSection,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  args: {
    tagline: de.hero.tagline,
  },
};

export const Mobile: Story = {
  args: Desktop.args,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
