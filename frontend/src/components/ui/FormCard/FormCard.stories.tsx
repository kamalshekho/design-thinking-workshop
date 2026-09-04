import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormCard } from './FormCard';

const meta = {
  title: 'UI/FormCard',
  component: FormCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FormCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <h1>ichbinhier lebt vom Mitmachen.</h1>
        <p>Sag uns in zwei Minuten, wie du dabei sein möchtest.</p>
      </>
    ),
  },
};
