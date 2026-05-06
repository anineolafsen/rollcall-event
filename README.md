# Rollcall Event 🎯

> A comprehensive event management system for real-time participant check-in, oversight, and safe execution of corporate trips and events.

**Rollcall Event** is a full-stack event management platform designed to give organizers complete visibility into participant presence, location, and activity status throughout an event lifecycle. Know who is present, who is missing, and what is happening – at all times.

[![Status](https://img.shields.io/badge/prototype%20%20-blue)]()

---

## 📋 Table of Contents

- [Concept](#concept)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [AI Usage](#ai-usage)
- [Known Issues](#known-issues)
- [Contributing](#contributing)

---

## Concept
<a id="concept"></a>

Managing participant flow during corporate trips involves more than just registration lists. Organizers need live insight into arrivals, movements between locations, parallel activities, and deviations from the plan.

Rollcall Event is designed to support this by combining:
- **Fast and flexible check-in** - Multiple methods for quick participant verification
- **Real-time status tracking** - Live presence updates across all locations
- **Clear operational dashboards** - Comprehensive organizer oversight
- **Simple incident handling** - Fast handling of emergencies

The system aims to reduce manual coordination, improve safety, and give organizers confidence throughout the event lifecycle.

---

## ✨ Features
<a id="features"></a>

### Current Features
- ✅ Multiple check-in methods (self and manual fallback)
- ✅ Real-time participant presence tracking
- ✅ Live overview of participants across locations and activities
- ✅ Quick access to participant information (contact, special needs)
- ✅ Messaging system for schedule changes and updates
- ✅ Shared, up-to-date event schedule
- ✅ Missing participant detection and alerts
- ✅ User authentication and authorization
- ✅ Responsive design for mobile and desktop
- ✅ Real-time chat functionality between organizers and participants

---

## 🛠 Tech Stack
<a id="tech-stack"></a>

### Backend
- **[.NET 8](https://dotnet.microsoft.com/)** - Modern C# framework
- **[C#](https://learn.microsoft.com/en-us/dotnet/csharp/)** - Primary backend language
- **[Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)** - ORM for database access
- **[PostgreSQL](https://www.postgresql.org/)** - Relational database
- **[ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/)** - Web API framework
- **[Clerk](https://clerk.com/)** - Authentication and user management

### Frontend
- **[React Native Expo](https://expo.dev/)** - Cross-platform mobile framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Playwright](https://playwright.dev/)** - End-to-end testing
- **[Jest](https://docs.expo.dev/develop/unit-testing/)** - Unit testing

### Development Tools
- **[Node.js](https://nodejs.org/)** - JavaScript runtime for frontend
- **[Node Package Manager (NPM)](https://www.npmjs.com/)** - Package manager
- **[ESLint](https://eslint.org/)** - Code linting

---

## 🏗 Architecture
<a id="architecture"></a>

The application follows a client-server architecture with clear separation between frontend mobile app and backend API:

```
┌──────────────────────┐        HTTP/REST       ┌─────────────────────┐
│                      │ ◄──────────────────────► │                     │
│  Frontend (Mobile)   │                          │   Backend (.NET)    │
│  (React Native Expo) │                          │   (ASP.NET Core)    │
│                      │                          │                     │
└──────────────────────┘                          └────────────┬────────┘
                                                               │
                                                 Entity Framework Core
                                                               │
                                                      ┌────────▼────────┐
                                                      │                 │
                                                      │   PostgreSQL    │
                                                      │                 │
                                                      └─────────────────┘
```

### Backend (`/backend`)

The backend uses a layered architecture with clear separation of concerns:

- **Controllers** - HTTP request handlers for:
  - `EventController.cs` - Event management endpoints
  - `CheckinController.cs` - Check-in operations
  - `ChatController.cs`, `ChatMessageController.cs`, `ChatParticipantController.cs` - Real-time communication
  - `MessagesController.cs` - Broadcast message endpoints
  - `UserController.cs` - User management endpoints
  - `InvitationController.cs` - Event invitation endpoints
  - `ParticipatingController.cs` - Participant status endpoints
  - `TripController.cs` - Trip management endpoints

- **Services** - Business logic layer:
  - `EventService.cs` - Event creation and management
  - `CheckinService.cs` - Check-in processing
  - `ChatService.cs`, `ChatMessageService.cs`, `ChatParticipantService.cs` - Chat functionality
  - `MessageService.cs` - Broadcast message handling
  - `UserService.cs` - User management
  - `InvitationService.cs` - Invitation handling
  - `ParticipantService.cs` - Participant operations
  - `TripService.cs`, `TripCleanupService.cs` - Trip management and cleanup

- **Models** - Data entities:
  - `Event.cs`, `EventParticipant.cs`, `EventCheckinSession.cs` - Event structure
  - `Checkin.cs` - Check-in tracking
  - `Participant.cs`, `User.cs` - User entities
  - `Chat.cs`, `ChatMessage.cs`, `ChatParticipant.cs` - Chat system
  - `Message.cs` - Broadcast messages
  - `Trip.cs`, `Invitation.cs` - Trip and invitation management

- **Data** - Data access layer:
  - `AppDbContext.cs` - Entity Framework Core context
  - Migrations directory - Database schema versioning

- **Migrations** - Keeps migrations history

### Frontend (`/frontend`)

The frontend provides a responsive mobile-first user interface:

- **`/app`** - Application pages and routing (Expo Router):
  - `(auth)/` - Authentication pages (login, signup)
  - `(app)/` - Main application pages (events, check-in, chat, profiles)

- **`/components`** - Reusable React components:
  - **Authentication**: Login, signup, social login buttons
  - **Events**: Event creation and display
  - **Trips**: Trip management and editor
  - **Check-in**: Check-in interface and controls
  - **Chat**: Chat views and creation
  - **Invitations**: Invitation handling and file upload
  - **Participation**: Participant tracking
  - **UI Primitives** (`/ui`): Buttons, form fields, date fields, navigation, tabs
  - **Check-in UI** (`/ui/checkin`): Check-in cards, modals, participant items

- **`/hooks`** - Custom React hooks:
  - Data fetching and caching hooks
  - Authentication state hooks
  - Navigation and routing hooks

- **`/services`** - API communication:
  - REST client for backend communication
  - Business logic and data transformation

- **`/types`** - TypeScript type definitions:
  - API response types
  - Domain model types
  - Component prop types

---

## 📁 Project Structure
<a id="project-structure"></a>

```
rollcall-event/
├── backend/
│   ├── Controllers/
│   │   ├── ChatController.cs
│   │   ├── ChatMessageController.cs
│   │   ├── ChatParticipantController.cs
│   │   ├── CheckinController.cs
│   │   ├── EventController.cs
│   │   ├── InvitationController.cs
│   │   ├── MessagesController.cs
│   │   ├── ParticipatingController.cs
│   │   ├── TripController.cs
│   │   └── UserController.cs
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── Migrations/
│   ├── Extensions/
│   ├── Models/
│   │   ├── Chat.cs
│   │   ├── ChatMessage.cs
│   │   ├── ChatParticipant.cs
│   │   ├── Checkin.cs
│   │   ├── Event.cs
│   │   ├── EventCheckinSession.cs
│   │   ├── EventParticipant.cs
│   │   ├── Invitation.cs
│   │   ├── Message.cs
│   │   ├── Participant.cs
│   │   ├── Trip.cs
│   │   └── User.cs
│   ├── Properties/
│   ├── Services/
│   │   ├── ChatMessageService.cs
│   │   ├── ChatParticipantService.cs
│   │   ├── ChatService.cs
│   │   ├── CheckinService.cs
│   │   ├── EventService.cs
│   │   ├── InvitationService.cs
│   │   ├── MessageService.cs
│   │   ├── ParticipantService.cs
│   │   ├── TripCleanupService.cs
│   │   ├── TripService.cs
│   │   └── UserService.cs
│   ├── MyApp.API.csproj
│   ├── Program.cs
│   ├── appsettings.Development.json
│   └── appsettings.json
├── frontend/
│   ├── __tests__/
│   ├── android/
│   ├── app/
│   ├── assets/
│   ├── components/
│   ├── constants/
│   ├── e2e/
│   ├── hooks/
│   ├── lib/
│   ├── scripts/
│   ├── services/
│   ├── types/
│   ├── app.json
│   ├── eslint.config.js
│   ├── expo-env.d.ts
│   ├── package.json
│   ├── playwright.config.ts
│   └── tsconfig.json
├── rollcall-event.sln
└── README.md
```

---

## 🚀 Getting Started
<a id="getting-started"></a>

### Prerequisites

- **Clerk Application** for authentication
- **.NET 10 SDK** or higher
- **Node.js 18** or higher
- **npm** or **yarn**
- **PostgreSQL 14** or higher
- **Visual Studio 2022** or **Visual Studio Code** with C# extension

### Environment Variables

#### Backend (`.env` in `root folder`)
```env
POSTGRES_HOST=
POSTGRES_PORT=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
```

#### Frontend (`.env` in `/frontend`)
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
EXPO_PUBLIC_API_BASE_URL=
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rollcall-event
   ```

2. **Backend Setup**
   ```bash
   cd backend
   dotnet restore
   dotnet ef database update
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

---

## ▶️ Running the Application
<a id="running-the-application"></a>

### Backend (Terminal 1)
```bash
cd backend
dotnet run
```
The API will be available at `http://localhost:5000`

### Frontend (Terminal 2)
```bash
cd frontend
npm start
```
Follow the Expo CLI prompts to run on your device or emulator.

---

## 🧪 Testing
<a id="testing"></a>

### Backend Tests
```bash
cd backend
dotnet test
```

### Frontend Tests
```bash
cd frontend
npx playwright test #end-2-end test
npx playwright test --ui #end-2-end watchmode
```

---

## 🤖 AI Usage
<a id="ai-usage"></a>

Throughout the development of Rollcall Event, AI tools have been used to enhance productivity:

### Development Assistance
- **GitHub Copilot** - Used for:
  - Generating C# controller and service boilerplate
  - Creating React component structures
  - Writing TypeScript type definitions
  - Auto-completing repetitive code patterns

- **ChatGPT/Claude** - Used for:
  - Understanding .NET Entity Framework patterns
  - Researching React Native best practices
  - Explaining authentication and security concepts

### Limitations & Human Oversight
All code is:
- **Reviewed and tested** by team members
- **Adapted** to fit project requirements
- **Debugged manually** when AI suggestions don't work
- **Refactored** based on team standards

AI serves as a productivity tool, but critical thinking remains essential.

---

## 🐛 Known Issues
<a id="known-issues"></a>

- 🚧 Mobile responsiveness improvements needed
- 🚧 Real-time chat push notifications needed
- 🚧 Map view for events and trips needed
- 🚧 Email and SMS services are currently only mocked
- 🚧 Offline mode support planned

---

## 🤝 Contributing
<a id="contributing"></a>

This is a student prototype project. Contributions are limited to authorized team members.

---

## 📋 License

TBD

---

**Made with ☕ by Bachelor Group 14**
