// In-memory data store (no database), as required by the assignment.
// Every mutation (create/update/delete) changes these arrays in the
// process's live memory.

let teams = [
  { id: 1, name: "Tel Aviv Falcons", city: "Tel Aviv", conference: "South", wins: 10, losses: 4 },
  { id: 2, name: "Haifa Sharks", city: "Haifa", conference: "North", wins: 7, losses: 7 },
  { id: 3, name: "Jerusalem Lions", city: "Jerusalem", conference: "South", wins: 12, losses: 2 },
  { id: 4, name: "Beer Sheva Wolves", city: "Beer Sheva", conference: "South", wins: 5, losses: 9 },
  { id: 5, name: "Netanya Eagles", city: "Netanya", conference: "North", wins: 9, losses: 5 },
  { id: 6, name: "Ashdod Hawks", city: "Ashdod", conference: "North", wins: 3, losses: 11 },
];

let games = [
  { id: 1, homeTeamId: 1, awayTeamId: 2, date: "2026-09-10", status: "finished", homeScore: 98, awayScore: 92 },
  { id: 2, homeTeamId: 3, awayTeamId: 4, date: "2026-09-11", status: "finished", homeScore: 110, awayScore: 87 },
  { id: 3, homeTeamId: 5, awayTeamId: 6, date: "2026-09-12", status: "finished", homeScore: 101, awayScore: 95 },
  { id: 4, homeTeamId: 2, awayTeamId: 3, date: "2026-09-15", status: "finished", homeScore: 88, awayScore: 90 },
  { id: 5, homeTeamId: 1, awayTeamId: 4, date: "2026-09-18", status: "scheduled", homeScore: null, awayScore: null },
  { id: 6, homeTeamId: 6, awayTeamId: 5, date: "2026-09-19", status: "scheduled", homeScore: null, awayScore: null },
  { id: 7, homeTeamId: 3, awayTeamId: 1, date: "2026-09-20", status: "scheduled", homeScore: null, awayScore: null },
  { id: 8, homeTeamId: 4, awayTeamId: 2, date: "2026-09-21", status: "scheduled", homeScore: null, awayScore: null },
  { id: 9, homeTeamId: 5, awayTeamId: 1, date: "2026-09-08", status: "finished", homeScore: 80, awayScore: 99 },
  { id: 10, homeTeamId: 2, awayTeamId: 6, date: "2026-09-09", status: "finished", homeScore: 105, awayScore: 70 },
];

let nextGameId = games.length + 1;

function getTeams() {
  return teams;
}

function getTeamById(id) {
  return teams.find((t) => t.id === id) || null;
}

function getGames() {
  return games;
}

function getGameById(id) {
  return games.find((g) => g.id === id) || null;
}

function getGamesByTeamId(teamId) {
  return games.filter((g) => g.homeTeamId === teamId || g.awayTeamId === teamId);
}

function createGame({ homeTeamId, awayTeamId, date }) {
  const game = {
    id: nextGameId++,
    homeTeamId,
    awayTeamId,
    date,
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  };
  games.push(game);
  return game;
}

function updateGame(id, patch) {
  const game = getGameById(id);
  if (!game) return null;
  Object.assign(game, patch);
  return game;
}

function deleteGame(id) {
  const index = games.findIndex((g) => g.id === id);
  if (index === -1) return null;
  const [removed] = games.splice(index, 1);
  return removed;
}

module.exports = {
  getTeams,
  getTeamById,
  getGames,
  getGameById,
  getGamesByTeamId,
  createGame,
  updateGame,
  deleteGame,
};
