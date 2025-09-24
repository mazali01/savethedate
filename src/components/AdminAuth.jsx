import React, { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const AdminAuth = ({ onAuthenticated }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Simple hash function for security (SHA-256 equivalent using Web Crypto API)
    const hashPassword = async (password) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Pre-computed hash of the password (SHA-256)
    const ADMIN_PASSWORD_HASH = 'b4f659816b66337502bf7bfcd44d334f100f383abc9133bef9e8105e97b9fc93';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Hash the entered password
            const inputPasswordHash = await hashPassword(password);

            // Compare with stored hash
            if (inputPasswordHash === ADMIN_PASSWORD_HASH) {
                // Store authentication in sessionStorage
                sessionStorage.setItem('adminAuthenticated', 'true');
                onAuthenticated(true);
            } else {
                setError('סיסמה שגויה');
            }
        } catch (error) {
            setError('שגיאה במערכת');
        }

        setIsLoading(false);
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            bgcolor="#f5f5f5"
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    maxWidth: 400,
                    width: '100%',
                    textAlign: 'center'
                }}
            >
                <Box mb={3}>
                    <LockOutlinedIcon sx={{ fontSize: 40, color: '#2e7d32', mb: 2 }} />
                    <Typography variant="h4" component="h1" gutterBottom>
                        כניסת מנהל
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        הזן את הסיסמה לכניסה לפאנל הניהול
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        type="password"
                        label="סיסמה"
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        required
                        disabled={isLoading}
                        dir="rtl"
                    />

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            mt: 3,
                            mb: 2,
                            bgcolor: '#2e7d32',
                            '&:hover': {
                                bgcolor: '#1b5e20'
                            }
                        }}
                        disabled={isLoading || !password}
                    >
                        {isLoading ? 'מתחבר...' : 'כניסה'}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default AdminAuth;
