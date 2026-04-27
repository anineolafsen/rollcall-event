using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddHotPathIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_EventParticipants_UserID",
                table: "EventParticipants",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Checkins_EventID",
                table: "Checkins",
                column: "EventID");

            migrationBuilder.CreateIndex(
                name: "IX_Checkins_EventID_ParticipantID",
                table: "Checkins",
                columns: new[] { "EventID", "ParticipantID" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventParticipants_UserID",
                table: "EventParticipants");

            migrationBuilder.DropIndex(
                name: "IX_Checkins_EventID",
                table: "Checkins");

            migrationBuilder.DropIndex(
                name: "IX_Checkins_EventID_ParticipantID",
                table: "Checkins");
        }
    }
}
