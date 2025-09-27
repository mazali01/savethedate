import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc, getDoc, setDoc, limit, startAfter } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

// Upload media file to Firebase Storage
export const uploadMediaFile = async (file, folder = 'blessings') => {
  try {
    // Create a unique filename
    let fileExtension = 'webm'; // Default for audio blobs

    if (file.name) {
      // Regular file with name
      fileExtension = file.name.split('.').pop();
    } else if (file.type) {
      // Blob with type (e.g., audio/webm)
      const mimeType = file.type.split('/').pop();
      fileExtension = mimeType === 'webm' ? 'webm' : mimeType;
    }

    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      filename: fileName,
      type: file.type.startsWith('image/') ? 'image' :
        file.type.startsWith('audio/') ? 'audio' : 'video'
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

// Delete media file from Firebase Storage
export const deleteMediaFile = async (fileName, folder = 'blessings') => {
  try {
    const storageRef = ref(storage, `${folder}/${fileName}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};

// Validate file type and size
export const validateMediaFile = (file) => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/mpeg'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('קובץ לא נתמך. אנא בחרו תמונה או סרטון בפורמט נתמך.');
  }

  if (file.size > maxSize) {
    throw new Error('הקובץ גדול מדי. גודל מקסימלי: 50MB');
  }

  return true;
};

// Firestore operations for blessings
export const createBlessing = async (blessingData) => {
  try {
    const blessing = {
      ...blessingData,
      createdAt: new Date(),
      reactions: []
    };

    const docRef = await addDoc(collection(db, 'blessings'), blessing);
    return { id: docRef.id, ...blessing };
  } catch (error) {
    console.error('Error creating blessing:', error);
    throw error;
  }
};

export const getPublicBlessings = async () => {
  try {
    const q = query(
      collection(db, 'blessings'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const blessings = [];

    for (const doc of querySnapshot.docs) {
      const blessingData = { id: doc.id, ...doc.data() };

      // Get reactions for this blessing
      const reactionsQ = query(collection(db, 'reactions'), where('blessingId', '==', doc.id));
      const reactionsSnapshot = await getDocs(reactionsQ);
      blessingData.reactions = reactionsSnapshot.docs.map(rDoc => ({ id: rDoc.id, ...rDoc.data() }));

      blessings.push(blessingData);
    }

    return blessings;
  } catch (error) {
    console.error('Error getting blessings:', error);
    throw error;
  }
};

// Get paginated public blessings for infinite scrolling
export const getPaginatedBlessings = async (pageSize = 10, lastDocId = null) => {
  try {
    let q = query(
      collection(db, 'blessings'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    // If we have a lastDocId, start after that document
    if (lastDocId) {
      const lastDocRef = doc(db, 'blessings', lastDocId);
      const lastDocSnap = await getDoc(lastDocRef);
      if (lastDocSnap.exists()) {
        q = query(
          collection(db, 'blessings'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastDocSnap),
          limit(pageSize)
        );
      }
    }

    const querySnapshot = await getDocs(q);
    const blessings = [];

    for (const docSnap of querySnapshot.docs) {
      const blessingData = { id: docSnap.id, ...docSnap.data() };

      // Get reactions for this blessing
      const reactionsQ = query(collection(db, 'reactions'), where('blessingId', '==', docSnap.id));
      const reactionsSnapshot = await getDocs(reactionsQ);
      blessingData.reactions = reactionsSnapshot.docs.map(rDoc => ({ id: rDoc.id, ...rDoc.data() }));

      blessings.push(blessingData);
    }

    return {
      blessings,
      hasMore: querySnapshot.docs.length === pageSize,
      lastDocId: querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1].id : null
    };
  } catch (error) {
    console.error('Error getting paginated blessings:', error);
    throw error;
  }
};

export const getUserBlessings = async (userId) => {
  try {
    const q = query(
      collection(db, 'blessings'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const blessings = [];

    for (const doc of querySnapshot.docs) {
      const blessingData = { id: doc.id, ...doc.data() };

      // Get reactions for this blessing
      const reactionsQ = query(collection(db, 'reactions'), where('blessingId', '==', doc.id));
      const reactionsSnapshot = await getDocs(reactionsQ);
      blessingData.reactions = reactionsSnapshot.docs.map(rDoc => ({ id: rDoc.id, ...rDoc.data() }));

      blessings.push(blessingData);
    }

    return blessings;
  } catch (error) {
    console.error('Error getting user blessings:', error);
    throw error;
  }
};

export const addReaction = async (blessingId, userId, username, emojisOrEmoji) => {
  try {
    // Handle both single emoji (old format) and multiple emojis (new format)
    const emojis = Array.isArray(emojisOrEmoji) ? emojisOrEmoji : [emojisOrEmoji];

    // Check if user already has a reaction for this blessing
    const reactionsQ = query(
      collection(db, 'reactions'),
      where('blessingId', '==', blessingId),
      where('userId', '==', userId)
    );
    const existingReactions = await getDocs(reactionsQ);

    if (!existingReactions.empty) {
      // Update existing reaction
      const existingDoc = existingReactions.docs[0];
      await updateDoc(doc(db, 'reactions', existingDoc.id), {
        emojis,
        // Keep backward compatibility
        emoji: emojis[0],
        createdAt: new Date()
      });
    } else {
      // Create new reaction
      await addDoc(collection(db, 'reactions'), {
        blessingId,
        userId,
        username,
        emojis,
        // Keep backward compatibility
        emoji: emojis[0],
        createdAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
};

export const removeReaction = async (blessingId, userId) => {
  try {
    const reactionsQ = query(
      collection(db, 'reactions'),
      where('blessingId', '==', blessingId),
      where('userId', '==', userId)
    );
    const existingReactions = await getDocs(reactionsQ);

    if (!existingReactions.empty) {
      await deleteDoc(doc(db, 'reactions', existingReactions.docs[0].id));
    }
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
};

export const deleteBlessing = async (blessingId, userId) => {
  try {
    // First, get the blessing to check ownership and get media filename
    const blessingDoc = await getDoc(doc(db, 'blessings', blessingId));
    if (!blessingDoc.exists()) {
      throw new Error('הברכה לא נמצאה');
    }

    const blessingData = blessingDoc.data();

    // Check if the current user is the owner of the blessing
    if (blessingData.userId !== userId) {
      throw new Error('אין לך הרשאה למחוק ברכה זו');
    }

    // Delete associated media file if exists
    if (blessingData.mediaUrl) {
      try {
        // Extract filename from URL
        const urlParts = blessingData.mediaUrl.split('/');
        const fileNameWithParams = urlParts[urlParts.length - 1];
        const fileName = fileNameWithParams.split('?')[0]; // Remove query parameters
        const decodedFileName = decodeURIComponent(fileName);

        // Extract just the UUID filename part after the folder
        const fileNameParts = decodedFileName.split('%2F'); // %2F is URL encoded '/'
        const actualFileName = fileNameParts[fileNameParts.length - 1];

        if (actualFileName && actualFileName !== '') {
          await deleteMediaFile(actualFileName);
        }
      } catch (mediaError) {
        console.warn('Error deleting media file:', mediaError);
        // Continue with blessing deletion even if media deletion fails
      }
    }

    // Delete all reactions associated with this blessing
    const reactionsQ = query(collection(db, 'reactions'), where('blessingId', '==', blessingId));
    const reactionsSnapshot = await getDocs(reactionsQ);
    const deleteReactionPromises = reactionsSnapshot.docs.map(reactionDoc =>
      deleteDoc(doc(db, 'reactions', reactionDoc.id))
    );
    await Promise.all(deleteReactionPromises);

    // Finally, delete the blessing document
    await deleteDoc(doc(db, 'blessings', blessingId));

    return true;
  } catch (error) {
    console.error('Error deleting blessing:', error);
    throw error;
  }
};

export const upsertUser = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), userData, { merge: true });
  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
};

export const createPaymentLinks = () => {
  return {
    bit: {
      url: `https://www.bitpay.co.il/app/me/8960D4FC-2726-3863-AC5F-847FBB3C9D231C50`,
      displayText: 'העבירו דרך Bit',
    },
    paybox: {
      url: 'https://links.payboxapp.com/BW58kFmIYWb',
      displayText: 'תשלום דרך PayBox',
    }
  };
};

// Generate QR code data for payment (you'll need to implement QR generation)
export const generatePaymentQR = (paymentType, amount = null) => {
  const links = createPaymentLinks();
  const link = links[paymentType];

  if (!link) {
    throw new Error('סוג תשלום לא נתמך');
  }

  // For QR codes, you might want to add amount to the URL if supported
  let qrData = link.url;
  if (amount && paymentType === 'paybox') {
    qrData += `?amount=${amount}`;
  }

  return qrData;
};

// Common emoji reactions - expanded list for horizontal scrolling
export const getCommonEmojis = () => [
  '❤️', '😍', '🙌', '🥳', '😂', '👏', '🎉', '😊', '🥰', '💕',
  '🔥', '✨', '💯', '🙏', '😘', '🤗', '😭', '🥺', '💪', '🎊'
];

// Format date for display in Hebrew
export const formatDate = (date) => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return new Date(date.seconds ? date.seconds * 1000 : date).toLocaleDateString('he-IL', options);
};

// Group reactions by emoji
export const groupReactionsByEmoji = (reactions) => {
  const grouped = {};

  reactions.forEach(reaction => {
    // Handle both old format (single emoji) and new format (multiple emojis)
    const emojis = reaction.emojis || [reaction.emoji];

    emojis.forEach(emoji => {
      if (emoji) {
        if (!grouped[emoji]) {
          grouped[emoji] = [];
        }
        grouped[emoji].push({
          id: reaction.userId,
          username: reaction.username
        });
      }
    });
  });

  return grouped;
};
