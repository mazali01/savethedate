import React, { useState } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line
import { IconButton, CircularProgress, Popover, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { formatDate, groupReactionsByEmoji, getCommonEmojis } from '../services/giftService';

const BlessingItem = ({
  index,
  blessing,
  user,
  onReaction,
  onDeleteBlessing,
  onToggleBlessingPrivacy,
  onEmojiPickerOpen,
  getUserReaction,
  setupResizeObserver
}) => {
  // Popover state
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [popoverContent, setPopoverContent] = useState(null);

  // Handle reaction popover
  const handleReactionClick = (event, emoji, users) => {
    setPopoverAnchor(event.currentTarget);
    setPopoverContent({ emoji, users });
  };

  const handlePopoverClose = () => {
    setPopoverAnchor(null);
    setPopoverContent(null);
  };

  if (!blessing) {
    // Loading placeholder
    return (
      <div
        className="blessing-card loading-placeholder"
        ref={(el) => setupResizeObserver(el, index)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '200px'
        }}>
          <CircularProgress size={30} />
        </div>
      </div>
    );
  }

  const userReaction = getUserReaction(blessing);
  const groupedReactions = groupReactionsByEmoji(blessing.reactions || []);
  const commonEmojis = getCommonEmojis();

  return (
    <motion.div
      className="blessing-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      ref={(el) => setupResizeObserver(el, index)}
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
        {user && blessing.userId === user.id && (
          <>
            <IconButton
              onClick={() => onToggleBlessingPrivacy(blessing.id, blessing.isPublic)}
              size="small"
              className="privacy-toggle-button"
              sx={{
                marginRight: '4px',
                color: blessing.isPublic ? '#74b9ff' : '#fdcb6e',
                opacity: 0.7,
                '&:hover': {
                  opacity: 1,
                  backgroundColor: blessing.isPublic ? 'rgba(116, 185, 255, 0.1)' : 'rgba(253, 203, 110, 0.1)',
                },
              }}
              title={blessing.isPublic ? 'הפוך לפרטי' : 'הפוך לציבורי'}
            >
              {blessing.isPublic ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </IconButton>
            <IconButton
              onClick={() => onDeleteBlessing(blessing.id)}
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
          </>
        )}
      </div>

      {/* Privacy indicator for private blessings */}
      {user && blessing.userId === user.id && !blessing.isPublic && (
        <div className="private-blessing-badge">
          <span className="private-icon">🔒</span>
          <span className="private-text">ברכה פרטית - רק אתם והזוג יכולים לראות</span>
        </div>
      )}

      {/* Media Display - Support both single and multiple media */}
      {(blessing.mediaUrl || (blessing.mediaUrls && blessing.mediaUrls.length > 0)) && (
        <div className="blessing-media">
          {blessing.mediaUrls && blessing.mediaUrls.length > 0 ? (
            // Multiple media files
            <div className="multiple-media-display">
              {blessing.mediaUrls.map((mediaUrl, index) => {
                const mediaType = blessing.mediaTypes?.[index] || 'image';
                return (
                  <div key={index} className="media-item-display">
                    {mediaType === 'image' ? (
                      <img
                        src={mediaUrl}
                        alt="Blessing media"
                        loading="lazy"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    ) : mediaType === 'audio' ? (
                      <div className="audio-message">
                        <audio
                          src={mediaUrl}
                          controls
                          preload="metadata"
                        />
                      </div>
                    ) : (
                      <video
                        src={mediaUrl}
                        controls
                        preload="metadata"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Single media file (backward compatibility)
            <>
              {blessing.mediaType === 'image' ? (
                <img
                  src={blessing.mediaUrl}
                  alt="Blessing media"
                  loading="lazy"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              ) : blessing.mediaType === 'audio' ? (
                <div className="audio-message">
                  <audio
                    src={blessing.mediaUrl}
                    controls
                    preload="metadata"
                  />
                </div>
              ) : (
                <video
                  src={blessing.mediaUrl}
                  controls
                  preload="metadata"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              )}
            </>
          )}
        </div>
      )}

      <div className="blessing-message">
        {blessing.message}
      </div>

      <div className="blessing-reactions">
        <div className="reaction-buttons">

          {/* Emoji picker button on the right */}
          <button
            onClick={(e) => onEmojiPickerOpen(e, blessing.id)}
            className="reaction-button emoji-picker-button"
            title="בחר אימוג'י נוסף"
          >
            <AddReactionIcon fontSize="small" />
          </button>

          {/* Common emojis as horizontal scrollable list */}
          <div className="common-emojis-scroll">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReaction(blessing.id, emoji)}
                className={`reaction-button ${userReaction && userReaction.emojis && userReaction.emojis.includes(emoji) ? 'active' : ''}`}
                title={`הוסף ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {Object.keys(groupedReactions).length > 0 && (
          <div className="existing-reactions">
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <div
                key={emoji}
                className="existing-reaction clickable-reaction"
                onClick={(e) => handleReactionClick(e, emoji, users)}
              >
                {emoji} <span className="count">{users.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Popover for showing users who reacted */}
      <Popover
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          style: {
            padding: '8px 12px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: '200px',
          }
        }}
      >
        {popoverContent && (
          <div style={{ direction: 'rtl', textAlign: 'center' }}>
            <Typography variant="body2" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {popoverContent.emoji}
            </Typography>
            <Typography variant="body2" style={{ color: '#666' }}>
              {popoverContent.users.map(user => user.username).join(', ')}
            </Typography>
          </div>
        )}
      </Popover>
    </motion.div>
  );
};

export default BlessingItem;
