import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const user = `bob${Date.now()}+clerk_test@example.com`;
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
    }

    await page.waitForTimeout(3000);

    // Confirm user details if profile confirmation screen is shown
    if (await page.locator("text=Complete Your Profile").isVisible()) {
      await page.fill('input[placeholder="First Name"]', "Bob");
      await page.fill('input[placeholder="Last Name"]', "Smith");
      await page.fill('input[placeholder="Phone Number"]', "12345678");
      await page.click('div[tabindex="0"]:has-text("Continue")');
    }

    await page.waitForTimeout(1000);
  });

  test("Create Trip", async ({ page }) => {
    // Navigate to Trips
    await page.click(
      'div[tabindex="0"][class*="r-cursor-1loqt21"]:has-text("My Trips")',
    );
    await page.waitForTimeout(1000);

    // Create a new trip
    await page.goto("/trips/create");
    await page.fill('input[placeholder="Add trip name"]', tripName);
    await page.fill('input[placeholder="Add destination"]', tripDestination);

    // Fill dates using aria-label from the DateField labels
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
    await page.fill(`textarea[placeholder="Add a short trip description"]`, tripDescription);


    await page.click('div[tabindex="0"]:has-text("Create Trip")');
    await page.waitForTimeout(3000);

    // Verify trip is created and redirected to invitation page
    await expect(page.locator("text=Invite Participants")).toBeVisible();
  });

  test("Edit Trip", async ({ page }) => {
    // Navigate to Trips
    await page.click(
      'div[tabindex="0"][class*="r-cursor-1loqt21"]:has-text("My Trips")',
    );
    await page.waitForTimeout(1000);

    // Create a new trip
    await page.goto("/trips/create");
    await page.fill('input[placeholder="Add trip name"]', tripName);
    await page.fill('input[placeholder="Add destination"]', tripDestination);

    // Fill dates
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

    // Navigate back to trips
    await page.click(
      'div[tabindex="0"][class*="r-cursor-1loqt21"]:has-text("My Trips")',
    );
    await page.click(
      'div[tabindex="0"][class*="r-cursor-1loqt21"][class*="r-overflow-1udh08x"]',
    );

    // Edit
    await page.click('div[tabindex="0"]:has-text("✎ Edit")');
    await page.waitForTimeout(1000);

    const editedTripName = `${tripName} - Edited`;
    const editedDestination = `${tripDestination} - Updated`;
    const editedDescription = `${tripDescription} This description has been updated.`;
    
    // Clear and fill new values
    await page.fill('input[placeholder="Add trip name"]', editedTripName);
    await page.fill('input[placeholder="Add destination"]', editedDestination);
    await page.fill('textarea[placeholder="Add a short trip description"]', editedDescription);

    await page.click('div[tabindex="0"]:has-text("Save changes")');

    // Verify changes were saved
    await expect(page.locator(`text=${editedTripName}`)).toBeVisible();
    await expect(page.locator(`text=${editedDestination}`)).toBeVisible();
  });

  // Delete trip and user after each test
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

    // Delete user
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
