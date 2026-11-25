import { expect, type Page, test } from '@playwright/test';

import {
  DASHBOARD_URL,
  FORM_URL,
  pickFirstCategoryValue,
  signInAsStaff,
  STAFF_NAME,
  waitForAcceptanceOnboardingUrl,
  waitForFormCategories,
} from './helpers';

function waitForApplicationPatch(page: Page) {
  return page.waitForResponse(
    (res) =>
      res.request().method() === 'PATCH' &&
      res.url().includes('/api/v1/staff/applications/') &&
      res.ok(),
  );
}

test('A29: applicant submits application and staff takes ownership and updates status', async ({
  page,
}, testInfo) => {
  const uniqueId = `${testInfo.project.name}-${String(Date.now())}`;
  const applicantName = `E2E Applicant ${uniqueId}`;
  const applicantEmail = `e2e-${uniqueId}@example.org`;

  await page.goto(FORM_URL);
  const routeSelect = await waitForFormCategories(page);
  const categoryValue = await pickFirstCategoryValue(page);
  await routeSelect.selectOption(categoryValue);

  await page.getByLabel(/^Name/).fill(applicantName);
  await page.getByLabel(/^E-Mail/).fill(applicantEmail);
  await page.getByLabel(/^Zeit pro Woche/).selectOption('HOURS_3_5');
  await page
    .getByLabel(/Erzähl uns kurz von dir/)
    .fill('Ich möchte gern in der Vereinsarbeit mithelfen.');
  await page.getByRole('checkbox').check();

  await page.getByRole('button', { name: 'Bewerbung abschicken' }).click();

  await expect(
    page.getByRole('heading', { name: 'Deine Bewerbung ist da!' }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(applicantEmail)).toBeVisible();

  // WebKit on Linux does not send Secure cookies over http://localhost;
  // only the Applicant part runs in WebKit (issue #137 triage).
  if (testInfo.project.name === 'webkit-375') {
    return;
  }

  await signInAsStaff(page);
  await page.goto(`${DASHBOARD_URL}/#applications`);
  await expect(page.getByRole('heading', { name: 'Anfragen' })).toBeVisible();

  const searchInput = page.getByRole('searchbox');
  await searchInput.fill(applicantEmail);

  const applicantEntry = page.getByText(applicantName).first();
  await expect(applicantEntry).toBeVisible({ timeout: 15_000 });
  await applicantEntry.click();

  // ApplicationDetail opens as a drawer only from Tailwind's lg breakpoint
  // (1024px); below it the detail replaces the list in place.
  const isNarrow = (page.viewportSize()?.width ?? 0) < 1024;

  if (isNarrow) {
    const detail = page.getByRole('region', { name: 'Anfrage' });
    await expect(detail).toBeVisible();

    const ownerPatch = waitForApplicationPatch(page);
    await detail.getByRole('button', { name: 'Übernehmen' }).click();
    await ownerPatch;
    await expect(detail.getByText('Du bist zuständig')).toBeVisible({
      timeout: 10_000,
    });

    const statusGroup = detail.getByRole('radiogroup', { name: 'Status' });
    const inReviewRadio = statusGroup.getByRole('radio', {
      name: 'In Prüfung',
    });
    const statusPatch = waitForApplicationPatch(page);
    await inReviewRadio.click();
    await statusPatch;
    await expect(inReviewRadio).toHaveAttribute('aria-checked', 'true', {
      timeout: 10_000,
    });

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Anfragen' })).toBeVisible();
    await page.getByRole('searchbox').fill(applicantEmail);
    await page.getByText(applicantName).first().click();

    const reloadedDetail = page.getByRole('region', { name: 'Anfrage' });
    await expect(reloadedDetail.getByText('Du bist zuständig')).toBeVisible();
    await expect(
      reloadedDetail
        .getByRole('radiogroup', { name: 'Status' })
        .getByRole('radio', { name: 'In Prüfung' }),
    ).toHaveAttribute('aria-checked', 'true');

    const acceptedPatch = waitForApplicationPatch(page);
    await reloadedDetail
      .getByRole('radiogroup', { name: 'Status' })
      .getByRole('radio', { name: 'Angenommen' })
      .click();
    await acceptedPatch;
    await expect(
      reloadedDetail.getByText('Onboarding: 0 von 4 Schritten'),
    ).toBeVisible();
    await expect(
      reloadedDetail.getByRole('button', { name: 'Onboarding-Link kopieren' }),
    ).toBeVisible();
  } else {
    const drawer = page.getByRole('complementary', { name: 'Anfrage' });
    await expect(drawer).toBeVisible();

    const ownerTrigger = drawer.getByRole('button', { name: /Zuständig/ });
    const ownerPatch = waitForApplicationPatch(page);
    await ownerTrigger.click();
    await page.getByRole('option', { name: STAFF_NAME }).click();
    await ownerPatch;
    await expect(ownerTrigger).toContainText(STAFF_NAME, { timeout: 10_000 });

    const statusSelect = drawer.getByLabel('Status');
    const statusPatch = waitForApplicationPatch(page);
    await statusSelect.selectOption('IN_REVIEW');
    await statusPatch;
    await expect(statusSelect).toHaveValue('IN_REVIEW');

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Anfragen' })).toBeVisible();
    await page.getByRole('searchbox').fill(applicantEmail);
    await page.getByText(applicantName).first().click();

    const reloadedDrawer = page.getByRole('complementary', { name: 'Anfrage' });
    await expect(
      reloadedDrawer.getByRole('button', { name: /Zuständig/ }),
    ).toContainText(STAFF_NAME);
    const reloadedStatus = reloadedDrawer.getByLabel('Status');
    await expect(reloadedStatus).toHaveValue('IN_REVIEW');

    const acceptedPatch = waitForApplicationPatch(page);
    await reloadedStatus.selectOption('ACCEPTED');
    await acceptedPatch;
    await expect(
      reloadedDrawer.getByText('Onboarding: 0 von 4 Schritten'),
    ).toBeVisible();
    await expect(
      reloadedDrawer.getByRole('button', { name: 'Onboarding-Link kopieren' }),
    ).toBeVisible();
  }

  const onboardingUrl = await waitForAcceptanceOnboardingUrl(applicantEmail);
  const onboardingPage = await page.context().newPage();
  await onboardingPage.goto(onboardingUrl);

  await expect(
    onboardingPage.getByRole('heading', {
      name: `Willkommen, ${applicantName}!`,
    }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(onboardingPage.getByText('0 von 4 erledigt')).toBeVisible();

  const checkboxes = onboardingPage.getByRole('checkbox');
  await expect(checkboxes).toHaveCount(4);

  for (let i = 0; i < 4; i++) {
    const stepPut = onboardingPage.waitForResponse(
      (res) =>
        res.request().method() === 'PUT' &&
        res.url().includes('/api/onboarding/') &&
        res.ok(),
    );
    await checkboxes.nth(i).check();
    await stepPut;
  }

  await expect(onboardingPage.getByText('4 von 4 erledigt')).toBeVisible();
  await onboardingPage.close();

  await expect(
    page.getByText('Onboarding: 4 von 4 Schritten'),
  ).toBeVisible({ timeout: 15_000 });

  await page.goto(`${FORM_URL}/onboarding/invalid-link-does-not-exist`);
  await expect(
    page.getByText(
      'Dieser Link ist nicht mehr gültig. Schreib uns an info@ichbinhier.online.',
    ),
  ).toBeVisible({ timeout: 15_000 });
});
