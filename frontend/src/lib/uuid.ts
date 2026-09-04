const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Whether `value` has the shape of a UUID (case-insensitive, any version). */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
