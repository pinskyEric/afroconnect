import { test, expect } from "@playwright/test";
const routes = [
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
];
test("all routes render without runtime errors or broken local images", async ({
  page,
}) => {
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const broken = await page
      .locator("img")
      .evaluateAll((images) =>
        images
          .filter(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth === 0,
          )
          .map((i) => (i as HTMLImageElement).src),
      );
    expect(broken, route).toEqual([]);
  }
  expect(errors).toEqual([]);
});
test("all routes fit a mobile viewport", async ({ page }) => {
  test.setTimeout(150000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
  }
  await page.goto("/app");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
});
test("registration, password visibility, and seven-step onboarding", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Create demo profile" }).click();
  await expect(page.getByText("Enter an email or phone number.")).toBeVisible();
  await page.getByLabel("Email or phone number").fill("alex@example.com");
  await page.getByLabel("Password", { exact: true }).fill("fictional123");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByLabel("I confirm that I am 18").check();
  await page.getByLabel("I agree to").check();
  await page.getByRole("button", { name: "Create demo profile" }).click();
  await expect(page).toHaveURL("/onboarding");
  await page.getByLabel("Username").fill("alex.demo");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Date of birth").fill("2015-01-01");
  await page.getByLabel("I confirm I’m 18").check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".form-error")).toContainText("18+");
  await page.getByLabel("Date of birth").fill("2000-01-01");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Music", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Display name").fill("Alex Demo");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Enter the community" }).click();
  await expect(page).toHaveURL("/app");
  await expect(page.getByText("A LITTLE HELLO, ALEX DEMO")).toBeVisible();
});
test("login failure and recovery are honest simulated states", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email or phone number").fill("error@demo.test");
  await page.getByLabel("Password", { exact: true }).fill("fictional123");
  await page.getByRole("button", { name: "Log in to the demo" }).click();
  await expect(page.locator(".form-error")).toContainText(
    "Simulated sign-in error",
  );
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL("/forgot-password");
  await page.getByLabel("Email or phone number").fill("alex@example.com");
  await page.getByRole("button", { name: "Preview recovery" }).click();
  await expect(page.getByText("Recovery preview complete.")).toBeVisible();
});
test("discovery filters, favorites, modal and friend requests update", async ({
  page,
}) => {
  await page.goto("/app/discover");
  await expect(page.locator(".profile-card")).toHaveCount(8);
  await page.getByLabel("Country", { exact: true }).selectOption("Uganda");
  await expect(page.locator(".profile-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Save Amina", exact: true }).click();
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await page.getByRole("button", { name: /Your favorites/ }).click();
  await expect(page.locator(".profile-card")).toHaveCount(1);
  await page.getByRole("button", { name: "View Amina’s profile" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await page.getByLabel("Country", { exact: true }).selectOption("Canada");
  await expect(page.locator(".profile-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Request pending" }),
  ).toBeVisible();
  await page.getByLabel("Language", { exact: true }).selectOption("Arabic");
  await expect(page.getByText("No matches just yet.")).toBeVisible();
});
test("matching supports cancel, accept, camera and mic toggles, chat and end", async ({
  page,
}) => {
  await page.goto("/app/match");
  await page
    .getByRole("button", { name: "Start matching", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel search" }).click();
  await expect(
    page.getByRole("button", { name: "Start matching", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Country preference").selectOption("Uganda");
  await page
    .getByRole("button", { name: "Start matching", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Say hello", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Say hello", exact: true }).click();
  await expect(page.getByText("SIMULATED CONVERSATION")).toBeVisible();
  await page.getByRole("button", { name: "Turn camera off" }).click();
  await expect(page.getByText("You · camera off")).toBeVisible();
  await page.getByRole("button", { name: "Unmute microphone" }).click();
  await expect(
    page.getByRole("button", { name: "Mute microphone" }),
  ).toBeVisible();
  await page
    .getByLabel("Call chat message", { exact: true })
    .fill("A fictional hello!");
  await page.getByRole("button", { name: "Send call chat message" }).click();
  await expect(
    page.getByText("A fictional hello!", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "End simulated call" }).click();
  await expect(
    page.getByRole("button", { name: "Start matching", exact: true }),
  ).toBeVisible();
});
test("matching empty and failure developer scenarios", async ({ page }) => {
  await page.goto("/app/match");
  await page.getByText("Developer preview controls").click();
  await page.getByLabel("Simulate an outcome").selectOption("empty");
  await page
    .getByRole("button", { name: "Start matching", exact: true })
    .click();
  await expect(page.getByText("A little quiet in this corner.")).toBeVisible();
  await page.getByRole("button", { name: "Reset preferences" }).click();
  await page.getByLabel("Simulate an outcome").selectOption("error");
  await page
    .getByRole("button", { name: "Start matching", exact: true })
    .click();
  await expect(page.getByText("A small bump in the connection.")).toBeVisible();
});
test("local messages and unread indicators work", async ({ page }) => {
  await page.goto("/app/messages?user=u2");
  await page
    .getByLabel("Message", { exact: true })
    .fill("This is a local message.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page
      .locator(".message-bubble")
      .filter({ hasText: "This is a local message." }),
  ).toBeVisible();
  await page
    .locator(".conversation-sidebar")
    .getByPlaceholder("Search conversations…")
    .fill("no match");
  await expect(page.getByText("No conversations found.")).toBeVisible();
});
test("friend requests accept and remove with confirmation", async ({
  page,
}) => {
  await page.goto("/app/friends");
  await page.getByRole("button", { name: /Incoming requests/ }).click();
  await page
    .locator(".friend-card")
    .filter({ hasText: "Amina" })
    .getByRole("button", { name: "Accept", exact: true })
    .click();
  await page.getByRole("button", { name: /Your friends/ }).click();
  const card = page.locator(".friend-card").filter({ hasText: "Amina" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Remove", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Remove friend" })
    .click();
  await expect(
    page.locator(".friend-card").filter({ hasText: "Amina" }),
  ).toHaveCount(0);
});
test("notifications mark all as read and empty state", async ({ page }) => {
  await page.goto("/app/notifications");
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await page.getByRole("button", { name: /Unread/ }).click();
  await expect(
    page.getByText("Nothing new. Plenty to discover."),
  ).toBeVisible();
});
test("profile edit and local display preferences persist correctly", async ({
  page,
}) => {
  await page.goto("/app/profile");
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await page.getByLabel("Display name").fill("Alex Updated");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.locator(".profile-overview h1")).toContainText(
    "Alex Updated",
  );
  await page
    .locator(".sidebar")
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Accessibility", exact: true })
    .click();
  await page.getByRole("switch", { name: "Reduce motion" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Accessibility", exact: true })
    .click();
  await expect(
    page.getByRole("switch", { name: "Reduce motion" }),
  ).toHaveAttribute("aria-checked", "true");
  const storage = await page.evaluate(() => JSON.stringify(localStorage));
  expect(storage).not.toContain("password");
  expect(storage).not.toContain("token");
});
test("safety reporting, blocking and admin resolution use local state", async ({
  page,
}) => {
  await page.goto("/app/safety?report=u1");
  await page.getByLabel("What happened?").selectOption("Spam");
  await page
    .getByLabel("Additional context")
    .fill("Fictional repeated promotional messages.");
  await page.getByRole("button", { name: "Save mock report" }).click();
  await expect(page.getByText("Saved to the demo.")).toBeVisible();
  await page.getByRole("button", { name: /Blocked users/ }).click();
  await page.getByLabel("Choose a fictional user").selectOption("u1");
  await page.getByRole("button", { name: "Block user", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Block user", exact: true })
    .click();
  await expect(page.locator(".blocked-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Unblock", exact: true }).click();
  await expect(page.getByText("No one on your blocked list.")).toBeVisible();
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "Review", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Mark resolved" }).click();
  await expect(page.locator("td .status-label.resolved")).toHaveCount(2);
  await page.getByRole("button", { name: "User management" }).click();
  await page
    .getByRole("button", { name: "Suspend", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Confirm demo action" }).click();
  await expect(page.locator("td .status-label.suspended")).toHaveCount(1);
});

test("profile upload validation, preview and modal focus stay usable", async ({
  page,
}) => {
  await page.goto("/app/profile");
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("input[type=file]").setInputFiles({
    name: "unsafe.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(dialog.locator(".form-error")).toContainText(
    "JPG, PNG, or WebP",
  );
  await dialog.locator("input[type=file]").setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG1sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(dialog.locator(".avatar img")).toHaveAttribute(
    "src",
    /^data:image\/png/,
  );
  const chip = dialog.getByRole("button", { name: "French", exact: true });
  await chip.click();
  await expect(chip).toBeFocused();
  await dialog.getByRole("button", { name: "Close dialog" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Save profile" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit profile", exact: true }),
  ).toBeFocused();
});

test("emergency disconnect blocks the match and hides them from discovery", async ({
  page,
}) => {
  await page.goto("/app/match");
  await page.getByLabel("Country preference").selectOption("Uganda");
  await page
    .getByRole("button", { name: "Start matching", exact: true })
    .click();
  await page.getByRole("button", { name: "Say hello", exact: true }).click();
  await page
    .getByRole("button", { name: "Disconnect & block", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Disconnect & block", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start matching", exact: true }),
  ).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("link", { name: "Discover people" })
    .click();
  await expect(page.locator(".profile-card")).toHaveCount(7);
  await expect(
    page.getByRole("button", { name: "View Amina’s profile" }),
  ).toHaveCount(0);
});
