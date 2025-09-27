import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const EmojiPickerModal = ({
  isOpen,
  onClose,
  onEmojiSelect
}) => {
  const handleEmojiSelect = (emoji) => {
    // emoji-mart returns an emoji object, we need the native emoji
    const emojiChar = emoji.native || emoji.emoji || emoji;
    onEmojiSelect(emojiChar);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="emoji-picker-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
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
              direction: 'rtl'
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
              searchPlaceholder="חיפוש אימוג'ים..."
              notFoundEmoji="cry"
              i18n={{
                search: 'חיפוש',
                clear: 'נקה', // Clear search
                notfound: 'לא נמצאו אימוג\'ים',
                skintext: 'בחר גוון עור ברירת מחדל',
                categories: {
                  search: 'תוצאות חיפוש',
                  recent: 'בשימוש תכוף',
                  people: 'חיוכים ואנשים',
                  nature: 'חיות וטבע',
                  foods: 'אוכל ושתייה',
                  activity: 'פעילויות',
                  places: 'נסיעות ומקומות',
                  objects: 'חפצים',
                  symbols: 'סמלים',
                  flags: 'דגלים',
                  custom: 'מותאם אישית'
                },
                skins: {
                  choose: 'בחר גוון עור ברירת מחדל',
                  '1': 'גוון עור ברירת מחדל',
                  '2': 'גוון עור בהיר',
                  '3': 'גוון עור בינוני-בהיר',
                  '4': 'גוון עור בינוני',
                  '5': 'גוון עור בינוני-כהה',
                  '6': 'גוון עור כהה'
                }
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmojiPickerModal;
