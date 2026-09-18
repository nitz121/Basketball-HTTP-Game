const express = require("express");
const { getPublicStages } = require("../game/stages");
const schemas = require("../data/schemas");

const router = express.Router();

// Main game page - server-rendered with EJS
router.get("/", (req, res) => {
  res.render("game", { stages: getPublicStages() });
});

// Schemas page - a second SSR page showing the shape of each resource
router.get("/schemas", (req, res) => {
  res.render("schemas", { schemas });
});

module.exports = router;
