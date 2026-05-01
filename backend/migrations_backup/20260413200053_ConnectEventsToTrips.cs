using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApp.API.Migrations
{
    /// <inheritdoc />
    public partial class ConnectEventsToTrips : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TripID",
                table: "Events",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    fallback_trip_id integer;
                BEGIN
                    IF EXISTS (SELECT 1 FROM "Events" WHERE "TripID" IS NULL) THEN
                        SELECT "TripID"
                        INTO fallback_trip_id
                        FROM "Trips"
                        ORDER BY "TripID"
                        LIMIT 1;

                        IF fallback_trip_id IS NULL THEN
                            INSERT INTO "Trips" ("Name", "StartDate", "EndDate", "Destination", "Description")
                            VALUES ('Migrated Trip', '1970-01-01', '1970-01-01', NULL, 'Created automatically while connecting existing events to trips.')
                            RETURNING "TripID" INTO fallback_trip_id;
                        END IF;

                        UPDATE "Events"
                        SET "TripID" = fallback_trip_id
                        WHERE "TripID" IS NULL;
                    END IF;
                END $$;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "TripID",
                table: "Events",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_TripID",
                table: "Events",
                column: "TripID");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Trips_TripID",
                table: "Events",
                column: "TripID",
                principalTable: "Trips",
                principalColumn: "TripID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Trips_TripID",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_TripID",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "TripID",
                table: "Events");
        }
    }
}
