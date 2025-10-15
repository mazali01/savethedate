import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

// Upload dish image to Firebase Storage
export const uploadDishImage = async (file, dishId) => {
    try {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${dishId}_${uuidv4()}.${fileExtension}`;
        const storageRef = ref(storage, `menu/${fileName}`);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return {
            url: downloadURL,
            filename: fileName
        };
    } catch (error) {
        console.error('Error uploading dish image:', error);
        throw error;
    }
};

// Delete dish image from Firebase Storage
export const deleteDishImage = async (fileName) => {
    try {
        const storageRef = ref(storage, `menu/${fileName}`);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error deleting dish image:', error);
        throw error;
    }
};

// Validate image file
export const validateImageFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
        throw new Error('קובץ לא נתמך. אנא בחרו תמונה בפורמט JPG, PNG או WEBP');
    }

    if (file.size > maxSize) {
        throw new Error('התמונה גדולה מדי. גודל מקסימלי: 5MB');
    }

    return true;
};

// Get all menu items
export const getMenuItems = async () => {
    try {
        const menuSnapshot = await getDocs(collection(db, 'menu'));
        const menuItems = [];

        menuSnapshot.forEach((doc) => {
            menuItems.push({ id: doc.id, ...doc.data() });
        });

        // Sort by category and order
        return menuItems.sort((a, b) => {
            if (a.category !== b.category) {
                return getCategoryOrder(a.category) - getCategoryOrder(b.category);
            }
            return (a.order || 0) - (b.order || 0);
        });
    } catch (error) {
        console.error('Error getting menu items:', error);
        throw error;
    }
};

// Get single menu item
export const getMenuItem = async (dishId) => {
    try {
        const docRef = doc(db, 'menu', dishId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting menu item:', error);
        throw error;
    }
};

// Update or create menu item
export const updateMenuItem = async (dishId, dishData) => {
    try {
        const docRef = doc(db, 'menu', dishId);
        await setDoc(docRef, {
            ...dishData,
            updatedAt: new Date()
        }, { merge: true });

        return { id: dishId, ...dishData };
    } catch (error) {
        console.error('Error updating menu item:', error);
        throw error;
    }
};

// Delete menu item
export const deleteMenuItem = async (dishId) => {
    try {
        // Get the dish data first to delete the image
        const dish = await getMenuItem(dishId);

        if (dish && dish.imageFileName) {
            try {
                await deleteDishImage(dish.imageFileName);
            } catch (imageError) {
                console.warn('Error deleting image:', imageError);
            }
        }

        await deleteDoc(doc(db, 'menu', dishId));
        return true;
    } catch (error) {
        console.error('Error deleting menu item:', error);
        throw error;
    }
};

// Helper function to get category order
const getCategoryOrder = (category) => {
    const order = {
        'salads': 1,
        'sharing': 2,
        'mains': 3
    };
    return order[category] || 999;
};

// Get category display name in Hebrew
export const getCategoryName = (category) => {
    const names = {
        'salads': 'סלטים',
        'sharing': 'מנות לשיתוף',
        'mains': 'עיקריות'
    };
    return names[category] || category;
};

// Initialize default menu items (for first time setup)
export const initializeDefaultMenu = async () => {
    const defaultMenu = [
        // Salads
        {
            id: 'tomato-salad',
            nameHe: 'סלט עגבניות מהעוטף עם בצל',
            description: 'עגבניות שלא קטפו את עצמן! נבחרו ביד (בעדינות) מחממות השמש של העוטף, נפגשו עם בצל ססגוני ויחד החליטו להיות טעימים במיוחד',
            category: 'salads',
            order: 1,
            isVegan: true,
            isVegetarian: true
        },
        {
            id: 'caesar-salad',
            nameHe: 'סלט קיסר חקלאים',
            description: 'קיסר שירד מהכס וטיפס על הטרקטור! חסות פריכה, פרמזן שלא מתנצל, וקרוטונים שמשמיעים "קראנץ\'" שנשמע עד הרחבה',
            category: 'salads',
            order: 2,
            isVegetarian: true
        },
        {
            id: 'beet-salad',
            nameHe: 'סלט סלקים ופירות',
            description: 'כשסלקים אדומים פוגשים פירות מתוקים - זה לא רק צבעוני, זה סלט שמבטיח לכם לפחות 3 תמונות אינסטגרם ושמח של ויטמינים',
            category: 'salads',
            order: 3,
            isVegan: true,
            isVegetarian: true
        },
        {
            id: 'polenta-croquettes',
            nameHe: 'קרוקט פולנטה עם מחית כמהין',
            description: 'פולנטה שהחליטה להיות קרוקט כי זה יותר סקסי! פריכים מבחוץ, רכים מבפנים, מונחים על מחית כמהין כאילו זו מיטת עננים איטלקית',
            category: 'salads',
            order: 4,
            isVegan: true,
            isVegetarian: true
        },
        {
            id: 'eggplant-carpaccio',
            nameHe: 'קרפצ׳יו חציל',
            description: 'חציל שהלך לספא והחליט להיות קרפצ׳יו! דק, אלגנטי, ומלא בטעמים שגורמים לכם לשכוח שאתם אוכלים ירק',
            category: 'salads',
            order: 5,
            isVegan: true,
            isVegetarian: true
        },
        // Sharing
        {
            id: 'picanha-roast',
            nameHe: 'רוסט פיקניה',
            description: 'בשר ברזילאי שבא לחתונה ישר מהבר-ביקיו! נשרף בדיוק כמו הלב שלכם כשאתם רואים את החתן והכלה - חיצוני פריך, פנים רך, והרבה אהבה',
            category: 'sharing',
            order: 1
        },
        {
            id: 'lubrak-gnocchi',
            nameHe: 'לברק וניוקי',
            description: 'זוג מושלם כמו החתן והכלה! לברק עסיסי מתחבק עם ניוקי רכים, ויחד הם יוצרים שילוב שגורם לכם לרצות לרקוד (אחרי שגמרתם לאכול כמובן)',
            category: 'sharing',
            order: 2
        },
        {
            id: 'chicken-nems',
            nameHe: 'נאמס עוף',
            description: 'רולים ויאטנמיים שהחליטו לבוא לחגוג! פריכים כמו ריקוד הסלסה, ומלאים בעוף עסיסי שמזכיר לכם שהאהבה עוברת דרך הבטן',
            category: 'sharing',
            order: 3
        },
        // Mains
        {
            id: 'polenta-tortellini',
            nameHe: 'טורטליני פולנטה - טבעוני',
            description: 'טורטליני שהלכו ל-yoga והחליטו להיות טבעוניים! מלאים בפולנטה קרמית, צפים ברוטב שגורם לכם להבין למה טבעונות זה לא עונש אלא בחירת חיים נכונה',
            category: 'mains',
            order: 1,
            isVegan: true,
            isVegetarian: true
        },
        {
            id: 'butcher-skewers',
            nameHe: 'שיפוד קצבים על פירה',
            description: 'הקצב שלח את השיפוד הכי טוב שלו לחתונה! בשר מושלם על שיפוד, מונח על פירה כמו על כרית מלכותית, מחכה שתפגשו אותו ותתאהבו',
            category: 'mains',
            order: 2
        },
        {
            id: 'chicken-cashew',
            nameHe: 'פרגית עם קשיו על פירה בטטה',
            description: 'פרגית שהלכה לטיול בתאילנד וחזרה עם קשיו! עסיסית, מתובלת, יושבת על פירה בטטה כתומה כמו שקיעה, וטעימה כמו החיים עצמם',
            category: 'mains',
            order: 3
        }
    ];

    try {
        for (const dish of defaultMenu) {
            await updateMenuItem(dish.id, dish);
        }
        console.log('Default menu initialized successfully');
        return defaultMenu;
    } catch (error) {
        console.error('Error initializing default menu:', error);
        throw error;
    }
};
