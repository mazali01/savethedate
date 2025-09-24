// Israeli cities data for autocomplete
export const israeliCities = [
    "אופקים",
    "אור עקיבא",
    "אור יהודה",
    "אילת",
    "אלעד",
    "אריאל",
    "אשדוד",
    "אשקלון",
    "באר שבע",
    "בית שאן",
    "בית שמש",
    "ביתר עילית",
    "בנימינה-גבעת עדה",
    "בת ים",
    "גבעת שמואל",
    "גבעתיים",
    "גדרה",
    "גן יבנה",
    "דימונה",
    "הוד השרון",
    "הרצליה",
    "זכרון יעקב",
    "חדרה",
    "חולון",
    "חיפה",
    "טבריה",
    "טירה",
    "טייבה",
    "טירת כרמל",
    "יבנה",
    "יהוד-מונוסון",
    "יקנעם עילית",
    "ירושלים",
    "כפר סבא",
    "כפר יונה",
    "כרמיאל",
    "לוד",
    "מגדל העמק",
    "מודיעין עילית",
    "מודיעין-מכבים-רעות",
    "מעלה אדומים",
    "מעלות-תרשיחא",
    "נהריה",
    "נס ציונה",
    "נצרת",
    "נצרת עילית (נוף הגליל)",
    "נשר",
    "נתיבות",
    "נתניה",
    "סח'נין",
    "עכו",
    "עפולה",
    "עראבה",
    "ערד",
    "פתח תקווה",
    "צפת",
    "קריית אונו",
    "קריית אתא",
    "קריית ביאליק",
    "קריית גת",
    "קריית ים",
    "קריית מוצקין",
    "קריית מלאכי",
    "קריית שמונה",
    "ראש העין",
    "ראשון לציון",
    "רהט",
    "רחובות",
    "רמלה",
    "רמת גן",
    "רמת השרון",
    "רעננה",
    "שדרות",
    "תל אביב-יפו",
    "טמרה",
    "באקה אל-גרביה",
    "דאלית אל-כרמל",
    "כפר קאסם",
    "מג'דל שמס",
    "עראמשה",
    "ג'דיידה-מכר",
    "ג'לג'וליה",
    "כפר מנדא",
    "כפר כנא",
    "כפר קרע",
    "עילוט",
    "אעבלין",
    "אום אל-פחם",
    "שפרעם",
    "חורפיש",
    "כסרא-סמיע",
    "ג'ש (גוש חלב)",
    "פקיעין",
    "מזרעה",
    "יאנוח-ג'ת"
];

/**
 * Filter cities based on search query
 * @param {string} query - Search query
 * @returns {string[]} Filtered cities array
 */
export const filterCities = (query) => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    return israeliCities.filter(city =>
        city.toLowerCase().includes(lowerQuery)
    ).slice(0, 10); // Limit to 10 suggestions
};

/**
 * Check if a city exists in the list
 * @param {string} city - City name to check
 * @returns {boolean} True if city exists
 */
export const isValidCity = (city) => {
    return israeliCities.includes(city);
};
