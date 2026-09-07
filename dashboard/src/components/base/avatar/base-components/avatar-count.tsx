/**
 * Clone path: `components/base/avatar/base-components/avatar-count.tsx`,
 * unchanged.
 */

import { cx } from '@/utils/cx';

interface AvatarCountProps {
  count: number;
  className?: string;
}

export const AvatarCount = ({ count, className }: AvatarCountProps) => (
  <div className={cx('absolute right-0 bottom-0 p-px', className)}>
    <div className="bg-fg-error-primary flex size-3.5 items-center justify-center rounded-full text-center text-[10px] leading-[13px] font-bold text-white">
      {count}
    </div>
  </div>
);
