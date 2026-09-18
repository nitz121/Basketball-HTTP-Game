const express = require("express");
const store = require("../../data/store");
const { sendGameResponse } = require("../../game/respond");

const router = express.Router();

// GET /api/teams?conference=&sortBy=
router.get("/", (req, res) => {
  let teams = store.getTeams();
  const { conference, sortBy } = req.query;

  if (conference) {
    teams = teams.filter((t) => t.conference.toLowerCase() === String(conference).toLowerCase());
  }

  if (sortBy === "wins") {
    teams = [...teams].sort((a, b) => b.wins - a.wins);
  } else if (sortBy === "losses") {
    teams = [...teams].sort((a, b) => b.losses - a.losses);
  } else if (sortBy === "name") {
    teams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  }

  sendGameResponse(req, res, 200, teams);
});

// GET /api/teams/:id
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const team = store.getTeamById(id);

  if (!team) {
    return sendGameResponse(req, res, 404, { error: `Team with id ${req.params.id} was not found.` });
  }

  sendGameResponse(req, res, 200, team);
});

// GET /api/teams/:id/games?status=
router.get("/:id/games", (req, res) => {
  const id = Number(req.params.id);
  const team = store.getTeamById(id);

  if (!team) {
    return sendGameResponse(req, res, 404, { error: `Team with id ${req.params.id} was not found.` });
  }

  let games = store.getGamesByTeamId(id);
  const { status } = req.query;
  if (status) {
    games = games.filter((g) => g.status.toLowerCase() === String(status).toLowerCase());
  }

  sendGameResponse(req, res, 200, games);
});

module.exports = router;
