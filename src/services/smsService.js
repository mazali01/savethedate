/**
 * SMS Service for sending wedding invitation links
 * This service handles generating personalized links and sending SMS invitations via SMS4Free
 */

const BASE_URL = 'localhost:5173'; // Updated development server URL

// SMS4Free configuration
const SMS4FREE_KEY = import.meta.env.VITE_SMS4FREE_KEY;
const SMS4FREE_USER = import.meta.env.VITE_SMS4FREE_USER;
const SMS4FREE_PASS = import.meta.env.VITE_SMS4FREE_PASS;
const SMS4FREE_SENDER = import.meta.env.VITE_SMS4FREE_SENDER || 'מזל&ערן';

// Check if SMS4Free is configured
let smsConfigured = false;
try {
    if (SMS4FREE_KEY && SMS4FREE_USER && SMS4FREE_PASS) {
        smsConfigured = true;
        console.log('✅ SMS4Free configuration found');
    } else {
        console.warn('⚠️ SMS4Free not configured. Please set VITE_SMS4FREE_KEY, VITE_SMS4FREE_USER, and VITE_SMS4FREE_PASS in your .env file');
    }
} catch (error) {
    console.error('❌ Failed to check SMS4Free configuration:', error.message);
}

/**
 * Test SMS sending functionality
 * @param {string} testPhoneNumber - Phone number to send test message to
 * @returns {Promise<Object>} Test result
 */
export const testSMSSending = async (testPhoneNumber) => {
    const testMessage = `🧪 Test message from your wedding invitation system!\n\nIf you received this, SMS is working correctly! ✅\n\nTime: ${new Date().toLocaleString('he-IL')}`;

    console.log('🧪 Testing SMS functionality...');
    const result = await sendSMS(testPhoneNumber, testMessage);

    if (result.success) {
        console.log('✅ SMS test successful!');
    } else {
        console.log('❌ SMS test failed:', result.error);
    }

    return result;
};

/**
 * Check SMS balance using SMS4Free API
 * @returns {Promise<Object>} Balance check result
 */
