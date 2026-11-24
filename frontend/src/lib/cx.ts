export type ClassValue = string | null | undefined | false;

/** Joins class names, dropping falsy values. */
export function cx(...values: ClassValue[]): string {
  return values.filter((value): value is string => Boolean(value)).join(' ');
}

// Temporary type error for the #123 proof; reverted in the next commit.
export const typeErrorProof: string = 42;
