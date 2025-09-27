import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatsAppInput from '../components/WhatsAppInput';
import PrivacyToggle from '../components/PrivacyToggle';
import Notification from '../components/Notification';
import VirtualizedBlessingsList from '../components/VirtualizedBlessingsList';
import EmojiPickerModal from '../components/EmojiPickerModal';
import PaymentFooter from '../components/PaymentFooter';
import {
  usePaginatedBlessings,
  useInvitedUser,
  useUploadMediaFile,
  useCreateBlessing,
  useAddReaction,
  useRemoveReaction,
  useDeleteBlessing,
  useUpsertUser,
  useUpdateBlessingPrivacy
} from '../api';
import './GiftsPage.css';

const GiftsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  const [selectedBlessingForEmoji, setSelectedBlessingForEmoji] = useState(null);

  // React Query hooks
  const { data: user } = useInvitedUser(userId);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: blessingsError
  } = usePaginatedBlessings(userId);

  const uploadMediaMutation = useUploadMediaFile();
  const createBlessingMutation = useCreateBlessing();
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();
  const deleteBlessingMutation = useDeleteBlessing();
  const upsertUserMutation = useUpsertUser();
  const updateBlessingPrivacyMutation = useUpdateBlessingPrivacy();

  const blessings = useMemo(() => {
    if (!data?.pages) return [];
    const flatBlessings = data.pages.flatMap(page => page.blessings);

    console.log('Blessings loaded:', flatBlessings.length);
    return flatBlessings;
  }, [data]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle media selection from WhatsApp input
  const handleMediaSelect = (mediaData) => {
    setMediaPreview(mediaData);
  };

  // Remove media file
  const removeMedia = () => {
    if (mediaPreview) {
      // Handle both single media and multiple media
      if (Array.isArray(mediaPreview)) {
        mediaPreview.forEach(media => {
          if (media.url) {
            URL.revokeObjectURL(media.url);
          }
        });
      } else {
        if (mediaPreview.url) {
          URL.revokeObjectURL(mediaPreview.url);
        }
      }
    }
    setMediaPreview(null);
  };

  // Handle blessing submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      showNotification('שגיאה בטעינת נתוני המשתמש', 'error');
      return;
    }

    try {
      // Ensure user exists in database
      await upsertUserMutation.mutateAsync({
        userId: user.id,
        userData: {
          username: user.name || user.invitedName || 'אורח'
        }
      });

      let mediaUrls = [];
      let mediaTypes = [];

      // Upload media if present
      if (mediaPreview) {
        // Handle both single media and multiple media
        const mediaArray = Array.isArray(mediaPreview) ? mediaPreview : [mediaPreview];

        for (const media of mediaArray) {
          if (media?.file) {
            const uploadResult = await uploadMediaMutation.mutateAsync({
              file: media.file,
              folder: 'blessings'
            });
            mediaUrls.push(uploadResult.url);
            mediaTypes.push(uploadResult.type);
          }
        }
      }

      // Create blessing with multiple media support
      const blessingData = {
        userId: user.id,
        username: user.name || user.invitedName || 'אורח',
        message: message.trim(),
        isPublic
      };

      // Add media data - support both single and multiple media for backward compatibility
      if (mediaUrls.length > 0) {
        if (mediaUrls.length === 1) {
          // Single media - keep backward compatibility
          blessingData.mediaUrl = mediaUrls[0];
          blessingData.mediaType = mediaTypes[0];
        } else {
          // Multiple media - use arrays
          blessingData.mediaUrls = mediaUrls;
          blessingData.mediaTypes = mediaTypes;
        }
        // Always include arrays for future compatibility
        blessingData.mediaUrls = mediaUrls;
        blessingData.mediaTypes = mediaTypes;
      }

      await createBlessingMutation.mutateAsync(blessingData);

      // Reset form
      setMessage('');
      setIsPublic(true);
      removeMedia();

    } catch (error) {
      console.error('Error submitting blessing:', error);
      showNotification('שגיאה בשליחת הברכה', 'error');
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
      const userReaction = blessing?.reactions?.find(r => r.userId === user.id);

      if (userReaction && userReaction.emojis && userReaction.emojis.includes(emoji)) {
        // Remove this specific emoji from user's reactions
        const updatedEmojis = userReaction.emojis.filter(e => e !== emoji);

        if (updatedEmojis.length === 0) {
          // Remove entire reaction if no emojis left
          await removeReactionMutation.mutateAsync({
            blessingId,
            userId: user.id
          });
        } else {
          // Update reaction with remaining emojis
          await addReactionMutation.mutateAsync({
            blessingId,
            userId: user.id,
            username: user.name || user.invitedName || 'אורח',
            emojis: updatedEmojis
          });
        }
      } else {
        // Add emoji to existing emojis or create new reaction
        const existingEmojis = userReaction?.emojis || [];
        const updatedEmojis = [...existingEmojis, emoji];

        await addReactionMutation.mutateAsync({
          blessingId,
          userId: user.id,
          username: user.name || user.invitedName || 'אורח',
          emojis: updatedEmojis
        });
      }

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
      await deleteBlessingMutation.mutateAsync({
        blessingId,
        userId: user.id
      });

      showNotification('הברכה נמחקה בהצלחה');
    } catch (error) {
      console.error('Error deleting blessing:', error);
      showNotification(error.message || 'שגיאה במחיקת הברכה', 'error');
    }
  };

  // Handle blessing privacy toggle
  const handleToggleBlessingPrivacy = async (blessingId, currentIsPublic) => {
    if (!user) {
      showNotification('אנא התחבר כדי לשנות הגדרות פרטיות', 'error');
      return;
    }

    try {
      await updateBlessingPrivacyMutation.mutateAsync({
        blessingId,
        isPublic: !currentIsPublic
      });

      showNotification(
        !currentIsPublic ? 'הברכה הפכה לציבורית' : 'הברכה הפכה לפרטית',
        'success'
      );
    } catch (error) {
      console.error('Error updating blessing privacy:', error);
      showNotification(error.message || 'שגיאה בעדכון הגדרות הפרטיות', 'error');
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

  // Get user's reaction for a blessing
  const getUserReaction = (blessing) => {
    if (!user) return null;
    return blessing.reactions?.find(r => r.userId === user.id);
  };

  // Handle back navigation
  const handleBack = () => {
    if (userId) {
      navigate(`/user/${userId}`);
    } else {
      navigate('/');
    }
  };

  // Loading state check
  const isSubmitting = createBlessingMutation.isPending || uploadMediaMutation.isPending;
  const isLoadingMore = isFetchingNextPage;
  const hasMore = hasNextPage;
  const error = blessingsError?.message;

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
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">טוען ברכות...</div>
            </div>
          ) : blessings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💌</div>
              <div className="empty-state-text">עדיין אין ברכות</div>
              <div className="empty-state-subtext">
                היו הראשונים לשלוח ברכה מתוקה!
              </div>
            </div>
          ) : (
            <VirtualizedBlessingsList
              items={blessings || []}
              loadMore={fetchNextPage || (() => Promise.resolve())}
              hasMore={hasMore || false}
              isLoading={isLoadingMore || false}
              user={user || null}
              onReaction={handleReaction || (() => { })}
              onDeleteBlessing={handleDeleteBlessing || (() => { })}
              onToggleBlessingPrivacy={handleToggleBlessingPrivacy || (() => { })}
              onEmojiPickerOpen={handleEmojiPickerOpen || (() => { })}
              getUserReaction={getUserReaction || (() => null)}
            />
          )}
        </div>
      </div>

      {/* Fixed Footer with Payment Options */}
      <PaymentFooter />

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={!!emojiPickerAnchor}
        onClose={handleEmojiPickerClose}
        onEmojiSelect={(emoji) => {
          if (selectedBlessingForEmoji) {
            handleReaction(selectedBlessingForEmoji, emoji);
          }
        }}
      />

      {/* Notification */}
      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
};

export default GiftsPage;
