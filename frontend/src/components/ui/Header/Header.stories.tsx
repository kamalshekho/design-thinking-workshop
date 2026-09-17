import type { Meta, StoryObj } from '@storybook/react-vite';

import { de } from '../../../content/de';
import { Header } from './Header';

const meta = {
  title: 'UI/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

const navItems = [
  { label: de.nav.items[0] },
  { label: de.nav.items[1] },
  { label: de.nav.items[2] },
  { label: de.nav.items[3] },
  { label: de.nav.items[4] },
];

export const Desktop: Story = {
  args: {
    donateLabel: de.nav.donate,
    logoAlt: de.nav.logoAlt,
    menuCloseLabel: de.nav.menuCloseLabel,
    menuLabel: de.nav.menuLabel,
    navItems,
    searchLabel: de.nav.searchLabel,
  },
};

export const Mobile: Story = {
  args: Desktop.args,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
