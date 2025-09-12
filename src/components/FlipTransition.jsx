import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Box } from '@mui/material';

const FlipTransition = ({ children }) => {
    const location = useLocation();

    const pageVariants = {
        initial: {
            rotateY: 90,
            opacity: 0,
        },
        in: {
            rotateY: 0,
            opacity: 1,
        },
        out: {
            rotateY: -90,
            opacity: 0,
        }
    };

    const pageTransition = {
        type: "tween",
        ease: "anticipate",
        duration: 0.6
    };

    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                height: '100vh',
                perspective: '1000px',
                overflow: 'hidden',
            }}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={location.pathname}
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                        transformOrigin: 'center center',
                    }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </Box>
    );
};

export default FlipTransition;
