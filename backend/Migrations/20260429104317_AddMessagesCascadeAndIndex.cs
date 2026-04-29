using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMessagesCascadeAndIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Messages_EventId",
                table: "Messages",
                column: "EventId");

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Events_EventId",
                table: "Messages",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Events_EventId",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_EventId",
                table: "Messages");
        }
    }
}
