import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';

const FadeTransition = ({ children }) => {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = React.useState(location);
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
        if (location.pathname !== displayLocation.pathname) {
            setIsVisible(false);

            setTimeout(() => {
                setDisplayLocation(location);
                setIsVisible(true);
            }, 250); // Half of the fade duration
        }
    }, [location.pathname, displayLocation.pathname]);

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100vh' }}>
            <Box
                sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                }}
            >
                {React.cloneElement(children, { key: displayLocation.pathname })}
            </Box>
        </Box>
    );
};

export default FadeTransition;
