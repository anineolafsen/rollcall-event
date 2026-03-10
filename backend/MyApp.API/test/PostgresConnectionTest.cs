using System;
using System.IO;
using Npgsql;

class PostgresConnectionTest
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("PostgreSQL Connection Test");
        Console.WriteLine("==========================\n");

        // Load environment variables from .env file (navigate up to project root)
        var currentDir = Directory.GetCurrentDirectory();
        var envPath = Path.Combine(currentDir, "..", "..", "..", ".env");
        envPath = Path.GetFullPath(envPath);
        LoadEnvFile(envPath);

        var host = Environment.GetEnvironmentVariable("POSTGRES_HOST");
        var port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
        var user = Environment.GetEnvironmentVariable("POSTGRES_USER");
        var password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");
        var database = Environment.GetEnvironmentVariable("POSTGRES_DB");

        Console.WriteLine($"Host:     {host}");
        Console.WriteLine($"Port:     {port}");
        Console.WriteLine($"User:     {user}");
        Console.WriteLine($"Database: {database}");
        Console.WriteLine();

        var connectionString = $"Host={host};Port={port};Username={user};Password={password};Database={database};";

        try
        {
            Console.WriteLine("Connecting to PostgreSQL...");
            using (var conn = new NpgsqlConnection(connectionString))
            {
                await conn.OpenAsync();
                Console.WriteLine("✓ Connection successful!");
                Console.WriteLine();

                // Test a simple query
                using (var cmd = new NpgsqlCommand("SELECT version();", conn))
                {
                    var version = await cmd.ExecuteScalarAsync();
                    Console.WriteLine("PostgreSQL version:");
                    Console.WriteLine(version);
                }
            }
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"✗ Connection failed: {ex.Message}");
            Console.ResetColor();
            Environment.Exit(1);
        }
    }

    static void LoadEnvFile(string envPath)
    {
        if (!File.Exists(envPath))
            return;

        foreach (var line in File.ReadAllLines(envPath))
        {
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
                continue;

            var parts = line.Split('=', 2);
            if (parts.Length == 2)
            {
                var key = parts[0].Trim();
                var value = parts[1].Trim().Trim('"');
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }
}
