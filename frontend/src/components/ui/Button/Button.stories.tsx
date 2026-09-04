import type { Meta, StoryObj } from '@storybook/react-vite';

import { de } from '../../../content/de';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: de.submit.label,
  },
};

export const Loading: Story = {
  args: {
    children: de.submit.label,
    isLoading: true,
    loadingLabel: de.submit.loadingLabel,
  },
};

export const PrimaryDisabled: Story = {
  args: {
    children: de.submit.label,
    disabled: true,
  },
};

export const Secondary: Story = {
  args: {
    children: de.actions.next,
    variant: 'secondary',
  },
};

export const RouteBlue: Story = {
  args: {
    children: de.communityPanel.cta,
    showArrow: true,
    variant: 'route-blue',
  },
};

export const RoutePurple: Story = {
  args: {
    children: de.supportingMemberPanel.cta,
    showArrow: true,
    variant: 'route-purple',
  },
};

export const FullWidth: Story = {
  args: {
    children: de.submit.label,
    width: 'full',
  },
  parameters: {
    layout: 'fullscreen',
  },
};
