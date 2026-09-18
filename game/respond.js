// Wraps every API response in a consistent shape: the real data (data) +
// the game's verdict on the current stage (stage), if and when a stage id
// was sent with the request.
//
// The status code that's actually sent (res.status) is always the real
// HTTP status of the operation (200/201/404/400, etc.) - completely
// independent of the game stage. The stage verdict is extra information,
// fully separate from the REST API's own behavior.

const { evaluateStage } = require("./stages");

function sendGameResponse(req, res, status, data) {
  const stageHeader = req.get("X-Game-Stage");
  const stageId = stageHeader ? Number(stageHeader) : null;

  let stage = null;
  if (Number.isInteger(stageId)) {
    // req.path is relative to the router's mount point (e.g. "/3" inside
    // /api/teams), so originalUrl is used to get the full path as the
    // client actually sent it.
    const fullPath = req.originalUrl.split("?")[0];
    const ctx = {
      method: req.method,
      path: fullPath,
      query: req.query,
      body: req.body,
    };
    stage = evaluateStage(stageId, ctx, status);
  }

  res.status(status).json({ data, stage });
}

module.exports = { sendGameResponse };
