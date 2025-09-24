import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Button,
    Paper,
    Alert,
    Fade,
} from '@mui/material';
import {
    Edit as EditIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import CalendarButtons from '../AddCalendar';

const weddingEvent = {
    title: 'חתונת מזל וערן',
    description: 'בואו לחגוג איתנו את היום הכי שמח שלנו!',
    location: 'גן אירועים הגליל, כפר ורדים',
    start: new Date('2025-10-16T19:00:00'),
    end: new Date('2025-10-17T02:00:00')
};

const CompletedAttending = ({
    guestCount,
    onUpdateGuestCount,
    onCancelAttendance,
    shouldShowWeddingSiteButton,
    isSubmitting
}) => {
    const navigate = useNavigate();
    const { userId } = useParams();

    const handleGoToWeddingMenu = () => {
        navigate(`/user/${userId}`);
    };
    return (
        <Box>
            <Fade in={true}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        width: '100%',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <Alert dir='ltr' severity="success" sx={{ mb: 3 }}>
                        אישרת הגעה עבור {guestCount} אורחים
                    </Alert>

                    {/* Action buttons */}
                    <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap" sx={{ mb: 3 }}>
                        <Button
                            variant="outlined"
                            dir='ltr'
                            startIcon={<EditIcon />}
                            onClick={onUpdateGuestCount}
                            disabled={isSubmitting}
                            sx={{ minWidth: 180, py: 1.5 }}
                        >
                            עדכן מספר אורחים
                        </Button>

                        <Button
                            variant="outlined"
                            color="error"
                            dir='ltr'
                            startIcon={<CancelIcon />}
                            onClick={onCancelAttendance}
                            disabled={isSubmitting}
                            sx={{ minWidth: 180, py: 1.5 }}
                        >
                            {isSubmitting ? 'מעדכן...' : 'בטל הגעה'}
                        </Button>
                    </Box>

                    {shouldShowWeddingSiteButton &&
                        <Button
                            variant="contained"
                            dir='ltr'
                            onClick={handleGoToWeddingMenu}
                            sx={{
                                minWidth: 200,
                                py: 2,
                                backgroundColor: '#2e7d32',
                                '&:hover': {
                                    backgroundColor: '#1b5e20',
                                },
                            }}
                        >
                            לאתר החתונה
                        </Button>
                    }
                </Paper>
            </Fade>
            <Box sx={{ mb: 4 }}>
                <CalendarButtons
                    event={weddingEvent}
                    style={{ margin: '0 auto' }}
                />
            </Box>
        </Box>
    );
};

export default CompletedAttending;
