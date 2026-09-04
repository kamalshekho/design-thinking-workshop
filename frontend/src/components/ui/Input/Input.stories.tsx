import type { Meta, StoryObj } from '@storybook/react-vite';

import { de } from '../../../content/de';
import { Field } from '../Field/Field';
import { Input } from './Input';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Field label={de.fields.name.label}>
      {(aria) => <Input placeholder={de.fields.name.label} {...aria} />}
    </Field>
  ),
};

export const Error: Story = {
  render: () => (
    <Field label={de.fields.email.label} error={de.errors.EMAIL_INVALID}>
      {(aria) => <Input type="email" {...aria} />}
    </Field>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Field label={de.fields.name.label}>
      {(aria) => (
        <Input disabled placeholder={de.fields.name.label} {...aria} />
      )}
    </Field>
  ),
};
