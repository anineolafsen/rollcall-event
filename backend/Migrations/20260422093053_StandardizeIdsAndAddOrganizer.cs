using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MyApp.API.Migrations
{
    /// <inheritdoc />
    public partial class StandardizeIdsAndAddOrganizer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Trips_TripID",
                table: "Events");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Invitations",
                table: "Invitations");

            migrationBuilder.RenameColumn(
                name: "TripID",
                table: "Trips",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "UserID",
                table: "Participants",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "TripID",
                table: "Participants",
                newName: "TripId");

            migrationBuilder.RenameColumn(
                name: "ParticipantID",
                table: "Participants",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "TripID",
                table: "Invitations",
                newName: "TripId");

            migrationBuilder.RenameColumn(
                name: "UserEmail",
                table: "Invitations",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "TripID",
                table: "Events",
                newName: "TripId");

            migrationBuilder.RenameColumn(
                name: "EventID",
                table: "Events",
                newName: "Id");

            migrationBuilder.RenameIndex(
                name: "IX_Events_TripID",
                table: "Events",
                newName: "IX_Events_TripId");

            migrationBuilder.AddColumn<string>(
                name: "ClerkId",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "OrganizerId",
                table: "Trips",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // FIX: Explicitly cast the column from text to integer
            migrationBuilder.Sql("ALTER TABLE \"Participants\" ALTER COLUMN \"UserId\" TYPE integer USING \"UserId\"::integer");

            migrationBuilder.AddColumn<string>(
                name: "Allergies",
                table: "Participants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsOrganizer",
                table: "Participants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OtherInfo",
                table: "Participants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "Invitations",
                type: "integer",
                nullable: false,
                defaultValue: 0)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Invitations",
                table: "Invitations",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Trips_OrganizerId",
                table: "Trips",
                column: "OrganizerId");

            migrationBuilder.CreateIndex(
                name: "IX_Participants_TripId_UserId",
                table: "Participants",
                columns: new[] { "TripId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Participants_UserId",
                table: "Participants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Invitations_TripId_Email",
                table: "Invitations",
                columns: new[] { "TripId", "Email" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Trips_TripId",
                table: "Events",
                column: "TripId",
                principalTable: "Trips",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Participants_Trips_TripId",
                table: "Participants",
                column: "TripId",
                principalTable: "Trips",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Participants_Users_UserId",
                table: "Participants",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Trips_Users_OrganizerId",
                table: "Trips",
                column: "OrganizerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Trips_TripId",
                table: "Events");

            migrationBuilder.DropForeignKey(
                name: "FK_Participants_Trips_TripId",
                table: "Participants");

            migrationBuilder.DropForeignKey(
                name: "FK_Participants_Users_UserId",
                table: "Participants");

            migrationBuilder.DropForeignKey(
                name: "FK_Trips_Users_OrganizerId",
                table: "Trips");

            migrationBuilder.DropIndex(
                name: "IX_Trips_OrganizerId",
                table: "Trips");

            migrationBuilder.DropIndex(
                name: "IX_Participants_TripId_UserId",
                table: "Participants");

            migrationBuilder.DropIndex(
                name: "IX_Participants_UserId",
                table: "Participants");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Invitations",
                table: "Invitations");

            migrationBuilder.DropIndex(
                name: "IX_Invitations_TripId_Email",
                table: "Invitations");

            migrationBuilder.DropColumn(
                name: "ClerkId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OrganizerId",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "Allergies",
                table: "Participants");

            migrationBuilder.DropColumn(
                name: "IsOrganizer",
                table: "Participants");

            migrationBuilder.DropColumn(
                name: "OtherInfo",
                table: "Participants");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "Invitations");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Trips",
                newName: "TripID");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Participants",
                newName: "UserID");

            migrationBuilder.RenameColumn(
                name: "TripId",
                table: "Participants",
                newName: "TripID");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Participants",
                newName: "ParticipantID");

            migrationBuilder.RenameColumn(
                name: "TripId",
                table: "Invitations",
                newName: "TripID");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "Invitations",
                newName: "UserEmail");

            migrationBuilder.RenameColumn(
                name: "TripId",
                table: "Events",
                newName: "TripID");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Events",
                newName: "EventID");

            migrationBuilder.RenameIndex(
                name: "IX_Events_TripId",
                table: "Events",
                newName: "IX_Events_TripID");

            migrationBuilder.AlterColumn<string>(
                name: "UserID",
                table: "Participants",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Invitations",
                table: "Invitations",
                columns: new[] { "TripID", "UserEmail" });

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Trips_TripID",
                table: "Events",
                column: "TripID",
                principalTable: "Trips",
                principalColumn: "TripID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
