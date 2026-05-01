using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddEventCodePerTrip : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Events_TripID",
                table: "Events");

            migrationBuilder.AddColumn<string>(
                name: "EventCode",
                table: "Events",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "Events"
                SET "EventCode" = UPPER(SUBSTRING(MD5("EventID"::text || '-' || "TripID"::text) FROM 1 FOR 8))
                WHERE "EventCode" IS NULL;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "EventCode",
                table: "Events",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_TripID_EventCode",
                table: "Events",
                columns: new[] { "TripID", "EventCode" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Events_TripID_EventCode",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "EventCode",
                table: "Events");

            migrationBuilder.CreateIndex(
                name: "IX_Events_TripID",
                table: "Events",
                column: "TripID");
        }
    }
}
