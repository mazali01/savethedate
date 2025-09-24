import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase.js';

const COLLECTION_NAME = 'singlesProfiles';

/**
 * Create a new singles profile
 * @param {Object} profileData - Profile data
 * @param {string} profileData.userId - User ID from invited users
 * @param {string} profileData.name - Full name
 * @param {number} profileData.age - Age
 * @param {string} profileData.gender - User's gender ('male' or 'female')
 * @param {string} profileData.interestedIn - Gender interested in ('male' or 'female')
 * @param {string} profileData.location - City/location
 * @param {string} profileData.howWeKnow - How they know the couple
 * @param {string} profileData.aboutMe - A few words about themselves
 * @param {string} profileData.photoUrl - Profile photo URL
 * @returns {Promise<Object>} Created profile
 */
export const createSinglesProfile = async (profileData) => {
    try {
        const profileWithDefaults = {
            ...profileData,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Use userId as document ID to ensure one profile per user
        await setDoc(doc(db, COLLECTION_NAME, profileData.userId), profileWithDefaults);

        return {
            id: profileData.userId,
            ...profileWithDefaults
        };
    } catch (error) {
        console.error('Error creating singles profile:', error);
        throw error;
    }
};

/**
 * Get all active singles profiles
 * @returns {Promise<Array>} Array of singles profiles
 */
export const getSinglesProfiles = async () => {
    try {
        // Simple query without orderBy to avoid index requirement
        const q = query(
            collection(db, COLLECTION_NAME),
            where('isActive', '==', true)
        );
        const querySnapshot = await getDocs(q);

        // Convert and sort client-side
        const profiles = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
        }));

        // Sort by creation date (newest first)
        profiles.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });

        return profiles;
    } catch (error) {
        console.error('Error fetching singles profiles:', error);
        throw error;
    }
};

/**
 * Get singles profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Profile data or null if not found
 */
export const getSinglesProfile = async (userId) => {
    try {
        const profileDoc = await getDoc(doc(db, COLLECTION_NAME, userId));
        if (profileDoc.exists()) {
            const data = profileDoc.data();

            // Only return active profiles
            if (data.isActive === false) {
                return null;
            }

            return {
                id: profileDoc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting singles profile:', error);
        throw error;
    }
};

/**
 * Update singles profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateSinglesProfile = async (userId, updateData) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, userId);
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error updating singles profile:', error);
        throw error;
    }
};

/**
 * Delete singles profile (set as inactive)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteSinglesProfile = async (userId) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, userId);
        await updateDoc(docRef, {
            isActive: false,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error deleting singles profile:', error);
        throw error;
    }
};

/**
 * Upload profile photo to Firebase Storage
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadProfilePhoto = async (file, userId) => {
    try {
        // Validate file
        if (!file) {
            throw new Error('No file provided');
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            throw new Error('Invalid file type. Please upload an image file.');
        }

        // Check file size (10MB limit for Firebase Storage)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File size too large. Maximum size is 10MB.');
        }

        console.log('Uploading image to Firebase Storage, size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

        // Create unique filename
        const timestamp = Date.now();
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `singles-photos/${userId}_${timestamp}_${cleanFileName}`;

        // Create storage reference
        const storageRef = ref(storage, fileName);

        // Set metadata
        const metadata = {
            contentType: file.type,
            customMetadata: {
                userId: userId,
                uploadedAt: new Date().toISOString(),
                originalName: file.name
            }
        };

        // Upload to Firebase Storage
        console.log('Uploading to:', fileName);
        const snapshot = await uploadBytes(storageRef, file, metadata);
        console.log('Upload successful');

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('Download URL obtained');

        return downloadURL;

    } catch (error) {
        console.error('Error uploading profile photo:', error);

        // Provide user-friendly error messages in Hebrew
        if (error.code === 'storage/unauthorized') {
            throw new Error('אין הרשאה להעלות תמונה');
        } else if (error.code === 'storage/canceled') {
            throw new Error('העלאת התמונה בוטלה');
        } else if (error.code === 'storage/quota-exceeded') {
            throw new Error('חריגה ממכסת האחסון');
        } else if (error.message.includes('File size too large')) {
            throw new Error('התמונה גדולה מדי. גודל מקסימלי: 10MB');
        } else if (error.message.includes('Invalid file type')) {
            throw new Error('סוג קובץ לא תקין. אנא העלה קובץ תמונה');
        }

        throw new Error('שגיאה בהעלאת התמונה');
    }
};

/**
 * Delete profile photo from Firebase Storage
 * @param {string} photoUrl - Photo URL to delete
 * @returns {Promise<void>}
 */
export const deleteProfilePhoto = async (photoUrl) => {
    try {
        if (!photoUrl || !photoUrl.includes('firebasestorage.googleapis.com')) {
            console.log('No valid Firebase Storage URL to delete');
            return;
        }

        // Extract file path from Firebase Storage URL
        const url = new URL(photoUrl);
        const pathname = decodeURIComponent(url.pathname);
        const pathMatch = pathname.match(/\/o\/(.+)$/);

        if (pathMatch) {
            const filePath = pathMatch[1];
            const photoRef = ref(storage, filePath);
            await deleteObject(photoRef);
            console.log('Photo deleted successfully:', filePath);
        } else {
            console.warn('Could not extract file path from URL:', photoUrl);
        }
    } catch (error) {
        console.error('Error deleting profile photo:', error);
        // Handle specific Firebase Storage errors
        if (error.code === 'storage/object-not-found') {
            console.log('Photo already deleted or does not exist, continuing...');
        } else if (error.code === 'storage/unauthorized') {
            console.warn('Unauthorized to delete photo, but continuing with profile deletion');
        } else {
            console.warn('Photo deletion failed, but continuing with profile deletion:', error.message);
        }
        // Don't throw error for photo deletion failures as it's not critical for profile deletion
    }
};

/**
 * Check if user has a singles profile
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user has an active profile
 */
export const hasSinglesProfile = async (userId) => {
    try {
        const profile = await getSinglesProfile(userId);
        return profile !== null && profile.isActive;
    } catch (error) {
        console.error('Error checking singles profile:', error);
        return false;
    }
};

/**
 * Get matching singles profiles for a user
 * Simple logic: Show profiles of people who are the gender this user is interested in,
 * and who are interested in this user's gender
 * @param {string} userGender - Current user's gender ('male' or 'female')
 * @param {string} userInterestedIn - What gender the user is interested in ('male' or 'female')
 * @param {string} currentUserId - Current user's ID to exclude from results
 * @returns {Promise<Array>} Array of matching singles profiles
 */
export const getMatchingSinglesProfiles = async (userGender, userInterestedIn, currentUserId) => {
    try {
        // Get all active profiles
        const q = query(
            collection(db, COLLECTION_NAME),
            where('isActive', '==', true)
        );
        const querySnapshot = await getDocs(q);

        // Convert to objects
        const allProfiles = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
        }));

        // Simple matching logic:
        // 1. Exclude current user
        // 2. Show people of the gender I'm interested in
        // 3. Who are interested in my gender
        const matchingProfiles = allProfiles.filter(profile => {
            return profile.userId !== currentUserId &&
                profile.gender === userInterestedIn &&
                profile.interestedIn === userGender;
        });

        // Sort by creation date (newest first)
        matchingProfiles.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });

        return matchingProfiles;
    } catch (error) {
        console.error('Error fetching matching singles profiles:', error);
        throw error;
    }
};
