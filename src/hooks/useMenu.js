import { useState, useEffect } from 'react';
import { getMenuItems } from '../api';

export const useMenu = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadMenu = async () => {
        try {
            setLoading(true);
            setError(null);
            const items = await getMenuItems();
            setMenuItems(items);
        } catch (err) {
            console.error('Error loading menu:', err);
            setError(err.message || 'שגיאה בטעינת התפריט');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenu();
    }, []);

    return {
        menuItems,
        loading,
        error,
        refetch: loadMenu
    };
};
