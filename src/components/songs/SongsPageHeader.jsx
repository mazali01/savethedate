import React from 'react';
import { Box, Typography } from '@mui/material';

const SongsPageHeader = () => {
    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: { xs: 2, md: 3 },
            borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
            background: 'rgba(10, 10, 10, 0.5)',
            direction: 'rtl'
        }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{
                    color: '#00ffff',
                    fontWeight: 'bold',
                    direction: 'rtl',
                    textAlign: 'center',
                    fontFamily: 'inherit'
                }}>
                    תציעו או תצביעו לשיר
                </Typography>
                <Typography variant="caption" sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.8rem',
                    display: 'block',
                    direction: 'rtl',
                    textAlign: 'center',
                    fontFamily: 'inherit'
                }}>
                    !ואולי הוא יושמע בחתונה
                </Typography>
                <Typography variant="caption" sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.6rem',
                    display: 'block',
                    direction: 'rtl',
                    textAlign: 'center',
                    fontFamily: 'inherit'
                }}>
                    הצעות נמחקות אחרי 15 דקות
                </Typography>
            </Box>
        </Box>
    );
};

export default SongsPageHeader;
