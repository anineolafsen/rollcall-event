import { test, expect } from "@playwright/test";

test.describe.configure({ mode: 'serial' });

const user = `bob${Date.now()}+clerk_test@example.com`;
const password = "password";

test.describe("Authentication", () => {
  test("Sign Up", async ({ page }) => {
    await page.goto("/sign-up");

    // Signup
    await page.fill('input[type="email"]', user);
    await page.fill('input[type="password"]', password);
    await page.click('div[tabindex="0"]:has-text("Sign Up")');

    await page.waitForTimeout(3000);

    // Verification email
    await page.fill('input[placeholder="Verification code"]', "424242");
    await page.click('div[tabindex="0"]:has-text("Verify Email")');

    await page.waitForTimeout(3000);

    // Input user details if profile completion screen is shown
    if (await page.locator("text=Complete Your Profile").isVisible()) {
      await page.fill('input[placeholder="First Name"]', "Bob");
      await page.fill('input[placeholder="Last Name"]', "Smith");
      await page.fill('input[placeholder="Phone Number"]', "12345678");
      await page.click('div[tabindex="0"]:has-text("Continue")');

      await page.waitForTimeout(3000);

      // Confirm user details if profile confirmation screen is shown
      if (await page.locator("text=Complete Your Profile").isVisible()) {
        await page.fill('input[placeholder="First Name"]', "Bob");
        await page.fill('input[placeholder="Last Name"]', "Smith");
        await page.fill('input[placeholder="Phone Number"]', "12345678");
        await page.click('div[tabindex="0"]:has-text("Continue")');
      }
    }

    await page.waitForTimeout(3000);

    // Verify that the user is signed in
    await expect(page.locator("text=Rollcall Event")).toBeVisible();
    await expect(page.locator("text=Trip management")).toBeVisible();
    await expect(page.locator("text=Invitations")).toBeVisible();
    await expect(page.locator("text=Chats")).toBeVisible();
    await expect(page.locator("text=Profile")).toBeVisible();

    // Sign out
    await page.goto("/profile");
    page.once("dialog", (dialog) => dialog.accept());
    await page.click('div[tabindex="0"]:has-text("Sign out")');
  });

  test("Login", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', user);
    await page.fill('input[type="password"]', password);
    await page.click('div[tabindex="0"]:has-text("Sign In")');

    // Add this assertion
    await expect(page.locator("text=Rollcall Event")).toBeVisible();
    await expect(page.locator("text=Trip management")).toBeVisible();
    await expect(page.locator("text=Invitations")).toBeVisible();
    await expect(page.locator("text=Chats")).toBeVisible();
    await expect(page.locator("text=Profile")).toBeVisible();
  });

  test("Delete Account", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', user);
    await page.fill('input[type="password"]', password);
    await page.click('div[tabindex="0"]:has-text("Sign In")');
  
    // Delete user after
    await page.goto("/profile");
    page.once("dialog", (dialog) => dialog.accept());
    await page.click('div[tabindex="0"]:has-text("Delete Account")');
    await page.waitForTimeout(1000);
    await page.reload();
    await expect(
      page.locator("text=Sign in to see your trips and events"),
    ).toBeVisible();
  });
});
