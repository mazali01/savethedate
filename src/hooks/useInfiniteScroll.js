import { useState, useCallback, useRef } from 'react';

export const useInfiniteScroll = (fetchFunction, pageSize = 10) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const lastDocId = useRef(null);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setData([]);
      lastDocId.current = null;
      setHasMore(true);

      const result = await fetchFunction(pageSize, null);

      setData(result.blessings || result);
      setHasMore(result.hasMore ?? true);
      lastDocId.current = result.lastDocId || null;
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, pageSize]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return Promise.resolve();
    }

    try {
      setIsLoadingMore(true);
      setError(null);

      const result = await fetchFunction(pageSize, lastDocId.current);

      const newData = result.blessings || result;
      if (newData && newData.length > 0) {
        setData(prevData => [...prevData, ...newData]);
      }

      setHasMore(result.hasMore ?? false);
      lastDocId.current = result.lastDocId || null;
    } catch (err) {
      console.error('Error loading more data:', err);
      setError(err.message || 'Failed to load more data');
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchFunction, pageSize, isLoadingMore, hasMore]);

  const refetch = useCallback(() => {
    return loadInitialData();
  }, [loadInitialData]);

  return {
    data,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refetch,
    loadInitialData
  };
};
