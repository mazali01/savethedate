// Israeli cities data for autocomplete
export const israeliCities = [
    'תל אביב-יפו',
    'ירושלים',
    'חיפה',
    'ראשון לציון',
    'אשדוד',
    'פתח תקווה',
    'נתניה',
    'באר שבע',
    'בני ברק',
    'חולון',
    'רמת גן',
    'בת ים',
    'אשקלון',
    'רחובות',
    'הרצליה',
    'כפר סבא',
    'חדרה',
    'מודיעין-מכבים-רעות',
    'נצרת',
    'לוד',
    'רעננה',
    'רמלה',
    'גבעתיים',
    'אור יהודה',
    'נהריה',
    'יקנעם',
    'אילת',
    'טבריה',
    'רמת השרון',
    'קריית גת',
    'עפולה',
    'קריית ים',
    'קריית ביאליק',
    'קריית מוצקין',
    'קריית אתא',
    'אקו',
    'דימונה',
    'קרית שמונה',
    'כרמיאל',
    'יבנה',
    'שדרות',
    'גדרה',
    'מעלות-תרשיחא',
    'עכו',
    'סח\'נין',
    'טמרה',
    'קריית מלאכי',
    'מגדל העמק',
    'שפרעם',
    'נוף הגליל',
    'בית שמש',
    'ערד',
    'מעלה אדומים',
    'כפר יונה',
    'נס ציונה',
    'זכרון יעקב',
    'עתלית',
    'אופקים',
    'סדרות',
    'אלעד',
    'בית שאן',
    'מגדיאל',
    'קדימה-צורן',
    'גבעת שמואל',
    'זיכרון יעקב',
    'פרדס חנה-כרכור',
    'אלפי מנשה',
    'יוקנעם עילית',
    'גדרה',
    'קרית עקרון',
    'מזכרת בתיה',
    'קדימה',
    'שוהם',
    'גני תקווה',
    'טירה',
    'אבן יהודה',
    'בני עיש',
    'כוכב יעקב',
    'בית דגן'
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
