import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

export const FORM_URL = process.env.FORM_URL ?? 'http://localhost:8081';
export const DASHBOARD_URL =
  process.env.DASHBOARD_URL ?? 'http://localhost:8082';
export const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025';
export const STAFF_EMAIL = 'ashton.blackwell@ichbinhier.online';
export const STAFF_NAME = 'Ashton Blackwell';

interface MailpitSummary {
  ID: string;
  Subject: string;
  To: { Address: string }[];
}

interface MailpitMessage {
  HTML?: string;
  Text?: string;
}

export async function waitForAcceptanceOnboardingUrl(
  applicantEmail: string,
  timeoutMs = 15_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const listRes = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    if (listRes.ok) {
      const list = (await listRes.json()) as { messages?: MailpitSummary[] };
      const match = (list.messages ?? []).find(
        (msg) =>
          msg.Subject === 'Willkommen bei ichbinhier: deine nächsten Schritte' &&
          msg.To.some(
            (recipient) =>
              recipient.Address.toLowerCase() === applicantEmail.toLowerCase(),
          ),
      );
      if (match) {
        const msgRes = await fetch(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
        if (msgRes.ok) {
          const detail = (await msgRes.json()) as MailpitMessage;
          const body = `${detail.HTML ?? ''}\n${detail.Text ?? ''}`;
          const linkMatch = /https?:\/\/[^\s"'<>]+\/onboarding\/[A-Za-z0-9_-]+/.exec(
            body,
          );
          if (linkMatch) {
            return linkMatch[0];
          }
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(
    `Timed out waiting for acceptance email to ${applicantEmail} in Mailpit (${MAILPIT_URL})`,
  );
}

export function getStaffPassword(): string {
  const fromEnv = process.env.STAFF_1_PASSWORD?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const dotenvPath = path.resolve(import.meta.dirname, '../../.env');
  try {
    const raw = readFileSync(dotenvPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const match = /^STAFF_1_PASSWORD=(.*)$/.exec(line.trim());
      if (match?.[1]) {
        const value = match[1].trim().replace(/^(['"])(.*)\1$/, '$2');
        if (value) {
          return value;
        }
      }
    }
  } catch {
  }

  throw new Error(
    'STAFF_1_PASSWORD is not set in the environment or in ../.env',
  );
}

export async function signInAsStaff(page: Page): Promise<void> {
  await page.goto(DASHBOARD_URL);
  await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible();

  await page.getByRole('textbox', { name: 'E-Mail' }).fill(STAFF_EMAIL);
  await page
    .getByRole('textbox', { name: 'Passwort' })
    .fill(getStaffPassword());
  await page.getByRole('button', { name: 'Anmelden' }).click();

  await expect(
    page.getByRole('navigation', { name: 'Hauptnavigation' }).or(
      page.getByRole('button', { name: 'Navigationsmenü öffnen' }),
    ),
  ).toBeVisible({ timeout: 15_000 });
}

export async function waitForFormCategories(page: Page) {
  const routeSelect = page.getByLabel(/Wie möchtest du uns helfen\?/);
  await expect(routeSelect).toBeEnabled({ timeout: 15_000 });
  return routeSelect;
}

export async function pickFirstCategoryValue(
  page: Page,
): Promise<string> {
  const routeSelect = await waitForFormCategories(page);
  const optionValues = await routeSelect
    .locator('option')
    .evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value),
    );
  const categoryValue = optionValues.find(
    (value) =>
      value !== '' && value !== 'COMMUNITY' && value !== 'SUPPORTING_MEMBER',
  );
  if (!categoryValue) {
    throw new Error(
      `Expected at least one Vereinsarbeit category option, got: ${JSON.stringify(optionValues)}`,
    );
  }
  return categoryValue;
}
