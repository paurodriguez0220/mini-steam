using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniSteam.Migrations
{
    /// <inheritdoc />
    public partial class AddScores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Scores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    GameId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    MetricKind = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    Value = table.Column<int>(type: "INTEGER", nullable: false),
                    BetterIs = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    Difficulty = table.Column<string>(type: "TEXT", maxLength: 16, nullable: true),
                    Outcome = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    AchievedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Scores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Scores_Games_GameId",
                        column: x => x.GameId,
                        principalTable: "Games",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Scores_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Scores_GameId_AchievedAt",
                table: "Scores",
                columns: new[] { "GameId", "AchievedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Scores_GameId_Difficulty_Value",
                table: "Scores",
                columns: new[] { "GameId", "Difficulty", "Value" });

            migrationBuilder.CreateIndex(
                name: "IX_Scores_UserId",
                table: "Scores",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Scores");
        }
    }
}
