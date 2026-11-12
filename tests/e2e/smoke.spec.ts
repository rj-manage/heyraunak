import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("public site is preserved", () => {
  test("homepage renders the original studio page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("We design digital experiences");
    await expect(page.locator("nav.nav")).toBeVisible();
  });

  test("services page keeps the catalogue UI", async ({ page }) => {
    await page.goto("/services/");
    await expect(page.locator("h1")).toContainText("Four things we do properly");
    await expect(page.getByRole("heading", { name: "Find the Service You Need" })).toBeVisible();
    // 69 services across the three live categories
    expect(await page.locator(".svc-list .svc").count()).toBe(4);
  });

  test("gallery item pages load directly", async ({ page }) => {
    const res = await page.goto("/facesgallery/face-1.html");
    expect(res?.status()).toBe(200);
  });
});

test.describe("application routes", () => {
  test("sign-in page renders", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("h1")).toContainText("Sign in to RJ Studio");
  });

  test("unknown app route shows the 404 page", async ({ page }) => {
    const res = await page.goto("/nope-not-here");
    expect(res?.status()).toBe(404);
  });
});

test.describe("accessibility", () => {
  for (const path of ["/", "/services/", "/sign-in"]) {
    test(`no critical axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const critical = violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
    });
  }
});
