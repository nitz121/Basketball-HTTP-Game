(function () {
  "use strict";

  var STORAGE_KEY = "basketballHttpGame.progress";
  var stages = (window.GAME_STAGES || []).slice().sort(function (a, b) {
    return a.order - b.order;
  });

  var state = {
    progressStageId: stages.length ? stages[0].id : null, // furthest stage the user hasn't solved yet
    viewStageId: stages.length ? stages[0].id : null, // stage currently displayed on screen
    completed: [], // array of completed stage ids (kept as an array for JSON, turned into a Set in memory)
    score: 0,
    attempts: {}, // stageId -> number of incorrect attempts
  };
  var completedSet = new Set();

  // ---------- elements ----------
  var stageTrackEl = document.getElementById("stage-track");
  var stageTitleEl = document.getElementById("stage-title");
  var stageDescriptionEl = document.getElementById("stage-description");
  var stageCounterEl = document.getElementById("stage-counter");
  var scoreValueEl = document.getElementById("score-value");
  var attemptsValueEl = document.getElementById("attempts-value");

  var methodSelect = document.getElementById("method-select");
  var pathInput = document.getElementById("path-input");
  var queryListEl = document.getElementById("query-params-list");
  var addQueryBtn = document.getElementById("add-query-btn");
  var bodyInput = document.getElementById("body-input");
  var requestForm = document.getElementById("request-form");
  var clearBtn = document.getElementById("clear-btn");
  var resetGameBtn = document.getElementById("reset-game-btn");

  var responseCard = document.getElementById("response-card");
  var statusBadge = document.getElementById("status-badge");
  var verdictBanner = document.getElementById("verdict-banner");
  var verdictMessage = document.getElementById("verdict-message");
  var responseBody = document.getElementById("response-body");
  var nextStageBtn = document.getElementById("next-stage-btn");

  // ---------- state helpers ----------
  function getStageById(id) {
    return stages.find(function (s) {
      return s.id === id;
    });
  }

  function getNextStage(order) {
    return stages.find(function (s) {
      return s.order === order + 1;
    });
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return;

      if (getStageById(saved.progressStageId)) state.progressStageId = saved.progressStageId;
      if (getStageById(saved.viewStageId)) state.viewStageId = saved.viewStageId;
      if (Array.isArray(saved.completed)) state.completed = saved.completed;
      if (typeof saved.score === "number") state.score = saved.score;
      if (saved.attempts && typeof saved.attempts === "object") state.attempts = saved.attempts;
    } catch (err) {
      // localStorage unavailable / corrupted data - continue with the initial state
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // nothing to do if storage is blocked - the game keeps working without saving
    }
  }

  // ---------- rendering ----------
  function renderStageTrack() {
    stageTrackEl.innerHTML = "";
    var progressOrder = getStageById(state.progressStageId).order;

    stages.forEach(function (stage) {
      var li = document.createElement("li");
      var dot = document.createElement("button");
      dot.type = "button";
      dot.textContent = stage.order;
      dot.className = "stage-dot";
      dot.title = stage.title;

      var isAvailable = stage.order <= progressOrder;
      var isCompleted = completedSet.has(stage.id);
      var isCurrentView = stage.id === state.viewStageId;

      if (isCompleted) dot.classList.add("completed");
      if (isCurrentView) dot.classList.add("current");
      if (isAvailable) {
        dot.classList.add("available");
        dot.addEventListener("click", function () {
          state.viewStageId = stage.id;
          saveProgress();
          resetForm();
          renderAll();
        });
      } else {
        dot.disabled = true;
      }

      li.appendChild(dot);
      stageTrackEl.appendChild(li);
    });
  }

  function renderStageCard() {
    var stage = getStageById(state.viewStageId);
    stageTitleEl.textContent = stage.title;
    stageDescriptionEl.textContent = stage.description;
    stageCounterEl.textContent = "Stage " + stage.order + " of " + stages.length;
    scoreValueEl.textContent = state.score;
    attemptsValueEl.textContent = state.attempts[stage.id] || 0;

    responseCard.classList.add("hidden");
  }

  function renderAll() {
    completedSet = new Set(state.completed);
    renderStageTrack();
    renderStageCard();
  }

  // ---------- Query Params ----------
  function addQueryRow(key, value) {
    var row = document.createElement("div");
    row.className = "param-row";

    var keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.placeholder = "Parameter name (e.g. status)";
    keyInput.value = key || "";
    keyInput.className = "param-key";

    var valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.placeholder = "Value (e.g. finished)";
    valueInput.value = value || "";
    valueInput.className = "param-value";

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-remove";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", function () {
      row.remove();
    });

    row.appendChild(keyInput);
    row.appendChild(valueInput);
    row.appendChild(removeBtn);
    queryListEl.appendChild(row);
  }

  function collectQueryParams() {
    var params = new URLSearchParams();
    queryListEl.querySelectorAll(".param-row").forEach(function (row) {
      var key = row.querySelector(".param-key").value.trim();
      var value = row.querySelector(".param-value").value.trim();
      if (key) params.append(key, value);
    });
    return params;
  }

  addQueryBtn.addEventListener("click", function () {
    addQueryRow();
  });

  clearBtn.addEventListener("click", function () {
    resetForm();
  });

  function resetForm() {
    methodSelect.value = "GET";
    pathInput.value = "";
    bodyInput.value = "";
    queryListEl.innerHTML = "";
    responseCard.classList.add("hidden");
  }

  resetGameBtn.addEventListener("click", function () {
    if (!confirm("Reset all progress and score, and start over from stage 1?")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
    state = {
      progressStageId: stages[0].id,
      viewStageId: stages[0].id,
      completed: [],
      score: 0,
      attempts: {},
    };
    resetForm();
    renderAll();
  });

  // ---------- sending the request ----------
  function buildUrl() {
    var rawPath = pathInput.value.trim();
    var splitIndex = rawPath.indexOf("?");
    var pathname = splitIndex === -1 ? rawPath : rawPath.slice(0, splitIndex);
    var inlineQuery = splitIndex === -1 ? "" : rawPath.slice(splitIndex + 1);

    var params = collectQueryParams();
    var inlineParams = new URLSearchParams(inlineQuery);
    inlineParams.forEach(function (value, key) {
      if (!params.has(key)) params.append(key, value);
    });

    var queryString = params.toString();
    return pathname + (queryString ? "?" + queryString : "");
  }

  function setStatusBadge(status) {
    statusBadge.textContent = status;
    statusBadge.classList.remove("ok", "error");
    statusBadge.classList.add(status >= 200 && status < 400 ? "ok" : "error");
  }

  function showResponse(status, payload, clientErrorMessage) {
    responseCard.classList.remove("hidden");
    setStatusBadge(status);

    if (clientErrorMessage) {
      verdictBanner.textContent = "";
      verdictBanner.className = "verdict-banner";
      verdictMessage.textContent = clientErrorMessage;
      responseBody.textContent = "";
      nextStageBtn.classList.add("hidden");
      return;
    }

    responseBody.textContent = JSON.stringify(payload.data, null, 2);

    var stage = payload.stage;
    if (!stage) {
      verdictBanner.textContent = "";
      verdictMessage.textContent = "";
      nextStageBtn.classList.add("hidden");
      return;
    }

    verdictBanner.textContent = stage.correct ? "✅ Correct" : "❌ Not quite";
    verdictBanner.className = "verdict-banner " + (stage.correct ? "correct" : "incorrect");
    verdictMessage.textContent = stage.message;

    handleVerdict(stage);
  }

  function handleVerdict(stage) {
    var wasAlreadyCompleted = completedSet.has(stage.id);

    if (stage.correct) {
      if (!wasAlreadyCompleted) {
        var attemptsSoFar = state.attempts[stage.id] || 0;
        var points = Math.max(100 - attemptsSoFar * 10, 20);
        state.score += points;
        state.completed.push(stage.id);
        completedSet.add(stage.id);

        var currentStage = getStageById(stage.id);
        var next = getNextStage(currentStage.order);
        if (next) {
          state.progressStageId = next.id;
        }
      }

      var justFinishedGame = !wasAlreadyCompleted && completedSet.size === stages.length;
      if (justFinishedGame) {
        nextStageBtn.classList.add("hidden");
        verdictMessage.textContent += " 🏆 You completed every stage! Final score: " + state.score;
      } else if (!wasAlreadyCompleted) {
        nextStageBtn.classList.remove("hidden");
      } else {
        nextStageBtn.classList.add("hidden");
      }
    } else {
      if (!wasAlreadyCompleted) {
        state.attempts[stage.id] = (state.attempts[stage.id] || 0) + 1;
      }
      nextStageBtn.classList.add("hidden");
    }

    scoreValueEl.textContent = state.score;
    attemptsValueEl.textContent = state.attempts[stage.id] || 0;
    renderStageTrack();
    saveProgress();
  }

  nextStageBtn.addEventListener("click", function () {
    state.viewStageId = state.progressStageId;
    saveProgress();
    resetForm();
    renderAll();
  });

  requestForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!pathInput.value.trim()) {
      showResponse(0, null, "Please enter a request path (e.g. /api/teams) before sending.");
      return;
    }

    var method = methodSelect.value;
    var url = buildUrl();
    var headers = { "X-Game-Stage": String(state.viewStageId) };
    var options = { method: method, headers: headers };

    var bodyText = bodyInput.value.trim();
    if (method !== "GET" && method !== "DELETE" && bodyText) {
      var parsedBody;
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (err) {
        showResponse(0, null, "Request body is not valid JSON: " + err.message);
        return;
      }
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(parsedBody);
    }

    fetch(url, options)
      .then(function (res) {
        return res.json().then(function (payload) {
          return { status: res.status, payload: payload };
        });
      })
      .then(function (result) {
        showResponse(result.status, result.payload, null);
      })
      .catch(function (err) {
        showResponse(0, null, "Network error while contacting the server: " + err.message);
      });
  });

  // ---------- init ----------
  loadProgress();
  completedSet = new Set(state.completed);
  renderAll();
})();
