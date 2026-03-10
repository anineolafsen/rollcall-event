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

To verify your PostgreSQL connection is working before running the full API:

```bash
cd backend/MyApp.API/test
dotnet run
```

This will test connectivity to your Azure PostgreSQL database and display the PostgreSQL version if successful.
