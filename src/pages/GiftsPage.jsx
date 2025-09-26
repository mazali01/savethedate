import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import WhatsAppInput from '../components/WhatsAppInput';
import PaymentGifts from '../components/PaymentGifts';
import PrivacyToggle from '../components/PrivacyToggle';
import Notification from '../components/Notification';
import {
  uploadMediaFile,
  validateMediaFile,
  createPaymentLinks,
  getCommonEmojis,
  formatDate,
  groupReactionsByEmoji,
  createBlessing,
  getPublicBlessings,
  addReaction,
  removeReaction,
  upsertUser,
  deleteBlessing
} from '../services/giftService';
import { getInvitedUserById } from '../services/rsvpService';
import './GiftsPage.css';

const GiftsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blessings, setBlessings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  const [selectedBlessingForEmoji, setSelectedBlessingForEmoji] = useState(null);

  const paymentLinks = useMemo(() => createPaymentLinks(), []);
  const commonEmojis = useMemo(() => getCommonEmojis(), []);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await getInvitedUserById(userId);
        if (userData) {
          setUser({
            uid: userId,
            displayName: userData.name || userData.invitedName,
            email: userData.email
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    if (userId) {
      loadUserData();
    }
  }, [userId]);

  // Load blessings
  const loadBlessings = useCallback(async () => {
    try {
      setIsLoading(true);
      const blessingsData = await getPublicBlessings();

      // Add random rotation for masonry effect
      const blessingsWithRotation = blessingsData.map(blessing => ({
        ...blessing,
        rotation: (Math.random() - 0.5) * 6 // Random rotation between -3 and 3 degrees
      }));

      setBlessings(blessingsWithRotation);
    } catch (error) {
      console.error('Error loading blessings:', error);
      setError('שגיאה בטעינת הברכות');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlessings();
  }, [loadBlessings]);

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Handle media selection from WhatsApp input
  const handleMediaSelect = useCallback((mediaData) => {
    setMediaPreview(mediaData);
  }, []);

  // Remove media file
  const removeMedia = useCallback(() => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview.url);
    }
    setMediaPreview(null);
  }, [mediaPreview]);

  // Handle blessing submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      showNotification('שגיאה בטעינת נתוני המשתמש', 'error');
      return;
    }

    if (!message.trim()) {
      showNotification('אנא כתבו הודעה', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      // Ensure user exists in database
      await upsertUser(user.uid, {
        username: user.displayName || user.email?.split('@')[0] || 'אורח'
      });

      let mediaUrl = null;
      let mediaType = null;

      // Upload media if present
      if (mediaPreview?.file) {
        const uploadResult = await uploadMediaFile(mediaPreview.file);
        mediaUrl = uploadResult.url;
        mediaType = uploadResult.type;
      }

      // Create blessing
      await createBlessing({
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'אורח',
        message: message.trim(),
        isPublic,
        mediaUrl,
        mediaType
      });

      // Reset form
      setMessage('');
      setIsPublic(true);
      removeMedia();

      showNotification('הברכה נשלחה בהצלחה! 🎉');

      // Reload blessings
      loadBlessings();

    } catch (error) {
      console.error('Error submitting blessing:', error);
      showNotification('שגיאה בשליחת הברכה', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle emoji reaction
  const handleReaction = async (blessingId, emoji) => {
    if (!user) {
      showNotification('אנא התחבר כדי להגיב', 'error');
      return;
    }

    try {
      // Check if user already reacted with this emoji
      const blessing = blessings.find(b => b.id === blessingId);
      const userReaction = blessing?.reactions?.find(r => r.userId === user.uid);

      if (userReaction && userReaction.emoji === emoji) {
        // Remove reaction
        await removeReaction(blessingId, user.uid);
      } else {
        // Add or update reaction
        await addReaction(blessingId, user.uid, user.displayName || 'אורח', emoji);
      }

      // Reload blessings to show updated reactions
      loadBlessings();

    } catch (error) {
      console.error('Error handling reaction:', error);
      showNotification('שגיאה בעדכון התגובה', 'error');
    }
  };

  // Handle blessing deletion
  const handleDeleteBlessing = async (blessingId) => {
    if (!user) {
      showNotification('אנא התחבר כדי למחוק ברכה', 'error');
      return;
    }

    // Show confirmation dialog
    const isConfirmed = window.confirm('האם אתם בטוחים שברצונכם למחוק את הברכה? פעולה זו לא ניתנת לביטול.');

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteBlessing(blessingId, user.uid);
      showNotification('הברכה נמחקה בהצלחה');

      // Reload blessings to reflect the deletion
      loadBlessings();
    } catch (error) {
      console.error('Error deleting blessing:', error);
      showNotification(error.message || 'שגיאה במחיקת הברכה', 'error');
    }
  };

  // Handle emoji picker open
  const handleEmojiPickerOpen = (event, blessingId) => {
    setEmojiPickerAnchor(event.currentTarget);
    setSelectedBlessingForEmoji(blessingId);
  };

  // Handle emoji picker close
  const handleEmojiPickerClose = () => {
    setEmojiPickerAnchor(null);
    setSelectedBlessingForEmoji(null);
  };

  // Handle emoji selection from picker
  const handleEmojiSelect = (emoji) => {
    if (selectedBlessingForEmoji) {
      // emoji-mart returns an emoji object, we need the native emoji
      const emojiChar = emoji.native || emoji.emoji || emoji;
      handleReaction(selectedBlessingForEmoji, emojiChar);
    }
    handleEmojiPickerClose();
  };

  // Get user's reaction for a blessing
  const getUserReaction = (blessing) => {
    if (!user) return null;
    return blessing.reactions?.find(r => r.userId === user.uid);
  };

  // Handle back navigation
  const handleBack = () => {
    if (userId) {
      navigate(`/user/${userId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="gifts-container">
      {/* Fixed Header with Back Button */}
      <div className="fixed-header">
        <IconButton
          onClick={handleBack}
          className="back-button-absolute"
          sx={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            color: '#2e7d32',
            zIndex: 10,
            '&:hover': {
              backgroundColor: 'rgba(46, 125, 50, 0.1)',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <div className="header-content">
          <h2 className="header-title">ברכות ואיחולים מהלב 💝</h2>

          {/* WhatsApp Input - Back to header */}
          <div className="header-input-section">
            <div className="input-with-privacy">
              <WhatsAppInput
                message={message}
                setMessage={setMessage}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                placeholder="כאן כותבים שאתם אוהבים אותנו"
                onMediaSelect={handleMediaSelect}
                mediaPreview={mediaPreview}
                onRemoveMedia={removeMedia}
                disabled={!user}
              />

              <PrivacyToggle
                isPublic={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isSubmitting || !user}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Body - Blessings Feed */}
      <div className="scrollable-body">
        <div className="feed-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="loading-spinner">טוען ברכות...</div>
          ) : blessings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💌</div>
              <div className="empty-state-text">עדיין אין ברכות</div>
              <div className="empty-state-subtext">
                היו הראשונים לשלוח ברכה מתוקה!
              </div>
            </div>
          ) : (
            <div className="blessings-masonry">
              <AnimatePresence>
                {blessings.map((blessing) => {
                  const userReaction = getUserReaction(blessing);
                  const groupedReactions = groupReactionsByEmoji(blessing.reactions || []);

                  return (
                    <motion.div
                      key={blessing.id}
                      className="blessing-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      layout
                    >
                      <div className="blessing-header">
                        <div className="blessing-avatar">
                          {blessing.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="blessing-user-info">
                          <div className="blessing-username">
                            {blessing.username}
                          </div>
                          <div className="blessing-date">
                            {formatDate(blessing.createdAt)}
                          </div>
                        </div>
                        {/* Delete button - only show for user's own blessings */}
                        {user && blessing.userId === user.uid && (
                          <IconButton
                            onClick={() => handleDeleteBlessing(blessing.id)}
                            size="small"
                            className="delete-blessing-button"
                            sx={{
                              marginRight: 'auto',
                              color: '#dc3545',
                              opacity: 0.7,
                              '&:hover': {
                                opacity: 1,
                                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                              },
                            }}
                            title="מחק ברכה"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </div>

                      {blessing.mediaUrl && (
                        <div className="blessing-media">
                          {blessing.mediaType === 'image' ? (
                            <img
                              src={blessing.mediaUrl}
                              alt="Blessing media"
                              loading="lazy"
                            />
                          ) : blessing.mediaType === 'audio' ? (
                            <div className="audio-message">
                              <audio
                                src={blessing.mediaUrl}
                                controls
                                preload="metadata"
                              />
                              <span className="audio-label">🎵 Voice Message</span>
                            </div>
                          ) : (
                            <video
                              src={blessing.mediaUrl}
                              controls
                              preload="metadata"
                            />
                          )}
                        </div>
                      )}

                      <div className="blessing-message">
                        {blessing.message}
                      </div>

                      <div className="blessing-reactions">
                        <div className="reaction-buttons">
                          {commonEmojis.slice(0, 5).map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(blessing.id, emoji)}
                              className={`reaction-button ${userReaction?.emoji === emoji ? 'active' : ''
                                }`}
                              title={`הוסף ${emoji}`}
                            >
                              {emoji}
                              {groupedReactions[emoji] && (
                                <span className="reaction-count">
                                  {groupedReactions[emoji].length}
                                </span>
                              )}
                            </button>
                          ))}
                          {/* Emoji picker button */}
                          <button
                            onClick={(e) => handleEmojiPickerOpen(e, blessing.id)}
                            className="reaction-button emoji-picker-button"
                            title="בחר אימוג'י נוסף"
                          >
                            <AddReactionIcon fontSize="small" />
                          </button>
                        </div>

                        {Object.keys(groupedReactions).length > 0 && (
                          <div className="existing-reactions">
                            {Object.entries(groupedReactions).map(([emoji, users]) => (
                              <div key={emoji} className="existing-reaction">
                                {emoji} <span className="count">{users.length}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer with Payment Options */}
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

      {/* Emoji Picker Modal */}
      <AnimatePresence>
        {emojiPickerAnchor && (
          <motion.div
            className="emoji-picker-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleEmojiPickerClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              className="emoji-picker-container"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                maxWidth: '320px',
                maxHeight: '400px',
                width: '100%'
              }}
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
                searchPosition="top"
                set="native"
                showPreview={false}
                showSkinTones={false}
                emojiButtonSize={32}
                emojiSize={24}
                perLine={8}
                maxFrequentRows={2}
                categories={['frequent', 'people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols']}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification */}
      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
};

export default GiftsPage;
