/**
 * Registry path: `registry/new-york-v4/ui/card.tsx` (shadcn/ui). Wired to this
 * application's `cx` helper in place of shadcn's `cn`, to the `sd-*` tokens of
 * `shadcn-ui-theme.css`, and reduced to the four parts the dashboard renders —
 * the registry's `CardAction` and `CardFooter` came with the `dashboard-01`
 * block that is no longer part of this application.
 */

import type { HTMLAttributes } from 'react';

import { cx } from '@/utils/cx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card"
      className={cx(
        'border-sd-border bg-sd-card text-sd-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cx(
        'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="card-title"
      className={cx('leading-none font-semibold', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="card-description"
      className={cx('text-sd-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-content"
      className={cx('px-6', className)}
      {...props}
    />
  );
}
