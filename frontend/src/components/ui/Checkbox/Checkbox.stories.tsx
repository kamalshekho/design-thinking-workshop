import type { Meta, StoryObj } from '@storybook/react-vite';

import { de } from '../../../content/de';
import { Checkbox } from './Checkbox';

const consentCopy = (
  <>
    {de.fields.consent.before}
    <a href="#privacy">{de.fields.consent.linkLabel}</a>
    {de.fields.consent.after}
  </>
);

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: { children: consentCopy },
};

export const Checked: Story = {
  args: {
    checked: true,
    children: consentCopy,
    onChange: () => undefined,
  },
};

export const Error: Story = {
  args: {
    'aria-invalid': 'true',
    children: consentCopy,
  },
};

export const Disabled: Story = {
  args: {
    children: consentCopy,
    disabled: true,
  },
};
