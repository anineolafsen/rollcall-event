import { test, expect } from "@playwright/test";

test.setTimeout(200000);
test.describe.configure({ mode: "serial" });

const user1 = `alice${Date.now()}+clerk_test@example.com`;
const user2 = `bob${Date.now()}+clerk_test@example.com`;
const password = "password";

const tripName = "Test Trip";
const tripDestination = "Test Destination";
const tripDescription = "This is a test trip.";

const startDate = new Date();
startDate.setDate(startDate.getDate() + 7);
const endDate = new Date();
endDate.setDate(endDate.getDate() + 14);

test.beforeEach(async ({ browser }) => {
  // Sign up the first user
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
    await page1.fill('input[placeholder="Last Name"]', "Participant");
    await page1.fill('input[placeholder="Phone Number"]', "11111111");
    await page1.click('div[tabindex="0"]:has-text("Continue")');
    await page1.waitForTimeout(3000);
  }

  // duplicate due to bug, remove after fix
  if (await page1.locator("text=Complete Your Profile").isVisible()) {
    await page1.fill('input[placeholder="First Name"]', "Alice");
    await page1.fill('input[placeholder="Last Name"]', "Participant");
    await page1.fill('input[placeholder="Phone Number"]', "11111111");
    await page1.click('div[tabindex="0"]:has-text("Continue")');
    await page1.waitForTimeout(3000);
  }
  await page1.waitForTimeout(3000);

  // Create trip and invite second user
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

  // Wait for invitation screen to appear
  await page1.waitForSelector('input[placeholder="Type an email address"]', {
    timeout: 5000,
  });

  await page1.fill('input[placeholder="Type an email address"]', user2);
  await page1.click('div[tabindex="0"]:has-text("Add")');
  await page1.waitForTimeout(500);

  await page1.click('div[tabindex="0"]:has-text("Send 1 invitation")');

  // Wait for success confirmation
  await page1.waitForSelector("text=Invitations sent", { timeout: 5000 });
  await page1.waitForTimeout(2000);

  await page1.close();

  // Sign up the second user
  const page2 = await browser.newPage();
  await page2.goto("/sign-up");
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
  await page2.waitForTimeout(3000);

  // Second user accepts the invitation
  await page2.goto("/my-invitations");
  await page2.waitForTimeout(2000);
  await page2.click(`div[tabindex="0"]:has-text("Accept")`);
  await page2.waitForTimeout(2000);

  const saveButton = page2
    .locator('div[tabindex="0"]:has-text("Save")')
    .first();
  await saveButton.click();
  await page2.waitForTimeout(2000);

  page2.close();
});

test.describe("Success", async () => {
  test("Create event and check in", async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', user1);
    await page.fill('input[type="password"]', password);
    await page.click('div[tabindex="0"]:has-text("Sign In")');

    // Create event
    await page.goto("/trips");
    await page.click(
      'div[tabindex="0"][class*="r-cursor-1loqt21"][class*="r-overflow-1udh08x"]',
    );
    await page.waitForTimeout(1000);
    await page.click('div[tabindex="0"]:has-text("See Events")');
    await page.waitForTimeout(1000);
    await page.click(
      ".css-view-g5y9jx.r-cursor-1loqt21.r-position-u8s1d.r-right-zchlnj.r-top-ipm5af",
    );
    await page.waitForTimeout(1000);

    // Fill in event details
    await page.fill('input[placeholder="Add event name"]', "Test Event");
    await page.fill('input[placeholder="Add location"]', "Test Location");
    await page.fill(
      `textarea[placeholder="Add a short event description"]`,
      "This is a test event.",
    );

    // Event dates within trip duration
    const eventStart = new Date();
    eventStart.setDate(eventStart.getDate() + 8);
    const eventEnd = new Date();
    eventEnd.setDate(eventEnd.getDate() + 9);
    const dateFromStr = eventStart.toISOString().slice(0, 16);
    const dateToStr = eventEnd.toISOString().slice(0, 16);

    await page.fill('input[aria-label="Date and time from"]', dateFromStr);
    await page.waitForTimeout(500);
    await page.fill('input[aria-label="Date and time to"]', dateToStr);
    await page.waitForTimeout(500);
    await page.fill('input[placeholder="e.g. 35"]', "50");

    await page.click('div[tabindex="0"]:has-text("Sign-up required")');
    await page.waitForTimeout(500);

    await page.click('div[tabindex="0"]:has-text("Create event")');
    await page.waitForTimeout(2000);
      
    // Verify event was created
    await expect(page.locator('text=Test Event').nth(1)).toBeVisible();
    page.close();

    // Check in to event with second user
    const page2 = await browser.newPage();
    await page2.goto("/sign-in");
    await page2.fill('input[type="email"]', user2);
    await page2.fill('input[type="password"]', password);
    await page2.click('div[tabindex="0"]:has-text("Sign In")');
    
    // Wait for sign-in to complete
    await page2.waitForSelector('text=Rollcall Event', { timeout: 5000 });
    await page2.waitForTimeout(1000);
    
    await page2.goto("/trips");
    await page2.click(
      'div[tabindex="0"][class*="r-cursor-1loqt21"][class*="r-overflow-1udh08x"]',
    );
    await page2.waitForTimeout(1000);
    await page2.click('div[tabindex="0"]:has-text("See Events")');
    await expect(page2.locator(`text=Test Event`)).toBeVisible();
    await page2.click(`text=Test Event`);
    await page2.waitForTimeout(1000);
    await page2.getByText('Join').nth(1).click();
    await page2.waitForTimeout(2000);
    await expect(
      page2.locator('div[tabindex="0"]:has-text("Leave")'),
    ).toBeVisible();
    page2.close();

    const page3 = await browser.newPage();
    await page3.goto("/sign-in");
    await page3.fill('input[type="email"]', user1);
    await page3.fill('input[type="password"]', password);
    await page3.click('div[tabindex="0"]:has-text("Sign In")');

    await page3.goto("/trips");
    await page3.click(
      'div[tabindex="0"][class*="r-cursor-1loqt21"][class*="r-overflow-1udh08x"]',
    );
    await page3.waitForTimeout(1000);
    await page3.click('div[tabindex="0"]:has-text("See Events")');

    await expect(page3.locator(`text=Test Event`)).toBeVisible();
    await expect(page3.locator("text=1/50")).toBeVisible();

    await page3.click('div[tabindex="0"]:has-text("Start Check-in")');
    await page3.click("text=Self Check-in");
    await page3.waitForTimeout(2000);

    await expect(page3.locator("text=Stop Check-in")).toBeVisible();
    page3.close();

    const page4 = await browser.newPage();
    await page4.goto("/sign-in");
    await page4.fill('input[type="email"]', user2);
    await page4.fill('input[type="password"]', password);
    await page4.click('div[tabindex="0"]:has-text("Sign In")');
    await page4.waitForTimeout(2000);

    await page4.isVisible(`text=Check in for:`);
    await page4.locator('div').filter({ hasText: /^Check in$/ }).first().click();
    await page4.waitForTimeout(2000);

    // Navigate to event to verify check-in
    await page4.goto("/trips");
    await page4.click(
      'div[tabindex="0"][class*="r-cursor-1loqt21"][class*="r-overflow-1udh08x"]',
    );
    await page4.waitForTimeout(1000);
    await page4.click('div[tabindex="0"]:has-text("See Events")');
    await page4.click(`text=Test Event`);
    await page4.waitForTimeout(1000);

    await expect(page4.locator("text=Checked in")).toBeVisible();
    page4.close();
  });
});

