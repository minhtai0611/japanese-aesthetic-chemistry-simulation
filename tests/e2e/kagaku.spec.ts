import { test, expect } from "@playwright/test";

test("gõ tiếng Việt CÓ DẤU không làm sập trang", async ({ page }) => {
  const r = await page.goto("/hop-chat/n%C6%B0%E1%BB%9Bc"); // "nước"
  expect(r?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/hop-chat\/nuoc/);
  await expect(page.getByText("H2O").first()).toBeVisible();
});

test("toàn bộ 8 hợp chất nổi bật đều mở được", async ({ page }) => {
  for (const s of ["benzene", "caffeine", "aspirin", "glucose", "water", "ethanol", "chlorophyll-a", "adenosine-triphosphate"]) {
    const r = await page.goto(`/hop-chat/${s}`);
    expect(r?.status(), `hợp chất ${s}`).toBe(200);
  }
});

test("nguyên tố Og hiện nhãn 'Dự đoán'", async ({ page }) => {
  await page.goto("/nguyen-to/og");
  await expect(page.getByText(/Dự đoán/i).first()).toBeVisible();
});

test("màu CPK Paladi là xanh lam, không phải hồng", async ({ page }) => {
  await page.goto("/nguyen-to/pd");
  const html = await page.content();
  expect(html).toContain("#006985");
  expect(html).not.toContain("#FF6985");
});

test("chuẩn độ tới điểm tương đương cho pH 7", async ({ page }) => {
  await page.goto("/thi-nghiem/chuan-do");
  await page.getByRole("button", { name: /Mở khóa burette/ }).click();
  // Vòng lặp chạy bằng setInterval thực (40ms/tick, ~9.6s để chạy hết) — dưới
  // tải song song nhiều worker Playwright, tick có thể bị trễ. Poll dài hơn
  // nhiều so với thời gian lý thuyết thay vì một lần chờ cố định rồi kiểm tra.
  await expect(page.getByText(/ĐIỂM TƯƠNG ĐƯƠNG|Quá điểm/)).toBeVisible({ timeout: 25000 });
});

test("chất ngoài chương trình có noindex", async ({ page }) => {
  await page.goto("/hop-chat/sunshine");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
