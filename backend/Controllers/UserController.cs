using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;
using System.Security.Claims;

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
      return Ok(_userService.CreateUser(user));
    }

    // GET /api/users/profile/needs - Henter allergier og otherInfo for innlogget bruker
    [HttpGet("profile/needs")]
    public IActionResult GetMyNeeds()
    {
      var clerkUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (clerkUserId == null) return Unauthorized();

      var user = _userService.GetUserNeeds(clerkUserId);
      if (user == null) return NotFound();
      return Ok(new { user.Allergies, user.OtherInfo });
    }

    // PUT /api/users/profile/needs - Oppdaterer allergier og otherInfo for innlogget bruker
    [HttpPut("profile/needs")]
    public IActionResult UpdateMyNeeds([FromBody] UpdateUserNeeds dto)
    {
      var clerkUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (clerkUserId == null) return Unauthorized();

      var user = _userService.UpdateUserNeeds(clerkUserId, dto);
      if (user == null) return NotFound();
      return Ok(new { user.Allergies, user.OtherInfo });
    }
  }
}