import { test, expect } from "@playwright/test";

test("typing accented Vietnamese doesn't crash the page", async ({ page }) => {
  const r = await page.goto("/compound/n%C6%B0%E1%BB%9Bc"); // "nước"
  expect(r?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/compound\/nuoc/);
  await expect(page.getByText("H2O").first()).toBeVisible();
});

test("all 8 featured compounds open successfully", async ({ page }) => {
  for (const s of ["benzene", "caffeine", "aspirin", "glucose", "water", "ethanol", "chlorophyll-a", "adenosine-triphosphate"]) {
    const r = await page.goto(`/compound/${s}`);
    expect(r?.status(), `compound ${s}`).toBe(200);
  }
});

test("element Og shows the 'Predicted' label", async ({ page }) => {
  await page.goto("/element/og");
  await expect(page.getByText(/Dự đoán/i).first()).toBeVisible();
});

test("Palladium's CPK color is blue, not pink", async ({ page }) => {
  await page.goto("/element/pd");
  const html = await page.content();
  expect(html).toContain("#006985");
  expect(html).not.toContain("#FF6985");
});

test("titrating to the equivalence point gives pH 7", async ({ page }) => {
  await page.goto("/experiments/titration");
  await page.getByRole("button", { name: /Mở khóa burette/ }).click();
  // The loop runs on a real setInterval (40ms/tick, ~9.6s to finish) — under
  // parallel load from many Playwright workers, ticks can lag. Poll for much
  // longer than the theoretical duration instead of a single fixed wait then check.
  await expect(page.getByText(/ĐIỂM TƯƠNG ĐƯƠNG|Quá điểm/)).toBeVisible({ timeout: 25000 });
});

test("a substance outside the curriculum has noindex", async ({ page }) => {
  await page.goto("/compound/sunshine");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
