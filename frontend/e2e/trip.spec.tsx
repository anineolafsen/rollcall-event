import { test, expect } from "@playwright/test";

test.setTimeout(200000);
test.describe.configure({ mode: "serial" });

const user = `bob4${Date.now()}+clerk_test@example.com`;
const password = "password";

const tripName = "Test Trip";
const tripDestination = "Test Destination";
const tripDescription = "This is a test trip.";
const today = new Date();
const startDate = new Date(today);
startDate.setDate(today.getDate() + 7);
const endDate = new Date(today);
endDate.setDate(today.getDate() + 14);

test.describe("Trips", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-up");

    await page.fill('input[type="email"]', user);
    await page.fill('input[type="password"]', password);
    await page.click('div[tabindex="0"]:has-text("Sign Up")');

    await page.waitForTimeout(3000);

    await page.fill('input[placeholder="Verification code"]', "424242");
    await page.click('div[tabindex="0"]:has-text("Verify Email")');

    await page.waitForTimeout(3000);

    if (await page.locator("text=Complete Your Profile").isVisible()) {
      await page.fill('input[placeholder="First Name"]', "Bob");
      await page.fill('input[placeholder="Last Name"]', "Smith");
      await page.fill('input[placeholder="Phone Number"]', "12345678");
      await page.click('div[tabindex="0"]:has-text("Continue")');
    }

    await page.waitForTimeout(3000);

    // Duplicate due to bug, remove after fix
    if (await page.locator("text=Complete Your Profile").isVisible()) {
      await page.fill('input[placeholder="First Name"]', "Bob");
      await page.fill('input[placeholder="Last Name"]', "Smith");
      await page.fill('input[placeholder="Phone Number"]', "12345678");
      await page.click('div[tabindex="0"]:has-text("Continue")');
    }

    await page.waitForTimeout(1000);
  });

  test.describe("Success", () => {
    test("Create Trip", async ({ page }) => {
      // Navigate and create trip
      await page.click(
        'div[tabindex="0"][class*="r-cursor-1loqt21"]:has-text("My Trips")',
      );
      await page.waitForTimeout(1000);

      await page.goto("/trips/create");
      await page.fill('input[placeholder="Add trip name"]', tripName);
      await page.fill('input[placeholder="Add destination"]', tripDestination);
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
        tripDescription,
      );

      await page.click('div[tabindex="0"]:has-text("Create Trip")');
      await page.waitForTimeout(3000);

      await expect(page.locator("text=Invite Participants")).toBeVisible();
    });

    test("Edit Trip", async ({ page }) => {
      // Navigate and create trip
      await page.click(
        'div[tabindex="0"][class*="r-cursor-1loqt21"]:has-text("My Trips")',
      );
      await page.waitForTimeout(1000);

      await page.goto("/trips/create");
      await page.fill('input[placeholder="Add trip name"]', tripName);
      await page.fill('input[placeholder="Add destination"]', tripDestination);
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
      await page.fill('textarea[placeholder="Add a short trip description"]', "This is a test trip.");

      await page.click('div[tabindex="0"]:has-text("Create Trip")');
      await page.waitForTimeout(1000);

      await page.click(
        'div[tabindex="0"][class*="r-cursor-1loqt21"]:has-text("My Trips")',
      );
      await page.click(
        'div[tabindex="0"][class*="r-cursor-1loqt21"][class*="r-overflow-1udh08x"]',
      );

      // Edit trip
      await page.click('div[tabindex="0"]:has-text("✎ Edit")');
      await page.waitForTimeout(1000);

      const editedTripName = `${tripName} - Edited`;
      const editedDestination = `${tripDestination} - Updated`;
      const editedDescription = `${tripDescription} This description has been updated.`;

      await page.fill('input[placeholder="Add trip name"]', editedTripName);
      await page.fill('input[placeholder="Add destination"]', editedDestination);
      await page.fill('textarea[placeholder="Add a short trip description"]', editedDescription);

      await page.click('div[tabindex="0"]:has-text("Save changes")');
      await page.waitForTimeout(1000);

      await expect(page.locator(`text=${editedTripName}`)).toBeVisible();
      await expect(page.locator(`text=${editedDestination}`)).toBeVisible();
    });
  });

  test.describe("Failure", () => {
    test("Create Trip - Missing trip name", async ({ page }) => {
      // Empty trip name
      await page.goto("/trips/create");
      await page.fill('input[placeholder="Add destination"]', tripDestination);
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
        tripDescription,
      );

      await page.click('div[tabindex="0"]:has-text("Create Trip")');
      await page.waitForTimeout(500);

      await expect(page.locator("text=Add a trip name")).toBeVisible();
    });

    test("Create Trip - Invalid date range", async ({ page }) => {
      // End date before start date
      const invalidStartDate = new Date(today);
      invalidStartDate.setDate(today.getDate() + 14);
      const invalidEndDate = new Date(today);
      invalidEndDate.setDate(today.getDate() + 7);

      await page.goto("/trips/create");
      await page.fill('input[placeholder="Add trip name"]', tripName);
      await page.fill('input[placeholder="Add destination"]', tripDestination);
      await page.fill(
        'input[aria-label="Date from"]',
        invalidStartDate.toISOString().slice(0, 16),
      );
      await page.waitForTimeout(500);
      await page.fill(
        'input[aria-label="Date to"]',
        invalidEndDate.toISOString().slice(0, 16),
      );
      await page.waitForTimeout(500);
      await page.fill(
        `textarea[placeholder="Add a short trip description"]`,
        tripDescription,
      );

      await page.click('div[tabindex="0"]:has-text("Create Trip")');
      await page.waitForTimeout(500);

      await expect(page.locator("text=End date must be after start date")).toBeVisible();
    });

    test("Create Trip - Missing description", async ({ page }) => {
      // Empty description
      await page.goto("/trips/create");
      await page.fill('input[placeholder="Add trip name"]', tripName);
      await page.fill('input[placeholder="Add destination"]', tripDestination);
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

      await page.click('div[tabindex="0"]:has-text("Create Trip")');
      await page.waitForTimeout(500);

      await expect(page.locator("text=Add a short description")).toBeVisible();
    });
  });

  test.afterEach(async ({ page }) => {
    try {
      await page.goto("/trips");
      await page.waitForTimeout(1000);

      const tripCards = await page.locator(
        'div[tabindex="0"][class*="r-cursor-1loqt21"][class*="r-overflow-1udh08x"]',
      ).all();

      if (tripCards.length > 0) {
        await tripCards[0].click();
        await page.waitForTimeout(500);

        page.once("dialog", (dialog) => dialog.accept());
        await page.click('div[tabindex="0"]:has-text("Delete")');
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log("Trip deletion failed, proceeding to delete account", e);
    }

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

