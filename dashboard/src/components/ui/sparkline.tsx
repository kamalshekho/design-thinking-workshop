/**
 * Small trend chart behind Übersicht's metric cards, so the three keep one
 * Recharts wiring instead of each repeating the area/bar switch.
 *
 * The themed container is shadcn/ui's `chart` primitive (registry
 * `new-york-v4`), reduced to the one wrapper this file needs — no legend, no
 * multi-theme support, since the dashboard is light-theme only, and no
 * `ChartTooltipContent`, which expects a multi-series `ChartConfig` where a
 * single-series trend point only needs its day label and its value.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { cx } from '@/utils/cx';

export type SparklineType = 'area' | 'bar';

type SparklinePoint = { index: number; value: number; label?: string };

/** Hover/tap readout for a single point: its day label, when known, and its value. */
function SparklineTooltipContent({
  active,
  payload,
  color,
}: {
  active?: boolean;
  payload?: readonly { value?: number; payload?: SparklinePoint }[];
  color: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const point = payload[0];
  if (!point) {
    return null;
  }
  const label = point.payload?.label;
  return (
    <div className="border-sd-border bg-sd-popover text-sd-popover-foreground flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md">
      {label && <span className="text-sd-muted-foreground">{label}</span>}
      <span className="font-semibold tabular-nums" style={{ color }}>
        {point.value}
      </span>
    </div>
  );
}

type SparklineProps = {
  /** Identifier retained for callers and chart inspection. */
  id: string;
  type: SparklineType;
  color: string;
  data: readonly number[];
  /**
   * One label per `data` point (e.g. `Mo`, `Di`, …), shown in the hover
   * tooltip and as a row under the chart. Omit entirely if the points have no
   * meaningful label (the tooltip then shows just the value).
   */
  labels?: readonly string[];
  className?: string;
  /** Tailwind height class for the chart itself. Defaults to the compact `h-16` used everywhere else. */
  chartClassName?: string;
  /** Area stroke thickness in px. Defaults to `2`; bump alongside a bigger chart so the line doesn't read as thin. */
  strokeWidth?: number;
  /** Tailwind text-size class for the weekday labels row. Defaults to `text-[10px]`. */
  labelClassName?: string;
};

export function Sparkline({
  id,
  type,
  color,
  data,
  labels,
  className,
  chartClassName = 'h-16',
  strokeWidth = 2,
  labelClassName = 'text-[10px]',
}: SparklineProps) {
  const points: SparklinePoint[] = data.map((value, index) => ({
    index,
    value,
    label: labels?.[index],
  }));

  /**
   * A week that never left zero is drawn as one muted baseline rather than
   * handed to Recharts, because the two chart types disagree about it and
   * neither reads as "flat": a bar chart draws nothing at all for zero-height
   * bars, so the card looks like a chart that failed to load, and an area
   * chart draws its line on the very bottom edge in the card's own colour —
   * which on the overdue card is a semantic red, so the honest answer "nothing
   * happened this week" reads as an alert. One rule in a neutral grey says the
   * same thing on all three cards. This is the state the platform is in on the
   * association's first day (issue #53).
   */
  const flat = data.every((value) => value === 0);

  return (
    <div
      data-sparkline={id}
      data-flat={flat ? 'true' : undefined}
      aria-hidden="true"
      className={cx('flex w-20 flex-col gap-1', className)}
    >
      <div
        data-slot="chart"
        className={cx('h-full w-full text-xs', chartClassName)}
      >
        {flat ? (
          <div className="flex h-full w-full items-end">
            <span
              className="h-px w-full rounded-full"
              style={{ backgroundColor: 'var(--color-border-secondary)' }}
            />
          </div>
        ) : (
          <ResponsiveContainer>
            {type === 'area' ? (
              <AreaChart
                data={points}
                margin={{ top: 4, right: 2, bottom: 0, left: 2 }}
              >
                <Area
                  dataKey="value"
                  type="linear"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  fill={color}
                  fillOpacity={0.05}
                  isAnimationActive={false}
                  activeDot={{ r: 3.5, strokeWidth: 0, fill: color }}
                />
                <Tooltip
                  cursor={{
                    stroke: color,
                    strokeWidth: 1,
                    strokeDasharray: '3 3',
                  }}
                  content={<SparklineTooltipContent color={color} />}
                  wrapperStyle={{ outline: 'none', zIndex: 50 }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={points}
                margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
              >
                <Bar
                  dataKey="value"
                  fill={color}
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
                <Tooltip
                  cursor={{ fill: color, opacity: 0.1 }}
                  content={<SparklineTooltipContent color={color} />}
                  wrapperStyle={{ outline: 'none', zIndex: 50 }}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      {labels && (
        <div
          className={cx(
            'text-sd-muted-foreground flex justify-between leading-none',
            labelClassName,
          )}
        >
          {labels.map((label, index) => (
            <span key={`${label}-${String(index)}`}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
