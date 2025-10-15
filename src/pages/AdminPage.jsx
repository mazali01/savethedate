import React, { useState, useEffect } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Tabs,
    Tab
} from '@mui/material';
import {
    ExitToApp as LogoutIcon,
    AdminPanelSettings as AdminIcon,
    People as PeopleIcon,
    Restaurant as RestaurantIcon
} from '@mui/icons-material';
import AdminAuth from '../components/AdminAuth';
import UnifiedUserManagement from '../components/UnifiedUserManagement';
import MenuManagement from '../components/MenuManagement';

const AdminPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentTab, setCurrentTab] = useState(0);

    useEffect(() => {
        // Check if user is already authenticated
        const authenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
        setIsAuthenticated(authenticated);
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('adminAuthenticated');
        setIsAuthenticated(false);
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    if (!isAuthenticated) {
        return <AdminAuth onAuthenticated={setIsAuthenticated} />;
    }

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: 'rgba(255, 255, 255, 0.95)', display: 'flex', flexDirection: 'column', direction: 'ltr' }}>
            <AppBar position="sticky" sx={{ bgcolor: '#2e7d32' }}>
                <Toolbar>
                    <AdminIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        פאנל ניהול - חתונת מזל וערן
                    </Typography>
                    <Button
                        color="inherit"
                        onClick={handleLogout}
                        startIcon={<LogoutIcon />}
                    >
                        התנתק
                    </Button>
                </Toolbar>

                {/* Tabs */}
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    sx={{
                        bgcolor: '#1b5e20',
                        '& .MuiTab-root': {
                            color: 'rgba(255,255,255,0.7)',
                            '&.Mui-selected': {
                                color: 'white'
                            }
                        }
                    }}
                >
                    <Tab icon={<PeopleIcon />} label="ניהול משתמשים" />
                    <Tab icon={<RestaurantIcon />} label="ניהול תפריט" />
                </Tabs>
            </AppBar>

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ mt: 3, mb: 3, flexGrow: 1, overflow: 'auto' }}>
                {currentTab === 0 && <UnifiedUserManagement />}
                {currentTab === 1 && <MenuManagement />}
            </Container>
        </Box>
    );
};

export default AdminPage;
