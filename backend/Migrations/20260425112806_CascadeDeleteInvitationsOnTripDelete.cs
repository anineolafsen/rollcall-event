using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApp.API.Migrations
{
    /// <inheritdoc />
    public partial class CascadeDeleteInvitationsOnTripDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove orphaned invitations whose trip no longer exists
            migrationBuilder.Sql(
                "DELETE FROM \"Invitations\" WHERE \"TripId\" NOT IN (SELECT \"Id\" FROM \"Trips\")");

            migrationBuilder.AddForeignKey(
                name: "FK_Invitations_Trips_TripId",
                table: "Invitations",
                column: "TripId",
                principalTable: "Trips",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invitations_Trips_TripId",
                table: "Invitations");
        }
    }
}
