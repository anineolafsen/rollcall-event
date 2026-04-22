using MyApp.API.Services;
using MyApp.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS to allow frontend requests
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Authentication Services
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Pull the Clerk Frontend API URL from the configuration
        options.Authority = builder.Configuration["Authentication:Clerk:Authority"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = true,
        };
    });

   builder.Services.AddAuthorization(); // Required for [Authorize] attributes to work

// Add DbContext with PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register your custom services
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<TripService>();
builder.Services.AddScoped<InvitationService>();
builder.Services.AddScoped<ParticipantService>();
builder.Services.AddScoped<EventService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS middleware
app.UseCors("AllowAll");

app.UseHttpsRedirection();

// Authentication & Authorization middleware
app.UseAuthentication(); // Check if token is valid
app.UseAuthorization(); // Check if user has permission

app.MapControllers();

app.Run();