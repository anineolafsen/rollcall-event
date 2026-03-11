# Data

Database configuration and Entity Framework Core context.

## AppDbContext

The heart of your data access layer. This class:
- Inherits from `DbContext`
- Defines `DbSet<T>` properties for each entity (table)
- Configures database connection in `Program.cs`
- Handles queries and changes to the database

Example:
```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) 
        : base(options) { }
    
    public DbSet<User> Users { get; set; }
    public DbSet<Event> Events { get; set; }  // Add more tables here
}
```

## Connection String

Set in `appsettings.json` (production) and `appsettings.Development.json` (local):
```json
"ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=mydb;..."
}
```

## Database Operations

All database interactions go through this context:
```csharp
_context.Users.ToList()        // Get all
_context.Users.FirstOrDefault() // Get one
_context.Users.Add(user)       // Add
_context.SaveChanges()         // Persist changes
```

## Adding New Tables

1. Create a model in `Models/`
2. Add `public DbSet<YourModel> YourModels { get; set; }` to AppDbContext
3. Create migration: `dotnet-ef migrations add AddYourTable`
4. Update database: `dotnet-ef database update`