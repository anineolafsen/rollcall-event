using System.Security.Claims;

namespace MyApp.API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static string? GetClerkId(this ClaimsPrincipal user)
        {
            // Clerk user id may be mapped to NameIdentifier or kept as raw "sub".
            return user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value;
        }

        public static string? GetEmail(this ClaimsPrincipal user)
        {
            // Email claim names can differ by token template/provider.
            return user.FindFirst(ClaimTypes.Email)?.Value
                ?? user.FindFirst("email")?.Value
                ?? user.FindFirst("email_address")?.Value;
        }
    }
}