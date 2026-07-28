/* ---------------------------------------------------------------------------
   data/questions.js — השאלון ומטריצת הניקוד.

   17 שאלות בחירה יחידה. לכל אופציה:
     label   — הטקסט שמוצג למשתמש (משמש גם לנימוקים ב-§5.6, מילה במילה).
     scores  — תרומת נקודות לתפקידים (roleId → points).
     profile — דגלים לבניית פרופיל המשתמש עבור בדיקת תנאי-הסף (§5.4).

   מפתח דירוג רובאי לפרופיל: none/פטור→0, 02→2, 03-04→4, 05-06→6, 07-08+פיקוד→8.
   כל roleId כאן חייב להתקיים ב-ROLES — נבדק בבדיקות השפיות (§5.7).
   --------------------------------------------------------------------------- */

const QUESTIONS = [
  {
    id: "status", text: "מה המצב שלך כרגע?",
    options: [
      { id: "student",    label: "סטודנט/ית פעיל/ה (או מתחיל/ה תוך שנה)", profile: { status: "student" },   scores: { student: 3, dispatcher: 1, patrol: 1, sigint_audio: 1 } },
      { id: "graduate",   label: "בוגר/ת תואר אקדמי",                      profile: { status: "graduate", hasDegree: true }, scores: { investigator: 2, forensics_lab: 1, forensics_scene: 1, traffic_accident: 1, tech_cyber: 1 } },
      { id: "civilian",   label: "לא סטודנט, ללא תואר",                    profile: { status: "civilian" },  scores: { patrol: 1, detective: 1, dispatcher: 1, magav_guard: 1 } },
      { id: "ex_officer", label: "קצין/ה לשעבר בצה\"ל / גוף ביטחוני",      profile: { status: "ex_officer" },scores: { officer_track: 3, tech_cyber: 1 } }
    ]
  },
  {
    id: "rifleman", text: "מה רמת הרובאי / הרקע הקרבי שלך?",
    options: [
      { id: "r0", label: "ללא / פטור / רובאי 02",                          profile: { rifleman: 2 }, scores: { patrol: 1, detective: 1, investigator: 1, dispatcher: 1, traffic_patrol: 1 } },
      { id: "r3", label: "רובאי 03–04",                                    profile: { rifleman: 4, combat: true }, scores: { magav_guard: 2, patrol: 1, detective: 1 } },
      { id: "r5", label: "רובאי 05–06",                                    profile: { rifleman: 6, combat: true }, scores: { spu_yasam: 3, magav_guard: 2, patrol: 1 } },
      { id: "r7", label: "רובאי 07–08 + לוחם/מפקד ביחידה מובחרת",          profile: { rifleman: 8, combat: true, combatCommand: true }, scores: { yamam: 3, gideonim: 3, spu_yasam: 2, tech_cyber: 1, forensics_mobile: 1 } }
    ]
  },
  {
    id: "degree_field", text: "אם יש לך תואר — באיזה תחום?",
    options: [
      { id: "none",     label: "אין לי תואר",                              profile: { degreeField: "none" },     scores: { patrol: 1, detective: 1, dispatcher: 1, traffic_patrol: 1 } },
      { id: "life_sci", label: "מדעי החיים / כימיה / ביולוגיה",            profile: { degreeField: "life_sci", hasDegree: true }, scores: { forensics_lab: 3, forensics_scene: 2, forensics_mobile: 1 } },
      { id: "tech",     label: "מדעי המחשב / הנדסה / סייבר",               profile: { degreeField: "tech", hasDegree: true },     scores: { tech_cyber: 3, sigint_audio: 1, net_investigator_105: 1 } },
      { id: "law",      label: "משפטים",                                   profile: { degreeField: "law", hasDegree: true },      scores: { investigator: 2 } },
      { id: "other",    label: "תחום אחר",                                 profile: { degreeField: "other", hasDegree: true },    scores: { investigator: 1, dispatcher: 1 } }
    ]
  },
  {
    id: "environment", text: "איזו סביבת עבודה מדברת אליך?",
    options: [
      { id: "field",   label: "שטח דינמי",                                scores: { patrol: 2, detective: 2, spu_yasam: 2, traffic_patrol: 2, forensics_scene: 2, magav_guard: 2, gideonim: 1, eod: 1 } },
      { id: "office",  label: "משרד / מעבדה",                             scores: { forensics_lab: 3, investigator: 1, sigint_audio: 2, net_investigator_105: 1 } },
      { id: "mix",     label: "שילוב שטח ומשרד",                          scores: { investigator: 2, detective: 1, forensics_scene: 1, youth_investigator: 1, child_investigator: 1 } },
      { id: "tech",    label: "מוקד / סביבה טכנולוגית",                   scores: { dispatcher: 3, net_investigator_105: 2, tech_cyber: 2, sigint_audio: 2 } }
    ]
  },
  {
    id: "fitness", text: "מה רמת הכושר הגופני והנכונות למאמץ פיזי?",
    options: [
      { id: "very_high", label: "גבוהה מאוד — אוהב/ת אתגר פיזי",          scores: { spu_yasam: 3, gideonim: 3, yamam: 3, magav_guard: 2, forensics_mobile: 2, patrol: 1 } },
      { id: "good",      label: "טובה",                                   scores: { patrol: 2, detective: 2, traffic_patrol: 2, magav_guard: 1, eod: 1 } },
      { id: "medium",    label: "בינונית",                                scores: { investigator: 1, forensics_scene: 1, dispatcher: 1 } },
      { id: "low",       label: "מעדיף/ה תפקיד ללא דרישה גופנית",         scores: { dispatcher: 3, investigator: 2, forensics_lab: 2, sigint_audio: 2, net_investigator_105: 2 } }
    ]
  },
  {
    id: "shifts", text: "מה היחס שלך למשמרות ולעבודת לילה?",
    options: [
      { id: "nights",   label: "בכיף — כולל לילות",                        scores: { patrol: 2, detective: 2, spu_yasam: 2, dispatcher: 2, magav_guard: 2, traffic_patrol: 1, gideonim: 1 } },
      { id: "no_night", label: "מוכן/ה למשמרות, מעדיף/ה בלי לילה",        scores: { net_investigator_105: 2, dispatcher: 1, traffic_patrol: 1 } },
      { id: "day",      label: "מעדיף/ה בוקר/צהריים קבוע",                scores: { investigator: 2, forensics_lab: 2, sigint_audio: 2, net_investigator_105: 1, youth_investigator: 1, child_investigator: 1 } }
    ]
  },
  {
    id: "public", text: "עבודה מול הציבור — כן או לא?",
    options: [
      { id: "yes", label: "אוהב/ת מגע ישיר ושירות לאזרח",                 scores: { patrol: 3, traffic_patrol: 2, youth_investigator: 1, investigator: 1 } },
      { id: "no",  label: "מעדיף/ה עבודה מאחורי הקלעים",                  scores: { detective: 2, forensics_lab: 2, sigint_audio: 2, tech_cyber: 2, gideonim: 2, net_investigator_105: 1 } }
    ]
  },
  {
    id: "curiosity", text: "כמה מדברת אליך 'ירידה לפרטים' וחיבור פאזל מראיות?",
    options: [
      { id: "high", label: "מאוד — אוהב/ת לפצח ולחקור",                   scores: { investigator: 3, detective: 2, forensics_scene: 2, youth_investigator: 2, child_investigator: 2, traffic_accident: 2, net_investigator_105: 2, forensics_lab: 1, arabic_investigator: 1 } },
      { id: "mid",  label: "בינוני",                                     scores: { investigator: 1, detective: 1 } },
      { id: "low",  label: "פחות — מעדיף/ה פעולה ישירה",                 scores: { patrol: 1, spu_yasam: 1, magav_guard: 1, dispatcher: 1 } }
    ]
  },
  {
    id: "resilience", text: "מה רמת החוסן הנפשי שלך מול אירועים/מראות קשים?",
    options: [
      { id: "high", label: "גבוהה — מתמודד/ת היטב",   profile: { resilience: 3 }, scores: { forensics_scene: 3, forensics_mobile: 3, eod: 2, child_investigator: 2, traffic_accident: 2, youth_investigator: 1, detective: 1, spu_yasam: 1 } },
      { id: "mid",  label: "בינונית",                 profile: { resilience: 2 }, scores: { patrol: 1, investigator: 1, dispatcher: 1 } },
      { id: "low",  label: "מעדיף/ה חשיפה נמוכה",     profile: { resilience: 1 }, scores: { forensics_lab: 1, dispatcher: 1, sigint_audio: 1 } }
    ]
  },
  {
    id: "youth", text: "עבודה עם ילדים ובני נוער — בשבילך?",
    options: [
      { id: "love", label: "מאוד מדבר אליי",                              scores: { youth_investigator: 3, child_investigator: 3 } },
      { id: "open", label: "פתוח/ה לזה",                                  scores: { youth_investigator: 1, child_investigator: 1, investigator: 1 } },
      { id: "no",   label: "לא בשבילי",                                   scores: {} }
    ]
  },
  {
    id: "arabic", text: "מה רמת הערבית שלך?",
    options: [
      { id: "native", label: "שפת אם / שליטה מלאה", profile: { arabic: 3 }, scores: { sigint_audio: 3, net_investigator_105: 1, detective: 1 } },
      { id: "good",   label: "טובה",               profile: { arabic: 2 }, scores: { sigint_audio: 2, arabic_investigator: 1 } },
      { id: "basic",  label: "בסיסית",             profile: { arabic: 1 }, scores: { arabic_investigator: 2 } },
      { id: "none",   label: "ללא — אבל פתוח/ה ללמוד", profile: { arabic: 0 }, scores: { arabic_investigator: 1 } }
    ]
  },
  {
    id: "tech_affinity", text: "מה הזיקה שלך לעולם הטכנולוגי / סייבר?",
    options: [
      { id: "high", label: "גבוהה",   profile: { techAffinity: 3 }, scores: { tech_cyber: 3, sigint_audio: 2, net_investigator_105: 2, dispatcher: 1, forensics_lab: 1 } },
      { id: "mid",  label: "בינונית", profile: { techAffinity: 2 }, scores: { dispatcher: 1, traffic_accident: 1 } },
      { id: "low",  label: "נמוכה",   profile: { techAffinity: 1 }, scores: { patrol: 1, magav_guard: 1 } }
    ]
  },
  {
    id: "patience", text: "כמה סבלנות יש לך לתצפיות/מעקבים ממושכים ועבודה סמויה?",
    options: [
      { id: "high", label: "גבוהה",   scores: { detective: 3, gideonim: 2, sigint_audio: 1 } },
      { id: "mid",  label: "בינונית", scores: { detective: 1, investigator: 1 } },
      { id: "low",  label: "נמוכה",   scores: { patrol: 1, dispatcher: 1, traffic_patrol: 1 } }
    ]
  },
  {
    id: "teamwork", text: "עבודת צוות או עבודה עצמאית?",
    options: [
      { id: "team", label: "צוות אורגני הדוק",                            scores: { spu_yasam: 2, gideonim: 2, yamam: 2, magav_guard: 2, eod: 1, patrol: 1 } },
      { id: "mix",  label: "שילוב",                                       scores: { detective: 1, investigator: 1, patrol: 1, traffic_patrol: 1 } },
      { id: "solo", label: "עצמאי/ת",                                     scores: { investigator: 1, forensics_lab: 1, sigint_audio: 1, detective: 1 } }
    ]
  },
  {
    id: "risk", text: "מה הנכונות שלך לסיכון מבצעי גבוה (מעצרים, לוחמה בטרור)?",
    options: [
      { id: "high", label: "גבוהה",                                       scores: { spu_yasam: 3, yamam: 3, gideonim: 3, magav_guard: 2, eod: 2, detective: 1 } },
      { id: "mid",  label: "בינונית",                                     scores: { patrol: 1, traffic_patrol: 1, detective: 1 } },
      { id: "low",  label: "נמוכה — מעדיף/ה סיכון נמוך",                  scores: { dispatcher: 2, investigator: 2, forensics_lab: 2, sigint_audio: 2, net_investigator_105: 2, youth_investigator: 1, child_investigator: 1 } }
    ]
  },
  {
    id: "age", text: "מה טווח הגיל / שלב החיים שלך?",
    options: [
      { id: "18_24", label: "18–24", profile: { ageBand: "18_24" }, scores: { patrol: 1, spu_yasam: 1, gideonim: 1, student: 1, magav_guard: 1 } },
      { id: "25_34", label: "25–34", profile: { ageBand: "25_34" }, scores: { detective: 1, investigator: 1, forensics_scene: 1, tech_cyber: 1 } },
      { id: "35_44", label: "35–44", profile: { ageBand: "35_44" }, scores: { traffic_patrol: 2, investigator: 1, forensics_lab: 1, eod: 1 } },
      { id: "45_plus", label: "45+ / לקראת פרישה או גמלאי/ת", profile: { ageBand: "45_plus" }, scores: { traffic_patrol: 3, dispatcher: 1 } }
    ]
  },
  {
    id: "commitment", text: "מה תפיסת הקריירה שלך?",
    options: [
      { id: "long",    label: "קריירה ארוכת טווח בקבע",                   scores: { patrol: 1, detective: 1, investigator: 1, spu_yasam: 1, eod: 1, forensics_lab: 1 } },
      { id: "studies", label: "שילוב עם לימודים (סטודנט)",                scores: { student: 3, dispatcher: 1 } },
      { id: "flex",    label: "שלב ביניים / גמיש",                        scores: { traffic_patrol: 1, dispatcher: 1 } }
    ]
  }
];

if (typeof module !== "undefined" && module.exports) module.exports = { QUESTIONS };
