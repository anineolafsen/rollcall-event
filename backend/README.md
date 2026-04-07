# Backend API

ASP.NET Core REST API for the Rollcall Event application.

## Quick Start

### Prerequisites
- .NET 10 SDK
- PostgreSQL database (connection configured in `appsettings.Development.json`)

### Setup

1. **Restore dependencies:**
   ```bash
   dotnet restore
   ```

2. **Apply database migrations:**
   ```bash
   dotnet-ef database update
   ```

3. **Run the API:**
   ```bash
   dotnet run
   ```

   The API will start on `http://localhost:5118`

## Project Structure

- **Controllers/** - HTTP endpoint handlers
- **Models/** - Data entity classes
- **Services/** - Business logic and data operations
- **Data/** - Database context and configuration
- **Migrations/** - Database schema change history
- **Program.cs** - Application configuration and startup
- **appsettings.json** - Configuration (secrets in Development.json)

## Common Tasks

### Add a New Entity

1. Create model in `Models/`
2. Add to `AppDbContext` in `Data/AppDbContext.cs`
3. Create migration: `dotnet-ef migrations add AddNewEntity`
4. Apply: `dotnet-ef database update`
5. Create controller in `Controllers/`
6. Create service in `Services/`

### API Endpoints

All endpoints are RESTful and prefixed with `/api/`:

- `GET /api/users` - List all users
- `POST /api/users` - Create a new user

See each folder's README for more details.

## Database

**PostgreSQL** hosted on Azure

Credentials are in `appsettings.Development.json` (local development only).

After container restarts, reapply migrations:
```bash
dotnet-ef database update
```

## Building & Testing

```bash
# Build the project
dotnet build

# Run tests (if available)
dotnet test

# Design database schema
dotnet-ef database drop    # Careful!
dotnet-ef database update  # Recreate
```

## Environment Variables

Development secrets are in `appsettings.Development.json` (NOT committed to git).

For production, use environment variables or Azure Key Vault.

## Useful Links

- [Entity Framework Core Docs](https://learn.microsoft.com/ef/core/)
- [ASP.NET Core API Docs](https://learn.microsoft.com/aspnet/core/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
