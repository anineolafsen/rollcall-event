using System.Security.Claims;

namespace MyApp.API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static string? GetClerkId(this ClaimsPrincipal user)
        {
            // Clerk User ID is stored in the "sub" claim
            return user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        public static string? GetEmail(this ClaimsPrincipal user)
        {
            // Clerk often uses the "email" claim or standard XML email claim
            return user.FindFirst(ClaimTypes.Email)?.Value 
                ?? user.FindFirst("email")?.Value;
        }
    }
}