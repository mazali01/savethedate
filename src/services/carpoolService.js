import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    increment,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase.js';

const COLLECTIONS = {
    CARPOOL_OFFERS: 'carpoolOffers',
    CARPOOL_REQUESTS: 'carpoolRequests'
};

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data) => {
    if (!data) return data;
    const converted = { ...data };
    Object.keys(converted).forEach(key => {
        if (converted[key] && typeof converted[key].toDate === 'function') {
            converted[key] = converted[key].toDate();
        }
        if (key === 'passengers' && Array.isArray(converted[key])) {
            converted[key] = converted[key].map(passenger => ({
                ...passenger,
                acceptedAt: passenger.acceptedAt?.toDate?.() || passenger.acceptedAt
            }));
        }
    });
    return converted;
};

// Helper function to convert Date objects to Firestore timestamps
const convertToTimestamps = (data) => {
    const converted = { ...data };
    Object.keys(converted).forEach(key => {
        if (converted[key] instanceof Date) {
            converted[key] = Timestamp.fromDate(converted[key]);
        }
        if (key === 'passengers' && Array.isArray(converted[key])) {
            converted[key] = converted[key].map(passenger => ({
                ...passenger,
                acceptedAt: passenger.acceptedAt instanceof Date
                    ? Timestamp.fromDate(passenger.acceptedAt)
                    : passenger.acceptedAt
            }));
        }
    });
    return converted;
};

/**
 * Create a new carpool offer
 * @param {Object} offerData - Carpool offer data
 * @returns {Promise<string>} Document ID of created offer
 */
export const createCarpoolOffer = async (offerData) => {
    try {
        const dataToStore = convertToTimestamps(offerData);
        const docRef = await addDoc(collection(db, COLLECTIONS.CARPOOL_OFFERS), dataToStore);
        return docRef.id;
    } catch (error) {
        console.error('Error creating carpool offer:', error);
        throw error;
    }
};

/**
 * Get all active carpool offers
 * @returns {Promise<Array>} Array of carpool offers
 */
export const getCarpoolOffers = async () => {
    try {
        const q = query(
            collection(db, COLLECTIONS.CARPOOL_OFFERS),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => convertTimestamps({
            ...doc.data(),
            id: doc.id,
        }));
        return data;
    } catch (error) {
        console.error('Error getting carpool offers:', error);
        throw error;
    }
};

/**
 * Get carpool offers by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user's carpool offers
 */
