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

1. **Sign In**
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

2. **Create Your Profile**
   - First name
   - Last name (optional)
   - Phone number (Norwegian format: +4798765432 or 98765432)
   - Tap "Save Profile"

3. **You're In!**
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

**Goal:** Set up a multi-day trip with multiple participants.

**Steps:**

1. **Go to My Trips**
   - Tap "My Trips" in sidebar navigation

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

**Method 1: Invite Individual**

1. **Go to your trip**
   - Tap on the trip name

2. **Tap "Invite Participants"**
   - Enter email address: "jane@company.com"
   - Tap "Send Invitation"
   - Invitation email is sent

3. **Participant Receives Invite**
   - Sees pending invitation in their "Invitations" tab
   - Taps "Accept" → joins trip and opens special needs forms

**Method 2: Spreadsheet Upload**

1. **Go to the Trips page**
   - Tap "+Manage invitations" on trip page
   - Tap "Upload spreadsheet"

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

2. **Tap "See Events" and "+"**
   - Event name: "Opening Keynote", "Lunch Break", etc.
   - Location: "Main Hall", "Restaurant", etc.
   - Start date/time: "2026-05-15 09:00"
   - End date/time: "2026-05-15 10:30"
   - Event type: 
     - **MANDATORY** = Everyone must attend
     - **SIGN_UP_REQUIRED** = Participants choose to join
   - Capacity: "50" or leave blank for unlimited
   - Description: "Keynote by CEO with live Q&A"
   - Tap "Create Event"

3. **Event Now Visible to Participants**
   - All trip participants see the event
   - They can join (if not mandatory)
   - You can start check-in for this event

### Managing Check-In

**Goal:** Track who's present at each event.

![Check-In Process Flow](/docs/images/snapshots/snapshot-check-in-start.png)
*Complete check-in workflow: from session start through participant verification to completion*

![Check-In Dashboard](/docs/images/snapshots/snapshot-check-in-overview.png)
*Check-in dashboard to see attending and missing participants*

**Self Check-In**

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
   - Missing participants list
   - Tap their name to see contact info

4. **Stop Check-In**
   - Tap "Stop Check-In"
   - No more check-ins accepted

### Viewing Participant Information

**Goal:** Access allergy info, contact details, special needs.

**Special Needs:**

1. **Go to Trip**
   - Tap trip name

2. **Tap "User Needs"**
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

2. **Tap "+"**
   - Chat name: "General Questions", "Logistics", "Social"
   - Add chat participants from trip participant list
   - Tap "Create Chat"

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
   - Modal opens where you can provide your allergies and special needs

### Viewing Your Trips

**Goal:** See all events and activities in a trip.

**Steps:**

1. **Go to My Trips**
   - Tap "My Trips" navigation

2. **Tap a Trip**
   - See trip details: dates, location, description
   - See all events in the trip

3. **Event Details**
   - Event name, location, time
   - Event type (mandatory, sign up, optional)

### Checking In

**Goal:** Mark yourself as present at an event.

**Self Check-In (If Organizer Enabled):**

1. **Open Event**
   - Tap event name

2. **Tap "Check In"**
   - Confirmation: "You're checked in ✓"

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
| View Attendees | ✓ |  |
| Create Chat Channel | ✓ | |
| Post to Chat | ✓ | ✓ |
| Update Profile | ✓ | ✓ |
| Add Special Needs | ✓ | ✓ |

### Emergency Events

**What are they?**
- Quickly created events for urgent situations
- Name and location can be auto-generated
- Capacity is unlimited

**When to use:**
- Emergency drills and situations

**How to create (Organizers):**
- Tap "+ Emergency Event"
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

### Chat Messages Aren't Sending

**Problem:** Message stuck or error appears

**Solutions:**
1. Check internet connection (WiFi or mobile)
2. Check message length (too long?)
3. Wait 5 seconds, try again
4. Restart app and try again

---

### Special Needs Aren't Saved

**Problem:** Allergies/info not visible to organizer

**Solutions:**
1. Tap "My Details" and check it was saved
2. Tap "Save" again to ensure it's submitted
3. Ask organizer to refresh their view
4. Log out and back in
5. Refresh application

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