using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using MyApp.API.Extensions;

namespace MyApp.API.Controllers
{
  [ApiController]
  [Route("api/users")]
  [Authorize] // Enforce authentication for user actions
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
      // SECURITY: limit who can see the full user list
      // For now, only require authentication
      return Ok(_userService.GetAllUsers());
    }

    [HttpGet("clerk/{clerkId}")]
    public IActionResult GetByClerkId(string clerkId)
    {
      var authenticatedClerkId = User.GetClerkId();
      
      // SECURITY: A user should only be able to fetch their own internal record
      if (authenticatedClerkId != clerkId)
      {
          return Forbid();
      }

      var user = _userService.GetByClerkId(clerkId);
      if (user == null)
      {
        return NotFound();
      }
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
