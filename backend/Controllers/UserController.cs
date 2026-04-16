using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;

namespace MyApp.API.Controllers
{
  [ApiController]
  [Route("api/users")]
  public class UserController : ControllerBase
  {
    private readonly UserService _userService;

    public UserController(UserService userService)
    {
      _userService = userService;
    }

    [HttpGet]
    public IActionResult GetUsers()
    {
      return Ok(_userService.GetAllUsers());
    }

    [HttpPost]
    public IActionResult CreateUser([FromBody] User user)
    {
      if (string.IsNullOrEmpty(user.Email))
      {
        return BadRequest("Email is required.");
      }
      return Ok(_userService.CreateUser(user));
    }

    // PUT /api/users/{id}
    // Updates Name and Phone for a user. Used by the profile page.
    [HttpPut("{id}")]
    public IActionResult UpdateUser(int id, [FromBody] UpdateUserProfileDto dto)
    {
      var user = _userService.UpdateUser(id, dto.Name, dto.Phone);
      if (user == null) return NotFound();
      return Ok(user);
    }

    public record UpdateUserProfileDto(string? Name, string? Phone);

    [HttpDelete("{id}")]
    public IActionResult DeleteUser(int id)
    {
      var user = _userService.GetAllUsers().FirstOrDefault(u => u.Id == id);
      if (user == null)
      {
        return NotFound();
      }

      _userService.DeleteUser(id);
      return NoContent();
    }

    // GET /api/users/{id}/needs
    // Returns all health info for the user, one entry per trip with trip name.
    // Used by the profile page.
    [HttpGet("{id}/needs")]
    public IActionResult GetUserNeeds(int id)
    {
      var needs = _userService.GetAllUserNeeds(id);
      return Ok(needs);
    }

    // GET /api/users/{id}/needs/{tripId}
    // Returns health info for a specific trip. Used by the popup to pre-load existing data.
    [HttpGet("{id}/needs/{tripId}")]
    public IActionResult GetUserNeedsForTrip(int id, int tripId)
    {
      var row = _userService.GetUserNeedsForTrip(id, tripId);
      return Ok(row ?? new UserNeeds { UserId = id, TripId = tripId });
    }

    // PUT /api/users/{id}/needs/{tripId}
    // Creates or updates health info for a specific trip. Used by the popup.
    [HttpPut("{id}/needs/{tripId}")]
    public IActionResult UpsertUserNeedsForTrip(int id, int tripId, [FromBody] UserNeeds dto)
    {
      var row = _userService.UpsertUserNeedsForTrip(id, tripId, dto);
      return Ok(row);
    }
  }
}
