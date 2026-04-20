# Services

Business logic layer. Services handle data operations and implement domain-specific logic.

## Current Services
- Services should back active API routes or core domain logic.

## Responsibility

Services:
- Access the database via `AppDbContext`
- Implement business rules and validation
- Return data to controllers
- Handle transactions and complex operations

Example:
```csharp
public class EventService
{
    private readonly AppDbContext _context;
    
    public EventService(AppDbContext context)
    {
        _context = context;
    }
    
    public List<Event> GetAllEvents()
    {
        return _context.Events.ToList();
    }
}
```

## Adding New Services

1. Create a class in this folder
2. Inject `AppDbContext` via constructor
3. Implement methods for CRUD operations
4. Register in `Program.cs`: `builder.Services.AddScoped<YourService>();`

## Pattern

```csharp
public class YourService
{
    private readonly AppDbContext _context;
    
    public YourService(AppDbContext context)
    {
        _context = context;
    }
    
    // Add your methods here
}
```
