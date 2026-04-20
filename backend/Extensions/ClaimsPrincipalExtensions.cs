using System.Security.Claims;

namespace MyApp.API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static string? GetClerkId(this ClaimsPrincipal user)
        {
            // The default JWT handler maps the "sub" claim to NameIdentifier
            return user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }
}