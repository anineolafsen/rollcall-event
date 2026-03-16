# Models

Data model classes that represent entities in your database and API requests/responses.

## Current Models
- **User** - Represents a user with Id and Name

## Structure

Models typically map 1:1 to database tables. Each model becomes a `DbSet<T>` in the `AppDbContext`.

Example model:
```csharp
public class User
{
    public int Id { get; set; }
    public required string Name { get; set; }
}
```

## Adding New Models

1. Create a new class file in this folder
2. Add properties that match your database columns
3. Add the model to `AppDbContext` as a `DbSet<T>`
4. Create a migration: `dotnet-ef migrations add AddNewModel`
5. Apply migration: `dotnet-ef database update`

## Best Practices
- Use `required` keyword for non-nullable properties
- Use descriptive names matching your domain
- Keep models focused on data representation
- Consider validation attributes: `[Required]`, `[MaxLength(100)]`, etc.
