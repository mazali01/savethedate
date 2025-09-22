import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'wedding_device_id';
const USER_INFO_KEY = 'wedding_user_info';

/**
 * Generate or retrieve existing device ID from localStorage
 * @returns {string} Unique device identifier
 */
export const getDeviceId = () => {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
};

/**
 * Get stored user information
 * @returns {Object|null} User info object or null if not set
 */
export const getUserInfo = () => {
    const userInfo = localStorage.getItem(USER_INFO_KEY);
    return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * Store user information
 * @param {Object} userInfo - User information object
 */
export const setUserInfo = (userInfo) => {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify({
        ...userInfo,
        deviceId: getDeviceId(),
        lastUpdated: new Date().toISOString()
    }));
};

/**
 * Clear user information (for testing purposes)
 */
export const clearUserInfo = () => {
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(DEVICE_ID_KEY);
};

/**
 * Get current user with device ID
 * @returns {Object} Current user object with device ID
 */
export const getCurrentUser = () => {
    const userInfo = getUserInfo();
    const deviceId = getDeviceId();

    return {
        deviceId,
        ...userInfo
    };
};
