import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import {
    Restaurant as RestaurantIcon,
    Spa as EcoIcon,
    LocalFlorist as LocalFloristIcon
} from '@mui/icons-material';
import PageTemplate from '../components/PageTemplate';
import { getMenuItems } from '../api';

const MenuPage = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadMenu();
    }, []);

    const loadMenu = async () => {
        try {
            setLoading(true);
            const items = await getMenuItems();
            setMenuItems(items);
            setError(null);
        } catch (err) {
            console.error('Error loading menu:', err);
            setError('שגיאה בטעינת התפריט');
        } finally {
            setLoading(false);
        }
    };

    const groupByCategory = (items) => {
        return items.reduce((acc, item) => {
            const category = item.category || 'other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {});
    };

    const getCategoryTitle = (category) => {
        const titles = {
            'salads': 'סלטים 🥗',
            'sharing': 'מנות לשיתוף 🍽️',
            'mains': 'עיקריות 👨‍🍳'
        };
        return titles[category] || category;
    };

    const groupedMenu = groupByCategory(menuItems);
    const categoryOrder = ['salads', 'sharing', 'mains'];

    if (loading) {
        return (
            <PageTemplate title="תפריט האירוע 🍽️">
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                    <CircularProgress sx={{ color: '#2e7d32' }} />
                </Box>
            </PageTemplate>
        );
    }

    if (error) {
        return (
            <PageTemplate title="תפריט האירוע 🍽️">
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            </PageTemplate>
        );
    }

    if (menuItems.length === 0) {
        return (
            <PageTemplate title="תפריט האירוע 🍽️">
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 6,
                        color: '#555'
                    }}
                >
                    <RestaurantIcon sx={{ fontSize: 80, color: '#ddd', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        התפריט בהכנה...
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        השפים שלנו עובדים קשה כדי להכין לכם משהו מיוחד!
                    </Typography>
                </Box>
            </PageTemplate>
        );
    }

    return (
        <PageTemplate title="מה אוכלים? 😋">
            <Container maxWidth="lg" sx={{ py: 2 }}>
                {/* Header Section */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography
                        variant="h5"
                        sx={{
                            color: '#2e7d32',
                            fontWeight: 'bold',
                            mb: 2
                        }}
                    >
                        תפריט החתונה 🥘
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        ארוחה חגיגית ומפנקת במיוחד בשבילכם
                    </Typography>
                    <Divider sx={{ borderColor: '#2e7d32', borderWidth: 1, mx: 'auto', width: '50%' }} />
                </Box>

                {/* Menu Categories */}
                {categoryOrder.map((category) => {
                    const items = groupedMenu[category];
                    if (!items || items.length === 0) return null;

                    return (
                        <Box key={category} sx={{ mb: 5 }}>
                            {/* Category Title */}
                            <Typography
                                variant="h4"
                                sx={{
                                    color: '#2e7d32',
                                    fontWeight: 'bold',
                                    mb: 3,
                                    textAlign: 'center',
                                    fontSize: { xs: '1.8rem', md: '2.5rem' }
                                }}
                            >
                                {getCategoryTitle(category)}
                            </Typography>

                            {/* Dishes Grid */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: 'repeat(2, 1fr)',
                                        md: 'repeat(3, 1fr)'
                                    },
                                    gap: 3
                                }}
                            >
                                {items.map((dish) => (
                                    <Card
                                        key={dish.id}
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 3,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            transition: 'transform 0.3s, box-shadow 0.3s',
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: '0 8px 20px rgba(46,125,50,0.2)'
                                            }
                                        }}
                                    >
                                        {/* Dish Image */}
                                        {dish.imageUrl ? (
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={dish.imageUrl}
                                                alt={dish.nameHe}
                                                sx={{
                                                    objectFit: 'cover',
                                                    borderTopLeftRadius: 12,
                                                    borderTopRightRadius: 12
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    height: 200,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                                                    borderTopLeftRadius: 12,
                                                    borderTopRightRadius: 12
                                                }}
                                            >
                                                <RestaurantIcon sx={{ fontSize: 80, color: '#4caf50' }} />
                                            </Box>
                                        )}

                                        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                                            {/* Dish Name */}
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: '#2e7d32',
                                                    mb: 1.5,
                                                    fontSize: '1.3rem'
                                                }}
                                            >
                                                {dish.nameHe}
                                            </Typography>

                                            {/* Dish Description */}
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 2,
                                                    lineHeight: 1.6,
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                                {dish.description}
                                            </Typography>

                                            {/* Diet Tags */}
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {dish.isVegan && (
                                                    <Chip
                                                        icon={<EcoIcon />}
                                                        label="טבעוני"
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#4caf50',
                                                            color: 'white',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                )}
                                                {dish.isVegetarian && !dish.isVegan && (
                                                    <Chip
                                                        icon={<LocalFloristIcon />}
                                                        label="צמחוני"
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#8bc34a',
                                                            color: 'white',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    );
                })}

                {/* Footer Message */}
                <Box
                    sx={{
                        textAlign: 'center',
                        mt: 6,
                        p: 3,
                        backgroundColor: 'rgba(46,125,50,0.05)',
                        borderRadius: 3
                    }}
                >
                    <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>
                        בתאבון! 🎉
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        מחכים לחגוג איתכם ולהנות מהאוכל המעולה ביחד
                    </Typography>
                </Box>
            </Container>
        </PageTemplate>
    );
};

export default MenuPage;
