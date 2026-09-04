import type { Meta, StoryObj } from '@storybook/react-vite';

import { de } from '../../../content/de';
import { links } from '../../../content/links';
import { RoutePanel } from './RoutePanel';

const meta = {
  title: 'UI/RoutePanel',
  component: RoutePanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RoutePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Community: Story = {
  args: {
    actionHref: links.communityGroup,
    actionLabel: de.communityPanel.cta,
    body: de.communityPanel.body,
    title: de.communityPanel.title,
    variant: 'community',
  },
};

export const SupportingMember: Story = {
  args: {
    actionHref: links.supportingMembership,
    actionLabel: de.supportingMemberPanel.cta,
    body: de.supportingMemberPanel.body,
    title: de.supportingMemberPanel.title,
    variant: 'supporting-member',
  },
};
