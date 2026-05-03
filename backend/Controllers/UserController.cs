using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using MyApp.API.Extensions;
using System.Text.RegularExpressions;

namespace MyApp.API.Controllers
{
  public record UpdateUserRequest(string? FirstName, string? LastName, string? Phone);

  [ApiController]
  [Route("api/users")]
  [Authorize] // Enforce authentication for user actions
  public class UserController : ControllerBase
  {
    private static readonly Regex NorwegianPhoneRegex = new(@"^(?:\+47)?\d{8}$", RegexOptions.Compiled);
    private readonly UserService _userService;

    public UserController(UserService userService)
    {
      _userService = userService;
    }

    private User? GetAuthenticatedUser()
    {
      try 
      {
        var clerkId = User.GetClerkId();
        if (string.IsNullOrEmpty(clerkId))
        {
            Console.WriteLine("[UserController] Missing ClerkId claim.");
            return null;
        }

        // Only find existing user by ID. Do not auto-create here to avoid race conditions.
        return _userService.GetByClerkId(clerkId);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"[UserController] Error in GetAuthenticatedUser: {ex.Message}");
        return null;
      }
    }

    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
      var user = GetAuthenticatedUser();
      if (user == null) return NotFound("User record not synced with local database yet.");
      return Ok(new { user.Id, user.FirstName, user.LastName, user.Email, user.Phone });
    }

    [HttpPost("sync")]
    [AllowAnonymous] // To allow creating the record if it doesn't exist
    public IActionResult SyncUser([FromBody] UserSyncRequest request)
    {
        if (string.IsNullOrEmpty(request.ClerkId) || string.IsNullOrEmpty(request.Email))
        {
            return BadRequest("ClerkId and Email are required for sync.");
        }

        var user = _userService.GetOrCreateUser(
            request.ClerkId, 
            request.Email, 
            request.FirstName, 
            request.LastName, 
            request.Phone
        );
        return Ok(user);
    }

    [HttpPut("me")]
    public IActionResult UpdateCurrentUser([FromBody] UpdateUserRequest request)
    {
      var user = GetAuthenticatedUser();
      if (user == null) return Unauthorized();


      var phone = request.Phone?.Trim();
      if (!string.IsNullOrWhiteSpace(phone) && !NorwegianPhoneRegex.IsMatch(phone))
      {
        return BadRequest("Phone number must be either 8 digits or +47 followed by 8 digits.");
      }

      var updated = _userService.UpdateUser(user.Id, request.FirstName, request.LastName, request.Phone);
      if (updated == null) return NotFound();
      return Ok(new { updated.Id, updated.FirstName, updated.LastName, updated.Email, updated.Phone });
    }

    [HttpGet]
    public IActionResult GetUsers()
    {
      return Ok(_userService.GetAllUsers());
    }

    [HttpPost]
    [AllowAnonymous] 
    public IActionResult CreateUser([FromBody] UserSyncRequest request)
    {
        return SyncUser(request); // Redirect to new sync logic
    }

    public class UserSyncRequest
    {
        public string ClerkId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
    }

    [HttpGet("clerk/{clerkId}")]
    public IActionResult GetByClerkId(string clerkId)
    {
      var authenticatedClerkId = User.GetClerkId();
      
      // SECURITY: A user should only be able to fetch their own internal record
      if (authenticatedClerkId != clerkId) return Forbid();

      var user = _userService.GetByClerkId(clerkId);
      if (user == null) return NotFound();
      return Ok(user);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteUser(int id)
    {
      var authenticatedClerkId = User.GetClerkId();
      var userToDelete = _userService.GetAllUsers().FirstOrDefault(u => u.Id == id);

      if (userToDelete == null) return NotFound();

      // SECURITY: A user can only delete their own account
      if (userToDelete.ClerkId != authenticatedClerkId)
      {
          return Forbid();
      }

      _userService.DeleteUser(id);
      return NoContent();
    }
  }
}