test.describe("Failure", () => {
  test("Create event with invalid date", async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', user1);
    await page.fill('input[type="password"]', password);
    await page.click('div[tabindex="0"]:has-text("Sign In")');

    // Create event
    await page.goto("/trips");
    await page.click(
      'div[tabindex="0"][class*="r-cursor-1loqt21"][class*="r-overflow-1udh08x"]',
    );
    await page.waitForTimeout(1000);
    await page.click('div[tabindex="0"]:has-text("See Events")');
    await page.waitForTimeout(1000);
    // Click the add event button
    await page.click(
      ".css-view-g5y9jx.r-cursor-1loqt21.r-position-u8s1d.r-right-zchlnj.r-top-ipm5af",
    );

    // Fill in event details
    await page.fill('input[placeholder="Add event name"]', "Invalid Event");
    await page.fill('input[placeholder="Add location"]', "Invalid Location");
    await page.fill(
      `textarea[placeholder="Add a short event description"]`,
      "This event has an invalid date.",
    );

    // Use dates outside trip duration
    const now = new Date();
    const dateFromStr = now.toISOString().slice(0, 16);
    const dateToStr = new Date(now.getTime() + 3600000)
      .toISOString()
      .slice(0, 16);

    await page.fill('input[aria-label="Date and time from"]', dateFromStr);
    await page.waitForTimeout(500);
    await page.fill('input[aria-label="Date and time to"]', dateToStr);
    await page.waitForTimeout(500);
    await page.fill('input[placeholder="e.g. 35"]', "50");

    await page.click('div[tabindex="0"]:has-text("Mandatory")');
    await page.waitForTimeout(500);

    // Try to create event
    await page.click('div[tabindex="0"]:has-text("Create event")');
    await page.waitForTimeout(2000);

    // Verify validation error appears
    await expect(
      page.locator("text=Start date and time cannot be in the past"),
    ).toBeVisible();

    await page.close();
  });
});

test.afterEach(async ({ browser }) => {
  // Delete the first user
  const page3 = await browser.newPage();
  await page3.goto("/sign-in");
  await page3.waitForTimeout(1000);
  await page3.fill('input[type="email"]', user1);
  await page3.fill('input[type="password"]', password);
  await page3.click('div[tabindex="0"]:has-text("Sign In")');

  // Wait for sign-in to complete by checking for home page elements
  await page3.waitForSelector("text=Rollcall Event", { timeout: 5000 });
  await page3.waitForTimeout(1000);

  // Navigate to profile
  await page3.goto("/profile");
  await page3.waitForTimeout(1000);
  page3.once("dialog", (dialog) => dialog.accept());
  await page3.click('div[tabindex="0"]:has-text("Delete Account")');
  await page3.waitForTimeout(2000);
  await page3.close();

  // Delete the second user
  const page4 = await browser.newPage();
  await page4.goto("/sign-in");
  await page4.waitForTimeout(1000);
  await page4.fill('input[type="email"]', user2);
  await page4.fill('input[type="password"]', password);
  await page4.click('div[tabindex="0"]:has-text("Sign In")');

  // Wait for sign-in to complete by checking for home page elements
  await page4.waitForSelector("text=Rollcall Event", { timeout: 5000 });
  await page4.waitForTimeout(1000);

  // Navigate to profile
  await page4.goto("/profile");
  await page4.waitForTimeout(1000);
  page4.once("dialog", (dialog) => dialog.accept());
  await page4.click('div[tabindex="0"]:has-text("Delete Account")');
  await page4.waitForTimeout(2000);
  await page4.close();
});
