using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddChatAndMessageService : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TripID",
                table: "Chats",
                newName: "TripId");

            migrationBuilder.RenameColumn(
                name: "CreatorID",
                table: "Chats",
                newName: "CreatorId");

            migrationBuilder.RenameColumn(
                name: "ChatID",
                table: "Chats",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "ChatID",
                table: "ChatParticipants",
                newName: "ChatId");

            migrationBuilder.RenameColumn(
                name: "ChatID",
                table: "ChatMessages",
                newName: "ChatId");

            migrationBuilder.RenameColumn(
                name: "MessageID",
                table: "ChatMessages",
                newName: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TripId",
                table: "Chats",
                newName: "TripID");

            migrationBuilder.RenameColumn(
                name: "CreatorId",
                table: "Chats",
                newName: "CreatorID");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Chats",
                newName: "ChatID");

            migrationBuilder.RenameColumn(
                name: "ChatId",
                table: "ChatParticipants",
                newName: "ChatID");

            migrationBuilder.RenameColumn(
                name: "ChatId",
                table: "ChatMessages",
                newName: "ChatID");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "ChatMessages",
                newName: "MessageID");
        }
    }
}
