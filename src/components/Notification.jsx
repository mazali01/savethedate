import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import './Notification.css';

const Notification = ({ notification, onClose }) => {
    if (!notification) return null;

    const getIcon = () => {
        switch (notification.type) {
            case 'success':
                return <CheckCircleIcon className="notification-icon success-icon" />;
            case 'error':
                return <XCircleIcon className="notification-icon error-icon" />;
            default:
                return <InformationCircleIcon className="notification-icon info-icon" />;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className={`notification-toast ${notification.type}`}
                initial={{ opacity: 0, x: 100, scale: 0.3 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.5 }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    duration: 0.3
                }}
                onClick={onClose}
            >
                <div className="notification-content">
                    {getIcon()}
                    <span className="notification-message">{notification.message}</span>
                </div>
                <div className="notification-progress">
                    <motion.div
                        className="progress-bar"
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 3, ease: "linear" }}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default Notification;
