# User Guide

> Step-by-step walkthroughs for using Rollcall Event as an organizer or participant.

---

## Table of Contents

- [Getting Started](#getting-started)
- [For Event Organizers](#for-event-organizers)
- [For Participants](#for-participants)
- [Core Features](#core-features)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Getting Started

### First Time Login

1. **Open the App**
   - Launch Rollcall Event on your mobile device (iOS or Android)

2. **Sign In**
   - **Option A: Email/Password**
     - Tap "Sign In"
     - Enter your email and password
     - Verify your email if prompted
   
   - **Option B: Social Login**
     - Tap "Sign In with Google", "Sign In with Microsoft", or "Sign In with Apple"
     - Follow the provider's login flow
     - Grant permission when prompted

![Sign In Screen](/docs/images/snapshots/snapshot-sign-in.png)
*Sign in with email/password or social login providers*

3. **Create Your Profile (First Time Only)**
   - First name
   - Last name (optional)
   - Phone number (Norwegian format: +4798765432 or 98765432)
   - Tap "Save Profile"

4. **You're In!**
   - You'll see the home screen with any pending trip invitations
   - If no trips yet, you'll see "No invitations at this time"

### Navigation

```
Home Screen
    ├─ My Trips (all trips you're in)
    ├─ Invitations (pending trip invites)
    ├─ Chats (messages within trips)
    └─ Profile (your information)
```

![App Navigation Flow](/docs/images/snapshots/snapshot-home.png)
*Complete user journey: from login through trip creation, event invitations, and profile management*

---

## For Event Organizers

### Creating a Trip

**Goal:** Set up a multi-day event with multiple participants.

**Steps:**

1. **Go to My Trips**
   - Tap "My Trips" in bottom navigation

2. **Tap "Create New Trip"**
   - Trip name: "Team Building 2026" or "Annual Conference"
   - Start date: Pick start date on calendar
   - End date: Pick end date (must be after start date)
   - Destination: "Oslo", "Barcelona", etc.
   - Description: "Annual company event with team activities"
   - Tap "Create Trip"

3. **You're Now the Organizer**
   - You're automatically added as a participant
   - You can now create events and invite participants

### Inviting Participants

**Goal:** Add people to your trip.

**Method 1: Invite Individual (Recommended)**

1. **Go to your trip**
   - Tap on the trip name

2. **Tap "Invite Participants"**
   - Enter email address: "jane@company.com"
   - Tap "Send Invitation"
   - Invitation email is sent (or shown in app)

3. **Participant Receives Invite**
   - Sees pending invitation in their "Invitations" tab
   - Taps "Accept" → joins trip automatically
   - Now you can see them in "Trip Participants"

**Method 2: Batch Upload (Multiple at Once)**

1. **Go to the Trips page**
   - Tap "+Manage invitations" on trip page
   - Tap "Upload Participants"

2. **Upload excel spreadsheet file**
   - Format: One email per row and in column A
   - Example:
     ```
     john@company.com
     jane@company.com
     bob@company.com
     ```
   - Tap "Upload"

3. **All Participants Invited**
   - Invitations sent to all emails
   - They'll see them in their "Invitations" tab

![Invitation flow](/docs/images/snapshots/snapshot-manage-invitation.png)
*Manage invitations and send*

![Invitation flow](/docs/images/snapshots/snapshot-manage-invitation.png)
*Accept invitation as user/participant*

### Creating Events

**Goal:** Schedule activities within your trip.

**Steps:**

1. **Go to Your Trip**
   - Tap trip name

2. **Tap "Add Event"**
   - Event name: "Opening Keynote", "Lunch Break", etc.
   - Location: "Main Hall", "Restaurant", etc.
   - Start date/time: "2026-05-15 09:00"
   - End date/time: "2026-05-15 10:30"
   - Event type: 
     - **MANDATORY** = Everyone must attend
     - **SIGN_UP_REQUIRED** = Participants choose to join (capacity limit)
   - Capacity: "50" or leave blank for unlimited
   - Description: "Keynote by CEO with live Q&A"
   - Tap "Create Event"

3. **Event Now Visible to Participants**
   - All trip participants see the event
   - They can join (if not mandatory)
   - You can start check-in for this event

### Managing Check-In

**Goal:** Track who's present at each event.

![Check-In Process Flow](/docs/images/snapshots/snapshot-check-in-start.png/check-in-start.png)
*Complete check-in workflow: from session start through participant verification to completion*

![Check-In Dashboard](/docs/images/snapshots/snapshot-check-in-overview.png)
*Check-in dashboard to see attending and missing participants*

**Check-In Methods:**

**Method 1: Self Check-In (Participants Check Themselves)**

1. **Start Self Check-In Session**
   - Go to event
   - Tap "Start Check-In"
   - Select "Self Check-In" method

2. **Tell Participants:**
   - "Check-in is now available for this event"
   - Participants go to event → tap "Check In"
   - Confirmation: "You're checked in! ✓"

3. **Monitor Check-Ins**
   - You see live count: "45 / 50 checked in"
   - Missing participants highlighted
   - Tap their name to see contact info

4. **Stop Check-In**
   - Tap "Stop Check-In"
   - No more check-ins accepted

**Method 2: QR Code Check-In (You Scan Participants)**

1. **Start QR Session**
   - Go to event
   - Tap "Start Check-In"
   - Select "QR Code" method
   - Token lifetime: 15 minutes (default)
   - Tap "Start"

2. **QR Code Display**
   - A unique QR code appears on your screen

3. **Monitor Check-Ins**
   - Live count updates as participants scan
   - "38 / 50 checked in"

4. **Stop Session**
   - Tap "Stop QR Check-In"
   - QR code expires
   - Participants cannot check in anymore

### Sending Announcements

**Goal:** Send urgent updates to all participants at an event.

**Steps:**

1. **Go to Event**
   - Tap event name

2. **Tap "Send Message"**
   - Write announcement: "Schedule has changed. Lunch moved to 12:30."
   - Tap "Send"

3. **All Participants Notified**
   - Message appears in their app under that event
   - Push notification sent (if enabled)

### Viewing Participant Information

**Goal:** Access allergy info, contact details, special needs.

**Special Needs:**

1. **Go to Trip**
   - Tap trip name

2. **Tap "Participant Needs"**
   - See list of all participants with:
     - Allergies (peanuts, shellfish, vegetarian, etc.)
     - Other info (accessibility, seat preferences)
     - Phone numbers (private contact info)

3. **Use This Info:**
   - When planning meals, arrange seating
   - During emergencies, contact via phone
   - Respect accessibility needs

### Creating Chat Channels

**Goal:** Enable team discussion within your trip.

**Steps:**

1. **Go to Trip → Chats**
   - Tap "Chats" tab

2. **Tap "Create Channel"**
   - Channel name: "General Questions", "Logistics", "Social"
   - Tap "Create"

3. **Participants Can Join**
   - All trip participants see new channel
   - They can post messages
   - You can moderate or post announcements

---

## For Participants

### Joining a Trip

**Goal:** Accept an invitation and join a trip.

![My Invitations Screen](/docs/images/snapshots/snapshot-my-invitations.png)
*Pending trip invitations dashboard with acceptance options*

**Steps:**

1. **View Pending Invitations**
   - Tap "Invitations" in bottom navigation
   - List shows all pending trip invites

2. **Tap "Accept"**
   - Trip name: "Team Building 2026"
   - Trip dates: "May 15-17, 2026"
   - Organizer info displayed
   - Tap "Accept Invitation"

3. **You're Now a Participant**
   - Trip appears in "My Trips"
   - You see all events, chats, and participants
   - Your information (allergies, phone) is on file

### Viewing Your Trips

**Goal:** See all events and activities in a trip.

**Steps:**

1. **Go to My Trips**
   - Tap "My Trips" navigation

2. **Tap a Trip**
   - See trip details: dates, location, description
   - See all events in the trip
   - Filter by "Upcoming", "Past", "All"

3. **Event Details**
   - Event name, location, time
   - Event type (mandatory, sign up, optional)
   - Who's attending
   - Current attendance/capacity

### Checking In

**Goal:** Mark yourself as present at an event.

**Self Check-In (If Organizer Enabled):**

1. **Open Event**
   - Tap event name

2. **Tap "Check In"**
   - Confirmation: "You're checked in ✓"
   - Shows your check-in time

**QR Code Check-In (If Organizer Started QR Session):**

1. **Open Event**
   - Tap event name
   - Notification shows: "QR check-in available"

2. **Tap "Scan QR Code"**
   - Point phone camera at QR code (organizer's screen)
   - App automatically scans and checks you in
   - Confirmation: "Check-in successful ✓"

### Adding Your Information

**Goal:** Let organizers know about allergies and special needs.

**Steps:**

1. **Go to My Trips**

2. **Tap Profile → "My trips and relevant information"**
   - Allergies: "Peanuts, shellfish, dairy"
   - Other info: "Vegetarian, aisle seat preference, uses wheelchair"
   - Tap "Save"

3. **Organizers Can See**
   - When planning meals, they know your needs

### Using Chat

**Goal:** Communicate with other trip participants or the organizer.

**Steps:**

1. **Go to Chats**
   - List of chat channels (General, Logistics, etc.)

2. **Tap a Conversation**
   - See conversation history
   - New messages at bottom

3. **Send a Message**
   - Tap message input box
   - Type: "What time should I arrive tomorrow?"
   - Tap "Send"

---

## Core Features

### Feature Matrix

| Feature | Organizer | Participant |
|---------|-----------|-------------|
| Create Trip | ✓ | |
| Invite Participants | ✓ | |
| Create Events | ✓ | |
| Start Check-In | ✓ | |
| Check In | ✓ | ✓ |
| View Attendees | ✓ | ✓ |
| Send Announcements | ✓ | |
| View Announcements | ✓ | ✓ |
| Create Chat Channel | ✓ | |
| Post to Chat | ✓ | ✓ |
| Update Profile | ✓ | ✓ |
| Add Special Needs | ✓ | ✓ |

### Event Types Explained

**MANDATORY**
- Organizer: All participants are automatically "in"
- Participant: You must attend (cannot opt out)
- Use for: Important sessions, required activities

**SIGN_UP_REQUIRED**
- Organizer: Sets capacity limit (e.g., 25 spots)
- Participant: Must choose to join (tap "Join Event")
- Use for: Workshops, breakout sessions, activities with limited spaces

**OPTIONAL**
- Organizer: Unlimited participants can join
- Participant: Can choose to attend or skip
- Use for: Social events, optional activities, networking

### Emergency Events

**What are they?**
- Quickly created events for urgent situations
- Name and location can be auto-generated
- Capacity is unlimited

**When to use:**
- Emergency drills and situations

**How to create (Organizers):**
- Tap "Create Emergency Event"
- Fill in only required fields
- Participants see it in their event list

---

## Troubleshooting

### I Can't Log In

**Problem:** "Incorrect email or password"

**Solutions:**
1. Check email spelling (case-insensitive)
3. Try social login (Google, Microsoft, Apple)

**Problem:** "Error connecting to Clerk"

**Solutions:**
1. Check internet connection
2. Restart app
3. Try again in 30 seconds
4. Check Clerk service status

---

### I Was Invited But Don't See the Trip

**Problem:** Invitation not appearing

**Solutions:**
1. Tap "Invitations" → scroll to refresh
2. Check if using correct email
3. Check spam folder (if email sent)
4. Ask organizer to resend invitation
5. Try logging out and in again

---

### Check-In Isn't Working

**Problem:** "Check-in is not available" or error

**Solutions:**

*If you're the organizer:*
1. Tap event → "Start Check-In"
2. Select check-in method (Self or QR)
4. Check that event date is today/now

*If you're a participant:*
1. Refresh the event page (pull down)
2. Check that check-in session is active (ask organizer)

---

### I Can't See Other Participants

**Problem:** "Participant list is empty"

**Solutions:**
1. Refresh trip page (pull down)
2. Check that participants have accepted invitations
3. Ask organizer to invite people again
4. Ensure you're in the same trip
5. Log out and in again

---

### Chat Messages Aren't Sending

**Problem:** Message stuck or error appears

**Solutions:**
1. Check internet connection (WiFi or mobile)
2. Check message length (too long?)
3. Wait 5 seconds, try again
4. Tap "Retry" if option appears
5. Restart app and try again

---

### Special Needs Aren't Saved

**Problem:** Allergies/info not visible to organizer

**Solutions:**
1. Tap "My Details" and check it was saved
2. Tap "Save" again to ensure it's submitted
3. Ask organizer to refresh their view
4. Log out and back in
5. Restart app

---

### Event Isn't Showing Up

**Problem:** Created event, but participants don't see it

**Solutions:**

*If you're the organizer:*
1. Check event date is within trip dates
2. Ensure you clicked "Create" (not just preview)
3. Refresh trip page

*If you're a participant:*
1. Refresh trip page (pull down)
2. Go back to trip, then return
3. Check event date (might be past)
4. Log out and in again
5. Ask organizer to check on their end

---

## FAQ

### General Questions

**Q: Is my data secure?**
A: Yes. We use:
- Clerk for authentication (industry standard)
- HTTPS encryption for all connections
- PostgreSQL with SSL encryption
- Your phone number is only shared with organizers
- Passwords never stored (Clerk handles this)

**Q: Can I delete my account?**
A: Yes, navigate to the profile page to delete your account

**Q: What if I attend under a different name?**
A: You can update your profile:
- Tap "Profile" → Edit
- Change first/last name
- Tap "Save"
- Changes visible to organizers

**Q: Can I be in multiple trips?**
A: Yes! Join as many trips as you'd like. Each appears in "My Trips."

---

### Trip Management

**Q: How do I change the trip dates?**
A: Trip dates cannot be edited after creation (prevents event date conflicts). Delete the trip and create a new one if needed.

**Q: Can I delete a trip?**
A: Only organizers can delete trips. This removes all events and invitations.

**Q: What if someone declines an invitation?**
A: They'll be removed from participants. You can invite them again later.

**Q: Can I remove a participant?**
A: Currently no, this is not a feature.

---

### Events & Check-In

**Q: Can I check in for someone else?**
A: Not yet. Participants must check in themselves (self method) or scan QR code personally.

**Q: What if I miss check-in?**
A: Tell the organizer and they can manually mark you as checked in.

**Q: How long does a QR code last?**
A: Default is 15 minutes.

**Q: Can I check in after the session ends?**
A: No. Once organizer stops the session, check-in is closed. Ask them to restart if needed.

**Q: Why are some events "Mandatory"?**
A: Organizer requires attendance. Participants cannot skip these events.

---

### Communication

**Q: Can I edit or delete messages?**
A: Yes. Tap and hold a message → Edit or Delete.

**Q: Will I get notified of new messages?**
A: Currently no, push notifications are not implemented

---

### Technical

**Q: What phone numbers do you accept?**
A: Norwegian phone numbers in these formats:
- `98765432` (8 digits, no prefix)
- `+4798765432` (with +47 country code)

**Q: What date formats do you accept?**
A: Both of these:
- `2026-05-15` (ISO format)
- `15.05.2026` (European format)

**Q: Can I use the app offline?**
A: Not yet. You need internet for all features. We're working on offline support.

**Q: How often does data sync?**
A: Real-time for most actions. Chat messages sync immediately. Check-ins sync as soon as you tap.

---