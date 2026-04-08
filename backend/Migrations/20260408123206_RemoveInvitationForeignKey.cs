using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApp.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveInvitationForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invitations_Trips_TripID",
                table: "Invitations");

            migrationBuilder.DropIndex(
                name: "IX_Invitations_TripID",
                table: "Invitations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Invitations_TripID",
                table: "Invitations",
                column: "TripID");

            migrationBuilder.AddForeignKey(
                name: "FK_Invitations_Trips_TripID",
                table: "Invitations",
                column: "TripID",
                principalTable: "Trips",
                principalColumn: "TripID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
