import React from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import './PrivacyToggle.css';

const PrivacyToggle = ({ isPublic, onChange, disabled = false }) => {
    return (
        <motion.label
            className={`privacy-toggle-wrapper ${disabled ? 'disabled' : ''}`}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
        >
            <input
                type="checkbox"
                checked={isPublic}
                onChange={onChange}
                disabled={disabled}
                className="privacy-checkbox"
            />

            <div className="privacy-icon-container">
                {isPublic ? (
                    <EyeIcon className="privacy-icon" />
                ) : (
                    <EyeSlashIcon className="privacy-icon" />
                )}

                <span className="privacy-text">
                    {isPublic ? 'לכולם' : 'אישי'}
                </span>
            </div>
        </motion.label>
    );
};

export default PrivacyToggle;
