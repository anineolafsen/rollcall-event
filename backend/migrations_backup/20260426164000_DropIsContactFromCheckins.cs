using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using MyApp.API.Data;

#nullable disable

namespace MyApp.API.Migrations
{
  [DbContext(typeof(AppDbContext))]
  [Migration("20260426164000_DropIsContactFromCheckins")]
  public partial class DropIsContactFromCheckins : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql(@"
ALTER TABLE ""Checkins""
DROP COLUMN IF EXISTS ""IsContact"";
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql(@"
ALTER TABLE ""Checkins""
ADD COLUMN IF NOT EXISTS ""IsContact"" boolean NOT NULL DEFAULT false;
");
    }
  }
}
