import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'invitedUsers';

// Create a new invited user
export const createInvitedUser = async (userData) => {
    try {
        const userWithDefaults = {
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), userWithDefaults);
        return { id: docRef.id, ...userWithDefaults };
    } catch (error) {
        console.error('Error creating invited user:', error);
        throw error;
    }
};

// Get invited user by ID
export const getInvitedUserById = async (userId) => {
    try {
        const userRef = doc(db, COLLECTION_NAME, userId);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching invited user by ID:', error);
        throw error;
    }
};

// Get all invited users
export const getInvitedUsers = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching invited users:', error);
        throw error;
    }
};

// Update an invited user
export const updateInvitedUser = async (userId, userData) => {
    try {
        const userRef = doc(db, COLLECTION_NAME, userId);
        const updateData = {
            ...userData,
            updatedAt: new Date()
        };

        await updateDoc(userRef, updateData);
        return { id: userId, ...updateData };
    } catch (error) {
        console.error('Error updating invited user:', error);
        throw error;
    }
};

// Delete an invited user
export const deleteInvitedUser = async (userId) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, userId));
        return userId;
    } catch (error) {
        console.error('Error deleting invited user:', error);
        throw error;
    }
};

// Mark SMS as sent for a user
export const markSmsSent = async (userId) => {
    try {
        const userRef = doc(db, COLLECTION_NAME, userId);
        await updateDoc(userRef, {
            smsSent: true,
            smsSentAt: new Date(),
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error marking SMS as sent:', error);
        throw error;
    }
};

// Mark WhatsApp as sent for a user
export const markWhatsAppSent = async (userId) => {
    try {
        const userRef = doc(db, COLLECTION_NAME, userId);
        await updateDoc(userRef, {
            whatsappSent: true,
            whatsappSentAt: new Date(),
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error marking WhatsApp as sent:', error);
        throw error;
    }
};

// Mark SMS as sent for multiple users
export const markBulkSmsSent = async (userIds) => {
    try {
        const promises = userIds.map(userId => markSmsSent(userId));
        await Promise.all(promises);
    } catch (error) {
        console.error('Error marking bulk SMS as sent:', error);
        throw error;
    }
};

// Mark WhatsApp as sent for multiple users
export const markBulkWhatsAppSent = async (userIds) => {
    try {
        const promises = userIds.map(userId => markWhatsAppSent(userId));
        await Promise.all(promises);
    } catch (error) {
        console.error('Error marking bulk WhatsApp as sent:', error);
        throw error;
    }
};
