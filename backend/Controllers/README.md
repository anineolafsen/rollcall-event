# Controllers

API endpoint handlers that define your REST routes and handle HTTP requests/responses.

## Example: UserController
- **Route:** `/api/users`
- **Endpoints:**
  - `GET /api/users` - Retrieve all users
  - `POST /api/users` - Create a new user

## Adding New Controllers

1. Create a new class that inherits from `ControllerBase`
2. Add `[ApiController]` and `[Route("api/[controller]")]` attributes
3. Inject dependencies (services) via constructor
4. Define action methods with HTTP verbs: `[HttpGet]`, `[HttpPost]`, `[HttpPut]`, `[HttpDelete]`

Example:
```csharp
[ApiController]
[Route("api/events")]
public class EventController : ControllerBase
{
    private readonly EventService _eventService;
    
    public EventController(EventService eventService)
    {
        _eventService = eventService;
    }
    
    [HttpGet]
    public IActionResult GetEvents()
    {
        return Ok(_eventService.GetAll());
    }
}
```

Don't forget to register the service in `Program.cs`!
