import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PaginationCardDefault } from './pagination';

describe('PaginationCardDefault', () => {
  it('renders page buttons inside list items without role="listitem" on buttons', () => {
    render(
      <PaginationCardDefault page={5} total={10} onPageChange={vi.fn()} />,
    );

    const list = screen.getByRole('list');
    const listItems = within(list).getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);

    for (const item of listItems) {
      expect(item.tagName).toBe('LI');
    }

    const pageButtons = within(list).getAllByRole('button');
    expect(pageButtons.length).toBeGreaterThan(0);
    for (const button of pageButtons) {
      expect(button).not.toHaveAttribute('role', 'listitem');
      expect(button.parentElement?.tagName).toBe('LI');
    }
  });

  it('calls onPageChange when clicking a page, previous, or next button', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <PaginationCardDefault page={2} total={5} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByRole('button', { name: 'Seite 4' }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    await user.click(screen.getByRole('button', { name: 'Zurück' }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
