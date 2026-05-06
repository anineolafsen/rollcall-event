using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MyApp.API.Services
{
  public class TripCleanupService : BackgroundService
  {
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TripCleanupService> _logger;

    public TripCleanupService(IServiceScopeFactory scopeFactory, ILogger<TripCleanupService> logger)
    {
      _scopeFactory = scopeFactory;
      _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
      while (!stoppingToken.IsCancellationRequested)
      {
        try
        {
          using var scope = _scopeFactory.CreateScope();
          var tripService = scope.ServiceProvider.GetRequiredService<TripService>();
          var deleted = tripService.DeleteExpiredTrips();
          _logger.LogInformation("TripCleanupService: deleted {Count} expired trips.", deleted);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "TripCleanupService: error during cleanup.");
        }

        await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
      }
    }
  }
}