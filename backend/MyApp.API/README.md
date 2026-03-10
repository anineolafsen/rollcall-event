# MyApp.API - Backend Setup & Running

## Prerequisites

- .NET 10.0 SDK installed
- PostgreSQL database credentials configured in `.env` file

## Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend/MyApp.API
   ```

## Running the API

```bash
dotnet run
```

The API will be available at: **http://localhost:5118/swagger**

## Testing Database Connection

To verify your PostgreSQL connection is working:

```bash
cd ../PostgresTest
dotnet run
```

This test will confirm connectivity to your database before running the full application.
