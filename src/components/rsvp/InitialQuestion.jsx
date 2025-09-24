import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Fade,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Favorite as HeartIcon
} from '@mui/icons-material';

const InitialQuestion = ({ onComing, onNotComing, isSubmitting }) => {
    return (
        <Fade in={true}>
            <Paper
                elevation={3}
                style={{
                    opacity: 0.8,
                    overflowY: 'auto',
                }}
                sx={{
                    p: 4,
                    width: '100%',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(5px)'
                }}
            >

                <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
                    ?האם תגיע/י לחתונה
                </Typography>

                <Box display="flex" gap={3} justifyContent="center" flexWrap="wrap">
                    <Button
                        variant="contained"
                        size="large"
                        dir='ltr'
                        startIcon={<CheckIcon sx={{ ml: 1 }} />}
                        onClick={onComing}
                        disabled={isSubmitting}
                        sx={{
                            minWidth: 200,
                            py: 2,
                            fontSize: '1.2rem',
                            bgcolor: '#2e7d32',
                            '&:hover': {
                                bgcolor: '#1b5e20',
                                transform: 'scale(1.05)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        !כן, אגיע
                    </Button>

                    <Button
                        variant="contained"
                        size="large"
                        dir='ltr'
                        startIcon={<CancelIcon sx={{ ml: 1 }} />}
                        onClick={onNotComing}
                        disabled={isSubmitting}
                        sx={{
                            minWidth: 200,
                            py: 2,
                            fontSize: '1.2rem',
                            bgcolor: '#d32f2f',
                            '&:hover': {
                                bgcolor: '#b71c1c',
                                transform: 'scale(1.05)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {isSubmitting ? 'שומר...' : 'לא אוכל להגיע'}
                    </Button>
                </Box>

                <Divider sx={{ mt: 3 }} />

                {/* Funny Consent Agreement */}
                <Box sx={{ mb: 4, textAlign: 'left', overflow: 'auto' }} >
                    <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                        הסכם נוכחות בחתונה 📝
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: '#666' }}>
                        בלחיצה על "כן, אגיע!" אתה מסכים לתנאים הבאים:
                    </Typography>

                    <List dense sx={{ backgroundColor: '#f5f5f5', borderRadius: 2, p: 2, direction: 'rtl', textAlign: 'right' }}>
                        <ListItem>
                            <ListItemText
                                primary="לרקוד לפחות פעם אחת (גם אם את/ה חושב שאת/ה לא יודע)"
                                primaryTypographyProps={{ fontSize: 14, textAlign: 'left' }}
                            />
                            <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                                <HeartIcon sx={{ color: '#e91e63', fontSize: 16 }} />
                            </ListItemIcon>
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="לחייך בכל התמונות (אפילו באלה שאת/ה לא יודע שצולמת)"
                                primaryTypographyProps={{ fontSize: 14, textAlign: 'left' }}
                            />
                            <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                                <HeartIcon sx={{ color: '#e91e63', fontSize: 16 }} />
                            </ListItemIcon>
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="לא להתלונן על המוזיקה (אפילו אם היא רועשת או שקטה מדי)"
                                primaryTypographyProps={{ fontSize: 14, textAlign: 'left' }}
                            />
                            <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                                <HeartIcon sx={{ color: '#e91e63', fontSize: 16 }} />
                            </ListItemIcon>
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="נשים - להעמיד פנים שהנעליים לא כואבות לך"
                                primaryTypographyProps={{ fontSize: 14, textAlign: 'left' }}
                            />
                            <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                                <HeartIcon sx={{ color: '#e91e63', fontSize: 16 }} />
                            </ListItemIcon>
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="לומר שהאוכל טעים גם אם הוא מלוח מדי או תפל"
                                primaryTypographyProps={{ fontSize: 14, textAlign: 'left' }}
                            />
                            <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                                <HeartIcon sx={{ color: '#e91e63', fontSize: 16 }} />
                            </ListItemIcon>
                        </ListItem>
                    </List>

                    <Typography variant="caption" sx={{ color: '#999', fontSize: 12, mt: 1 }}>
                        * התנאים הללו בתוקף לכל אורך האירוע.
                        ביטול ההסכם יגרור חיוב בהרמת צ׳ייסר עם החתן והכלה
                        🥃
                    </Typography>
                </Box>
            </Paper>
        </Fade>
    );
};

export default InitialQuestion;
