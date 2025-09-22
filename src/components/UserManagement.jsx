import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    IconButton,
    Alert,
    Chip,
    Fab
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import {
    createInvitedUser,
    getInvitedUsers,
    updateInvitedUser,
    deleteInvitedUser
} from '../services/invitedUsersService';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        peopleCount: 1
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const fetchedUsers = await getInvitedUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            setError('שגיאה בטעינת הנתונים');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (user = null) => {
        setEditingUser(user);
        setFormData(user ? {
            name: user.name,
            phoneNumber: user.phoneNumber,
            peopleCount: user.peopleCount
        } : {
            name: '',
            phoneNumber: '',
            peopleCount: 1
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
        setFormData({ name: '', phoneNumber: '', peopleCount: 1 });
    };

    const handleSubmit = async () => {
        try {
            if (editingUser) {
                await updateInvitedUser(editingUser.id, formData);
                setSuccess('המשתמש עודכן בהצלחה');
            } else {
                await createInvitedUser(formData);
                setSuccess('המשתמש נוסף בהצלחה');
            }

            handleCloseDialog();
            fetchUsers();
        } catch (error) {
            setError('שגיאה בשמירת הנתונים');
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
            try {
                await deleteInvitedUser(userId);
                setSuccess('המשתמש נמחק בהצלחה');
                fetchUsers();
            } catch (error) {
                setError('שגיאה במחיקת המשתמש');
            }
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: field === 'peopleCount' ? parseInt(value) || 1 : value
        }));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <Typography>טוען...</Typography>
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    ניהול מוזמנים
                </Typography>
                <Chip
                    icon={<PersonIcon />}
                    label={`${users.length} מוזמנים`}
                    color="primary"
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>שם</TableCell>
                            <TableCell>טלפון</TableCell>
                            <TableCell align="center">מספר אנשים</TableCell>
                            <TableCell align="center">פעולות</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.phoneNumber}</TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={user.peopleCount}
                                        size="small"
                                        color={user.peopleCount > 1 ? "secondary" : "default"}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        onClick={() => handleOpenDialog(user)}
                                        color="primary"
                                        size="small"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(user.id)}
                                        color="error"
                                        size="small"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        אין מוזמנים עדיין
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add User FAB */}
            <Fab
                color="primary"
                aria-label="add"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    bgcolor: '#2e7d32',
                    '&:hover': {
                        bgcolor: '#1b5e20'
                    }
                }}
                onClick={() => handleOpenDialog()}
            >
                <AddIcon />
            </Fab>

            {/* Add/Edit User Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingUser ? 'עריכת מוזמן' : 'הוספת מוזמן חדש'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="שם מלא"
                        variant="outlined"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        margin="normal"
                        required
                        dir="rtl"
                    />
                    <TextField
                        fullWidth
                        label="מספר טלפון"
                        variant="outlined"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        margin="normal"
                        required
                        dir="rtl"
                    />
                    <TextField
                        fullWidth
                        label="מספר אנשים"
                        type="number"
                        variant="outlined"
                        value={formData.peopleCount}
                        onChange={(e) => handleInputChange('peopleCount', e.target.value)}
                        margin="normal"
                        required
                        inputProps={{ min: 1, max: 10 }}
                        helperText="מספר האנשים שיגיעו (כולל המוזמן עצמו)"
                        InputProps={{ readOnly: true }}
                        disabled
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>ביטול</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.name || !formData.phoneNumber}
                        sx={{
                            bgcolor: '#2e7d32',
                            '&:hover': {
                                bgcolor: '#1b5e20'
                            }
                        }}
                    >
                        {editingUser ? 'עדכן' : 'הוסף'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;
