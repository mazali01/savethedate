import {
    collection,
    addDoc,
    getDocs,
    doc,
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
            peopleCount: 1, // Default to 1 person
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
