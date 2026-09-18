const express = require("express");
const path = require("path");

const pagesRouter = require("./routes/pages");
const teamsRouter = require("./routes/api/teams");
const gamesRouter = require("./routes/api/games");
const { sendGameResponse } = require("./game/respond");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// SSR pages: / (the game) and /schemas (the schemas page)
app.use("/", pagesRouter);

// All API routes are grouped under /api
app.use("/api/teams", teamsRouter);
app.use("/api/games", gamesRouter);

// Catch-all for ANY request that doesn't match a registered route+method
// combination - not just under /api. A player might type a path without
// the /api prefix, use extra path segments, or pick a Method with no
// matching handler at all; without this, Express's default HTML 404 page
// would reach the client, whose fetch().then(res => res.json()) would then
// fail to parse it ("Unexpected token '<' ... is not valid JSON"), and the
// game would show a confusing network error instead of real stage feedback.
// This still runs the stage check via sendGameResponse, so the player
// always gets a proper JSON response and an "incorrect" verdict here.
app.use((req, res) => {
  sendGameResponse(req, res, 404, { error: "The requested route does not exist." });
});

// Global error handler (e.g. invalid JSON in the request body)
app.use((err, req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(400).json({ data: { error: "The request body is not valid JSON." }, stage: null });
  }
  console.error(err);
  res.status(500).send("Internal Server Error");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
