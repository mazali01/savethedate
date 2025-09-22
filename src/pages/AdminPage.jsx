import React, { useState, useEffect } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container
} from '@mui/material';
import {
    ExitToApp as LogoutIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import AdminAuth from '../components/AdminAuth';
import UserManagement from '../components/UserManagement';

const AdminPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if user is already authenticated
        const authenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
        setIsAuthenticated(authenticated);
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('adminAuthenticated');
        setIsAuthenticated(false);
    };

    if (!isAuthenticated) {
        return <AdminAuth onAuthenticated={setIsAuthenticated} />;
    }

    return (
        <Box>
            {/* Admin App Bar */}
            <AppBar position="sticky" sx={{ bgcolor: '#2e7d32' }}>
                <Toolbar>
                    <AdminIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        פאנל ניהול - חתונת מזל ואורי
                    </Typography>
                    <Button
                        color="inherit"
                        onClick={handleLogout}
                        startIcon={<LogoutIcon />}
                    >
                        התנתק
                    </Button>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
                <UserManagement />
            </Container>
        </Box>
    );
};

export default AdminPage;
