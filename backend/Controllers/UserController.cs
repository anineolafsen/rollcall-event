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
  }
}