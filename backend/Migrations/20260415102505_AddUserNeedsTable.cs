using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserNeedsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Allergies",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OtherInfo",
                table: "Users");

            migrationBuilder.CreateTable(
                name: "UserNeeds",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    TripId = table.Column<int>(type: "integer", nullable: false),
                    Allergies = table.Column<string>(type: "text", nullable: true),
                    OtherInfo = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNeeds", x => new { x.UserId, x.TripId });
                    table.ForeignKey(
                        name: "FK_UserNeeds_Trips_TripId",
                        column: x => x.TripId,
                        principalTable: "Trips",
                        principalColumn: "TripID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserNeeds_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserNeeds_TripId",
                table: "UserNeeds",
                column: "TripId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserNeeds");

            migrationBuilder.AddColumn<string>(
                name: "Allergies",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtherInfo",
                table: "Users",
                type: "text",
                nullable: true);
        }
    }
}
