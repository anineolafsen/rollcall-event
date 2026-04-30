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

    private User GetAuthenticatedUser()
    {
      var clerkId = User.GetClerkId();
      var email = User.GetEmail();
      if (string.IsNullOrEmpty(clerkId) || string.IsNullOrEmpty(email))
        throw new UnauthorizedAccessException("Identity claims missing from token.");
      return _userService.GetOrCreateUser(clerkId, email);
    }

    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
      var user = GetAuthenticatedUser();
      return Ok(new { user.Id, user.FirstName, user.LastName, user.Email, user.Phone });
    }

    [HttpPut("me")]
    public IActionResult UpdateCurrentUser([FromBody] UpdateUserRequest request)
    {
      var user = GetAuthenticatedUser();

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
      // SECURITY: limit who can see the full user list
      // For now, only require authentication
      return Ok(_userService.GetAllUsers());
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
