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
import './GlassyButton.css';
import './CompletedAttending.css';

const weddingEvent = {
    title: 'חתונת מזל וערן',
    description: 'בואו לחגוג איתנו את היום הכי שמח שלנו!',
    location: 'הבית - רעננה',
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
                            startIcon={<EditIcon sx={{ ml: 1 }} />}
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
                            startIcon={<CancelIcon sx={{ ml: 1 }} />}
                            onClick={onCancelAttendance}
                            disabled={isSubmitting}
                            sx={{ minWidth: 180, py: 1.5 }}
                        >
                            {isSubmitting ? 'מעדכן...' : 'בטל הגעה'}
                        </Button>
                    </Box>

                    {shouldShowWeddingSiteButton &&
                        <>
                            <Box className="wedding-button-container">
                                <div className="arrow-left"></div>
                                <Button
                                    variant="contained"
                                    dir='ltr'
                                    onClick={handleGoToWeddingMenu}
                                    className="glassy-button"
                                    sx={{ minWidth: 200, py: 2, boxShadow: 'none', background: 'none' }}
                                >
                                    לאתר החתונה
                                </Button>
                                <div className="arrow-right"></div>
                            </Box>

                            {/* Promo section */}
                            <Box
                                className="promo-section"
                                dir="rtl"
                                sx={{
                                    mt: 3,
                                    pt: 2,
                                    borderTop: '1px solid rgba(232, 180, 200, 0.3)',
                                    fontSize: '0.85rem',
                                    color: '#666',
                                    textAlign: 'center'
                                }}
                            >
                                <span style={{ marginLeft: '6px' }}>📸</span>
                                אלבום משותף
                                <span style={{ margin: '0 8px' }}>•</span>
                                <span style={{ marginLeft: '6px' }}>🚗</span>
                                שיתוף טרמפים
                                <span style={{ margin: '0 8px' }}>•</span>
                                ועוד...
                            </Box>
                        </>
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
