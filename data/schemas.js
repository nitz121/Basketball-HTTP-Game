// Metadata describing the shape of each resource in the system - used only
// by the /schemas SSR page. Unrelated to the game/stage engine and not
// secret in any way.

const schemas = [
  {
    name: "Team",
    description: "A basketball team in the league",
    fields: [
      { name: "id", type: "number" },
      { name: "name", type: "string" },
      { name: "city", type: "string" },
      { name: "conference", type: 'string ("North" | "South")' },
      { name: "wins", type: "number" },
      { name: "losses", type: "number" },
    ],
  },
  {
    name: "Game",
    description: "A game between two teams (Team) in the league",
    fields: [
      { name: "id", type: "number" },
      { name: "homeTeamId", type: "number (id of a Team resource)" },
      { name: "awayTeamId", type: "number (id of a Team resource)" },
      { name: "date", type: 'string ("YYYY-MM-DD")' },
      { name: "status", type: 'string ("scheduled" | "live" | "finished")' },
      { name: "homeScore", type: "number | null" },
      { name: "awayScore", type: "number | null" },
    ],
  },
];

module.exports = schemas;
