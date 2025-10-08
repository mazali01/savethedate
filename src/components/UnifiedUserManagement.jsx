import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
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
    Fab,
    Checkbox,
    LinearProgress,
    Tabs,
    Tab
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    Upload as UploadIcon,
    GetApp as GetAppIcon,
    Send as SendIcon,
    ContentCopy as CopyIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxBlankIcon,
    Sms as SmsIcon,
    Sync as SyncIcon,
    WhatsApp as WhatsAppIcon
} from '@mui/icons-material';

import { hasCompletedRsvp, getAllRsvpResponses } from '../services/rsvpService';
import {
    getInvitedUsers,
    createInvitedUser,
    updateInvitedUser,
    deleteInvitedUser
} from '../services/invitedUsersService';
import {
    generateInvitationLink,
    generateBulkInvitationLinks,
    sendSMS,
    sendBulkSMS,
    copyLinkToClipboard,
    isValidPhoneNumber,
    formatPhoneNumber,
    testSMSSending,
    checkSMSConfiguration,
    checkSMSBalance
} from '../services/smsService';

const UnifiedUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, percentage: 0 });

    // User management states
    const [openDialog, setOpenDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: ''
    });

    // SMS states
    const [testSmsDialog, setTestSmsDialog] = useState(false);
    const [bulkSendDialog, setBulkSendDialog] = useState(false);
    const [whatsappDialog, setWhatsappDialog] = useState(false);
    const [testPhoneNumber, setTestPhoneNumber] = useState('');

    // Filters and config
    const [currentTab, setCurrentTab] = useState(0);
    const [userRsvpStatus, setUserRsvpStatus] = useState(new Map());
    const [rsvpResponses, setRsvpResponses] = useState(new Map());
    const [smsConfig, setSmsConfig] = useState({ isConfigured: false });
    const [smsBalance, setSmsBalance] = useState({ balance: 0, loading: false });

    useEffect(() => {
        loadUsers();
        checkSmsConfiguration();
        loadSmsBalance();
    }, []);

    useEffect(() => {
        loadRsvpStatuses();
    }, [users]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const fetchedUsers = await getInvitedUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            setError('שגיאה בטעינת רשימת המוזמנים');
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRsvpStatuses = async () => {
        try {
            // Get all RSVP responses at once for better performance
            const allRsvpResponses = await getAllRsvpResponses();
            const rsvpMap = new Map();
            const statusMap = new Map();

            // Create maps for quick lookup
            allRsvpResponses.forEach(rsvp => {
                rsvpMap.set(rsvp.userId, rsvp);
                statusMap.set(rsvp.userId, true);
            });

            // Set status for users without RSVP
            users.forEach(user => {
                if (!statusMap.has(user.id)) {
                    statusMap.set(user.id, false);
                }
            });

            setRsvpResponses(rsvpMap);
            setUserRsvpStatus(statusMap);
        } catch (error) {
            console.error('Error loading RSVP statuses:', error);
            // Fallback to the old method if getAllRsvpResponses fails
            const statusMap = new Map();
            for (const user of users) {
                try {
                    const hasRsvp = await hasCompletedRsvp(user.id);
                    statusMap.set(user.id, hasRsvp);
                } catch (error) {
                    console.error(`Error checking RSVP for user ${user.id}:`, error);
                    statusMap.set(user.id, false);
                }
            }
            setUserRsvpStatus(statusMap);
        }
    };

    const checkSmsConfiguration = () => {
        const config = checkSMSConfiguration();
        setSmsConfig(config);
        if (!config.isConfigured) {
            setError(`SMS לא מוגדר: חסרים המשתנים ${config.missingVariables.join(', ')}`);
        }
    };

    const loadSmsBalance = async () => {
        try {
            setSmsBalance(prev => ({ ...prev, loading: true }));
            const balanceResult = await checkSMSBalance();

            if (balanceResult.success) {
                setSmsBalance({ balance: balanceResult.balance, loading: false });
            } else {
                console.error('Failed to load SMS balance:', balanceResult.error);
                setSmsBalance({ balance: 0, loading: false });
            }
        } catch (error) {
            console.error('Error loading SMS balance:', error);
            setSmsBalance({ balance: 0, loading: false });
        }
    };

    const handleSyncBalance = async () => {
        await loadSmsBalance();
    };

    // User Management Functions
    const handleSubmit = async () => {
        try {
            if (editingUser) {
                await updateInvitedUser(editingUser.id, formData);
                setSuccess('המוזמן עודכן בהצלחה');
            } else {
                await createInvitedUser(formData);
                setSuccess('המוזמן נוסף בהצלחה');
            }

            setOpenDialog(false);
            setEditingUser(null);
            setFormData({ name: '', phoneNumber: '' });
            loadUsers();
        } catch {
            setError('שגיאה בשמירת המוזמן');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            phoneNumber: user.phoneNumber
        });
        setOpenDialog(true);
    };

    const handleDelete = async (userId) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק את המוזמן?')) {
            try {
                await deleteInvitedUser(userId);
                setSuccess('המוזמן נמחק בהצלחה');
                loadUsers();
            } catch {
                setError('שגיאה במחיקת המוזמן');
            }
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        setUploadFile(file);
    };

    const processUpload = async () => {
        if (!uploadFile) return;

        try {
            const data = await uploadFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            let successCount = 0;
            let errorCount = 0;

            for (const row of jsonData) {
                try {
                    const userData = {
                        name: row.name || row['שם'] || '',
                        phoneNumber: (row.phoneNumber || row.phone || row['טלפון'] || '').toString()
                    };

                    if (userData.name && userData.phoneNumber) {
                        await createInvitedUser(userData);
                        successCount++;
                    }
                } catch (error) {
                    errorCount++;
                    console.error('Error creating user from upload:', error);
                }
            }

            setSuccess(`הועלו ${successCount} מוزמנים בהצלחה${errorCount > 0 ? `, ${errorCount} נכשלו` : ''}`);
            setOpenUploadDialog(false);
            setUploadFile(null);
            loadUsers();
        } catch {
            setError('שגיאה בעיבוד הקובץ');
        }
    };

    const exportUsers = () => {
        const exportData = users.map(user => {
            const rsvp = rsvpResponses.get(user.id);
            let attendanceStatus = 'לא אישר עדיין';
            let guestCount = 0;

            if (rsvp) {
                attendanceStatus = rsvp.isAttending ? 'מגיע' : 'לא מגיע';
                guestCount = rsvp.isAttending ? rsvp.guestCount : 0;
            }

            return {
                'שם': user.name,
                'טלפון': user.phoneNumber,
                'סטטוס': attendanceStatus,
                'מספר מגיעים': guestCount
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'מוזמנים');
        XLSX.writeFile(wb, 'invited-users.xlsx');
    };

    // SMS Functions
    const handleSelectUser = (userId) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleSelectAll = () => {
        const filteredUsers = getFilteredUsers();
        if (selectedUsers.size === filteredUsers.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
        }
    };

    const handleCopyLink = async (userId, userName) => {
        try {
            const { url } = generateInvitationLink(userId, userName);
            const success = await copyLinkToClipboard(url);
            if (success) {
                setSuccess(`קישור הועתק ללוח עבור ${userName}`);
            } else {
                setError('שגיאה בהעתקת הקישור');
            }
        } catch {
            setError('שגיאה בהעתקת הקישור');
        }
    };

    const handleSendSingle = async (user) => {
        if (!isValidPhoneNumber(user.phoneNumber)) {
            setError(`מספר טלפון לא תקין עבור ${user.name}`);
            return;
        }

        try {
            setSending(true);
            const { message } = generateInvitationLink(user.id, user.name);
            await sendSMS(user.phoneNumber, message);
            setSuccess(`הזמנה נשלחה בהצלחה ל-${user.name}`);

            // Refresh SMS balance after sending
            loadSmsBalance();
        } catch {
            setError(`שגיאה בשליחת הזמנה ל-${user.name}`);
        } finally {
            setSending(false);
        }
    };

    const handleBulkSend = async () => {
        const selectedUserList = users.filter(user => selectedUsers.has(user.id));
        const invalidPhones = selectedUserList.filter(user => !isValidPhoneNumber(user.phoneNumber));

        if (invalidPhones.length > 0) {
            setError(`מספרי טלפון לא תקינים עבור: ${invalidPhones.map(u => u.name).join(', ')}`);
            return;
        }

        try {
            setSending(true);
            setBulkSendDialog(false);

            const invitations = generateBulkInvitationLinks(selectedUserList);
            const results = await sendBulkSMS(invitations, (progress) => {
                setSendProgress(progress);
            });

            setSuccess(`נשלחו ${results.successful.length} הזמנות בהצלחה מתוך ${results.total}`);
            if (results.failed.length > 0) {
                setError(`${results.failed.length} שליחות נכשלו`);
            }

            // Refresh SMS balance after sending
            loadSmsBalance();

            setSelectedUsers(new Set());
        } catch {
            setError('שגיאה בשליחת ההזמנות');
        } finally {
            setSending(false);
            setSendProgress({ current: 0, total: 0, percentage: 0 });
        }
    };

    const handleTestSMS = async () => {
        if (!testPhoneNumber) {
            setError('אנא הזן מספר טלפון לבדיקה');
            return;
        }

        if (!isValidPhoneNumber(testPhoneNumber)) {
            setError('מספר טלפון לא תקין');
            return;
        }

        try {
            setSending(true);
            const result = await testSMSSending(testPhoneNumber);
            if (result.success) {
                setSuccess('הודעת בדיקה נשלחה בהצלחה! 🎉');
                setTestSmsDialog(false);
                setTestPhoneNumber('');

                // Refresh SMS balance after test
                loadSmsBalance();
            } else {
                setError(`שגיאה בשליחת הודעת בדיקה: ${result.error}`);
            }
        } catch {
            setError('שגיאה בשליחת הודעת בדיקה');
        } finally {
            setSending(false);
        }
    };

    const handleWhatsAppSend = async () => {
        try {
            setSending(true);
            setError('');

            const usersToSend = Array.from(selectedUsers)
                .map(id => users.find(u => u.id === id))
                .filter(u => u && u.phoneNumber);

            const response = await axios.post('http://localhost:3001/send', {
                users: usersToSend.map(u => ({
                    id: u.id,
                    name: u.name,
                    phoneNumber: u.phoneNumber
                }))
            });

            const { success, failed } = response.data;
            setSuccess(`נשלח בהצלחה: ${success.length}, נכשלו: ${failed.length}`);

            if (failed.length > 0) {
                console.log('Failed messages:', failed);
            }

            setWhatsappDialog(false);
        } catch (error) {
            setError('שגיאה בשליחת הודעות WhatsApp: ' + (error.response?.data?.error || error.message));
        } finally {
            setSending(false);
        }
    };

    const getFilteredUsers = () => {
        switch (currentTab) {
            case 1:
                return users.filter(u => !userRsvpStatus.get(u.id));
            case 2:
                return users.filter(u => {
                    const rsvp = rsvpResponses.get(u.id);
                    return rsvp && rsvp.isAttending;
                });
            case 3:
                return users.filter(u => {
                    const rsvp = rsvpResponses.get(u.id);
                    return rsvp && !rsvp.isAttending;
                });
            default:
                return users;
        }
    };

    const getAttendingCount = () => {
        return users.filter(u => {
            const rsvp = rsvpResponses.get(u.id);
            return rsvp && rsvp.isAttending;
        }).length;
    };

    const getNotAttendingCount = () => {
        return users.filter(u => {
            const rsvp = rsvpResponses.get(u.id);
            return rsvp && !rsvp.isAttending;
        }).length;
    };

    const getTotalGuestCount = () => {
        return users.reduce((total, user) => {
            const rsvp = rsvpResponses.get(user.id);
            if (rsvp && rsvp.isAttending) {
                return total + rsvp.guestCount;
            }
            return total;
        }, 0);
    };

    const filteredUsers = getFilteredUsers();

    if (loading) {
        return (
            <Box p={3} textAlign="center">
                <Typography>טוען רשימת מוזמנים...</Typography>
            </Box>
        );
    }

    return (
        <Box>
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

            {sending && sendProgress.total > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                        שולח הזמנות... ({sendProgress.current}/{sendProgress.total})
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={sendProgress.percentage}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>
            )}

            {/* SMS Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                    📱 SMS הזמנות
                </Typography>

                {/* SMS Configuration Display */}
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>
                        מצב SMS
                    </Typography>
                    {!smsConfig.isConfigured && (
                        <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
                            ❌ SMS לא מוגדר - חסרים: {smsConfig.missingVariables?.join(', ')}
                        </Typography>
                    )}
                    {smsConfig.isConfigured && (
                        <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                            ✅ SMS מוגדר - ספק: {smsConfig.provider} - שולח: {smsConfig.sender}
                        </Typography>
                    )}

                    {/* SMS Balance Display */}
                    <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            יתרת SMS: {smsBalance.loading ? 'טוען...' : smsBalance.balance}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<SyncIcon />}
                            onClick={handleSyncBalance}
                            disabled={smsBalance.loading || !smsConfig.isConfigured}
                            sx={{ minWidth: 80 }}
                        >
                            {smsBalance.loading ? 'טוען...' : 'רענן'}
                        </Button>
                    </Box>
                </Paper>

                {/* SMS Actions */}
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Button
                            variant="outlined"
                            startIcon={selectedUsers.size === filteredUsers.length ? <CheckBoxIcon /> : <CheckBoxBlankIcon />}
                            onClick={handleSelectAll}
                        >
                            {selectedUsers.size === filteredUsers.length ? 'בטל בחירה' : 'בחר הכל'}
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                            נבחרו: {selectedUsers.size} מתוך {filteredUsers.length}
                        </Typography>
                    </Box>

                    <Box display="flex" gap={2}>
                        <Button
                            variant="outlined"
                            startIcon={<SmsIcon />}
                            onClick={() => setTestSmsDialog(true)}
                            disabled={sending || !smsConfig.isConfigured}
                            sx={{
                                color: smsConfig.isConfigured ? '#2e7d32' : 'text.secondary',
                                borderColor: smsConfig.isConfigured ? '#2e7d32' : 'text.secondary'
                            }}
                        >
                            בדיקת SMS
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<WhatsAppIcon />}
                            onClick={() => setWhatsappDialog(true)}
                            disabled={selectedUsers.size === 0}
                            sx={{
                                color: '#25D366',
                                borderColor: '#25D366',
                                '&:hover': {
                                    borderColor: '#128C7E',
                                    bgcolor: 'rgba(37, 211, 102, 0.04)'
                                }
                            }}
                        >
                            WhatsApp ({selectedUsers.size})
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={() => setBulkSendDialog(true)}
                            disabled={selectedUsers.size === 0 || sending || !smsConfig.isConfigured}
                            color={smsBalance.balance > 0 && selectedUsers.size > smsBalance.balance ? 'warning' : 'primary'}
                            sx={{
                                bgcolor: smsBalance.balance > 0 && selectedUsers.size > smsBalance.balance ? 'warning.main' : '#2e7d32',
                                '&:hover': {
                                    bgcolor: smsBalance.balance > 0 && selectedUsers.size > smsBalance.balance ? 'warning.dark' : '#1b5e20'
                                }
                            }}
                        >
                            שלח הזמנות ({selectedUsers.size})
                            {smsBalance.balance > 0 && selectedUsers.size > smsBalance.balance && ' ⚠️'}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* User Management Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                    👥 ניהול מוזמנים
                </Typography>

                {/* Filter Tabs */}
                <Paper sx={{ mb: 2 }}>
                    <Tabs value={currentTab} onChange={(e, value) => setCurrentTab(value)}>
                        <Tab label={`כל המוזמנים (${users.length})`} />
                        <Tab
                            label={`ללא RSVP (${users.filter(u => !userRsvpStatus.get(u.id)).length})`}
                            sx={{ color: 'warning.main' }}
                        />
                        <Tab
                            label={`מגיעים (${getAttendingCount()})`}
                            sx={{ color: 'success.main' }}
                        />
                        <Tab
                            label={`לא מגיעים (${getNotAttendingCount()})`}
                            sx={{ color: 'error.main' }}
                        />
                    </Tabs>
                </Paper>

                {/* Summary Statistics */}
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>
                        סיכום
                    </Typography>
                    <Box display="flex" gap={4} flexWrap="wrap">
                        <Typography variant="body2">
                            סה"כ מוזמנים: <strong>{users.length}</strong>
                        </Typography>
                        <Typography variant="body2" color="success.main">
                            מגיעים: <strong>{getAttendingCount()}</strong>
                        </Typography>
                        <Typography variant="body2" color="error.main">
                            לא מגיעים: <strong>{getNotAttendingCount()}</strong>
                        </Typography>
                        <Typography variant="body2" color="warning.main">
                            ללא מענה: <strong>{users.filter(u => !userRsvpStatus.get(u.id)).length}</strong>
                        </Typography>
                        <Typography variant="body2" color="primary.main">
                            סה"כ אורחים מגיעים: <strong>{getTotalGuestCount()}</strong>
                        </Typography>
                    </Box>
                </Paper>

                {/* User Management Actions */}
                <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                        sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                    >
                        הוסף מוזמן
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => setOpenUploadDialog(true)}
                    >
                        העלה קובץ Excel
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<GetAppIcon />}
                        onClick={exportUsers}
                        disabled={users.length === 0}
                    >
                        ייצא לExcel
                    </Button>
                </Box>
            </Paper>

            {/* Users Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                                    indeterminate={selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell>שם</TableCell>
                            <TableCell>טלפון</TableCell>
                            <TableCell align="center">סטטוס נוכחות</TableCell>
                            <TableCell align="center">מספר מגיעים</TableCell>
                            <TableCell align="center">פעולות</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map((user) => {
                            const rsvp = rsvpResponses.get(user.id);
                            const hasRsvpResponse = userRsvpStatus.get(user.id);

                            let attendanceStatus = 'לא אישר עדיין';
                            let attendanceColor = 'warning';
                            let guestCount = 0;

                            if (rsvp) {
                                if (rsvp.isAttending) {
                                    attendanceStatus = 'מגיע';
                                    attendanceColor = 'success';
                                    guestCount = rsvp.guestCount;
                                } else {
                                    attendanceStatus = 'לא מגיע';
                                    attendanceColor = 'error';
                                    guestCount = 0;
                                }
                            }

                            return (
                                <TableRow key={user.id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedUsers.has(user.id)}
                                            onChange={() => handleSelectUser(user.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{formatPhoneNumber(user.phoneNumber)}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={attendanceStatus}
                                            color={attendanceColor}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {hasRsvpResponse ? (
                                            <Typography variant="body2" color={guestCount > 0 ? 'text.primary' : 'text.secondary'}>
                                                {guestCount}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                -
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            onClick={() => handleEdit(user)}
                                            size="small"
                                            title="ערוך"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleDelete(user.id)}
                                            size="small"
                                            title="מחק"
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleCopyLink(user.id, user.name)}
                                            size="small"
                                            title="העתק קישור"
                                        >
                                            <CopyIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleSendSingle(user)}
                                            size="small"
                                            disabled={sending || !isValidPhoneNumber(user.phoneNumber)}
                                            title="שלח הזמנה"
                                            color="primary"
                                        >
                                            <SmsIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        אין מוזמנים בקטגוריה זו
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit User Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingUser ? 'ערוך מוזמן' : 'הוסף מוזמן חדש'}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="שם המוזמן"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="מספר טלפון"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        margin="normal"
                        required
                        placeholder="050-1234567"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>ביטול</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.name || !formData.phoneNumber}
                        sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                    >
                        {editingUser ? 'עדכן' : 'הוסף'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Upload Dialog */}
            <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>העלה קובץ Excel</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                        הקובץ צריך לכלול עמודות: שם, טלפון
                    </Typography>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUploadDialog(false)}>ביטול</Button>
                    <Button
                        onClick={processUpload}
                        variant="contained"
                        disabled={!uploadFile}
                        sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                    >
                        העלה
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Send Confirmation Dialog */}
            <Dialog
                open={bulkSendDialog}
                onClose={() => setBulkSendDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>שליחת הזמנות בקבוצה</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        האם אתה בטוח שברצונך לשלוח הזמנות ל-{selectedUsers.size} מוזמנים?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        כל מוזמן יקבל הודעת SMS עם קישור אישי לאישור הגעה.
                    </Typography>
                    {smsBalance.balance > 0 && (
                        <Typography variant="body2" color={selectedUsers.size <= smsBalance.balance ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                            יתרת SMS נוכחית: {smsBalance.balance} | נדרש: {selectedUsers.size}
                            {selectedUsers.size > smsBalance.balance && ' (יתרה לא מספיקה!)'}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkSendDialog(false)}>ביטול</Button>
                    <Button
                        onClick={handleBulkSend}
                        variant="contained"
                        color="primary"
                        disabled={sending}
                    >
                        שלח הזמנות
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Test SMS Dialog */}
            <Dialog
                open={testSmsDialog}
                onClose={() => setTestSmsDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>בדיקת שליחת SMS</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom sx={{ mb: 2 }}>
                        שלח הודעת בדיקה לוודא שהגדרות SMS פועלות תקין
                    </Typography>
                    {smsConfig.isConfigured && (
                        <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                            ✅ SMS מוגדר - ספק: {smsConfig.provider} - שולח: {smsConfig.sender}
                        </Typography>
                    )}

                    {/* SMS Balance Display */}
                    <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            יתרת SMS: {smsBalance.loading ? 'טוען...' : smsBalance.balance}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<SyncIcon />}
                            onClick={handleSyncBalance}
                            disabled={smsBalance.loading || !smsConfig.isConfigured}
                            sx={{ minWidth: 80 }}
                        >
                            {smsBalance.loading ? 'טוען...' : 'רענן'}
                        </Button>
                    </Box>
                    <TextField
                        fullWidth
                        label="מספר טלפון לבדיקה"
                        placeholder="050-1234567"
                        value={testPhoneNumber}
                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 2 }}
                        helperText="הזן את המספר שלך לקבלת הודעת בדיקה"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTestSmsDialog(false)}>ביטול</Button>
                    <Button
                        onClick={handleTestSMS}
                        variant="contained"
                        startIcon={<SmsIcon />}
                        disabled={sending || !testPhoneNumber}
                        sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                    >
                        {sending ? 'שולח...' : 'שלח בדיקה'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* WhatsApp Send Dialog */}
            <Dialog
                open={whatsappDialog}
                onClose={() => setWhatsappDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WhatsAppIcon sx={{ color: '#25D366' }} />
                    שליחת הודעות WhatsApp
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        הודעות יישלחו ל-{selectedUsers.size} מוזמנים שנבחרו
                    </Alert>
                    <Typography variant="body2" gutterBottom>
                        כל מוזמן יקבל הודעה אישית עם קישור ייחודי לאישור הגעה.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        ⚠️ וודא ששרת WhatsApp פועל: <code>node scripts/whatsapp-server.js</code>
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWhatsappDialog(false)}>ביטול</Button>
                    <Button
                        onClick={handleWhatsAppSend}
                        variant="contained"
                        startIcon={<WhatsAppIcon />}
                        disabled={sending}
                        sx={{
                            bgcolor: '#25D366',
                            '&:hover': { bgcolor: '#128C7E' }
                        }}
                    >
                        {sending ? 'שולח...' : `שלח ל-${selectedUsers.size} מוזמנים`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UnifiedUserManagement;
