/* ---------------------------------------------------------------------------
   app.js — ניווט בין מסכים, רינדור ומצב.

   האפליקציה לא מחשבת כאן שום דבר: החישוב כולו ב-scoring.js, והעובדות כולן
   ב-data/roles.js. הקובץ הזה רק מציג. מצב נשמר בזיכרון בלבד.
   --------------------------------------------------------------------------- */

(function () {
  "use strict";

  // ── מצב ─────────────────────────────────────────────────────────────────

  var state = {
    index: 0,            // אינדקס השאלה הנוכחית
    answers: {},         // { questionId: optionId }
    results: null,       // תוצאת computeResults האחרונה
    catalogFilter: "all",
    returnScreen: "welcome" // לאן חוזרים מהקטלוג
  };

  // ── עזרים ───────────────────────────────────────────────────────────────

  function $(id) { return document.getElementById(id); }

  /** הכל שמגיע מה-KB עובר כאן לפני שהוא נכנס ל-HTML. */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showScreen(name) {
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle("is-active", screens[i].id === "screen-" + name);
    }
    $("btnRestartTop").hidden = (name === "welcome");
    $("btnCatalogTop").hidden = (name === "catalog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── מסך השאלון ──────────────────────────────────────────────────────────

  function renderQuestion() {
    var question = QUESTIONS[state.index];
    var total = QUESTIONS.length;
    var answeredCount = state.index;
    var pct = Math.round((answeredCount / total) * 100);

    $("progressLabel").textContent = "שאלה " + (state.index + 1) + " מתוך " + total;
    $("progressPct").textContent = pct + "%";
    var fill = $("progressFill");
    fill.style.width = pct + "%";
    fill.setAttribute("aria-valuenow", String(pct));

    $("questionText").textContent = question.text;

    var list = $("optionsList");
    list.innerHTML = "";

    question.options.forEach(function (option) {
      var isSelected = state.answers[question.id] === option.id;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option" + (isSelected ? " is-selected" : "");
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", isSelected ? "true" : "false");
      btn.innerHTML = '<span class="option-dot" aria-hidden="true"></span><span>' + esc(option.label) + "</span>";

      btn.addEventListener("click", function () { selectOption(question.id, option.id); });
      list.appendChild(btn);
    });

    $("btnBack").disabled = (state.index === 0);
    $("btnNext").disabled = (state.answers[question.id] == null);
    $("btnNext").textContent = (state.index === total - 1) ? "הצג תוצאות" : "הבא";
  }

  function selectOption(questionId, optionId) {
    state.answers[questionId] = optionId;
    renderQuestion();

    // מעבר אוטומטי קדימה — עם השהיה קצרה, כדי שהבחירה תיראה לפני המעבר.
    window.setTimeout(goNext, CONFIG.AUTO_ADVANCE_MS);
  }

  function goNext() {
    var question = QUESTIONS[state.index];
    if (state.answers[question.id] == null) return;

    if (state.index < QUESTIONS.length - 1) {
      state.index += 1;
      renderQuestion();
    } else {
      finish();
    }
  }

  function goBack() {
    if (state.index === 0) return;
    state.index -= 1;
    renderQuestion();
  }

  // ── מסך התוצאות ─────────────────────────────────────────────────────────

  function finish() {
    state.results = computeResults(state.answers);

    $("progressFill").style.width = "100%";
    renderResults(state.results);
    showScreen("results");

    // שכבת הסבר ה-AI היא קישוט בלבד: הדירוג והאחוזים כבר נקבעו ומוצגים.
    if (CONFIG.ENABLE_AI_EXPLANATION) enhanceWithAI(state.results);
  }

  function renderResults(results) {
    var container = $("topRoles");
    container.innerHTML = "";

    results.top3.forEach(function (entry, i) {
      container.appendChild(buildRoleCard(entry.role, {
        rank: i + 1,
        matchPct: entry.matchPct,
        reasons: entry.reasons,
        highlight: true
      }));
    });

    renderBlocked(results.blocked);
  }

  /** בלוק השקיפות: מה נחסם בתנאי-סף. מוצג רק אם באמת יש מה להציג. */
  function renderBlocked(blocked) {
    var host = $("blockedBlock");
    host.innerHTML = "";
    if (!blocked || blocked.length === 0) return;

    var items = blocked.map(function (b) {
      return '<li><strong>' + esc(b.role.name) + '</strong> — <span>' + esc(b.reason) + "</span></li>";
    }).join("");

    var box = document.createElement("div");
    box.className = "blocked-block";
    box.innerHTML =
      "<h3>תפקידים מעניינים שדורשים תנאי-סף שלא סומנו</h3>" +
      "<p>לפי התשובות שלך, התפקידים האלה קיבלו התאמה גבוהה אך לא עמדו בתנאי-סף. " +
      "זו הצגה שקופה של המצב — לא הבטחה ולא פסילה סופית.</p>" +
      '<ul class="blocked-list">' + items + "</ul>";

    host.appendChild(box);
  }

  // ── כרטיס תפקיד (משותף לתוצאות ולקטלוג) ─────────────────────────────────

  /**
   * options: { rank, matchPct, reasons, highlight }
   * כל השדות אופציונליים — בקטלוג אין דירוג, אחוז או נימוקים.
   */
  function buildRoleCard(role, options) {
    options = options || {};
    var card = document.createElement("article");
    card.className = "role-card" + (options.highlight ? " is-top" : "");

    var html = '<div class="role-head">';

    if (options.rank) {
      html += '<div class="rank-badge" aria-hidden="true">' + options.rank + "</div>";
    }

    html += '<div class="role-title">' +
              "<h3>" + esc(role.name) + "</h3>" +
              '<span class="tag">' + esc(role.category) + "</span>";

    if (options.rank) {
      html += '<p class="role-oneliner">' + esc(role.oneLiner) + "</p>";
    }
    html += "</div>";

    if (options.matchPct != null) {
      html += '<div class="match-ring" style="--pct:' + options.matchPct + '" ' +
              'role="img" aria-label="' + options.matchPct + ' אחוז התאמה">' +
                '<div class="match-ring-text"><b>' + options.matchPct + "%</b><span>התאמה</span></div>" +
              "</div>";
    }
    html += "</div>";

    if (!options.rank) {
      html += '<p class="role-oneliner">' + esc(role.oneLiner) + "</p>";
    }

    // "למה זה מתאים לך" — רק בתוצאות, ורק אם יש נימוקים.
    if (options.reasons && options.reasons.length) {
      html += '<div class="why"><h4>למה זה מתאים לך</h4><ul>' +
        options.reasons.map(function (r) {
          return "<li>" + esc(r.text) + '<span class="q">' + esc(r.questionText) + "</span></li>";
        }).join("") +
        "</ul></div>";
    }

    html += buildFacts(role);

    var moreId = "more-" + role.id + "-" + (options.rank ? "top" : "cat");
    html += '<div class="more">' +
              '<button class="more-toggle" type="button" data-more="' + moreId + '" ' +
              'aria-expanded="false" aria-controls="' + moreId + '">קרא/י עוד ▾</button>' +
              '<div class="more-body" id="' + moreId + '">' +
                "<h5>על התפקיד</h5><p>" + esc(role.description) + "</p>" +
                "<h5>יום בחיי</h5><p>" + esc(role.dayInLife) + "</p>" +
              "</div>" +
            "</div>";

    html += '<div class="role-actions">' +
              '<a class="btn-apply" href="' + esc(role.applyUrl) + '" target="_blank" rel="noopener">' +
                "להגשת מועמדות</a>" +
            "</div>";

    card.innerHTML = html;

    var toggle = card.querySelector(".more-toggle");
    var body = card.querySelector(".more-body");
    toggle.addEventListener("click", function () {
      var isOpen = body.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.textContent = isOpen ? "הצג פחות ▴" : "קרא/י עוד ▾";
    });

    return card;
  }

  /**
   * עובדות המפתח. כאן נאכף כלל הכנות: אם salary הוא null — מוצג בדיוק
   * CONFIG.SALARY_UNKNOWN, ואף פעם לא טווח מחושב או משוער.
   */
  function buildFacts(role) {
    var html = '<dl class="facts">';

    if (role.requirements && role.requirements.length) {
      html += '<div class="fact"><dt>דרישות ותנאי-סף</dt><dd><ul>' +
        role.requirements.map(function (req) { return "<li>" + esc(req) + "</li>"; }).join("") +
        "</ul></dd></div>";
    }

    html += '<div class="fact"><dt>משך הכשרה</dt><dd' +
            (role.training ? ">" + esc(role.training) : ' class="is-unknown">' + esc(CONFIG.SALARY_UNKNOWN)) +
            "</dd></div>";

    html += '<div class="fact"><dt>שכר</dt><dd' +
            (role.salary ? ">" + esc(role.salary) : ' class="is-unknown">' + esc(CONFIG.SALARY_UNKNOWN)) +
            "</dd></div>";

    html += '<div class="fact"><dt>מסלול התקדמות</dt><dd' +
            (role.advancement ? ">" + esc(role.advancement) : ' class="is-unknown">' + esc(CONFIG.SALARY_UNKNOWN)) +
            "</dd></div>";

    return html + "</dl>";
  }

  // ── קטלוג ───────────────────────────────────────────────────────────────

  function renderCatalogFilters() {
    var host = $("catalogFilters");
    host.innerHTML = "";

    // רק קטגוריות שבאמת מיוצגות ב-KB, בסדר התצוגה שהוגדר ב-roles.js.
    var present = CATEGORIES.filter(function (cat) {
      return ROLES.some(function (r) { return r.category === cat; });
    });

    [{ id: "all", label: "הכל" }].concat(present.map(function (c) { return { id: c, label: c }; }))
      .forEach(function (item) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip" + (state.catalogFilter === item.id ? " is-active" : "");
        chip.textContent = item.label;
        chip.setAttribute("aria-pressed", state.catalogFilter === item.id ? "true" : "false");
        chip.addEventListener("click", function () {
          state.catalogFilter = item.id;
          renderCatalog();
        });
        host.appendChild(chip);
      });
  }

  function renderCatalog() {
    renderCatalogFilters();

    var list = $("catalogList");
    list.innerHTML = "";

    var shown = ROLES.filter(function (role) {
      return state.catalogFilter === "all" || role.category === state.catalogFilter;
    });

    shown.forEach(function (role) { list.appendChild(buildRoleCard(role, {})); });

    $("catalogCount").textContent =
      state.catalogFilter === "all"
        ? "כל " + ROLES.length + " התפקידים במאגר."
        : "מוצגים " + shown.length + " מתוך " + ROLES.length + " תפקידים.";
  }

  function openCatalog() {
    state.returnScreen = document.querySelector(".screen.is-active").id.replace("screen-", "");
    renderCatalog();
    showScreen("catalog");
  }

  // ── איפוס ───────────────────────────────────────────────────────────────

  function restart() {
    state.index = 0;
    state.answers = {};
    state.results = null;
    $("progressFill").style.width = "0%";
    showScreen("welcome");
  }

  // ── שכבת הסבר AI (רשות, כבויה כברירת מחדל) ──────────────────────────────

  /**
   * מנסח מחדש את בלוק ההסבר בלבד. הדירוג, האחוזים והעובדות כבר מוצגים ולא
   * משתנים. אם ה-proxy לא זמין — לא קורה כלום והנימוקים המתבניתיים נשארים.
   */
  function enhanceWithAI(results) {
    var payload = {
      answers: results.top3.map(function (entry) {
        return {
          roleId: entry.id,
          roleName: entry.role.name,
          matchPct: entry.matchPct,
          reasons: entry.reasons.map(function (r) { return r.text; }),
          facts: {
            oneLiner: entry.role.oneLiner,
            requirements: entry.role.requirements,
            training: entry.role.training,
            salary: entry.role.salary
          }
        };
      })
    };

    fetch(CONFIG.AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error("proxy " + res.status)); })
      .then(function (data) {
        if (!data || !data.explanations) return;
        results.top3.forEach(function (entry, i) {
          var text = data.explanations[entry.id];
          if (!text) return;
          var card = $("topRoles").children[i];
          var why = card && card.querySelector(".why");
          if (!why) return;
          var p = document.createElement("p");
          p.style.cssText = "margin:9px 0 0;font-size:13.5px;color:#475569;line-height:1.6;";
          p.textContent = text;
          why.appendChild(p);
        });
      })
      .catch(function () {
        // נפילה בחן: הנימוקים הדטרמיניסטיים כבר על המסך.
        if (CONFIG.DEBUG) console.warn("שכבת ההסבר של ה-AI אינה זמינה — ממשיכים במצב דטרמיניסטי.");
      });
  }

  // ── חיווט ───────────────────────────────────────────────────────────────

  function init() {
    $("welcomeDisclaimer").textContent = CONFIG.DISCLAIMER;
    $("resultsDisclaimer").textContent = CONFIG.DISCLAIMER;

    $("btnStart").addEventListener("click", function () {
      state.index = 0;
      renderQuestion();
      showScreen("quiz");
    });

    $("btnNext").addEventListener("click", goNext);
    $("btnBack").addEventListener("click", goBack);

    $("btnRestart").addEventListener("click", restart);
    $("btnRestartTop").addEventListener("click", restart);

    $("btnCatalogTop").addEventListener("click", openCatalog);
    $("btnCatalogFromResults").addEventListener("click", openCatalog);
    $("btnCatalogBack").addEventListener("click", function () { showScreen(state.returnScreen); });

    // ניווט מקלדת בשאלון: חיצים בין אפשרויות, Enter לאישור.
    document.addEventListener("keydown", function (e) {
      if (!$("screen-quiz").classList.contains("is-active")) return;

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") return; // RTL — נשאר לדפדפן
      if (e.key === "Enter" && !$("btnNext").disabled && document.activeElement === document.body) {
        goNext();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
