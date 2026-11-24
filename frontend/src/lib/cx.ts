export type ClassValue = string | null | undefined | false;

/** Joins class names, dropping falsy values. */
export function cx(...values: ClassValue[]): string {
  return values.filter((value): value is string => Boolean(value)).join(' ');
}
