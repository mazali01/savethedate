import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

// Upload media file to Firebase Storage
export const uploadMediaFile = async (file, folder = 'blessings') => {
  try {
    // Create a unique filename
    const fileExtension = file.name.split('.').pop();
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

export const addReaction = async (blessingId, userId, username, emoji) => {
  try {
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
        emoji,
        createdAt: new Date()
      });
    } else {
      // Create new reaction
      await addDoc(collection(db, 'reactions'), {
        blessingId,
        userId,
        username,
        emoji,
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

// Create payment links for Bit and PayBox
export const createPaymentLinks = () => {
  return {
    bit: {
      // For Bit, users need to:
      // 1. Open Bit app
      // 2. Go to "Request Money" or "Send Money"
      // 3. Enter your phone number
      // You can also create a Bit.ly link that opens the Bit app with pre-filled info
      url: `https://bit.ly/3A1B2C3`, // Replace with your actual Bit link
      phone: '+972-50-123-4567', // Replace with your actual phone number
      displayText: 'העבירו דרך Bit',
      instructions: 'לתשלום דרך Bit - לחצו על הקישור או חייגו 050-123-4567',
      qrText: 'bit://pay/0501234567' // This creates a QR that opens Bit app
    },
    paybox: {
      // For PayBox, you need to:
      // 1. Sign up to PayBox business account at https://payboxapp.com
      // 2. Create a payment page 
      // 3. Get the payment page link
      url: 'https://payboxapp.com/checkout/your-business-id', // Replace with your actual PayBox checkout link
      displayText: 'תשלום דרך PayBox',
      instructions: 'לתשלום דרך PayBox - לחצו על הקישור ובחרו את הסכום',
      businessId: 'your-business-id' // Your PayBox business ID
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

// Common emoji reactions
export const getCommonEmojis = () => [
  '❤️', '😍', '🙌', '🥳', '😂'
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
    if (!grouped[reaction.emoji]) {
      grouped[reaction.emoji] = [];
    }
    grouped[reaction.emoji].push({
      id: reaction.userId,
      username: reaction.username
    });
  });

  return grouped;
};
