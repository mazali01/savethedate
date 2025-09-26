import React from 'react';
import { motion } from 'framer-motion';
import './PaymentGifts.css';

const PaymentGifts = ({ paymentLinks }) => {
    return (
        <motion.div
            className="payment-gifts-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <div className="payment-content">
                <div className="gift-icon">🎁</div>
                <h3 className="payment-title">רוצים להשאיר מתנה?</h3>
                <p className="payment-subtitle">הנוכחות שלכם היא המתנה הכי יפה, אבל אם תרצו לתרום...</p>

                <div className="payment-buttons">
                    <motion.a
                        href={paymentLinks.bit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="payment-button bit-button"
                        title="תשלום דרך Bit"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <img
                            src="https://upload.wikimedia.org/wikipedia/he/d/d6/Bit_logo.svg"
                            alt="Bit"
                            className="payment-logo"
                        />
                        <span>Bit</span>
                    </motion.a>

                    <motion.a
                        href={paymentLinks.paybox.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="payment-button paybox-button"
                        title="תשלום דרך PayBox"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <img
                            src="https://upload.wikimedia.org/wikipedia/he/e/ef/Pay-box-logo%403x.webp"
                            alt="PayBox"
                            className="payment-logo"
                        />
                        <span>PayBox</span>
                    </motion.a>
                </div>
            </div>
        </motion.div>
    );
};

export default PaymentGifts;
