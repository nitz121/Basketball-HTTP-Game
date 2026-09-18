// ==========================================================================
// Game stage engine.
//
// Important: this file is server-side only. It is never sent to the client -
// not as a JS file, and not as part of any response. The game page route
// (routes/pages.js) only pulls the public fields (id, order, title,
// description) from here for display, and never the check functions or the
// expected values.
// ==========================================================================

const { getTeamById } = require("../data/store");

// Matches a path against a pattern like "/api/teams/:id" and returns the
// captured route params, or null if the actual path doesn't match the
// pattern (different segment count / mismatched static segments).
function matchPath(pattern, actualPath) {
  const patternParts = pattern.split("/").filter(Boolean);
  const actualParts = actualPath.split("/").filter(Boolean);
  if (patternParts.length !== actualParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (part.startsWith(":")) {
      params[part.slice(1)] = actualParts[i];
    } else if (part !== actualParts[i]) {
      return null;
    }
  }
  return params;
}

function normalize(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

// The game's stages. Each stage has:
// - id, order, title, description: shown to the user (not secret).
// - expectedStatus: the status code the server should actually return when
//   the request is correct.
// - check(ctx): returns true if the actual request (method/path/query/body)
//   matches the stage's requirement. ctx = { method, path, query, body }.
const stages = [
  {
    id: 1,
    order: 1,
    title: "Meet the teams",
    description:
      "You're building the league website's home page. First task: show a list of every team currently in the system.",
    expectedStatus: 200,
    check: (ctx) => ctx.method === "GET" && ctx.path === "/api/teams",
  },
  {
    id: 2,
    order: 2,
    title: "A specific team's details",
    description:
      "A fan wants to see the full details of the 'Jerusalem Lions'. They know the team's id in the system is 3. Show them its complete details.",
    expectedStatus: 200,
    check: (ctx) => {
      if (ctx.method !== "GET") return false;
      const params = matchPath("/api/teams/:id", ctx.path);
      return !!params && params.id === "3";
    },
  },
  {
    id: 3,
    order: 3,
    title: "When something doesn't exist",
    description:
      "Someone mistakenly typed a wrong team id - 999 - and tried to view the team with that id. Send that exact request yourself and check how the server responds when asked for a resource that doesn't exist.",
    expectedStatus: 404,
    check: (ctx) => {
      if (ctx.method !== "GET") return false;
      const params = matchPath("/api/teams/:id", ctx.path);
      if (!params) return false;
      const id = Number(params.id);
      return Number.isInteger(id) && !getTeamById(id);
    },
  },
  {
    id: 4,
    order: 4,
    title: "A team's game schedule",
    description:
      "The coach of the 'Haifa Sharks' (team id: 2) wants to see all of that team's games - both home games and away games.",
    expectedStatus: 200,
    check: (ctx) => {
      if (ctx.method !== "GET") return false;
      const params = matchPath("/api/teams/:id/games", ctx.path);
      return !!params && params.id === "2";
    },
  },
  {
    id: 5,
    order: 5,
    title: "Finished games, sorted",
    description:
      "The site needs to display only the games that have already finished (status = finished), sorted by date from earliest to latest.",
    expectedStatus: 200,
    check: (ctx) => {
      if (ctx.method !== "GET" || ctx.path !== "/api/games") return false;
      return normalize(ctx.query.status) === "finished" && normalize(ctx.query.sortBy) === "date";
    },
  },
  {
    id: 6,
    order: 6,
    title: "Games within a date range",
    description:
      "The league manager wants to see which games are scheduled between 2026-09-18 and 2026-09-20 (inclusive).",
    expectedStatus: 200,
    check: (ctx) => {
      if (ctx.method !== "GET" || ctx.path !== "/api/games") return false;
      return ctx.query.fromDate === "2026-09-18" && ctx.query.toDate === "2026-09-20";
    },
  },
  {
    id: 7,
    order: 7,
    title: "Scheduling a new game",
    description:
      "A new future game needs to be scheduled: team 4 (Beer Sheva Wolves) hosts team 6 (Ashdod Hawks) on 2026-09-25.",
    expectedStatus: 201,
    check: (ctx) => {
      if (ctx.method !== "POST" || ctx.path !== "/api/games") return false;
      const body = ctx.body || {};
      return Number(body.homeTeamId) === 4 && Number(body.awayTeamId) === 6 && body.date === "2026-09-25";
    },
  },
  {
    id: 8,
    order: 8,
    title: "Updating a game's result",
    description:
      "Game number 5 (between Tel Aviv Falcons and Beer Sheva Wolves) has finished with a score of 112-101 in favor of the home team. Update the game's record in the system accordingly.",
    expectedStatus: 200,
    check: (ctx) => {
      if (ctx.method !== "PATCH") return false;
      const params = matchPath("/api/games/:id", ctx.path);
      if (!params || params.id !== "5") return false;
      const body = ctx.body || {};
      return (
        normalize(body.status) === "finished" &&
        Number(body.homeScore) === 112 &&
        Number(body.awayScore) === 101
      );
    },
  },
  {
    id: 9,
    order: 9,
    title: "Cancelling a game",
    description:
      "Game number 6 (between Ashdod Hawks and Netanya Eagles) has been cancelled and will not take place. Remove it from the system entirely.",
    expectedStatus: 200,
    check: (ctx) => {
      if (ctx.method !== "DELETE") return false;
      const params = matchPath("/api/games/:id", ctx.path);
      return !!params && params.id === "6";
    },
  },
  {
    id: 10,
    order: 10,
    title: "Ranking the South conference",
    description:
      "Show only the teams from the 'South' conference, sorted by number of wins (highest to lowest).",
    expectedStatus: 200,
    check: (ctx) => {
      if (ctx.method !== "GET" || ctx.path !== "/api/teams") return false;
      return normalize(ctx.query.conference) === "south" && normalize(ctx.query.sortBy) === "wins";
    },
  },
  {
    id: 11,
    order: 11,
    title: "A team's finished-games history",
    description:
      "Show only the games that have already finished for the 'Jerusalem Lions' (team id: 3) - excluding any future or scheduled games.",
    expectedStatus: 200,
    check: (ctx) => {
      if (ctx.method !== "GET") return false;
      const params = matchPath("/api/teams/:id/games", ctx.path);
      if (!params || params.id !== "3") return false;
      return normalize(ctx.query.status) === "finished";
    },
  },
];

// Returns only the public fields (for display on the game page) - never the
// check function or the expectedStatus.
function getPublicStages() {
  return stages.map(({ id, order, title, description }) => ({ id, order, title, description }));
}

// Checks an actual request against a given stage's requirements and returns
// a verdict for the client. ctx = { method, path, query, body },
// actualStatus = the real status code the server returned.
function evaluateStage(stageId, ctx, actualStatus) {
  const stage = stages.find((s) => s.id === stageId);
  if (!stage) {
    return { id: stageId, correct: false, message: "Unknown stage. Refresh the page and try again." };
  }

  let matches = false;
  try {
    matches = !!stage.check(ctx);
  } catch (err) {
    matches = false;
  }

  const statusOk = actualStatus === stage.expectedStatus;

  if (matches && statusOk) {
    return {
      id: stageId,
      correct: true,
      message: "Great! That's exactly the right request for this stage. You can move on to the next one.",
    };
  }

  if (matches && !statusOk) {
    return {
      id: stageId,
      correct: false,
      message: `Very close, but the status code that came back (${actualStatus}) isn't what's expected for this scenario.`,
    };
  }

  return {
    id: stageId,
    correct: false,
    message: "This request doesn't match the scenario described in this stage. Check the Method, the path, the parameters, or the body, and try again.",
  };
}

module.exports = { stages, getPublicStages, evaluateStage };
