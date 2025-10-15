import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardMedia,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Grid,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CloudUpload as UploadIcon,
    Restaurant as RestaurantIcon,
    Spa as EcoIcon,
    LocalFlorist as LocalFloristIcon
} from '@mui/icons-material';
import {
    getMenuItems,
    updateMenuItem,
    deleteMenuItem,
    uploadDishImage,
    validateImageFile,
    getCategoryName,
    initializeDefaultMenu
} from '../api';

const MenuManagement = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingDish, setEditingDish] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [notification, setNotification] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        id: '',
        nameHe: '',
        description: '',
        category: 'salads',
        order: 0,
        isVegan: false,
        isVegetarian: false,
        imageUrl: '',
        imageFileName: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        loadMenu();
    }, []);

    const loadMenu = async () => {
        try {
            setLoading(true);
            const items = await getMenuItems();
            setMenuItems(items);
        } catch (error) {
            showNotification('שגיאה בטעינת התפריט', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleOpenDialog = (dish = null) => {
        if (dish) {
            setEditingDish(dish);
            setFormData(dish);
            setImagePreview(dish.imageUrl || null);
        } else {
            setEditingDish(null);
            setFormData({
                id: '',
                nameHe: '',
                description: '',
                category: 'salads',
                order: menuItems.length,
                isVegan: false,
                isVegetarian: false,
                imageUrl: '',
                imageFileName: ''
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingDish(null);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            validateImageFile(file);
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } catch (error) {
            showNotification(error.message, 'error');
            event.target.value = '';
        }
    };

    const handleSave = async () => {
        if (!formData.nameHe.trim()) {
            showNotification('נא למלא שם מנה', 'error');
            return;
        }

        if (!formData.id.trim()) {
            showNotification('נא למלא מזהה מנה (באנגלית)', 'error');
            return;
        }

        setUploading(true);

        try {
            let imageData = {
                imageUrl: formData.imageUrl,
                imageFileName: formData.imageFileName
            };

            // Upload new image if selected
            if (imageFile) {
                const uploadResult = await uploadDishImage(imageFile, formData.id);
                imageData = {
                    imageUrl: uploadResult.url,
                    imageFileName: uploadResult.filename
                };
            }

            const dishData = {
                ...formData,
                ...imageData
            };

            await updateMenuItem(formData.id, dishData);
            await loadMenu();
            handleCloseDialog();
            showNotification(editingDish ? 'המנה עודכנה בהצלחה' : 'המנה נוספה בהצלחה');
        } catch (error) {
            console.error('Error saving dish:', error);
            showNotification('שגיאה בשמירת המנה', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (dishId) => {
        if (!window.confirm('האם למחוק את המנה?')) return;

        try {
            await deleteMenuItem(dishId);
            await loadMenu();
            showNotification('המנה נמחקה בהצלחה');
        } catch (error) {
            showNotification('שגיאה במחיקת המנה', 'error');
        }
    };

    const handleInitializeMenu = async () => {
        if (!window.confirm('האם לאתחל את התפריט עם מנות ברירת מחדל? זה לא ימחק מנות קיימות.')) return;

        try {
            setLoading(true);
            await initializeDefaultMenu();
            await loadMenu();
            showNotification('התפריט אותחל בהצלחה');
        } catch (error) {
            showNotification('שגיאה באתחול התפריט', 'error');
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

    const groupedMenu = groupByCategory(menuItems);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Notification */}
            {notification && (
                <Alert severity={notification.type} sx={{ mb: 2 }}>
                    {notification.message}
                </Alert>
            )}

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">ניהול תפריט</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleInitializeMenu}
                        startIcon={<RestaurantIcon />}
                    >
                        אתחל תפריט
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleOpenDialog()}
                        startIcon={<AddIcon />}
                    >
                        הוסף מנה
                    </Button>
                </Box>
            </Box>

            {/* Menu Items by Category */}
            {Object.keys(groupedMenu).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        אין מנות בתפריט. לחץ על "הוסף מנה" או "אתחל תפריט" להתחיל
                    </Typography>
                </Box>
            ) : (
                Object.entries(groupedMenu).map(([category, items]) => (
                    <Box key={category} sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32' }}>
                            {getCategoryName(category)}
                        </Typography>
                        <Grid container spacing={2}>
                            {items.map((dish) => (
                                <Grid item xs={12} sm={6} md={4} key={dish.id}>
                                    <Card sx={{ height: '100%' }}>
                                        {dish.imageUrl ? (
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                image={dish.imageUrl}
                                                alt={dish.nameHe}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    height: 140,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: '#f5f5f5'
                                                }}
                                            >
                                                <RestaurantIcon sx={{ fontSize: 60, color: '#ccc' }} />
                                            </Box>
                                        )}
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                {dish.nameHe}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {dish.description?.substring(0, 80)}...
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                                                {dish.isVegan && (
                                                    <Chip icon={<EcoIcon />} label="טבעוני" size="small" color="success" />
                                                )}
                                                {dish.isVegetarian && !dish.isVegan && (
                                                    <Chip icon={<LocalFloristIcon />} label="צמחוני" size="small" color="success" />
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(dish)}
                                                    color="primary"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(dish.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                ))
            )}

            {/* Edit/Add Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingDish ? 'עריכת מנה' : 'הוספת מנה חדשה'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {/* Image Upload */}
                        <Box>
                            {imagePreview && (
                                <Box sx={{ mb: 2, textAlign: 'center' }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                                    />
                                </Box>
                            )}
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<UploadIcon />}
                                fullWidth
                            >
                                {imagePreview ? 'החלף תמונה' : 'העלה תמונה'}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </Button>
                        </Box>

                        {/* Dish ID */}
                        <TextField
                            label="מזהה מנה (באנגלית, ללא רווחים)"
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value.replace(/\s/g, '-').toLowerCase() })}
                            disabled={!!editingDish}
                            fullWidth
                        />

                        {/* Dish Name */}
                        <TextField
                            label="שם המנה"
                            value={formData.nameHe}
                            onChange={(e) => setFormData({ ...formData, nameHe: e.target.value })}
                            fullWidth
                        />

                        {/* Description */}
                        <TextField
                            label="תיאור המנה"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={3}
                            fullWidth
                        />

                        {/* Category */}
                        <FormControl fullWidth>
                            <InputLabel>קטגוריה</InputLabel>
                            <Select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                label="קטגוריה"
                            >
                                <MenuItem value="salads">סלטים</MenuItem>
                                <MenuItem value="sharing">מנות לשיתוף</MenuItem>
                                <MenuItem value="mains">עיקריות</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Order */}
                        <TextField
                            label="סדר הצגה"
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            fullWidth
                        />

                        {/* Diet Options */}
                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isVegan}
                                        onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })}
                                    />
                                }
                                label="טבעוני"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isVegetarian}
                                        onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                                    />
                                }
                                label="צמחוני"
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={uploading}>
                        ביטול
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={uploading}
                        startIcon={uploading ? <CircularProgress size={20} /> : null}
                    >
                        {uploading ? 'שומר...' : 'שמור'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MenuManagement;
