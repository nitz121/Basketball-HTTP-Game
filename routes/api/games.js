const express = require("express");
const store = require("../../data/store");
const { sendGameResponse } = require("../../game/respond");

const router = express.Router();

const VALID_STATUSES = ["scheduled", "live", "finished"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/games?status=&sortBy=&fromDate=&toDate=
router.get("/", (req, res) => {
  let games = store.getGames();
  const { status, sortBy, fromDate, toDate } = req.query;

  if (status) {
    games = games.filter((g) => g.status.toLowerCase() === String(status).toLowerCase());
  }

  if (fromDate) {
    games = games.filter((g) => g.date >= fromDate);
  }

  if (toDate) {
    games = games.filter((g) => g.date <= toDate);
  }

  if (sortBy === "date") {
    games = [...games].sort((a, b) => a.date.localeCompare(b.date));
  }

  sendGameResponse(req, res, 200, games);
});

// GET /api/games/:id
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const game = store.getGameById(id);

  if (!game) {
    return sendGameResponse(req, res, 404, { error: `Game with id ${req.params.id} was not found.` });
  }

  sendGameResponse(req, res, 200, game);
});

// POST /api/games  { homeTeamId, awayTeamId, date }
router.post("/", (req, res) => {
  const { homeTeamId, awayTeamId, date } = req.body || {};
  const homeId = Number(homeTeamId);
  const awayId = Number(awayTeamId);

  if (!Number.isInteger(homeId) || !Number.isInteger(awayId) || typeof date !== "string" || !DATE_RE.test(date)) {
    return sendGameResponse(req, res, 400, {
      error: "You must provide homeTeamId and awayTeamId (numbers), and a date in YYYY-MM-DD format.",
    });
  }

  if (homeId === awayId) {
    return sendGameResponse(req, res, 400, { error: "homeTeamId and awayTeamId must be two different teams." });
  }

  if (!store.getTeamById(homeId) || !store.getTeamById(awayId)) {
    return sendGameResponse(req, res, 400, { error: "One of the specified teams does not exist." });
  }

  const game = store.createGame({ homeTeamId: homeId, awayTeamId: awayId, date });
  sendGameResponse(req, res, 201, game);
});

// PATCH /api/games/:id  { status?, homeScore?, awayScore? }
router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = store.getGameById(id);

  if (!existing) {
    return sendGameResponse(req, res, 404, { error: `Game with id ${req.params.id} was not found.` });
  }

  const { status, homeScore, awayScore } = req.body || {};
  const patch = {};

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(String(status).toLowerCase())) {
      return sendGameResponse(req, res, 400, {
        error: `status must be one of: ${VALID_STATUSES.join(", ")}.`,
      });
    }
    patch.status = String(status).toLowerCase();
  }

  if (homeScore !== undefined) {
    if (!Number.isInteger(Number(homeScore))) {
      return sendGameResponse(req, res, 400, { error: "homeScore must be a whole number." });
    }
    patch.homeScore = Number(homeScore);
  }

  if (awayScore !== undefined) {
    if (!Number.isInteger(Number(awayScore))) {
      return sendGameResponse(req, res, 400, { error: "awayScore must be a whole number." });
    }
    patch.awayScore = Number(awayScore);
  }

  const updated = store.updateGame(id, patch);
  sendGameResponse(req, res, 200, updated);
});

// DELETE /api/games/:id
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const removed = store.deleteGame(id);

  if (!removed) {
    return sendGameResponse(req, res, 404, { error: `Game with id ${req.params.id} was not found.` });
  }

  sendGameResponse(req, res, 200, { message: "The game was deleted successfully.", deleted: removed });
});

module.exports = router;
