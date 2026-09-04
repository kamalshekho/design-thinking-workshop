import type { Meta, StoryObj } from '@storybook/react-vite';

import { de } from '../../../content/de';
import { Field } from '../Field/Field';
import { Select } from './Select';

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const options = (
  <>
    <option disabled value="">
      {de.fields.weeklyTime.placeholder}
    </option>
    <option value="HOURS_1_2">{de.weeklyTimeLabels.HOURS_1_2}</option>
    <option value="HOURS_3_5">{de.weeklyTimeLabels.HOURS_3_5}</option>
  </>
);

export const Default: Story = {
  args: { children: options },
  render: () => (
    <Field label={de.fields.weeklyTime.label}>
      {(aria) => (
        <Select defaultValue="" required {...aria}>
          {options}
        </Select>
      )}
    </Field>
  ),
};

export const Error: Story = {
  args: { children: options },
  render: () => (
    <Field
      label={de.fields.weeklyTime.label}
      error={de.errors.WEEKLY_TIME_REQUIRED}
    >
      {(aria) => (
        <Select defaultValue="" required {...aria}>
          {options}
        </Select>
      )}
    </Field>
  ),
};

export const Disabled: Story = {
  args: { children: options },
  render: () => (
    <Field label={de.fields.weeklyTime.label}>
      {(aria) => (
        <Select defaultValue="" disabled {...aria}>
          {options}
        </Select>
      )}
    </Field>
  ),
};
