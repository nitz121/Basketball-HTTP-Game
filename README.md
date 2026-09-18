# Basketball League - HTTP & REST Learning Game

A short web game for practicing Client-Server communication over HTTP. Each
stage presents a real-world scenario from managing a basketball league, and
the player has to build the matching HTTP request themselves (Method, path,
Query/Route Parameters, and Request Body where needed) and actually send it
to the server. Whether the request is correct is decided entirely on the
server side.

## Install & Run

Requires Node.js (v18 or newer recommended).

```bash
npm install
npm start
```

Then open in your browser:

- Game page: http://localhost:3000/
- Schemas page (resource structure): http://localhost:3000/schemas

You can change the port by setting the `PORT` environment variable before
running.

## Project Structure

```
server.js            Express app entry point
routes/pages.js       SSR pages: / (the game) and /schemas
routes/api/           API routes under /api (teams, games)
data/store.js         In-memory data (Teams, Games) and CRUD operations
data/schemas.js       Resource schema metadata, for the /schemas page
game/stages.js        Definition of all 11 game stages and their correctness checks (server-only)
game/respond.js        Wraps every API response as { data, stage }
views/                EJS templates (game.ejs, schemas.ejs)
public/css/style.css  Client-side styling (responsive)
public/js/game.js     Client-side game logic (Vanilla JS, AJAX only)
```

## Resources

- **Team** - a basketball team in the league (`id, name, city, conference, wins, losses`)
- **Game** - a game between two teams (`id, homeTeamId, awayTeamId, date, status, homeScore, awayScore`)

Data is defined in server memory (`data/store.js`) and is not persisted to a
database. Create/update/delete operations actually mutate that memory, but
reset whenever the server restarts.

## API Routes (all under `/api`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/teams` | All teams (supports `conference`, `sortBy`) |
| GET | `/api/teams/:id` | A team by id |
| GET | `/api/teams/:id/games` | All games for a given team (supports `status`) |
| GET | `/api/games` | All games (supports `status`, `sortBy`, `fromDate`, `toDate`) |
| GET | `/api/games/:id` | A game by id |
| POST | `/api/games` | Create a new game |
| PATCH | `/api/games/:id` | Update a game's result/status |
| DELETE | `/api/games/:id` | Delete a game |

Every request sent from the game also includes an `X-Game-Stage` header
carrying the current stage id, which the server uses to check whether the
request matches that stage's requirements.

## Game Stages

11 stages (beyond the minimum requirement of 8), covering GET/POST/PATCH/
DELETE, Route Parameters, Query Parameters (including stages with more than
one parameter that genuinely affect the returned data), Request Body, a 404
status code for a request to a resource that doesn't exist, and several
stages that combine more than one concept (e.g. a Route Parameter together
with a Request Body).

## Scoring & Progress

The game saves progress, score, and attempt counts in the browser
(localStorage), so refreshing the page won't lose progress, and you can go
back and review stages you've already completed. The "Reset Game" button
resets everything back to the start.
