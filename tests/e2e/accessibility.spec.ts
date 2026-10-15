import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("key public and application routes pass automated WCAG A/AA checks", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/terms",
    "/privacy",
    "/safety",
    "/onboarding",
    "/app",
    "/app/discover",
    "/app/match",
    "/app/messages",
    "/app/friends",
    "/app/notifications",
    "/app/profile",
    "/app/settings",
    "/app/safety",
    "/admin",
    "/offline",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        rule: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      route,
    ).toEqual([]);
  }
});
