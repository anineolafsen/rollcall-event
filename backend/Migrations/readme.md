# Migrations

Database schema version control. Migrations define how the database evolves over time.

## What Are Migrations?

Migrations are C# classes that describe changes to the database schema:
- Creating tables
- Adding/removing columns
- Changing column types
- Adding constraints

Each migration has:
- **Up()** - Changes to apply
- **Down()** - Changes to undo/rollback

Example filename: `20260311131420_InitialCreate.cs`
- Timestamp ensures chronological order
- Description tells you what changed

## Creating New Migrations

When you add/modify models, create a migration:

```bash
dotnet-ef migrations add AddEventTable
```

This generates `AddEventTable.cs` and `AddEventTableSnapshot.cs` files.

## Applying Migrations

Apply all pending migrations to the database:

```bash
dotnet-ef database update
```

After a container restart:
```bash
dotnet-ef database update
```

Or automatically on API startup (see `Program.cs`).

## Viewing Migration History

Current migrations are tracked in the `__EFMigrationsHistory` table in your database.

## Workflow

1. Update models in `Models/`
2. Create migration: `dotnet-ef migrations add YourDescription`
3. Review the generated migration file
4. Apply: `dotnet-ef database update`
5. Commit migration files to git

## Important

- **Always commit migration files** to version control
- Never edit migration files manually (recreate them if needed)
- Keep migrations focused and descriptive
