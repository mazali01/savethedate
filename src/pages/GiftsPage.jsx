import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
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
  upsertUser
} from '../services/giftService';
import { getInvitedUserById } from '../services/rsvpService';
import './GiftsPage.css';

const GiftsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blessings, setBlessings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

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

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      try {
        validateMediaFile(file);
        setMediaFile(file);

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setMediaPreview({
          url: previewUrl,
          type: file.type.startsWith('image/') ? 'image' : 'video'
        });
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }
  }, [showNotification]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    maxFiles: 1
  });

  // Remove media file
  const removeMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview.url);
    }
    setMediaFile(null);
    setMediaPreview(null);
  };

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
      if (mediaFile) {
        const uploadResult = await uploadMediaFile(mediaFile);
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
      {/* Fixed Header with Back Button and Condensed Blessing Form */}
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

          {/* Condensed Blessing Form */}
          <form onSubmit={handleSubmit} className="condensed-blessing-form">
            <div className="textarea-container">
              <textarea
                className="condensed-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="כתבו את הברכה שלכם כאן... ✨"
                rows={3}
              />
              <div className="textarea-buttons">
                <input
                  {...getInputProps()}
                  id="file-upload"
                  style={{ display: 'none' }}
                />
                <IconButton
                  component="label"
                  htmlFor="file-upload"
                  className="attach-button-inside"
                  size="small"
                  sx={{
                    color: '#636e72',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' }
                  }}
                >
                  <AttachFileIcon />
                </IconButton>
                <IconButton
                  type="submit"
                  disabled={isSubmitting || !message.trim() || !user}
                  className="send-button-inside"
                  size="small"
                  sx={{
                    color: '#74b9ff',
                    '&:hover': { backgroundColor: 'rgba(116, 185, 255, 0.1)' },
                    '&:disabled': { color: '#ccc' }
                  }}
                >
                  {isSubmitting ? '⏳' : '💌'}
                </IconButton>
              </div>
            </div>

            <div className="form-options">
              <label className="privacy-checkbox">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span>ברכה ציבורית</span>
              </label>

              {mediaPreview && (
                <div className="media-preview-small">
                  {mediaPreview.type === 'image' ? (
                    <img src={mediaPreview.url} alt="Preview" />
                  ) : (
                    <video src={mediaPreview.url} />
                  )}
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="remove-media-small"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </form>
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
                      style={{ '--rotation': `${blessing.rotation}deg` }}
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
                      </div>

                      {blessing.mediaUrl && (
                        <div className="blessing-media">
                          {blessing.mediaType === 'image' ? (
                            <img
                              src={blessing.mediaUrl}
                              alt="Blessing media"
                              loading="lazy"
                            />
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
                          {commonEmojis.slice(0, 6).map((emoji) => (
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

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className={`notification ${notification.type}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GiftsPage;
