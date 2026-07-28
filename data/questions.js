/* ---------------------------------------------------------------------------
   data/questions.js — השאלון ומטריצת הניקוד.

   לכל אופציה:
     label   — הטקסט שמוצג למשתמש (משמש גם לנימוקים, מילה במילה).
     scores  — תרומת נקודות לתפקידים (roleId → points).
     profile — דגלים לבניית פרופיל המשתמש עבור בדיקת תנאי-הסף.

   ── מבנה השאלה (עודכן בתיקון 1) ──
   multi:  true  — בחירה מרובה. מועמד יכול להשתייך לכמה קבוצות בו-זמנית
                   (למשל סטודנט שהוא גם קצין לשעבר).
   showIf: fn(profile) — שאלה מותנית. מוצגת רק אם הפונקציה מחזירה true,
                   ומחושבת מחדש אחרי כל תשובה. שאלה שלא הוצגה פשוט לא
                   תורמת ניקוד, וזה תקין: הנרמול מתחשב רק בשאלות שהוצגו.

   מפתח דירוג רובאי: ללא/פטור→0, 02→2, 03-04→4, 05-06→6, 07-08+פיקוד→8.
   כל roleId כאן חייב להתקיים ב-ROLES — נבדק בבדיקות השפיות.
   --------------------------------------------------------------------------- */

