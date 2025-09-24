import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

const RSVP_COLLECTION = 'rsvpResponses';
const INVITED_USERS_COLLECTION = 'invitedUsers';

/**
 * Get invited user by ID
 * @param {string} userId - User document ID
 * @returns {Promise<Object|null>} User data or null if not found
 */
export const getInvitedUserById = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, INVITED_USERS_COLLECTION, userId));
        if (userDoc.exists()) {
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting invited user:', error);
        throw error;
    }
};

/**
 * Get RSVP response for a user
 * @param {string} userId - User document ID
 * @returns {Promise<Object|null>} RSVP data or null if not found
 */
export const getRsvpResponse = async (userId) => {
    try {
        const rsvpDoc = await getDoc(doc(db, RSVP_COLLECTION, userId));
        if (rsvpDoc.exists()) {
            return {
                id: rsvpDoc.id,
                ...rsvpDoc.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting RSVP response:', error);
        throw error;
    }
};

/**
 * Submit or update RSVP response
 * @param {string} userId - User document ID
 * @param {Object} rsvpData - RSVP response data
 * @param {boolean} rsvpData.isAttending - Whether user is attending
 * @param {number} rsvpData.guestCount - Number of guests (including user)
 * @param {string} rsvpData.userName - User's name
 * @param {string} rsvpData.phoneNumber - User's phone
 * @returns {Promise<Object>} Created/updated RSVP response
 */
export const submitRsvpResponse = async (userId, rsvpData) => {
    try {
        const rsvpResponse = {
            userId,
            isAttending: rsvpData.isAttending,
            guestCount: rsvpData.isAttending ? rsvpData.guestCount : 0,
            userName: rsvpData.userName,
            phoneNumber: rsvpData.phoneNumber,
            submittedAt: new Date(),
            updatedAt: new Date()
        };

        await setDoc(doc(db, RSVP_COLLECTION, userId), rsvpResponse);

        return {
            id: userId,
            ...rsvpResponse
        };
    } catch (error) {
        console.error('Error submitting RSVP response:', error);
        throw error;
    }
};

/**
 * Update RSVP response
 * @param {string} userId - User document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateRsvpResponse = async (userId, updateData) => {
    try {
        const docRef = doc(db, RSVP_COLLECTION, userId);
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error updating RSVP response:', error);
        throw error;
    }
};

/**
 * Get all RSVP responses (for admin)
 * @returns {Promise<Array>} Array of RSVP responses
 */
export const getAllRsvpResponses = async () => {
    try {
        const q = query(
            collection(db, RSVP_COLLECTION),
            orderBy('submittedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all RSVP responses:', error);
        throw error;
    }
};

/**
 * Check if user has completed RSVP
 * @param {string} userId - User document ID
 * @returns {Promise<boolean>} True if RSVP is completed
 */
export const hasCompletedRsvp = async (userId) => {
    try {
        const rsvp = await getRsvpResponse(userId);
        return rsvp !== null;
    } catch (error) {
        console.error('Error checking RSVP status:', error);
        return false;
    }
};

/**
 * Generate calendar event data
 * @param {Object} eventDetails - Wedding event details
 * @returns {Object} Calendar event data
 */
export const generateCalendarEvent = (eventDetails = {}) => {
    const {
        title = 'חתונת מזל וערן',
        startDate = new Date('2025-12-15T18:00:00'), // Default wedding date
        endDate = new Date('2025-12-15T23:00:00'),
        location = 'אולם האירועים', // Default location
        description = 'חתונה של מזל וערן - נתראה שם!'
    } = eventDetails;

    return {
        title,
        startDate,
        endDate,
        location,
        description
    };
};

/**
 * Generate calendar download links
 * @param {Object} eventData - Event data
 * @returns {Object} Calendar links for different formats
 */
export const generateCalendarLinks = (eventData) => {
    const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = formatDate(eventData.startDate);
    const endDate = formatDate(eventData.endDate);

    // Google Calendar link
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&dates=${startDate}/${endDate}&location=${encodeURIComponent(eventData.location)}&details=${encodeURIComponent(eventData.description)}`;

    // iCal format for Apple Calendar and Outlook
    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Wedding//Wedding Event//EN
BEGIN:VEVENT
UID:wedding-${Date.now()}@wedding.com
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${eventData.title}
DESCRIPTION:${eventData.description}
LOCATION:${eventData.location}
END:VEVENT
END:VCALENDAR`;

    const icalBlob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const icalUrl = URL.createObjectURL(icalBlob);

    return {
        google: googleCalendarUrl,
        ical: icalUrl,
        download: () => {
            const link = document.createElement('a');
            link.href = icalUrl;
            link.download = 'wedding-invitation.ics';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
};
