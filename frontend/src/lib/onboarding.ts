export const ONBOARDING_STEP_IDS = [
  'RULES',
  'COMMUNITY_GROUP',
  'DIGITAL_DEMOCRACY_LAB',
  'CONTACT',
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

const ONBOARDING_PATH_PATTERN = /^\/onboarding\/([^/]+)\/?$/;

export function extractOnboardingToken(pathname: string): string | null {
  const match = ONBOARDING_PATH_PATTERN.exec(pathname);

  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
