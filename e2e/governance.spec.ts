import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

test("complete Governance Challenge without OpenAI, with validation, comparison and languages", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByTestId("projected-score")).toHaveText("52.56");
  await expect(page.getByTestId("decision-count")).toHaveText("0/ 5");
  await expect(page.locator(".map-zone")).toHaveCount(5);
  await page.getByRole("button", { name: "Esil", exact: true }).click();
  await expect(page.locator(".district-heading h2")).toContainText("Esil");
  await expect(page.locator(".indicator-item")).toHaveCount(10);
  mkdirSync("docs/screenshots", { recursive: true });
  await page.screenshot({
    path: "docs/screenshots/dashboard.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Initiatives", exact: true }).click();
  await expect(page.locator(".initiative-card")).toHaveCount(14);
  await page
    .getByRole("button", { name: "Add initiative M1", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add initiative M3", exact: true }),
  ).toBeDisabled();
  await expect(
    page.locator('[data-action-id="M3"] .blocked-reason'),
  ).toContainText("Conflicting initiatives");
  await expect(page.locator(".confirm-button")).toBeDisabled();
  await page
    .locator('[data-action-id="M1"]')
    .getByRole("button", { name: "Remove M1", exact: true })
    .click();
  await page
    .getByLabel("Target district", { exact: true })
    .selectOption("nura");
  for (const action of ["M7", "M8", "M10", "M12"])
    await page
      .getByRole("button", { name: `Add initiative ${action}`, exact: true })
      .click();
  await page
    .getByLabel("Target district", { exact: true })
    .selectOption("saryarka");
  await page
    .getByRole("button", { name: "Add initiative M5", exact: true })
    .click();
  await expect(page.getByTestId("projected-score")).toHaveText("56.54");
  await expect(page.getByTestId("decision-count")).toHaveText("5/ 5");
  await expect(page.locator(".synergy-inline")).toContainText("M10 + M12");
  await page.getByRole("button", { name: "AI Advisor", exact: true }).click();
  await expect(page.locator(".advice-card")).toContainText(
    "Deterministic advisor",
  );
  const apiResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/advisor") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Ask advisor", exact: true }).click();
  const response = await apiResponse;
  expect(response.status()).toBe(200);
  expect((await response.json()).mode).toBe("fallback");
  await page
    .getByRole("button", { name: "Confirm city strategy", exact: true })
    .click();
  await expect(page.getByTestId("final-score")).toHaveText("56.54");
  await page
    .getByRole("button", {
      name: "Compare with AI Reference Strategy",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Best strategy found by exhaustive deterministic search",
    }),
  ).toBeVisible();
  await expect(page.locator(".reference-card .comparison-score")).toHaveText(
    "57.24",
  );
  await expect(page.locator(".reference-card .comparison-plan li")).toHaveCount(
    5,
  );
  await page.screenshot({
    path: "docs/screenshots/results.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "RU", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Качество жизни Астаны", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "KZ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Астанадағы өмір сапасы", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("projected-score")).toHaveText("52.56");
  expect(errors).toEqual([]);
});

test("narrow-screen layout remains usable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Initiatives", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "RU", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Инициативы", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  mkdirSync("docs/screenshots", { recursive: true });
  await page.screenshot({
    path: "docs/screenshots/narrow.png",
    fullPage: true,
  });
});