export const checkSMSBalance = async () => {
    try {
        if (!smsConfigured) {
            throw new Error('SMS4Free is not configured');
        }

        const payload = {
            key: SMS4FREE_KEY,
            user: SMS4FREE_USER,
            pass: SMS4FREE_PASS
        };

        const response = await fetch('https://api.sms4free.co.il/ApiSMS/AvailableSMS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            mode: 'cors'
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return {
            success: true,
            balance: responseData.status || responseData.available_sms || 0,
            message: responseData.message || 'Balance retrieved successfully'
        };

    } catch (error) {
        console.error('❌ Balance check failed:', error.message);
        return {
            success: false,
            error: error.message,
            balance: 0
        };
    }
};

/**
 * Check if SMS service is properly configured
 * @returns {Object} Configuration status
 */
export const checkSMSConfiguration = () => {
    const isConfigured = smsConfigured && !!(SMS4FREE_KEY && SMS4FREE_USER && SMS4FREE_PASS);

    return {
        isConfigured,
        missingVariables: [
            !SMS4FREE_KEY ? 'VITE_SMS4FREE_KEY' : null,
            !SMS4FREE_USER ? 'VITE_SMS4FREE_USER' : null,
            !SMS4FREE_PASS ? 'VITE_SMS4FREE_PASS' : null,
        ].filter(Boolean),
        provider: 'SMS4Free',
        sender: SMS4FREE_SENDER,
        hasClient: smsConfigured
    };
};/**
 * Generate personalized invitation link for a user
 * @param {string} userId - User document ID
 * @param {string} userName - User's name for personalization
 * @returns {Object} Link data with URL and message
 */
export const generateInvitationLink = (userId, userName) => {
    const invitationUrl = `http://${BASE_URL}/rsvp/${userId}`;

    const message = `🎉 שלום ${userName}!

את/ה מוזמן/ת לחתונה של מזל וערן! 💒

לחץ על הקישור כדי לאשר הגעה ולצפות בכל הפרטים:
${invitationUrl}

נשמח לחגוג איתך! ❤️
מזל וערן`;

    return {
        url: invitationUrl,
        message,
        recipientName: userName,
        userId
    };
};

/**
 * Generate invitation links for multiple users
 * @param {Array} users - Array of user objects with id, name, and phoneNumber
 * @returns {Array} Array of invitation link objects
 */
export const generateBulkInvitationLinks = (users) => {
    return users.map(user => ({
        ...generateInvitationLink(user.id, user.name),
        phoneNumber: user.phoneNumber,
        userId: user.id
    }));
};

/**
 * Send SMS using SMS4Free API
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} Send result
 */
export const sendSMS = async (phoneNumber, message) => {
    try {
        // Check if SMS4Free is configured
        if (!smsConfigured) {
            throw new Error('SMS4Free is not configured. Please set SMS4FREE_KEY, SMS4FREE_USER, and SMS4FREE_PASS environment variables.');
        }

        // Format phone number for Israeli format
        const formattedPhone = formatPhoneForSMS4Free(phoneNumber);

        console.log('📱 Sending SMS to:', formattedPhone);
        console.log('💬 Message:', message);

        // Prepare payload for SMS4Free API
        const payload = {
            key: SMS4FREE_KEY,
            user: SMS4FREE_USER,
            pass: SMS4FREE_PASS,
            sender: SMS4FREE_SENDER,
            recipient: formattedPhone,
            msg: message
        };

        // Send SMS using SMS4Free API
        const response = await fetch('https://api.sms4free.co.il/ApiSMS/v2/SendSMS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            mode: 'cors'
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // SMS4Free status interpretation
        const status = responseData.status;
        const statusMessage = responseData.message;

        if (status > 0) {
            // Success - status contains number of recipients
            console.log('✅ SMS sent successfully to', status, 'recipients:', statusMessage);

            return {
                success: true,
                messageId: `${Date.now()}-${status}`, // Generate unique ID
                recipient: formattedPhone,
                timestamp: new Date().toISOString(),
                status: 'sent',
                recipientCount: status,
                message: statusMessage
            };
        } else {
            // Error - interpret error codes
            const errorMessages = {
                0: 'שגיאה כללית',
                [-1]: 'מפתח, שם משתמש או סיסמה שגויים',
                [-2]: 'שם או מספר שולח ההודעה שגוי',
                [-3]: 'לא נמצאו נמענים',
                [-4]: 'לא ניתן לשלוח הודעה, יתרת הודעות פנויות נמוכה',
                [-5]: 'הודעה לא מתאימה',
                [-6]: 'צריך לאמת מספר שולח'
            };

            const errorMsg = errorMessages[status] || statusMessage || 'שגיאה לא ידועה';
            throw new Error(`SMS4Free Error ${status}: ${errorMsg}`);
        }

    } catch (error) {
        console.error('❌ SMS sending failed:', error.message);

        return {
            success: false,
            error: error.message,
            recipient: phoneNumber,
            timestamp: new Date().toISOString()
        };
    }
};/**
 * Send bulk SMS invitations
 * @param {Array} invitations - Array of invitation objects with phoneNumber and message
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} Bulk send results
 */
export const sendBulkSMS = async (invitations, onProgress) => {
    const results = {
        successful: [],
        failed: [],
        total: invitations.length
    };

    for (let i = 0; i < invitations.length; i++) {
        const invitation = invitations[i];

        try {
            const result = await sendSMS(invitation.phoneNumber, invitation.message);

            if (result.success) {
                results.successful.push({
                    ...invitation,
                    result
                });
            } else {
                results.failed.push({
                    ...invitation,
                    error: result.error || 'Unknown error occurred'
                });
            }
        } catch (error) {
            console.error('Error sending SMS to', invitation.phoneNumber, ':', error);
            results.failed.push({
                ...invitation,
                error: error.message
            });
        }

        // Call progress callback
        if (onProgress) {
            onProgress({
                current: i + 1,
                total: invitations.length,
                percentage: Math.round(((i + 1) / invitations.length) * 100)
            });
        }

        // No rate limiting - send messages as fast as possible
    }

    return results;
};

/**
 * Copy invitation link to clipboard
 * @param {string} link - Invitation URL
 * @returns {Promise<boolean>} Success status
 */
export const copyLinkToClipboard = async (link) => {
    try {
        await navigator.clipboard.writeText(link);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
    }
};

/**
 * Format phone number for SMS4Free (Israeli format)
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} Formatted phone number for SMS4Free
 */
export const formatPhoneForSMS4Free = (phoneNumber) => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // SMS4Free accepts Israeli format (05xxxxxxxx)
    // If starts with 972 (Israel country code), convert to local format
    if (cleaned.startsWith('972')) {
        return `0${cleaned.substring(3)}`;
    }

    // If starts with 0 (Israeli local format), keep as is
    if (cleaned.startsWith('0') && cleaned.length >= 9) {
        return cleaned;
    }

    // If doesn't have country code, add 0 prefix
    if (cleaned.length >= 8 && !cleaned.startsWith('972') && !cleaned.startsWith('0')) {
        return `0${cleaned}`;
    }

    return cleaned;
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} Is valid phone number
 */
export const isValidPhoneNumber = (phoneNumber) => {
    // Israeli phone number pattern (basic validation)
    const israeliPhonePattern = /^(\+972|0)([23456789])\d{7,8}$/;
    return israeliPhonePattern.test(phoneNumber.replace(/[-\s]/g, ''));
};

/**
 * Format phone number for display
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('972')) {
        return `+${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.startsWith('0')) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneNumber;
};