const QUESTIONS = [
  {
    id: "status", text: "מה המצב שלך כרגע?",
    hint: "אפשר לבחור יותר מאפשרות אחת — למשל סטודנט/ית שהוא גם קצין/ה לשעבר.",
    multi: true,
    options: [
      { id: "student",    label: "סטודנט/ית פעיל/ה (או מתחיל/ה תוך שנה)", profile: { isStudent: true },   scores: { student: 3, student_social_assistant: 2, dispatcher: 1, patrol: 1, sigint_audio: 1 } },
      { id: "graduate",   label: "בוגר/ת תואר אקדמי",                      profile: { isGraduate: true, hasDegree: true }, scores: { investigator: 2, forensics_lab: 1, forensics_scene: 1, traffic_accident: 1, tech_cyber: 1 } },
      { id: "civilian",   label: "לא סטודנט, ללא תואר",                    profile: { isCivilian: true },  scores: { patrol: 1, detective: 1, dispatcher: 1, magav_guard: 1 } },
      { id: "ex_officer", label: "קצין/ה לשעבר בצה\"ל / גוף ביטחוני",      profile: { isExOfficer: true }, scores: { officer_track: 3, tech_cyber: 1 } }
    ]
  },
  {
    // יתרת לימודים — תנאי לתקן סטודנט. מוצגת רק לסטודנטים (תיקון 1).
    id: "study_left", text: "כמה זמן נותר לך ללימודים?",
    showIf: function (profile) { return profile.isStudent === true; },
    options: [
      { id: "year_plus", label: "שנה ומעלה",   profile: { studyYear: true },  scores: { student: 2, student_social_assistant: 1 } },
      { id: "less_year", label: "פחות משנה",   profile: { studyYear: false }, scores: {} }
    ]
  },
  {
    // מוצגת מיד אחרי שאלת הסטטוס, ורק למי שיש לו תואר או שהוא סטודנט (תיקון 1).
    id: "degree_field", text: "באיזה תחום התואר / הלימודים שלך?",
    showIf: function (profile) { return profile.hasDegree === true || profile.isStudent === true; },
    options: [
      { id: "life_sci",      label: "מדעי החיים / כימיה / ביולוגיה",   profile: { degreeField: "life_sci" },      scores: { forensics_lab: 3, forensics_scene: 2, forensics_mobile: 1 } },
      { id: "tech",          label: "מדעי המחשב / הנדסה / סייבר",      profile: { degreeField: "tech" },          scores: { tech_cyber: 3, sigint_audio: 1, net_investigator_105: 1 } },
      { id: "law",           label: "משפטים",                          profile: { degreeField: "law" },           scores: { investigator: 2, detective: 1 } },
      { id: "criminology",   label: "קרימינולוגיה",                    profile: { degreeField: "criminology" },   scores: { investigator: 3, detective: 2, youth_investigator: 1 } },
      { id: "middle_east",   label: "לימודי המזרח התיכון / ערבית",     profile: { degreeField: "middle_east" },   scores: { arabic_investigator: 2, sigint_audio: 2, detective: 1 } },
      { id: "social_sci",    label: "מדעי החברה",                      profile: { degreeField: "social_sci" },    scores: { investigator: 2, youth_investigator: 1, admin_welfare: 2, admin_training: 2, student_social_assistant: 1 } },
      { id: "health_social", label: "בריאות / עבודה סוציאלית",         profile: { degreeField: "health_social" }, scores: { admin_welfare: 3, student_social_assistant: 3, youth_investigator: 1, child_investigator: 1 } },
      { id: "other",         label: "תחום אחר",                        profile: { degreeField: "other" },         scores: { investigator: 1, dispatcher: 1, admin_office: 1 } }
    ]
  },
  {
    // אזור מגורים — נאסף לצורך התמונה המלאה. השיבוץ בפועל נקבע במרכז הגיוס,
    // ולכן אין כאן ניקוד: אין במאגר נתוני פריסה שמצדיקים העדפה גאוגרפית.
    id: "region", text: "מה אזור המגורים שלך?",
    hint: "השיבוץ בפועל נקבע במרכז הגיוס. הנתון נאסף לצורך התמונה המלאה בלבד.",
    options: [
      { id: "north",     label: "צפון",                  profile: { region: "צפון" },              scores: {} },
      { id: "haifa",     label: "חיפה והקריות",          profile: { region: "חיפה והקריות" },      scores: {} },
      { id: "center",    label: "מרכז / שרון",           profile: { region: "מרכז / שרון" },       scores: {} },
      { id: "tel_aviv",  label: "תל אביב והמטרופולין",   profile: { region: "תל אביב והמטרופולין" }, scores: {} },
      { id: "jerusalem", label: "ירושלים והסביבה",       profile: { region: "ירושלים והסביבה" },   scores: {} },
      { id: "south",     label: "דרום",                  profile: { region: "דרום" },              scores: {} },
      { id: "yosh",      label: "יהודה ושומרון",         profile: { region: "יהודה ושומרון" },     scores: {} }
    ]
  },
  {
    id: "rifleman", text: "מה רמת הרובאי / הרקע הקרבי שלך?",
    options: [
      { id: "none", label: "ללא רובאי כלל / פטור על פי חוק",                profile: { rifleman: 0 }, scores: { dispatcher: 2, admin_office: 2, admin_welfare: 1, admin_logistics: 1, admin_training: 1 } },
      { id: "r02",  label: "רובאי 02",                                      profile: { rifleman: 2 }, scores: { patrol: 1, detective: 1, investigator: 1, dispatcher: 1, traffic_patrol: 1 } },
      { id: "r3",   label: "רובאי 03–04",                                   profile: { rifleman: 4 }, scores: { magav_guard: 2, patrol: 1, detective: 1 } },
      { id: "r5",   label: "רובאי 05–06",                                   profile: { rifleman: 6 }, scores: { spu_yasam: 3, magav_guard: 2, patrol: 1 } },
      { id: "r7",   label: "רובאי 07–08 + לוחם/מפקד ביחידה מובחרת",         profile: { rifleman: 8, combatCommand: true }, scores: { yamam: 3, gideonim: 3, spu_yasam: 2, tech_cyber: 1, forensics_mobile: 1 } }
    ]
  },
  {
    // מעבדה הופרדה ממשרד — אלה שתי סביבות עבודה שונות לגמרי (תיקון 1).
    id: "environment", text: "איזו סביבת עבודה מדברת אליך?",
    hint: "אפשר לבחור יותר מאפשרות אחת.",
    multi: true,
    options: [
      { id: "field",   label: "שטח דינמי",                    scores: { patrol: 2, detective: 2, spu_yasam: 2, traffic_patrol: 2, forensics_scene: 2, magav_guard: 2, gideonim: 1, eod: 1 } },
      { id: "office",  label: "משרד",                         scores: { investigator: 2, net_investigator_105: 1, admin_office: 3, admin_logistics: 3, admin_welfare: 2, admin_training: 2, sigint_audio: 1 } },
      { id: "lab",     label: "מעבדה",                        scores: { forensics_lab: 3, forensics_mobile: 2, traffic_accident: 1 } },
      { id: "control", label: "מוקד / סביבה טכנולוגית",       scores: { dispatcher: 3, net_investigator_105: 2, tech_cyber: 2, sigint_audio: 2 } }
    ]
  },
  {
    id: "fitness", text: "מה רמת הכושר הגופני והנכונות למאמץ פיזי?",
    options: [
      { id: "very_high", label: "גבוהה מאוד — אוהב/ת אתגר פיזי",          profile: { fitness: 3 }, scores: { spu_yasam: 3, gideonim: 3, yamam: 3, magav_guard: 2, forensics_mobile: 2, patrol: 1 } },
      { id: "good",      label: "טובה",                                   profile: { fitness: 2 }, scores: { patrol: 2, detective: 2, traffic_patrol: 2, magav_guard: 1, eod: 1 } },
      { id: "medium",    label: "בינונית",                                profile: { fitness: 1 }, scores: { investigator: 1, forensics_scene: 1, dispatcher: 1 } },
      { id: "low",       label: "מעדיף/ה תפקיד ללא דרישה גופנית",         profile: { fitness: 0 }, scores: { dispatcher: 3, investigator: 2, forensics_lab: 2, sigint_audio: 2, net_investigator_105: 2, admin_office: 3, admin_logistics: 2, admin_welfare: 2, admin_training: 2 } }
    ]
  },
  {
    id: "shifts", text: "מה היחס שלך למשמרות ולעבודת לילה?",
    options: [
      { id: "nights",   label: "בכיף — כולל לילות",                        scores: { patrol: 2, detective: 2, spu_yasam: 2, dispatcher: 2, magav_guard: 2, traffic_patrol: 1, gideonim: 1 } },
      { id: "no_night", label: "מוכן/ה למשמרות, מעדיף/ה בלי לילה",        scores: { net_investigator_105: 2, dispatcher: 1, traffic_patrol: 1 } },
      { id: "day",      label: "מעדיף/ה בוקר/צהריים קבוע",                scores: { investigator: 2, forensics_lab: 2, sigint_audio: 2, net_investigator_105: 1, youth_investigator: 1, child_investigator: 1, admin_office: 2, admin_logistics: 2, admin_welfare: 2, admin_training: 2 } }
    ]
  },
  {
    // שלוש אפשרויות במקום שתיים — "מול עובדים אחרים" הוא הקהל של המנהלה (תיקון 1).
    id: "public", text: "מול מי היית רוצה לעבוד?",
    options: [
      { id: "citizens", label: "מול אזרחים — מגע ישיר ושירות",            profile: { facing: "citizens" }, scores: { patrol: 3, traffic_patrol: 2, youth_investigator: 1, investigator: 1, dispatcher: 1 } },
      { id: "staff",    label: "מול עובדים אחרים בארגון",                 profile: { facing: "staff" },    scores: { admin_welfare: 3, admin_training: 3, admin_office: 3, admin_logistics: 3, student_social_assistant: 2 } },
      { id: "backstage",label: "מאחורי הקלעים",                           profile: { facing: "backstage" },scores: { detective: 2, forensics_lab: 2, sigint_audio: 2, tech_cyber: 2, gideonim: 2, net_investigator_105: 1, admin_logistics: 1 } }
    ]
  },
  {
    id: "curiosity", text: "כמה מדברת אליך 'ירידה לפרטים' וחיבור פאזל מראיות?",
    options: [
      { id: "high", label: "מאוד — אוהב/ת לפצח ולחקור",                   scores: { investigator: 3, detective: 2, forensics_scene: 2, youth_investigator: 2, child_investigator: 2, traffic_accident: 2, net_investigator_105: 2, forensics_lab: 1, arabic_investigator: 1 } },
      { id: "mid",  label: "בינוני",                                     scores: { investigator: 1, detective: 1 } },
      { id: "low",  label: "פחות — מעדיף/ה פעולה ישירה",                 scores: { patrol: 1, spu_yasam: 1, magav_guard: 1, dispatcher: 1, admin_logistics: 1 } }
    ]
  },
  {
    id: "resilience", text: "מה רמת החוסן הנפשי שלך מול אירועים/מראות קשים?",
    options: [
      { id: "high", label: "גבוהה — מתמודד/ת היטב",   profile: { resilience: 3 }, scores: { forensics_scene: 3, forensics_mobile: 3, eod: 2, child_investigator: 2, traffic_accident: 2, youth_investigator: 1, detective: 1, spu_yasam: 1 } },
      { id: "mid",  label: "בינונית",                 profile: { resilience: 2 }, scores: { patrol: 1, investigator: 1, dispatcher: 1 } },
      { id: "low",  label: "מעדיף/ה חשיפה נמוכה",     profile: { resilience: 1 }, scores: { dispatcher: 1, admin_office: 2, admin_logistics: 2, admin_welfare: 1, admin_training: 2 } }
    ]
  },
  {
    id: "youth", text: "עבודה עם ילדים ובני נוער — בשבילך?",
    options: [
      { id: "love", label: "מאוד מדבר אליי",                              scores: { youth_investigator: 3, child_investigator: 3, student_social_assistant: 1 } },
      { id: "open", label: "פתוח/ה לזה",                                  scores: { youth_investigator: 1, child_investigator: 1, investigator: 1 } },
      { id: "no",   label: "לא בשבילי",                                   scores: {} }
    ]
  },
  {
    id: "arabic", text: "מה רמת הערבית שלך?",
    options: [
      { id: "native",   label: "שפת אם / שליטה מלאה",        profile: { arabic: 3 }, scores: { sigint_audio: 3, net_investigator_105: 1, detective: 1 } },
      { id: "good",     label: "טובה",                       profile: { arabic: 2 }, scores: { sigint_audio: 2, arabic_investigator: 1 } },
      { id: "basic",    label: "בסיסית",                     profile: { arabic: 1 }, scores: { arabic_investigator: 2 } },
      { id: "none_open",label: "ללא — אבל פתוח/ה ללמוד",     profile: { arabic: 0 }, scores: { arabic_investigator: 1 } },
      // "לא מעוניין ללמוד" חוסם את מסלול האולפן — אין טעם להציע קורס ערבית מלא (תיקון 1).
      { id: "none_no",  label: "ללא — ולא מעוניין/ת ללמוד",  profile: { arabic: 0, arabicRefuses: true }, scores: {} }
    ]
  },
  {
    id: "tech_affinity", text: "מה הזיקה שלך לעולם הטכנולוגי / סייבר?",
    options: [
      { id: "high", label: "גבוהה",   profile: { techAffinity: 3 }, scores: { tech_cyber: 3, sigint_audio: 2, net_investigator_105: 2, dispatcher: 1, forensics_lab: 1 } },
      { id: "mid",  label: "בינונית", profile: { techAffinity: 2 }, scores: { dispatcher: 1, traffic_accident: 1, admin_office: 1 } },
      { id: "low",  label: "נמוכה",   profile: { techAffinity: 1 }, scores: { patrol: 1, magav_guard: 1, admin_logistics: 1 } }
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
      { id: "mix",  label: "שילוב",                                       scores: { detective: 1, investigator: 1, patrol: 1, traffic_patrol: 1, admin_training: 1, admin_welfare: 1 } },
      { id: "solo", label: "עצמאי/ת",                                     scores: { investigator: 1, forensics_lab: 1, sigint_audio: 1, detective: 1, admin_office: 1, admin_logistics: 1 } }
    ]
  },
  {
    id: "risk", text: "מה הנכונות שלך לסיכון מבצעי גבוה (מעצרים, לוחמה בטרור)?",
    options: [
      { id: "high", label: "גבוהה",                                       profile: { risk: 2 }, scores: { spu_yasam: 3, yamam: 3, gideonim: 3, magav_guard: 2, eod: 2, detective: 1 } },
      { id: "mid",  label: "בינונית",                                     profile: { risk: 1 }, scores: { patrol: 1, traffic_patrol: 1, detective: 1 } },
      { id: "low",  label: "נמוכה — מעדיף/ה סיכון נמוך",                  profile: { risk: 0 }, scores: { dispatcher: 2, investigator: 2, forensics_lab: 2, sigint_audio: 2, net_investigator_105: 2, youth_investigator: 1, child_investigator: 1, admin_office: 2, admin_logistics: 2, admin_welfare: 2, admin_training: 2 } }
    ]
  },
  {
    id: "age", text: "מה טווח הגיל / שלב החיים שלך?",
    options: [
      { id: "18_24", label: "18–24", profile: { ageBand: "18_24" }, scores: { patrol: 1, spu_yasam: 1, gideonim: 1, student: 1, magav_guard: 1 } },
      { id: "25_34", label: "25–34", profile: { ageBand: "25_34" }, scores: { detective: 1, investigator: 1, forensics_scene: 1, tech_cyber: 1 } },
      { id: "35_44", label: "35–44", profile: { ageBand: "35_44" }, scores: { traffic_patrol: 2, investigator: 1, forensics_lab: 1, eod: 1, admin_office: 1 } },
      { id: "45_plus", label: "45+ / לקראת פרישה או גמלאי/ת", profile: { ageBand: "45_plus" }, scores: { traffic_patrol: 3, dispatcher: 1, admin_logistics: 1, admin_office: 1 } }
    ]
  },
  {
    id: "commitment", text: "מה תפיסת הקריירה שלך?",
    options: [
      { id: "long",    label: "קריירה ארוכת טווח בקבע",                   scores: { patrol: 1, detective: 1, investigator: 1, spu_yasam: 1, eod: 1, forensics_lab: 1, admin_office: 1 } },
      { id: "studies", label: "שילוב עם לימודים (סטודנט)",                scores: { student: 3, student_social_assistant: 2, dispatcher: 1 } },
      { id: "flex",    label: "שלב ביניים / גמיש",                        scores: { traffic_patrol: 1, dispatcher: 1, admin_logistics: 1, admin_office: 1 } }
    ]
  }
];

if (typeof module !== "undefined" && module.exports) module.exports = { QUESTIONS };
