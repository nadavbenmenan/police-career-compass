/* ---------------------------------------------------------------------------
   scoring.js — מנוע הניקוד הדטרמיניסטי.

   כל הפונקציות כאן טהורות: הן מקבלות תשובות ומחזירות תוצאה, ואינן נוגעות ב-DOM.
   זו הסיבה שאפשר להריץ אותן בבדיקות (test/run_checks.js) בלי דפדפן.

   הזרימה: answers → profile → earned/maxScore → gates → אחוזים → top3 + blocked.
   אין כאן שום מקור לעובדות על תפקידים; העובדות כולן ב-data/roles.js.
   --------------------------------------------------------------------------- */

// ── עזרים ──────────────────────────────────────────────────────────────────

function getRole(roleId) {
  return ROLES.find(r => r.id === roleId) || null;
}

function getQuestion(questionId) {
  return QUESTIONS.find(q => q.id === questionId) || null;
}

/** מאתר את אובייקט האופציה שנבחרה בשאלה מסוימת. מחזיר null אם לא נענתה. */
function getSelectedOption(question, answers) {
  const optionId = answers[question.id];
  if (optionId == null) return null;
  return question.options.find(o => o.id === optionId) || null;
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

// ── 5.1 בניית פרופיל ───────────────────────────────────────────────────────

/**
 * ממזג את שדות ה-profile של כל האופציות שנבחרו לאובייקט פרופיל אחד.
 * שאלה אחת = מקור אחד לכל שדה, ולכן אין התנגשות אמיתית בין ערכים מספריים.
 * החריג היחיד הוא hasDegree, שיכול להגיע משתי שאלות (סטטוס ותחום תואר) —
 * שם מספיק ש-אחת מהן סימנה true.
 */
function buildProfile(answers) {
  const profile = {};

  QUESTIONS.forEach(question => {
    const option = getSelectedOption(question, answers);
    if (!option || !option.profile) return;

    Object.keys(option.profile).forEach(key => {
      const value = option.profile[key];
      // hasDegree הוא OR על פני כל התשובות: "אין לי תואר" לא מבטל "בוגר תואר".
      if (key === "hasDegree") {
        profile.hasDegree = profile.hasDegree === true || value === true;
      } else {
        profile[key] = value;
      }
    });
  });

  // ברירות מחדל למי שלא ענה על שאלה מסוימת (§5.1).
  if (profile.resilience   == null) profile.resilience   = 2;
  if (profile.arabic       == null) profile.arabic       = 0;
  if (profile.rifleman     == null) profile.rifleman     = 2;
  if (profile.techAffinity == null) profile.techAffinity = 1;
  if (profile.hasDegree    == null) profile.hasDegree    = false;

  // combat נגזר מרמת הרובאי, לא נשאל ישירות.
  profile.combat = profile.rifleman >= 3;
  profile.combatCommand = profile.combatCommand === true;

  return profile;
}

// ── 5.2 ניקוד גולמי ────────────────────────────────────────────────────────

/** סוכם לכל תפקיד את הנקודות שהתשובות שנבחרו תרמו לו בפועל. */
function computeEarned(answers) {
  const earned = {};
  ROLES.forEach(role => { earned[role.id] = 0; });

  QUESTIONS.forEach(question => {
    const option = getSelectedOption(question, answers);
    if (!option || !option.scores) return;

    Object.keys(option.scores).forEach(roleId => {
      if (earned[roleId] == null) return; // roleId לא מוכר — נתפס בבדיקות השפיות
      earned[roleId] += option.scores[roleId];
    });
  });

  return earned;
}

// ── 5.3 ניקוד מרבי לנרמול ──────────────────────────────────────────────────

/**
 * לכל תפקיד: סכום התרומה המקסימלית האפשרית מכל שאלה.
 * בשאלה שאף אופציה בה לא נוגעת בתפקיד — התרומה 0, ולכן היא לא מנפחת את המכנה.
 * זה מה שמאפשר לתפקיד נישה להגיע לאחוז גבוה בלי להתחרות על שאלות לא רלוונטיות,
 * ובדיוק בגלל זה נדרש גם סף MIN_EARNED_FOR_RANK (§5.5).
 */
function computeMaxScores() {
  const maxScore = {};
  ROLES.forEach(role => { maxScore[role.id] = 0; });

  QUESTIONS.forEach(question => {
    const bestInQuestion = {};

    question.options.forEach(option => {
      if (!option.scores) return;
      Object.keys(option.scores).forEach(roleId => {
        const pts = option.scores[roleId];
        if (pts <= 0) return;
        if (bestInQuestion[roleId] == null || pts > bestInQuestion[roleId]) {
          bestInQuestion[roleId] = pts;
        }
      });
    });

    Object.keys(bestInQuestion).forEach(roleId => {
      if (maxScore[roleId] == null) return;
      maxScore[roleId] += bestInQuestion[roleId];
    });
  });

  return maxScore;
}

// ── 5.4 בדיקת תנאי-סף ──────────────────────────────────────────────────────

/**
 * מחזיר { passed, unmet } — האם התפקיד עובר את כל שעריו, ואילו שערים נכשלו.
 * gates ריק ({}) = תמיד עובר. כך תפקידי הליבה לעולם לא נחסמים.
 */
function checkGates(role, profile) {
  const gates = role.gates || {};
  const unmet = [];

  if (gates.minRifleman != null && !(profile.rifleman >= gates.minRifleman)) {
    unmet.push({ gate: "minRifleman", need: gates.minRifleman, label: "דורש רובאי " + String(gates.minRifleman).padStart(2, "0") + " ומעלה" });
  }
  if (gates.requiresCombat === true && profile.combat !== true) {
    unmet.push({ gate: "requiresCombat", label: "דורש רקע לחימה" });
  }
  if (gates.requiresCombatCommand === true && profile.combatCommand !== true) {
    unmet.push({ gate: "requiresCombatCommand", label: "דורש רקע קרבי-פיקודי" });
  }
  if (gates.requiresDegree === true && profile.hasDegree !== true) {
    unmet.push({ gate: "requiresDegree", label: "דורש תואר אקדמי" });
  }
  if (gates.minResilience != null && !(profile.resilience >= gates.minResilience)) {
    unmet.push({ gate: "minResilience", need: gates.minResilience, label: "דורש רמת חוסן נפשי גבוהה יותר" });
  }
  if (gates.minArabic != null && !(profile.arabic >= gates.minArabic)) {
    unmet.push({ gate: "minArabic", need: gates.minArabic, label: "דורש שליטה בערבית" });
  }
  if (gates.requiresStudent === true && profile.status !== "student") {
    unmet.push({ gate: "requiresStudent", label: "מיועד לסטודנטים בלבד" });
  }
  if (gates.requiresExOfficer === true && profile.status !== "ex_officer") {
    unmet.push({ gate: "requiresExOfficer", label: "מיועד לבעלי רקע קצונה" });
  }

  return { passed: unmet.length === 0, unmet };
}

// ── 5.6 נימוקים ────────────────────────────────────────────────────────────

/**
 * "למה זה מתאים לך" — נגזר אך ורק מהתשובות שנבחרו בפועל.
 * מאתר את השאלות שבהן הבחירה תרמה הכי הרבה לתפקיד, וממיר אותן למשפט
 * בתבנית קבועה. אין כאן ניסוח חופשי ואין הוספת עובדות.
 */
function buildReasons(roleId, answers, limit) {
  const max = limit != null ? limit : CONFIG.MAX_REASONS;
  const contributions = [];

  QUESTIONS.forEach(question => {
    const option = getSelectedOption(question, answers);
    if (!option || !option.scores) return;
    const pts = option.scores[roleId];
    if (!pts || pts <= 0) return;

    contributions.push({
      questionId: question.id,
      questionText: question.text,
      optionLabel: option.label,
      points: pts,
      text: 'בחרת: "' + option.label + '"'
    });
  });

  contributions.sort((a, b) => b.points - a.points);
  return contributions.slice(0, max);
}

// ── 5.5 חישוב מלא, דירוג והשלמה ────────────────────────────────────────────

/**
 * הסף שתפקיד צריך לעבור כדי להיכלל בדירוג.
 *
 * הסף (MIN_EARNED_FOR_RANK) קיים כדי שתפקיד נישה, שרק שאלה או שתיים תורמות לו,
 * לא "יקפוץ" ל-100% על סמך מעט מאוד מידע. אבל סף קבוע יוצר תקלה: תפקיד שהניקוד
 * המרבי שלו נמוך מהסף אינו יכול לעבור אותו לעולם — כלומר הוא לא ניתן להמלצה בשום
 * שילוב תשובות. במטריצה הנוכחית זה קורה לשני תפקידים שהניקוד המרבי שלהם 3:
 * "מסלולי קצונה" ו-"מסלול אולפן ערבית".
 *
 * במקרה של הקצונה זה סותר במפורש את הדרישה שהמסלול ייפתח לפי סטטוס — קצין לשעבר
 * היה מסמן "קצין/ה לשעבר", עובר את השער, ובכל זאת לא רואה את המסלול שנועד לו.
 *
 * לכן הסף נחתך לפי מה שהתפקיד מסוגל לצבור בפועל. תפקיד כזה ייכלל רק אם המשתמש
 * צבר את מלוא הניקוד האפשרי עבורו — כלומר סימן בדיוק את התשובות שמובילות אליו,
 * ובנוסף עבר את תנאי-הסף. זו דרישה מחמירה יותר, לא מקילה.
 */
function rankThreshold(maxScoreForRole) {
  return Math.min(CONFIG.MIN_EARNED_FOR_RANK, maxScoreForRole);
}

/**
 * הפונקציה הראשית. מקבלת answers בצורת { questionId: optionId } ומחזירה:
 *   profile   — הפרופיל שנבנה מהתשובות
 *   top3      — התפקידים המובילים (תמיד לפחות 3, ראה "תמיד ממליץ")
 *   blocked   — תפקידים שנחסמו בשער אך היו מקבלים אחוז גבוה (בלוק השקיפות)
 *   all       — כל התפקידים עם הניקוד שלהם, לצורכי דיבוג/קטלוג
 */
function computeResults(answers) {
  const profile = buildProfile(answers);
  const earned = computeEarned(answers);
  const maxScore = computeMaxScores();

  const all = ROLES.map(role => {
    const gateCheck = checkGates(role, profile);
    const roleEarned = earned[role.id] || 0;
    const roleMax = Math.max(maxScore[role.id] || 0, 1);
    const matchPct = clamp(Math.round((roleEarned / roleMax) * 100), 0, 100);

    return {
      role,
      id: role.id,
      earned: roleEarned,
      maxScore: maxScore[role.id] || 0,
      matchPct,
      passedGates: gateCheck.passed,
      unmetGates: gateCheck.unmet
    };
  });

  // מיון אחיד: אחוז יורד → ניקוד גולמי יורד → priority עולה (נמוך = עדיף).
  const byRank = (a, b) =>
    (b.matchPct - a.matchPct) ||
    (b.earned - a.earned) ||
    (a.role.priority - b.role.priority);

  const candidates = all
    .filter(entry => entry.passedGates && entry.earned >= rankThreshold(entry.maxScore))
    .sort(byRank);

  // "תמיד ממליץ": אם הסינון השאיר פחות מ-3, משלימים מתפקידי הליבה חסרי-השער.
  // מציגים להם את האחוז שחושב להם בפועל, גם אם נמוך — בלי לנפח אותו.
  const top = candidates.slice(0, CONFIG.TOP_N);
  if (top.length < CONFIG.TOP_N) {
    const chosen = new Set(top.map(e => e.id));
    CONFIG.FALLBACK_ROLE_IDS.forEach(roleId => {
      if (top.length >= CONFIG.TOP_N || chosen.has(roleId)) return;
      const entry = all.find(e => e.id === roleId);
      if (!entry || !entry.passedGates) return;
      top.push(entry);
      chosen.add(roleId);
    });
  }

  // בלוק השקיפות: מה נחסם, ולמה. הסיבה נלקחת מדרישות ה-KB — לא מנוסחת מחדש.
  const blocked = all
    .filter(entry => !entry.passedGates && entry.matchPct >= CONFIG.BLOCKED_MIN_PCT)
    .sort(byRank)
    .map(entry => ({
      role: entry.role,
      id: entry.id,
      matchPct: entry.matchPct,
      reason: (entry.role.requirements && entry.role.requirements[0]) ||
              entry.unmetGates.map(g => g.label).join(", "),
      unmetGates: entry.unmetGates
    }));

  const top3 = top.map(entry => Object.assign({}, entry, {
    reasons: buildReasons(entry.id, answers)
  }));

  return { profile, top3, blocked, all };
}

// ── 5.7 בדיקות שפיות ───────────────────────────────────────────────────────

/**
 * בדיקות שמאמתות שהמטריצה וה-KB לא יצאו מסנכרון, ושההתנהגות המובטחת נשמרת.
 * רצות רק כש-CONFIG.DEBUG פעיל, ומחזירות רשימת תוצאות כדי שגם הבדיקות
 * מחוץ לדפדפן (test/run_checks.js) יוכלו להשתמש באותו קוד בדיוק.
 */
function runSanityChecks() {
  const results = [];
  const check = (name, passed, detail) => results.push({ name, passed, detail: detail || "" });

  // 1. כל roleId שמופיע במטריצת הניקוד קיים ב-ROLES.
  const knownIds = new Set(ROLES.map(r => r.id));
  const unknownIds = [];
  QUESTIONS.forEach(question => {
    question.options.forEach(option => {
      Object.keys(option.scores || {}).forEach(roleId => {
        if (!knownIds.has(roleId)) unknownIds.push(question.id + "/" + option.id + " → " + roleId);
      });
    });
  });
  check("כל roleId ב-scores קיים ב-ROLES", unknownIds.length === 0, unknownIds.join("; "));

  // 1b. כל שער שמוגדר על תפקיד הוא שער שהמנוע יודע לבדוק.
  const knownGates = new Set([
    "minRifleman", "requiresCombat", "requiresCombatCommand", "requiresDegree",
    "minResilience", "minArabic", "requiresStudent", "requiresExOfficer"
  ]);
  const unknownGates = [];
  ROLES.forEach(role => {
    Object.keys(role.gates || {}).forEach(gate => {
      if (!knownGates.has(gate)) unknownGates.push(role.id + " → " + gate);
    });
  });
  check("כל שער ב-gates מוכר למנוע", unknownGates.length === 0, unknownGates.join("; "));

  // 1c. תפקידי ברירת המחדל חייבים להיות חסרי שער, אחרת "תמיד ממליץ" יישבר.
  const gatedFallbacks = CONFIG.FALLBACK_ROLE_IDS.filter(roleId => {
    const role = getRole(roleId);
    return !role || Object.keys(role.gates || {}).length > 0;
  });
  check("תפקידי ברירת המחדל ללא שער", gatedFallbacks.length === 0, gatedFallbacks.join("; "));

  // 2. פרופיל "ריק" — התשובות הנמוכות/המסויגות ביותר — עדיין מחזיר 3 המלצות.
  const lowAnswers = {
    status: "civilian", rifleman: "r0", degree_field: "none", environment: "mix",
    fitness: "low", shifts: "day", public: "no", curiosity: "low", resilience: "low",
    youth: "no", arabic: "none", tech_affinity: "low", patience: "low",
    teamwork: "solo", risk: "low", age: "45_plus", commitment: "flex"
  };
  const lowResult = computeResults(lowAnswers);
  check("פרופיל ריק מחזיר 3 המלצות", lowResult.top3.length === 3,
        "התקבלו " + lowResult.top3.length);

  // 2b. גם שאלון שלא נענה כלל (אין תשובות בכלל) מחזיר 3 המלצות.
  const emptyResult = computeResults({});
  check("שאלון ללא תשובות מחזיר 3 המלצות", emptyResult.top3.length === 3,
        "התקבלו " + emptyResult.top3.length);

  // 3. פרופיל לוחם עילית מחזיר את היחידות המיוחדות בטופ.
  const eliteAnswers = {
    status: "civilian", rifleman: "r7", degree_field: "none", environment: "field",
    fitness: "very_high", shifts: "nights", public: "no", curiosity: "low",
    resilience: "high", youth: "no", arabic: "none", tech_affinity: "low",
    patience: "high", teamwork: "team", risk: "high", age: "18_24", commitment: "long"
  };
  const eliteResult = computeResults(eliteAnswers);
  const eliteIds = eliteResult.top3.map(e => e.id);
  const eliteHits = ["spu_yasam", "gideonim", "yamam"].filter(id => eliteIds.includes(id));
  check("פרופיל לוחם עילית מחזיר יס\"מ/גדעונים/ימ\"מ בטופ", eliteHits.length >= 2,
        "התקבל: " + eliteIds.join(", "));

  // 4. השערים חוסמים בפועל — פרופיל בלי רקע קרבי לא מקבל יחידות מיוחדות.
  const noCombatIds = lowResult.top3.map(e => e.id);
  const leakedElite = ["spu_yasam", "gideonim", "yamam", "magav_guard"].filter(id => noCombatIds.includes(id));
  check("פרופיל ללא רקע קרבי לא מקבל יחידות מיוחדות", leakedElite.length === 0,
        leakedElite.join(", "));

  // 5. סטודנט מקבל את מסלול הסטודנטים; לא-סטודנט לא מקבל אותו.
  const studentAnswers = Object.assign({}, lowAnswers, { status: "student", commitment: "studies", age: "18_24" });
  const studentResult = computeResults(studentAnswers);
  check("סטודנט מקבל את מסלול הסטודנטים",
        studentResult.top3.some(e => e.id === "student"),
        studentResult.top3.map(e => e.id).join(", "));
  check("לא-סטודנט לא מקבל את מסלול הסטודנטים",
        !lowResult.top3.some(e => e.id === "student"));

  // 6. ערבית: שליטה מלאה פותחת את מפיק השמע, "ללא" חוסמת אותו.
  const arabicAnswers = Object.assign({}, lowAnswers, { arabic: "native", environment: "office" });
  const arabicResult = computeResults(arabicAnswers);
  check("ערבית ברמה גבוהה פותחת את מפיק השמע",
        arabicResult.all.find(e => e.id === "sigint_audio").passedGates === true);
  check("ללא ערבית — מפיק שמע חסום",
        lowResult.all.find(e => e.id === "sigint_audio").passedGates === false);

  // 7. תואר: מז"פ מעבדה נפתח רק עם תואר.
  const degreeAnswers = Object.assign({}, lowAnswers, { status: "graduate", degree_field: "life_sci" });
  const degreeResult = computeResults(degreeAnswers);
  check("תואר פותח את מז\"פ מעבדה",
        degreeResult.all.find(e => e.id === "forensics_lab").passedGates === true);
  check("ללא תואר — מז\"פ מעבדה חסום",
        lowResult.all.find(e => e.id === "forensics_lab").passedGates === false);

  // 8. אף אחוז לא חורג מהטווח, ולכל תפקיד יש maxScore חיובי (אחרת הנרמול חסר משמעות).
  const badPct = lowResult.all.filter(e => e.matchPct < 0 || e.matchPct > 100).map(e => e.id);
  check("כל האחוזים בטווח 0–100", badPct.length === 0, badPct.join(", "));
  const zeroMax = computeMaxScores();
  const unreachable = ROLES.filter(r => (zeroMax[r.id] || 0) === 0).map(r => r.id);
  check("לכל תפקיד יש ניקוד מרבי חיובי", unreachable.length === 0, unreachable.join(", "));

  // 9. אף תפקיד אינו "בלתי ניתן להמלצה": חייב להתקיים שילוב תשובות שמדרג אותו.
  //    זו הבדיקה שתופסת תפקיד שהניקוד המרבי שלו נמוך מסף הדירוג (ראה rankThreshold).
  const unrankable = ROLES.filter(r => (zeroMax[r.id] || 0) < rankThreshold(zeroMax[r.id] || 0)).map(r => r.id);
  check("כל תפקיד ניתן להמלצה בשילוב תשובות כלשהו", unrankable.length === 0, unrankable.join(", "));

  // 10. קצין לשעבר אכן מקבל את מסלול הקצונה — הדרישה המפורשת של "שערים לפי סטטוס".
  const officerAnswers = Object.assign({}, lowAnswers, { status: "ex_officer" });
  const officerResult = computeResults(officerAnswers);
  check("קצין לשעבר מקבל את מסלול הקצונה",
        officerResult.top3.some(e => e.id === "officer_track"),
        officerResult.top3.map(e => e.id).join(", "));
  check("לא-קצין לא מקבל את מסלול הקצונה",
        !lowResult.top3.some(e => e.id === "officer_track"));

  return results;
}

// מריץ אוטומטית בדפדפן כשמצב הדיבוג פעיל.
if (typeof window !== "undefined" && typeof CONFIG !== "undefined" && CONFIG.DEBUG) {
  const checks = runSanityChecks();
  const failed = checks.filter(c => !c.passed);
  checks.forEach(c => console[c.passed ? "log" : "error"](
    (c.passed ? "✓" : "✗") + " " + c.name + (c.detail ? " — " + c.detail : "")
  ));
  console.log(failed.length === 0
    ? "בדיקות השפיות עברו: " + checks.length + "/" + checks.length
    : "בדיקות שנכשלו: " + failed.length);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    buildProfile, computeEarned, computeMaxScores, checkGates,
    buildReasons, computeResults, runSanityChecks, getRole, getQuestion
  };
}
