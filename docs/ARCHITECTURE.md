# Architecture Documentation

> In-depth technical design of the Rollcall Event system.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Authentication Flow](#authentication-flow)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Data Models](#data-models)
- [Core Data Flows](#core-data-flows)
- [Service Layer Architecture](#service-layer-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Security Architecture](#security-architecture)

---

## System Architecture

![System Overview](/docs/images/diagrams/system_overview.png)

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                │
│                                                                     │
│  ┌────────────────────┐                                            │
│  │  React Native Expo │ (iOS/Android Mobile App)                  │
│  │  TypeScript        │                                            │
│  └──────────┬─────────┘                                            │
│             │                                                      │
│             │ HTTPS/REST                                          │
│             │                                                      │
└─────────────┼──────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                              │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │          ASP.NET Core Web API (.NET 10)                   │   │
│  │          Hosted on Azure App Service                      │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                 Controllers (10 endpoints)                          │
│          ├── EventController                                       │
│          ├── CheckinController                                     │
│          ├── UserController                                        │
│          ├── TripController                                        │
│          ├── ChatController                                        │
│          ├── ChatMessageController                                 │
│          ├── ChatParticipantController                             │
│          ├── InvitationController                                  │
│          ├── ParticipantController                                 │
│          └── MessagesController                                    │
└─────────────┬──────────────────────────────────────────────────────┘
              │
    ┌─────────┼─────────┬───────────┐
    │         │         │           │
    ▼         ▼         ▼           ▼
┌────────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                          │
│                                                                   │
│  Service Classes (11 services)                                    │
│  ├── EventService (Event CRUD, permissions)                      │
│  ├── CheckinService (Session management, QR/self check-in)      │
│  ├── UserService (User sync, profile management)                 │
│  ├── TripService (Trip CRUD, organizer management)               │
│  ├── ChatService (Chat channel management)                       │
│  ├── ChatMessageService (Message CRUD)                           │
│  ├── ChatParticipantService (Chat membership)                    │
│  ├── InvitationService (Invitation workflow)                     │
│  ├── ParticipantService (Participant data, special needs)        │
│  ├── MessageService (Broadcast messages)                         │
│  └── TripCleanupService (Scheduled background tasks)             │
│                                                                   │
└─────────────┬──────────────────────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Access Layer                              │
│                                                                     │
│          Entity Framework Core 10.0 (ORM)                          │
│          AppDbContext (14 DbSets)                                  │
│                                                                     │
└─────────────┬──────────────────────────────────────────────────────┘
              │
              │ SQL Queries
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Persistence Layer                              │
│                                                                     │
│                  PostgreSQL 14+                                     │
│         (14 tables with relationships)                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

External Services:
┌─────────────────────────┐
│   Clerk Authentication  │  JWT token validation
│   (clerk.com)          │  User identity claims
└─────────────────────────┘
```

---

## Technology Stack

### Backend
- **Runtime:** .NET 10.0
- **Language:** C# 14
- **Framework:** ASP.NET Core 10.0
- **ORM:** Entity Framework Core 10.0
- **Database:** PostgreSQL 14+
- **Authentication:** Clerk JWT tokens
- **Middleware:** Standard ASP.NET Core (CORS, Auth, Logging)

### Frontend
- **Framework:** React Native Expo
- **Language:** TypeScript 5+
- **State Management:** React Hooks + Custom Hooks
- **HTTP Client:** Fetch API or Axios
- **Testing:** Jest (unit), Playwright (E2E)
- **Linting:** ESLint

### Infrastructure (Production)
- **Cloud:** Microsoft Azure
- **Compute:** App Service (backend), Static Web App or Mobile hosting (frontend)
- **Database:** Azure Database for PostgreSQL
- **Authentication:** Clerk (SaaS)

---

## Authentication Flow

### Clerk Integration Overview

Rollcall Event uses [Clerk](https://clerk.com/) for user authentication. Clerk handles login, signup, social auth (Google, Microsoft, Apple), and token management.

### Step-by-Step Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. User Launches Frontend App                                 │
│     - App loads Clerk configuration                            │
│     - Checks for existing session token in localStorage        │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. User Not Authenticated?                                     │
│     - Clerk redirects to login/signup page                      │
│     - User enters email/password OR selects OAuth provider      │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Clerk Validates Credentials                                │
│     - Verifies password or OAuth response                       │
│     - Creates session, generates JWT token                      │
│     - Stores token in browser (localStorage/sessionStorage)     │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Frontend Sync User                                          │
│     - Calls POST /users/sync with Clerk ID and email            │
│     - Creates local user record in PostgreSQL                   │
│     - Backend receives JWT claims: sub (Clerk ID), email        │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. User Authenticated & Ready                                  │
│     - Frontend stores JWT token globally                        │
│     - All subsequent API calls include token in header:         │
│       Authorization: Bearer {jwt_token}                         │
│     - Backend validates token signature with Clerk's public key │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. API Request with Authentication                             │
│     Request:  Authorization: Bearer eyJhbGc...                  │
│     Backend:  Extracts claims (sub, email)                      │
│               Looks up or creates user                          │
│               Authorizes based on permissions                   │
│     Response: 200 OK or 403 Forbidden                           │
└─────────────────────────────────────────────────────────────────┘
```

### JWT Token Claims

The Clerk JWT token contains these key claims:

```json
{
  "sub": "user_abc123xyz",           // Clerk User ID
  "email": "john@example.com",       // Email address
  "email_verified": true,            // Verification status
  "iat": 1651234567,                 // Issued at
  "exp": 1651238167,                 // Expiration (1 hour)
  "iss": "https://clerk.dev"         // Issuer
}
```

**Key Points:**
- Token expires after 1 hour; Clerk auto-refreshes in background
- `sub` (Subject/ClerkId) is used to identify users locally
- `email` is used for invitations and participant matching
- Backend **validates signature** against Clerk's public key before trusting claims

### Authorization Strategy

```
Authentication ≠ Authorization

Authentication:  "Are you who you say you are?"  → Clerk + JWT
Authorization:   "Are you allowed to do this?"   → Backend services

Example:
GET /api/trips/1
├─ Authentication: ✓ Valid JWT token
├─ Authorization:  ✓ User is participant in trip 1
└─ Result: 200 OK with trip data

vs.

GET /api/trips/2
├─ Authentication: ✓ Valid JWT token
├─ Authorization:  ✗ User is NOT participant in trip 2
└─ Result: 403 Forbidden
```

---

## Entity Relationship Diagram

![Database ERD](/docs/images/diagrams/er-diagram.png)
*Entity relationships showing all tables and their connections*

### Table Relationships Summary

| Table | Relationships | Foreign Keys |
|-------|---------------|--------------|
| **User** | 1 → Many Participants, Invitations, ChatParticipants | None (Primary) |
| **Trip** | 1 → Many Events, Chats, Participants, Invitations | None (Primary) |
| **Event** | 1 → Many EventParticipants, Checkins, Messages, Sessions | TripId |
| **EventParticipant** | Many → Event, User | EventId, UserId |
| **EventCheckinSession** | 1 → Many Checkins | EventId |
| **Checkin** | Many → Event, Participant | EventId, ParticipantId |
| **Participant** | Many → Trip, User | TripId, UserId |
| **Invitation** | Many → Trip, User (email match) | TripId |
| **Chat** | 1 → Many Messages, Participants | TripId |
| **ChatMessage** | Many → Chat, User | ChatId, SenderId |
| **ChatParticipant** | Many → Chat, User | ChatId, UserId |
| **Message** | Many → Event | EventId |

---

## Data Models

### User
```csharp
public class User
{
  public int Id { get; set; }
  public required string ClerkId { get; set; }        // From Clerk JWT
  public required string Email { get; set; }
  public string? FirstName { get; set; }
  public string? LastName { get; set; }
  public string? Phone { get; set; }                  // Norwegian format
  public DateTime CreatedAt { get; set; }
}
```

### Trip
```csharp
public class Trip
{
  public int Id { get; set; }
  public required string Name { get; set; }
  public required string StartDate { get; set; }      // YYYY-MM-DD or DD.MM.YYYY
  public required string EndDate { get; set; }
  public string? Destination { get; set; }
  public string? Description { get; set; }
  
  public ICollection<Event> Events { get; set; }
  public ICollection<Participant> Participants { get; set; }
  public ICollection<Chat> Chats { get; set; }
}
```

### Event
```csharp
public class Event
{
  public int Id { get; set; }
  public string? Name { get; set; }
  public string? Location { get; set; }
  public required string StartDate { get; set; }
  public required string EndDate { get; set; }
  public string? Description { get; set; }
  public int? Capacity { get; set; }
  public bool HasUnlimitedCapacity { get; set; }
  public required string AttendanceMode { get; set; }  // MANDATORY, SIGN_UP_REQUIRED, etc.
  public bool IsEmergency { get; set; }               // Spontaneous event creation
  public int TripId { get; set; }
  
  public Trip? Trip { get; set; }
  public ICollection<EventParticipant> Participants { get; set; }
}
```

### Participant (Trip participant with special needs)
```csharp
public class Participant
{
  public int Id { get; set; }
  public int TripId { get; set; }
  public int UserId { get; set; }
  public string? Allergies { get; set; }
  public string? OtherInfo { get; set; }
  
  public Trip? Trip { get; set; }
  public User? User { get; set; }
}
```

### Invitation
```csharp
public class Invitation
{
  public int Id { get; set; }
  public int TripId { get; set; }
  public required string Email { get; set; }        // Email of invitee
  public bool Accepted { get; set; }
  public DateTime CreatedAt { get; set; }
  
  public Trip? Trip { get; set; }
}
```

### Checkin
```csharp
public class Checkin
{
  public int Id { get; set; }
  public int EventId { get; set; }
  public int ParticipantId { get; set; }
  public CheckinType Type { get; set; }             // SELF, QR, MANUAL
  public DateTime Timestamp { get; set; }
  
  public Event? Event { get; set; }
}

public enum CheckinType { SELF, QR, MANUAL }
```

### EventCheckinSession
```csharp
public class EventCheckinSession
{
  public int SessionId { get; set; }
  public int EventId { get; set; }
  public CheckinSessionType SessionType { get; set; }  // QR, SELF
  public required string Token { get; set; }        // QR code token
  public DateTime ExpiresAt { get; set; }           // Token expiration
  public DateTime StartedAt { get; set; }
  public DateTime? StoppedAt { get; set; }
  
  public Event? Event { get; set; }
}

public enum CheckinSessionType { Qr, Self }
```

### Chat & Messages
```csharp
public class Chat
{
  public int Id { get; set; }
  public int TripId { get; set; }
  public required string Title { get; set; }
  public int CreatorId { get; set; }
  public DateTime CreatedAt { get; set; }
  
  public Trip? Trip { get; set; }
  public ICollection<ChatMessage> Messages { get; set; }
  public ICollection<ChatParticipant> Participants { get; set; }
}

public class ChatMessage
{
  public int Id { get; set; }
  public int ChatId { get; set; }
  public int SenderId { get; set; }
  public required string Content { get; set; }
  public DateTime Timestamp { get; set; }
  
  public Chat? Chat { get; set; }
  public User? Sender { get; set; }
}

public class ChatParticipant
{
  public int Id { get; set; }
  public int ChatId { get; set; }
  public int UserId { get; set; }
  
  public Chat? Chat { get; set; }
  public User? User { get; set; }
}
```

---

## Core Data Flows

### 1. Trip Creation & Participant Onboarding Flow

```
Organizer creates trip
      │
      ▼
Trip record saved
      │
      ▼
Organizer added as Participant
      │
      ▼
Organizer invites participants (batch or individual)
      │
      ▼
Invitation records created (one per email)
      │
      ├─ Email sent to invitee (optional/mocked)
      │
      ▼
Invitee receives & accepts invitation
      │
      ▼
Participant record created
      │
      ▼
Invitee now sees trip in "My Trips"
```

### 2. Event Check-in Flow

```
Organizer starts check-in session
      │
      ├─ Session Type: SELF or QR
      │
      ├─ If QR:
      │  ├─ Generate token (JWT)
      │  ├─ Session expires in 15 min (configurable)
      │  └─ Send QR code to organizer
      │
      ├─ If SELF:
      │  └─ Participants can check themselves in
      │
      ▼
Participant checks in
      │
      ├─ SELF: User taps "Check in" button
      ├─ QR: User scans QR code with phone
      │
      ▼
Checkin record created
      │
      ├─ Timestamp recorded
      ├─ Type recorded (SELF/QR/MANUAL)
      │
      ▼
Participant marked as present
      │
      ▼
Organizer sees live check-in count
```

### 3. Chat & Real-Time Communication Flow

```
Chat Channel Created
      │
      ├─ Title: "General", "Logistics", etc.
      ├─ TripId: Associated trip
      ├─ CreatorId: Who created it
      │
      ▼
Users can be added as ChatParticipants (optional)
      │
      ▼
User posts message to chat
      │
      ├─ ChatMessage created
      ├─ SenderId: Who posted
      ├─ Content: Message text
      ├─ Timestamp: When posted
      │
      ▼
Message appears for all trip participants
      │
      └─ Real-time updates via polling or WebSocket (future)
```

---

## Service Layer Architecture

### Service Responsibilities

```
EventService
├─ Create/Read/Update/Delete events
├─ Validate event dates against trip dates
├─ Handle emergency event creation (auto-fields)
├─ Check organizer permissions
└─ Return event data with participant counts

CheckinService
├─ Start/Stop check-in sessions
├─ Generate QR tokens and manage expiration
├─ Validate QR tokens and create Checkin records
├─ Track active sessions per event
└─ Notify participants when session starts

UserService
├─ Get or create users from Clerk claims
├─ Sync new users from Clerk to database
├─ Update user profile information
├─ Validate phone numbers (Norwegian format)
└─ Manage user authentication state

TripService
├─ Create/Read/Update/Delete trips
├─ Manage trip organizers
├─ Check user access (participant or invited)
├─ Add users as participants
└─ Return trip data with event lists

ChatService
├─ Create/Read/Update/Delete chat channels
├─ Manage chat participants
├─ Control channel creation permissions
└─ Return chat data by trip

InvitationService
├─ Create invitations (organizer only)
├─ Get pending invitations by email
├─ Accept/Decline invitations
├─ Auto-add user as participant on acceptance
└─ Handle duplicate prevention

ParticipantService
├─ Get participant special needs (allergies, info)
├─ Update special needs information
├─ Get contact information by trip
├─ Calculate participant counts
└─ Enrich participant data

MessageService
├─ Send broadcast messages to event participants
├─ Get messages by event
├─ Filter messages by timestamp
└─ Validate sender permissions

TripCleanupService
├─ Scheduled background tasks
├─ Archive old trips
├─ Clean up expired sessions
└─ Maintenance operations
```

---

## Frontend Architecture

### State Management Pattern

The frontend uses **React Hooks + Custom Hooks** for state management (no Redux/MobX):

```
App Root
├─ Clerk Provider (authentication)
├─ Router (navigation)
└─ Global State (via useContext or custom hooks)

Screen/Page
├─ useAuth() — User authentication state
├─ useTrips() — Trips data, loading, error
├─ useEvents() — Events for current trip
├─ useCheckin() — Check-in session state
├─ useChat() — Chat messages and participants
└─ useInvitations() — Pending invitations

Components
├─ Presentational (UI primitives)
└─ Container (logic + presentation)
```

### Key React Patterns

**Custom Hooks (in `hooks/` folder):**
- Handle API calls and caching
- Manage loading/error states
- Auto-refresh on intervals
- Return: `{ data, loading, error, refetch }`

**TypeScript Interfaces (in `types/` folder):**
- Define API request/response shapes
- Define component prop types
- Ensure type safety across app

**Service Layer (in `services/` folder):**
- Centralized API client code
- Base URL configuration
- Error handling and logging
- Token injection to headers

---

## Security Architecture

### Defense Layers

```
Layer 1: Authentication (Clerk)
├─ Email/password validation
├─ Social OAuth (Google, Microsoft, Apple)
├─ JWT token generation and signing
└─ Token refresh and expiration

Layer 2: API Authentication (Backend)
├─ Validate JWT signature
├─ Verify token hasn't expired
├─ Extract claims (sub, email)
└─ Reject if invalid

Layer 3: Authorization (Business Logic)
├─ Is user a trip participant? (per endpoint)
├─ Is user a trip organizer? (for invite/event creation)
├─ Does user own this resource? (chat, message)
└─ Return 403 Forbidden if denied

Layer 4: Data Validation
├─ Input sanitization
├─ Email format validation
├─ Phone number validation
├─ Date range validation
└─ Prevent SQL injection via Entity Framework

Layer 5: Database Security
├─ Connection string in environment variables
├─ PostgreSQL user with minimal permissions
├─ Unique indexes on sensitive fields (email)
└─ Cascade deletes to maintain referential integrity
```

### Permission Matrix

| Resource | Create | Read | Update | Delete | Notes |
|----------|--------|------|--------|--------|-------|
| **Trip** | Owner | Participant or Invited | Owner | Owner | - |
| **Event** | Organizer | Participant | Organizer | Organizer | - |
| **Checkin** | Anyone | Organizer | Organizer | Organizer | - |
| **Chat** | Participant | Participant | Creator | Creator | - |
| **Message** | Any User | Any User | Sender | Sender | - |
| **Invitation** | Organizer | Own | - | Recipient or Organizer | - |
| **User Profile** | Self | Self | Self | Self |  |

### Unconventional Logic: Emergency Events

**Why it exists:**
- Support spontaneous incidents or last-minute changes
- Requires flexibility in required fields
- Auto-generates event name and location

**How it works:**
```csharp
// When IsEmergency = true:
// - Name, Location, Capacity become optional
// - Automatically generated as: "Emergency Alert - {timestamp}"
// - Used for ad-hoc participant check-ins
// - Helps organizers respond quickly to unexpected situations

if (appEvent.IsEmergency)
{
  appEvent.Name ??= $"Emergency Alert - {DateTime.UtcNow:yyyy-MM-dd HH:mm}";
  appEvent.Location ??= "TBD";
  appEvent.HasUnlimitedCapacity = true;  // Auto-set
}
```

---

## Database Indexes

Key indexes for performance:

```sql
-- User lookups by ClerkId or email
CREATE INDEX idx_users_clerk_id ON "Users"("ClerkId");
CREATE INDEX idx_users_email ON "Users"("Email");

-- Trip/Participant relationships
CREATE UNIQUE INDEX idx_participants_trip_user ON "Participants"("TripId", "UserId");
CREATE INDEX idx_participants_user_id ON "Participants"("UserId");

-- Check-in queries
CREATE INDEX idx_checkins_event ON "Checkins"("EventId");
CREATE INDEX idx_checkins_event_participant ON "Checkins"("EventId", "ParticipantId");

-- Event participant lookups
CREATE UNIQUE INDEX idx_event_participants_event_user ON "EventParticipants"("EventID", "UserID");
CREATE INDEX idx_event_participants_user ON "EventParticipants"("UserID");

-- Invitation uniqueness
CREATE UNIQUE INDEX idx_invitations_trip_email ON "Invitations"("TripId", "Email");

-- Chat queries
CREATE INDEX idx_chat_messages_chat ON "ChatMessages"("ChatId");
CREATE INDEX idx_chat_participants_chat ON "ChatParticipants"("ChatId");
```

---

## Deployment Architecture

### Production Deployment (Azure)

**Detailed Infrastructure:**

```
Azure Subscription
│
├─ App Service (Backend ASP.NET)
│  ├─ Auto-scaling (2-5 instances)
│  ├─ HTTPS/TLS 1.2+
│  ├─ Runtime: .NET 10.0
│  └─ Application Insights (monitoring)
│
├─ Static Web App (Frontend)
│  ├─ CDN (content delivery)
│  ├─ CI/CD from GitHub
│  └─ Auto-deploy on push
│
├─ Azure Database for PostgreSQL
│  ├─ Automated backups (30 days)
│  ├─ SSL/TLS required
│  ├─ VNet integration
│  └─ Monitoring & alerts
│
├─ Key Vault
│  ├─ Connection strings
│  ├─ API keys
│  └─ Secrets rotation
│
└─ Application Insights
   ├─ Performance metrics
   ├─ Error tracking
   ├─ Log aggregation
   └─ Alerts
```

### Environment Configuration

```
Development (local):
- .env with localhost URLs
- Clerk application
- Azure Database for PostgreSQL flexible server
```
