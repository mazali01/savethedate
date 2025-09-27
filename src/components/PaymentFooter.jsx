import React from 'react';
import { createPaymentLinks } from '../services/giftService';

const PaymentFooter = () => {
  const paymentLinks = createPaymentLinks();

  return (
    <div className="fixed-footer">
      <div className="footer-content">
        <span className="footer-text">רוצים להשאיר מתנה?</span>
        <div className="payment-buttons">
          <a
            href={paymentLinks.bit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="payment-button-footer bit-button"
            title="תשלום דרך Bit"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/he/d/d6/Bit_logo.svg"
              alt="Bit"
              className="payment-logo"
            />
          </a>
          <a
            href={paymentLinks.paybox.url}
            target="_blank"
            rel="noopener noreferrer"
            className="payment-button-footer paybox-button"
            title="תשלום דרך PayBox"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/he/e/ef/Pay-box-logo%403x.webp"
              alt="PayBox"
              className="payment-logo"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaymentFooter;
