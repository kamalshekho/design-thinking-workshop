import type { Meta, StoryObj } from '@storybook/react-vite';

import { de } from '../../../content/de';
import { links } from '../../../content/links';
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
  { label: de.nav.items[0], href: links.nav.about },
  { label: de.nav.items[1], href: links.nav.engagement },
  { label: de.nav.items[2], href: links.nav.education },
  { label: de.nav.items[3], href: links.nav.news },
  { label: de.nav.items[4], href: links.nav.events },
];

export const Desktop: Story = {
  args: {
    donateHref: links.nav.donate,
    donateLabel: de.nav.donate,
    homeHref: links.home,
    logoAlt: de.nav.logoAlt,
    menuCloseLabel: de.nav.menuCloseLabel,
    menuLabel: de.nav.menuLabel,
    navItems,
    language: 'de',
    languageLabel: de.nav.languageLabel,
    onLanguageChange: () => undefined,
    searchLabel: de.nav.searchLabel,
  },
};

export const Mobile: Story = {
  args: Desktop.args,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
