import type { Meta, StoryObj } from '@storybook/react-vite';

import { de } from '../../../content/de';
import { Field } from '../Field/Field';
import { Textarea } from './Textarea';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Field label={de.fields.about.label} hint={de.fields.about.hint}>
      {(aria) => (
        <Textarea placeholder={de.fields.about.placeholder} {...aria} />
      )}
    </Field>
  ),
};

export const Error: Story = {
  args: { placeholder: de.fields.about.placeholder },
  render: () => (
    <Field label={de.fields.about.label} error={de.errors.ABOUT_TOO_LONG}>
      {(aria) => <Textarea {...aria} />}
    </Field>
  ),
};

export const Disabled: Story = {
  args: { placeholder: de.fields.about.placeholder },
  render: () => (
    <Field label={de.fields.about.label}>
      {(aria) => <Textarea disabled {...aria} />}
    </Field>
  ),
};
