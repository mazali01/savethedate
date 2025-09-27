import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing microphone access and audio level detection
 * @param {boolean} requestPermission - Whether to request microphone permission
 * @returns {Object} - Hook state and methods
 */
export const useMicrophoneLevel = (requestPermission = false) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);

  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Cleanup function (defined early to avoid circular dependency)
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
    setIsActive(false);
  }, []);

  // Check microphone permission status
  const checkPermission = useCallback(async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' });
      setHasPermission(permission.state === 'granted');

      permission.addEventListener('change', () => {
        setHasPermission(permission.state === 'granted');
        if (permission.state !== 'granted') {
          cleanup();
        }
      });

      return permission.state === 'granted';
    } catch {
      console.warn('Permission API not supported, will request directly');
      return null;
    }
  }, [cleanup]);

  // Request microphone permission and setup audio monitoring
  const requestMicrophoneAccess = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      setHasPermission(true);

      // Setup audio context for level detection
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      return { stream, analyser, audioContext };
    } catch (err) {
      console.error('Failed to access microphone:', err);
      let errorMessage = 'שגיאה בגישה למיקרופון';

      if (err.name === 'NotAllowedError') {
        errorMessage = 'נדרש אישור לגישה למיקרופון';
        setHasPermission(false);
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'לא נמצא מיקרופון במכשיר';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'המיקרופון בשימוש על ידי אפליקציה אחרת';
      }

      setError(errorMessage);
      setHasPermission(false);
      throw new Error(errorMessage);
    }
  }, []);

  // Monitor audio levels
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (!isActive || !analyserRef.current) return;

      analyser.getByteFrequencyData(dataArray);

      // Calculate RMS (Root Mean Square) for better audio level detection
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += (dataArray[i] / 255) ** 2;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Apply smoothing and scaling
      const smoothedLevel = Math.min(1, rms * 3); // Scale up for better sensitivity
      setAudioLevel(prev => prev * 0.7 + smoothedLevel * 0.3); // Smooth transition

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }, [isActive]);

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    try {
      if (!mediaStreamRef.current || !analyserRef.current) {
        await requestMicrophoneAccess();
      }
      setIsActive(true);
    } catch (err) {
      console.error('Failed to start monitoring:', err);
    }
  }, [requestMicrophoneAccess]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsActive(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Initialize permission check
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Request access when needed
  useEffect(() => {
    if (requestPermission && hasPermission === null) {
      requestMicrophoneAccess().catch(() => {
        // Error already handled in the function
      });
    }
  }, [requestPermission, hasPermission, requestMicrophoneAccess]);

  // Start/stop monitoring based on isActive
  useEffect(() => {
    if (isActive && analyserRef.current) {
      monitorAudioLevel();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, monitorAudioLevel]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    hasPermission,
    audioLevel,
    error,
    isActive,
    mediaStream: mediaStreamRef.current,
    analyser: analyserRef.current,
    audioContext: audioContextRef.current,
    requestMicrophoneAccess,
    startMonitoring,
    stopMonitoring,
    cleanup
  };
};

export default useMicrophoneLevel;
