import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });
test.setTimeout(120000);

const user1 = `alice${Date.now()}+clerk_test@example.com`;
const user2 = `bob${Date.now()}+clerk_test@example.com`;
const user3 = `charlie${Date.now()}+clerk_test@example.com`;
const password = "password";

const tripName = "Shared Trip";
const tripDestination = "Test Destination";
const tripDescription = "A trip for testing invitations.";
const today = new Date();
const startDate = new Date(today);
startDate.setDate(today.getDate() + 7);
const endDate = new Date(today);
endDate.setDate(today.getDate() + 14);

test.describe("Invitations", () => {
  let createdUsers: Array<{ email: string; password: string }> = [];

  test.describe("Success", () => {
    test("Invite user to a trip and user joins", async ({ browser }) => {
      const page1 = await browser.newPage();

      await page1.goto("/sign-up");
      await page1.fill('input[type="email"]', user1);
      await page1.fill('input[type="password"]', password);
      await page1.click('div[tabindex="0"]:has-text("Sign Up")');
      await page1.waitForTimeout(3000);

      await page1.fill('input[placeholder="Verification code"]', "424242");
      await page1.click('div[tabindex="0"]:has-text("Verify Email")');
      await page1.waitForTimeout(3000);

      if (await page1.locator("text=Complete Your Profile").isVisible()) {
        await page1.fill('input[placeholder="First Name"]', "Alice");
        await page1.fill('input[placeholder="Last Name"]', "Organizer");
        await page1.fill('input[placeholder="Phone Number"]', "11111111");
        await page1.click('div[tabindex="0"]:has-text("Continue")');
        await page1.waitForTimeout(3000);
      }

      // duplicate due to bug, remove after fix
      if (await page1.locator("text=Complete Your Profile").isVisible()) {
        await page1.fill('input[placeholder="First Name"]', "Alice");
        await page1.fill('input[placeholder="Last Name"]', "Organizer");
        await page1.fill('input[placeholder="Phone Number"]', "11111111");
        await page1.click('div[tabindex="0"]:has-text("Continue")');
        await page1.waitForTimeout(3000);
      }

      // User A: Create Trip
      await page1.click(
        'div[tabindex="0"][class*="r-cursor-1loqt21"]:has-text("My Trips")',
      );
      await page1.waitForTimeout(1000);

      await page1.goto("/trips/create");
      await page1.fill('input[placeholder="Add trip name"]', tripName);
      await page1.fill('input[placeholder="Add destination"]', tripDestination);
      await page1.fill(
        'input[aria-label="Date from"]',
        startDate.toISOString().slice(0, 16),
      );
      await page1.waitForTimeout(500);
      await page1.fill(
        'input[aria-label="Date to"]',
        endDate.toISOString().slice(0, 16),
      );
      await page1.waitForTimeout(500);
      await page1.fill(
        `textarea[placeholder="Add a short trip description"]`,
        tripDescription,
      );

      await page1.click('div[tabindex="0"]:has-text("Create Trip")');
      await page1.waitForTimeout(3000);

      // User A: Send Email Invitation
      await expect(page1.locator("text=Invite Participants")).toBeVisible();

      await page1.fill('input[placeholder="Type an email address"]', user2);
      await page1.click('div[tabindex="0"]:has-text("Add")');
      await page1.waitForTimeout(500);

      await page1.click('div[tabindex="0"]:has-text("Send 1 invitation")');
      await page1.waitForTimeout(2000);

      await expect(page1.locator("text=Invitations sent")).toBeVisible();

      await page1.close();

      // User B: Create new page and sign up
      const page2 = await browser.newPage();

      await page2.goto("/sign-up");
      await page2.waitForTimeout(2000);

      await page2.fill('input[type="email"]', user2);
      await page2.fill('input[type="password"]', password);
      await page2.click('div[tabindex="0"]:has-text("Sign Up")');
      await page2.waitForTimeout(3000);

      await page2.fill('input[placeholder="Verification code"]', "424242");
      await page2.click('div[tabindex="0"]:has-text("Verify Email")');
      await page2.waitForTimeout(3000);

      if (await page2.locator("text=Complete Your Profile").isVisible()) {
        await page2.fill('input[placeholder="First Name"]', "Bob");
        await page2.fill('input[placeholder="Last Name"]', "Participant");
        await page2.fill('input[placeholder="Phone Number"]', "22222222");
        await page2.click('div[tabindex="0"]:has-text("Continue")');
        await page2.waitForTimeout(3000);
      }

      // duplicate due to bug, remove after fix
      if (await page2.locator("text=Complete Your Profile").isVisible()) {
        await page2.fill('input[placeholder="First Name"]', "Bob");
        await page2.fill('input[placeholder="Last Name"]', "Participant");
        await page2.fill('input[placeholder="Phone Number"]', "22222222");
        await page2.click('div[tabindex="0"]:has-text("Continue")');
        await page2.waitForTimeout(3000);
      }

      // User B: Check My Invitations
      console.log("User B navigating to My Invitations");
      await page2.goto("/my-invitations");
      await page2.waitForTimeout(2000);

      // User B: Accept invitation
      console.log(`User B looking for invitation with trip name: ${tripName}`);

      await page2.click(`div[tabindex="0"]:has-text("Accept")`);
      await page2.waitForTimeout(2000);

      // User B: Save modal
      const saveButton = page2
        .locator('div[tabindex="0"]:has-text("Save")')
        .first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page2.waitForTimeout(2000);
      } else {
        console.log("No Save button found in modal");
      }

      // User B: Verify trip appears
      await page2.click(
        'div[tabindex="0"][class*="r-cursor-1loqt21"]:has-text("My Trips")',
      );
      await page2.waitForTimeout(2000);
      await expect(page2.locator(`text=${tripName}`)).toBeVisible({
        timeout: 10000,
      });
      await expect(page2.locator(`text=${tripDestination}`)).toBeVisible();

      // Cleanup: Delete user B
      await page2.goto("/profile");
      page2.once("dialog", (dialog) => dialog.accept());
      await page2.click('div[tabindex="0"]:has-text("Delete Account")');
      await page2.waitForTimeout(2000);
      await page2.close();

      // Cleanup: Delete user A
      const page3 = await browser.newPage();
      await page3.goto("/sign-in");
      await page3.fill('input[type="email"]', user1);
      await page3.fill('input[type="password"]', password);
      await page3.click('div[tabindex="0"]:has-text("Sign In")');
      await page3.waitForTimeout(3000);
      await page3.goto("/profile");
      page3.once("dialog", (dialog) => dialog.accept());
      await page3.click('div[tabindex="0"]:has-text("Delete Account")');
      await page3.waitForTimeout(2000);
      await page3.close();
    });
  });

  test.describe("Failure", () => {
    test("Invalid email rejected when adding invitation", async ({ page }) => {

      await page.goto("/sign-up");
      await page.fill('input[type="email"]', user3);
      await page.fill('input[type="password"]', password);
      await page.click('div[tabindex="0"]:has-text("Sign Up")');
      await page.waitForTimeout(3000);

      await page.fill('input[placeholder="Verification code"]', "424242");
      await page.click('div[tabindex="0"]:has-text("Verify Email")');
      await page.waitForTimeout(3000);

      if (await page.locator("text=Complete Your Profile").isVisible()) {
        await page.fill('input[placeholder="First Name"]', "Charlie");
        await page.fill('input[placeholder="Last Name"]', "Test");
        await page.fill('input[placeholder="Phone Number"]', "33333333");
        await page.click('div[tabindex="0"]:has-text("Continue")');
        await page.waitForTimeout(3000);
      }

      // Duplicate due to bug - use same values
      if (await page.locator("text=Complete Your Profile").isVisible()) {
        await page.fill('input[placeholder="First Name"]', "Charlie");
        await page.fill('input[placeholder="Last Name"]', "Test");
        await page.fill('input[placeholder="Phone Number"]', "33333333");
        await page.click('div[tabindex="0"]:has-text("Continue")');
        await page.waitForTimeout(3000);
      }

      // Create a trip
      await page.click(
        'div[tabindex="0"][class*="r-cursor-1loqt21"]:has-text("My Trips")',
      );
      await page.waitForTimeout(3000);

      await page.goto("/trips/create");
      await page.fill('input[placeholder="Add trip name"]', "Test Trip");
      await page.fill('input[placeholder="Add destination"]', "Destination");
      await page.fill(
        'input[aria-label="Date from"]',
        startDate.toISOString().slice(0, 16),
      );
      await page.waitForTimeout(500);
      await page.fill(
        'input[aria-label="Date to"]',
        endDate.toISOString().slice(0, 16),
      );
      await page.waitForTimeout(500);
      await page.fill(
        `textarea[placeholder="Add a short trip description"]`,
        "Test",
      );

      await page.click('div[tabindex="0"]:has-text("Create Trip")');
      await page.waitForTimeout(1000);

      // Try invalid email
      await page.fill(
        'input[placeholder="Type an email address"]',
        "invalid-email",
      );
      await page.click('div[tabindex="0"]:has-text("Add")');
      await page.waitForTimeout(500);

      await expect(
        page.locator("text=Invalid email format. Please use a valid email address (e.g., user@example.com)")
      ).toBeVisible();

      await page.goto("/profile");
      page.once("dialog", (dialog) => dialog.accept());
      await page.click('div[tabindex="0"]:has-text("Delete Account")');
      await page.waitForTimeout(2000);
      await page.close();
    });
  });
});