export const getUserCarpoolOffers = async (userId) => {
    try {
        const q = query(
            collection(db, COLLECTIONS.CARPOOL_OFFERS),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => convertTimestamps({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting user carpool offers:', error);
        throw error;
    }
};

/**
 * Update a carpool offer
 * @param {string} offerId - Offer document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateCarpoolOffer = async (offerId, updateData) => {
    try {
        const dataToUpdate = convertToTimestamps({
            ...updateData,
            updatedAt: new Date()
        });
        const docRef = doc(db, COLLECTIONS.CARPOOL_OFFERS, offerId);
        await updateDoc(docRef, dataToUpdate);
    } catch (error) {
        console.error('Error updating carpool offer:', error);
        throw error;
    }
};

/**
 * Delete a carpool offer
 * @param {string} offerId - Offer document ID
 * @returns {Promise<void>}
 */
export const deleteCarpoolOffer = async (offerId) => {
    try {
        const docRef = doc(db, COLLECTIONS.CARPOOL_OFFERS, offerId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting carpool offer:', error);
        throw error;
    }
};

/**
 * Add passenger to carpool offer
 * @param {string} offerId - Offer document ID
 * @param {Object} passengerData - Passenger information
 * @returns {Promise<void>}
 */
export const addPassengerToOffer = async (offerId, passengerData) => {
    try {
        const docRef = doc(db, COLLECTIONS.CARPOOL_OFFERS, offerId);
        const passenger = {
            ...passengerData,
            acceptedAt: Timestamp.fromDate(new Date()),
            status: 'accepted'
        };

        await updateDoc(docRef, {
            passengers: arrayUnion(passenger),
            availableSeats: increment(-1),
            updatedAt: Timestamp.fromDate(new Date())
        });
    } catch (error) {
        console.error('Error adding passenger to offer:', error);
        throw error;
    }
};

/**
 * Remove passenger from carpool offer
 * @param {string} offerId - Offer document ID
 * @param {Object} passengerData - Passenger to remove
 * @returns {Promise<void>}
 */
export const removePassengerFromOffer = async (offerId, passengerData) => {
    try {
        const docRef = doc(db, COLLECTIONS.CARPOOL_OFFERS, offerId);
        await updateDoc(docRef, {
            passengers: arrayRemove(passengerData),
            availableSeats: increment(1),
            updatedAt: Timestamp.fromDate(new Date())
        });
    } catch (error) {
        console.error('Error removing passenger from offer:', error);
        throw error;
    }
};

/**
 * CARPOOL REQUESTS SERVICE
 */

/**
 * Create a new carpool request
 * @param {Object} requestData - Carpool request data
 * @returns {Promise<string>} Document ID of created request
 */
export const createCarpoolRequest = async (requestData) => {
    try {
        const dataToStore = convertToTimestamps(requestData);
        const docRef = await addDoc(collection(db, COLLECTIONS.CARPOOL_REQUESTS), dataToStore);
        return docRef.id;
    } catch (error) {
        console.error('Error creating carpool request:', error);
        throw error;
    }
};

/**
 * Get all active carpool requests
 * @returns {Promise<Array>} Array of carpool requests
 */
export const getCarpoolRequests = async () => {
    try {
        const q = query(
            collection(db, COLLECTIONS.CARPOOL_REQUESTS),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => convertTimestamps({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting carpool requests:', error);
        throw error;
    }
};

/**
 * Get carpool requests by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user's carpool requests
 */
export const getUserCarpoolRequests = async (userId) => {
    try {
        const q = query(
            collection(db, COLLECTIONS.CARPOOL_REQUESTS),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => convertTimestamps({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting user carpool requests:', error);
        throw error;
    }
};

/**
 * Update a carpool request
 * @param {string} requestId - Request document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateCarpoolRequest = async (requestId, updateData) => {
    try {
        const dataToUpdate = convertToTimestamps({
            ...updateData,
            updatedAt: new Date()
        });
        const docRef = doc(db, COLLECTIONS.CARPOOL_REQUESTS, requestId);
        await updateDoc(docRef, dataToUpdate);
    } catch (error) {
        console.error('Error updating carpool request:', error);
        throw error;
    }
};

/**
 * Delete a carpool request
 * @param {string} requestId - Request document ID
 * @returns {Promise<void>}
 */
export const deleteCarpoolRequest = async (requestId) => {
    try {
        const docRef = doc(db, COLLECTIONS.CARPOOL_REQUESTS, requestId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting carpool request:', error);
        throw error;
    }
};

/**
 * REAL-TIME LISTENERS
 */

/**
 * Subscribe to carpool offers changes
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCarpoolOffers = (callback) => {
    const q = query(
        collection(db, COLLECTIONS.CARPOOL_OFFERS),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
        const offers = querySnapshot.docs.map(doc => convertTimestamps({
            id: doc.id,
            ...doc.data()
        }));
        callback(offers);
    }, (error) => {
        console.error('Error in carpool offers subscription:', error);
    });
};

/**
 * Subscribe to carpool requests changes
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCarpoolRequests = (callback) => {
    const q = query(
        collection(db, COLLECTIONS.CARPOOL_REQUESTS),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
        const requests = querySnapshot.docs.map(doc => convertTimestamps({
            id: doc.id,
            ...doc.data()
        }));
        callback(requests);
    }, (error) => {
        console.error('Error in carpool requests subscription:', error);
    });
};

/**
 * PHOTO UPLOAD SERVICE
 */

/**
 * Upload driver photo to Firebase Storage
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadDriverPhoto = async (file, userId) => {
    try {
        const timestamp = Date.now();
        const fileName = `driver-photos/${userId}_${timestamp}_${file.name}`;
        const storageRef = ref(storage, fileName);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error('Error uploading driver photo:', error);
        throw error;
    }
};

/**
 * Delete driver photo from Firebase Storage
 * @param {string} photoUrl - URL of photo to delete
 * @returns {Promise<void>}
 */
export const deleteDriverPhoto = async (photoUrl) => {
    try {
        const photoRef = ref(storage, photoUrl);
        await deleteObject(photoRef);
    } catch (error) {
        console.error('Error deleting driver photo:', error);
        throw error;
    }
};
