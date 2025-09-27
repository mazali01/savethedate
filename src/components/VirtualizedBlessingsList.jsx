import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import BlessingItem from './BlessingItem';

const VirtualizedBlessingsList = ({
  items = [],
  loadMore,
  hasMore = false,
  isLoading = false,
  user,
  onReaction,
  onDeleteBlessing,
  onEmojiPickerOpen,
  getUserReaction,
}) => {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: hasMore ? items.length + 1 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    measureElement: (element) => element?.getBoundingClientRect().height ?? 0,
    overscan: 5,
  });

  const items_with_loader = React.useMemo(() => {
    return hasMore ? [...items, undefined] : items;
  }, [items, hasMore]);

  // Simple intersection observer for infinite loading
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= items.length - 1 &&
      hasMore &&
      !isLoading
    ) {
      loadMore();
    }
  }, [
    hasMore,
    loadMore,
    isLoading,
    items.length,
    virtualItems,
  ]);

  return (
    <div
      ref={parentRef}
      className="virtual-feed"
      style={{
        height: '100%',
        overflow: 'auto',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE and Edge
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const isLoaderRow = virtualItem.index > items.length - 1;
          const item = items_with_loader[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {isLoaderRow ? (
                hasMore ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    {isLoading ? 'טוען...' : 'טוען עוד...'}
                  </div>
                ) : null
              ) : (
                <BlessingItem
                  key={item.id}
                  index={virtualItem.index}
                  blessing={item}
                  user={user}
                  onReaction={onReaction}
                  onDeleteBlessing={onDeleteBlessing}
                  onEmojiPickerOpen={onEmojiPickerOpen}
                  getUserReaction={getUserReaction}
                  setupResizeObserver={(element) => {
                    if (element) virtualizer.measureElement(element);
                  }}
                />
              )}
            </div>
          );
        })}

        {/* No more items indicator */}
        {!hasMore && items.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: `${virtualizer.getTotalSize()}px`,
              left: 0,
              width: '100%',
              padding: '1em',
              paddingBottom: '10em',
              textAlign: 'center',
              color: '#666',
              fontSize: '14px',
              opacity: 0.7,
            }}
          >
            ✨ זה הכל! אין עוד ברכות להציג ✨
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedBlessingsList;
