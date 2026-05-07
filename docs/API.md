# API Documentation

> Complete reference for all REST endpoints in the Rollcall Event API.

**Base URL:** `http://localhost:5118/api`

**Authentication:** All endpoints (except noted) require a valid Clerk JWT token in the `Authorization` header:
```
Authorization: Bearer <clerk_jwt_token>
```

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Trips](#trips)
- [Events](#events)
- [Check-in](#check-in)
- [Participants](#participants)
- [Invitations](#invitations)
- [Chat](#chat)
- [Chat Messages](#chat-messages)
- [Messages (Broadcast)](#messages-broadcast)
- [Error Responses](#error-responses)

---

## Authentication

### Clerk Integration

The API uses [Clerk](https://clerk.com/) for user authentication and management. The JWT token is automatically injected by the frontend after successful authentication.

**Required Claims in Token:**
- `sub` — Clerk user ID
- `email` — User's email address

**How Clerk Token Gets to Backend:**
1. User authenticates via Clerk in frontend
2. Frontend obtains JWT token from Clerk
3. Frontend includes token in every API request: `Authorization: Bearer {token}`
4. Backend validates token with Clerk's public key
5. Backend extracts user claims for authorization

---

## Users

### Get Current User
Retrieve the authenticated user's profile information.

**Endpoint:** `GET /users/me`

**Authentication:** ✅ Required

**Response (200 OK):**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+4798765432"
}
```

**Error Responses:**
- **404 Not Found** — User record not yet synced with database (first-time login)

**Notes:**
- User records are created lazily on first API access
- If 404 is returned, call `POST /users/sync` to create the record

---

### Sync User to Database
Create or update a user record in the local database. Used for first-time login sync.

**Endpoint:** `POST /users/sync`

**Authentication:** ❌ Not Required (Allow Anonymous)

**Request Body:**
```json
{
  "clerkId": "user_abc123xyz",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+4798765432"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+4798765432"
}
```

**Error Responses:**
- **400 Bad Request** — `clerkId` or `email` missing

**Notes:**
- Called automatically on frontend after first login
- Idempotent — safe to call multiple times

---

### Update Current User
Update the authenticated user's profile information.

**Endpoint:** `PUT /users/me`

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+4798765432"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "phone": "+4798765432"
}
```

**Error Responses:**
- **400 Bad Request** — Invalid phone number (must be Norwegian format)
- **401 Unauthorized** — Missing or invalid token

**Phone Validation:**
- Format: Norwegian numbers only (8 digits, optional +47 prefix)
- Examples: `98765432`, `+4798765432`

---

## Trips

### Get My Trips
Retrieve all trips for the authenticated user (as organizer or participant).

**Endpoint:** `GET /trips/my`

**Authentication:** ✅ Required

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Team Building 2026",
    "startDate": "2026-05-15T09:00:00Z",
    "endDate": "2026-05-17T18:00:00Z",
    "destination": "Oslo",
    "description": "Annual team building event",
    "isOrganizer": true
  }
]
```

---

### Get Trip by ID
Retrieve details for a specific trip.

**Endpoint:** `GET /trips/{id}`

**Authentication:** ✅ Required

**URL Parameters:**
- `id` (integer) — Trip ID

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Team Building 2026",
  "startDate": "2026-05-15T09:00:00Z",
  "endDate": "2026-05-17T18:00:00Z",
  "destination": "Oslo",
  "description": "Annual team building event",
  "isOrganizer": true,
  "organizerPhone": "+4798765432"
}
```

**Error Responses:**
- **404 Not Found** — Trip not found
- **403 Forbidden** — User is neither participant nor invited

**Security:**
- User must be either a trip participant OR have a pending invitation

---

### Get Trip Events
Retrieve all events within a trip.

**Endpoint:** `GET /trips/{id}/events`

**Authentication:** ✅ Required

**URL Parameters:**
- `id` (integer) — Trip ID

**Response (200 OK):**
```json
[
  {
    "id": 101,
    "name": "Day 1 Conference",
    "location": "Oslo Convention Center",
    "fromDate": "2026-05-15T09:00:00Z",
    "toDate": "2026-05-15T17:00:00Z",
    "type": "MANDATORY",
    "capacity": 200,
    "participantCount": 150,
    "isJoined": true
  }
]
```

**Error Responses:**
- **403 Forbidden** — User not a trip participant

---

## Events

### Get Event by ID
Retrieve details for a specific event.

**Endpoint:** `GET /api/events/{id}`

**Authentication:** ✅ Required

**URL Parameters:**
- `id` (integer) — Event ID

**Response (200 OK):**
```json
{
  "id": 101,
  "name": "Day 1 Conference",
  "location": "Oslo Convention Center",
  "fromDate": "2026-05-15T09:00:00Z",
  "toDate": "2026-05-15T17:00:00Z",
  "type": "MANDATORY",
  "capacity": 200,
  "participantCount": 150,
  "joinButtonState": "joined",
  "isJoined": true,
  "isSelfCheckinActive": true
}
```

**Error Responses:**
- **404 Not Found** — Event not found
- **403 Forbidden** — User does not have access to event's trip

---

### Create Event
Create a new event within a trip.

**Endpoint:** `POST /api/events`

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "name": "Day 1 Conference",
  "location": "Oslo Convention Center",
  "startDate": "2026-05-15",
  "endDate": "2026-05-15",
  "description": "Opening keynote and sessions",
  "capacity": 200,
  "hasUnlimitedCapacity": false,
  "type": "MANDATORY",
  "tripId": 1,
  "isEmergency": false
}
```

**Response (201 Created):**
```json
{
  "id": 101,
  "name": "Day 1 Conference",
  "location": "Oslo Convention Center",
  "startDate": "2026-05-15",
  "endDate": "2026-05-15",
  "type": "MANDATORY",
  "capacity": 200
}
```

**Error Responses:**
- **400 Bad Request** — Missing required fields or invalid date format
- **403 Forbidden** — User is not trip organizer

**Date Format:**
- Accepts: `YYYY-MM-DD` or `DD.MM.YYYY`
- Must be within trip dates

**Emergency Events:**
- When `isEmergency: true`, fields like `name`, `location`, `capacity` are optional
- Used for spontaneous participant check-ins

---

## Check-in

### Start Check-in Session
Begin a check-in session for an event (either self-check-in or QR code based).

**Endpoint:** `POST /checkins/sessions/start/{eventId}`

**Authentication:** ✅ Required

**URL Parameters:**
- `eventId` (integer) — Event ID

**Request Body:**
```json
{
  "sessionType": "qr",
  "qrTokenLifetimeMinutes": 15
}
```

**Response (200 OK):**
```json
{
  "sessionId": "sess_12345",
  "eventId": 101,
  "sessionType": "qr",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-05-15T09:15:00Z",
  "startedAt": "2026-05-15T09:00:00Z",
  "participantsToNotify": [1, 2, 3, 5]
}
```

**Session Types:**
- `"self"` — Self check-in (participant verifies themselves)
- `"qr"` — QR code check-in (organizer generates QR token)

**QR Token Lifetime:**
- Default: 15 minutes
- Max recommended: 60 minutes

**Error Responses:**
- **404 Not Found** — Event not found

**Security:**
- Only organizers can start QR sessions
- Participants can start self-check-in

---

### Stop Check-in Session
End an active check-in session.

**Endpoint:** `POST /checkins/sessions/stop/{eventId}/{sessionType}`

**Authentication:** ✅ Required

**URL Parameters:**
- `eventId` (integer) — Event ID
- `sessionType` (string) — `"qr"` or `"self"`

**Response (200 OK):**
```json
{
  "message": "Session stopped."
}
```

**Error Responses:**
- **404 Not Found** — No active session for this event and type

---

### Get Active Check-in Session
Check if there's an active check-in session for an event.

**Endpoint:** `GET /checkins/sessions/active/{eventId}/{sessionType}`

**Authentication:** ✅ Required

**URL Parameters:**
- `eventId` (integer) — Event ID
- `sessionType` (string) — `"qr"` or `"self"`

**Response (200 OK):**
```json
{
  "isActive": true,
  "sessionId": "sess_12345",
  "sessionType": "qr",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-05-15T09:15:00Z"
}
```

Or if inactive:
```json
{
  "isActive": false
}
```

---

### Validate QR Check-in
Validate a participant's QR code and register their check-in.

**Endpoint:** `POST /checkins/qr/validate`

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "participantId": 42
}
```

**Response (200 OK):**
```json
{
  "message": "Check-in registered successfully",
  "checkinId": 5001,
  "participantId": 42,
  "eventId": 101,
  "timestamp": "2026-05-15T09:05:00Z"
}
```

**Error Responses:**
- **400 Bad Request** — Invalid token or participant ID
- **409 Conflict** — Check-in already recorded for this participant

---

### Self Check-in
Participant checks themselves in (no QR required).

**Endpoint:** `POST /checkins/self`

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "eventId": 101
}
```

**Response (200 OK):**
```json
{
  "message": "Self check-in completed",
  "checkinId": 5002,
  "eventId": 101,
  "timestamp": "2026-05-15T09:10:00Z"
}
```

**Error Responses:**
- **404 Not Found** — Event not found or self check-in not active
- **409 Conflict** — User already checked in

---

## Participants

### Get Participants by Trip
Retrieve all participants in a trip with their special needs information.

**Endpoint:** `GET /participants/trip/{tripId}`

**Authentication:** ✅ Required

**URL Parameters:**
- `tripId` (integer) — Trip ID

**Response (200 OK):**
```json
[
  {
    "userId": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "allergies": "Peanuts, shellfish",
    "otherInfo": "Vegetarian, requires aisle seat"
  }
]
```

**Error Responses:**
- **403 Forbidden** — User not a trip participant

---

### Get Participants Contacts
Retrieve contact information for all participants in a trip.

**Endpoint:** `GET /participants/trip/{tripId}/contact`

**Authentication:** ✅ Required

**URL Parameters:**
- `tripId` (integer) — Trip ID

**Response (200 OK):**
```json
[
  {
    "userId": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+4798765432"
  }
]
```

**Error Responses:**
- **403 Forbidden** — User not a trip participant

---

### Get My Trip Needs
Retrieve special needs information for all trips the user is in.

**Endpoint:** `GET /participants/my-trips`

**Authentication:** ✅ Required

**Response (200 OK):**
```json
[
  {
    "tripId": 1,
    "tripName": "Team Building 2026",
    "allergies": "Peanuts",
    "otherInfo": "Vegetarian"
  }
]
```

---

### Update Participant Needs
Update special needs information for a specific trip.

**Endpoint:** `PUT /participants/{tripId}/needs`

**Authentication:** ✅ Required

**URL Parameters:**
- `tripId` (integer) — Trip ID

**Request Body:**
```json
{
  "allergies": "Peanuts, shellfish",
  "otherInfo": "Vegetarian, requires aisle seat"
}
```

**Response (204 No Content)**

**Error Responses:**
- **404 Not Found** — User not a participant in this trip

---

## Invitations

### Get My Invitations
Retrieve all pending invitations for the authenticated user.

**Endpoint:** `GET /invitations/my`

**Authentication:** ✅ Required

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "tripId": 1,
    "tripName": "Team Building 2026",
    "tripDestination": "Oslo",
    "invitedEmail": "john@example.com",
    "createdAt": "2026-05-01T10:00:00Z"
  }
]
```

---

### Create Invitation
Invite a participant to a trip. Only organizers can invite.

**Endpoint:** `POST /invitations`

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "tripId": 1,
  "email": "jane@example.com"
}
```

**Response (200 OK):**
```json
{
  "id": 2,
  "tripId": 1,
  "email": "jane@example.com",
  "createdAt": "2026-05-01T10:05:00Z"
}
```

**Error Responses:**
- **400 Bad Request** — Invalid email or cannot invite organizer to own trip
- **403 Forbidden** — User is not trip organizer

**Validation:**
- Email must be valid format
- Cannot invite yourself to your own trip
- Each email can only have one pending invitation per trip

---

### Accept Invitation
Accept a pending trip invitation.

**Endpoint:** `POST /invitations/accept?invitationId={id}`

**Authentication:** ✅ Required

**Query Parameters:**
- `invitationId` (integer) — Invitation ID

**Response (200 OK):**
```json
{
  "message": "Invitation accepted",
  "tripId": 1,
  "tripName": "Team Building 2026"
}
```

**Error Responses:**
- **404 Not Found** — Invitation not found or already accepted

**Notes:**
- User is automatically added as a trip participant
- Invitation record is removed after acceptance

---

### Decline/Ignore Invitation
Decline a pending trip invitation.

**Endpoint:** `DELETE /invitations/{invitationId}`

**Authentication:** ✅ Required

**URL Parameters:**
- `invitationId` (integer) — Invitation ID

**Response (204 No Content)**

**Error Responses:**
- **404 Not Found** — Invitation not found

---

## Chat

### Get Chats by Trip
Retrieve all chat channels for a trip.

**Endpoint:** `GET /chats/trip/{tripId}`

**Authentication:** ✅ Required

**URL Parameters:**
- `tripId` (integer) — Trip ID

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "General Discussion",
    "tripId": 1,
    "creatorId": 1,
    "createdAt": "2026-05-01T09:00:00Z"
  }
]
```

---

### Get Chat by ID
Retrieve details for a specific chat channel.

**Endpoint:** `GET /chats/{id}`

**Authentication:** ✅ Required

**URL Parameters:**
- `id` (integer) — Chat ID

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "General Discussion",
  "tripId": 1,
  "creatorId": 1,
  "createdAt": "2026-05-01T09:00:00Z"
}
```

**Error Responses:**
- **404 Not Found** — Chat not found

---

### Create Chat Channel
Create a new chat channel for a trip.

**Endpoint:** `POST /chats`

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "title": "Logistics & Questions",
  "tripId": 1
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "title": "Logistics & Questions",
  "tripId": 1,
  "creatorId": 1,
  "createdAt": "2026-05-01T09:15:00Z"
}
```

**Error Responses:**
- **400 Bad Request** — Missing title or invalid trip
- **401 Unauthorized** — Not authenticated

---

### Update Chat Channel
Update chat channel title (creator only).

**Endpoint:** `PUT /chats/{id}`

**Authentication:** ✅ Required

**URL Parameters:**
- `id` (integer) — Chat ID

**Request Body:**
```json
{
  "title": "General Q&A"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "General Q&A",
  "tripId": 1,
  "creatorId": 1
}
```

**Error Responses:**
- **403 Forbidden** — User is not chat creator
- **404 Not Found** — Chat not found

---

### Delete Chat Channel
Delete a chat channel (creator only).

**Endpoint:** `DELETE /chats/{id}`

**Authentication:** ✅ Required

**URL Parameters:**
- `id` (integer) — Chat ID

**Response (204 No Content)**

**Error Responses:**
- **403 Forbidden** — User is not chat creator
- **404 Not Found** — Chat not found

**Cascade Behavior:**
- All messages in the chat are deleted
- All chat participant records are removed

---

## Chat Messages

### Get Messages by Chat
Retrieve all messages in a chat channel.

**Endpoint:** `GET /chat-messages/chat/{chatId}`

**Authentication:** ✅ Required

**URL Parameters:**
- `chatId` (integer) — Chat ID

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "chatId": 1,
    "senderId": 1,
    "content": "Welcome to the chat!",
    "timestamp": "2026-05-01T09:20:00Z"
  },
  {
    "id": 2,
    "chatId": 1,
    "senderId": 2,
    "content": "Thanks for creating this channel",
    "timestamp": "2026-05-01T09:21:00Z"
  }
]
```

**Error Responses:**
- **404 Not Found** — Chat not found

---

### Get Message by ID
Retrieve a single chat message.

**Endpoint:** `GET /chat-messages/{id}`

**Authentication:** ✅ Required

**URL Parameters:**
- `id` (integer) — Message ID

**Response (200 OK):**
```json
{
  "id": 1,
  "chatId": 1,
  "senderId": 1,
  "content": "Welcome to the chat!",
  "timestamp": "2026-05-01T09:20:00Z"
}
```

**Error Responses:**
- **404 Not Found** — Message not found

---

### Send Message to Chat
Post a new message to a chat channel.

**Endpoint:** `POST /chat-messages`

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "chatId": 1,
  "senderId": 1,
  "content": "Has anyone checked out the schedule yet?"
}
```

**Response (201 Created):**
```json
{
  "id": 3,
  "chatId": 1,
  "senderId": 1,
  "content": "Has anyone checked out the schedule yet?",
  "timestamp": "2026-05-01T09:25:00Z"
}
```

**Error Responses:**
- **400 Bad Request** — Missing content, senderId, or chat not found
- **404 Not Found** — Chat not found

**Validation:**
- Content is trimmed of leading/trailing whitespace
- Content cannot be empty
- SenderId must be a valid user

---

### Update Message
Edit an existing chat message.

**Endpoint:** `PUT /chat-messages/{id}`

**Authentication:** ✅ Required

**URL Parameters:**
- `id` (integer) — Message ID

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Response (200 OK):**
```json
{
  "id": 3,
  "chatId": 1,
  "senderId": 1,
  "content": "Updated message content",
  "timestamp": "2026-05-01T09:25:00Z",
  "editedAt": "2026-05-01T09:30:00Z"
}
```

**Error Responses:**
- **400 Bad Request** — Content cannot be empty
- **404 Not Found** — Message not found

---

### Delete Message
Delete a chat message.

**Endpoint:** `DELETE /chat-messages/{id}`

**Authentication:** ✅ Required

**URL Parameters:**
- `id` (integer) — Message ID

**Response (204 No Content)**

**Error Responses:**
- **404 Not Found** — Message not found

---

## Messages (Broadcast)

### Get Messages by Event
Retrieve all broadcast messages for an event.

**Endpoint:** `GET /messages/event/{eventId}`

**Authentication:** ✅ Required

**URL Parameters:**
- `eventId` (integer) — Event ID

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "eventId": 101,
    "senderName": "John Doe",
    "body": "Please be on time for the morning session",
    "timestamp": "2026-05-15T08:00:00Z"
  }
]
```

---

### Send Broadcast Message
Send a broadcast message to all participants in an event.

**Endpoint:** `POST /messages/event/{eventId}`

**Authentication:** ✅ Required

**URL Parameters:**
- `eventId` (integer) — Event ID

**Request Body:**
```json
{
  "senderParticipantId": 1,
  "senderName": "John Doe",
  "body": "The schedule for today has been updated. Check your app for details."
}
```

**Response (200 OK):**
```json
{
  "id": 2,
  "eventId": 101,
  "senderName": "John Doe",
  "body": "The schedule for today has been updated. Check your app for details.",
  "timestamp": "2026-05-15T08:15:00Z"
}
```

**Error Responses:**
- **400 Bad Request** — Empty message body or invalid event

**Use Cases:**
- Schedule changes and announcements
- Important reminders or alerts
- Last-minute logistics updates
- Emergency communications

---

## Error Responses

### Standard Error Format

All error responses follow this format:

```json
{
  "message": "Error description",
  "error": "Error type (optional)",
  "details": "Additional context (optional)"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| **200** | OK | Successful GET, POST with data |
| **201** | Created | New resource created (POST) |
| **204** | No Content | Successful DELETE or PUT |
| **400** | Bad Request | Invalid input, validation failed |
| **401** | Unauthorized | Missing or invalid authentication token |
| **403** | Forbidden | Authenticated but not authorized (e.g., not organizer) |
| **404** | Not Found | Resource does not exist |
| **409** | Conflict | Duplicate entry, already checked in, etc. |
| **500** | Internal Server Error | Unexpected server error |

### Authentication Errors

**401 Unauthorized:**
```json
{
  "message": "Identity claims missing from token."
}
```

**403 Forbidden (Authorization):**
```json
{
  "message": "Only the chat creator can delete this chat."
}
```

### Validation Errors

**400 Bad Request (Date Format):**
```json
{
  "message": "Invalid date format. Use YYYY-MM-DD or DD.MM.YYYY"
}
```

**400 Bad Request (Missing Field):**
```json
{
  "message": "Start and end date are required."
}
```

---

## Testing with HTTP Client

The repository includes `backend/MyApp.API.http` file for testing endpoints with VS Code's REST Client extension or Postman.

### Example Test Requests

**Get My Trips:**
```http
GET http://localhost:5118/api/trips/my
Authorization: Bearer {your_clerk_jwt_token}
```

**Create Event:**
```http
POST http://localhost:5118/api/events
Authorization: Bearer {your_clerk_jwt_token}
Content-Type: application/json

{
  "name": "Keynote Speech",
  "location": "Main Hall",
  "startDate": "2026-05-15",
  "endDate": "2026-05-15",
  "capacity": 300,
  "hasUnlimitedCapacity": false,
  "type": "MANDATORY",
  "tripId": 1
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Production deployments should add:
- Per-user rate limits (e.g., 100 requests per minute)
- Per-endpoint rate limits (especially for check-in)
- Exponential backoff for retries
