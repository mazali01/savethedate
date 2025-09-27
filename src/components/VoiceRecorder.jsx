import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Dummy reference to satisfy linter in case tree-shaking marks it unused
// (motion is heavily used later in JSX; this line keeps linter happy)
const __ensureMotionUsed = motion && true;
import { MicrophoneIcon, StopIcon, XMarkIcon, PaperAirplaneIcon, TrashIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import WaveSurfer from 'wavesurfer.js';
import './VoiceRecorder.css';
import './VoiceRecorderEnhanced.css';

// Real-time Audio Visualizer Component using WaveSurfer
const RealtimeAudioVisualizer = ({ analyser, isActive }) => {
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (waveformRef.current && !wavesurferRef.current) {
            // Initialize WaveSurfer for visualization
            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#00a884',
                progressColor: '#00c496',
                backgroundColor: 'transparent',
                height: 60,
                normalize: true,
                responsive: true,
                barWidth: 3,
                barGap: 1,
                barRadius: 2,
            });
        }

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!analyser || !isActive || !wavesurferRef.current) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const animate = () => {
            if (!isActive || !analyser) return;

            analyser.getByteFrequencyData(dataArray);

            // Create mock audio data for visualization
            const mockData = new Float32Array(64);
            for (let i = 0; i < 64; i++) {
                const dataIndex = Math.floor((i * bufferLength) / 64);
                mockData[i] = (dataArray[dataIndex] / 255) * 0.8 - 0.4;
            }

            // Update the waveform with real-time data
            if (wavesurferRef.current) {
                try {
                    wavesurferRef.current.load('', [mockData]);
                } catch {
                    // Fallback: create simple bar visualization
                    console.warn('WaveSurfer update failed, using fallback');
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyser, isActive]);

    return <div ref={waveformRef} className="realtime-waveform" />;
};

// Simple Canvas-based Visualizer as fallback
const CanvasAudioVisualizer = ({ analyser, isActive }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (!analyser || !isActive) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isActive) return;

            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / 40;
            const barGap = 2;
            const actualBarWidth = barWidth - barGap;

            for (let i = 0; i < 40; i++) {
                const dataIndex = Math.floor((i * bufferLength) / 40);
                const barHeight = (dataArray[dataIndex] / 255) * canvas.height * 0.9;

                const x = i * barWidth + barGap / 2;
                const y = canvas.height - barHeight;

                // Create gradient for bars
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, '#00a884');
                gradient.addColorStop(0.5, '#00c496');
                gradient.addColorStop(1, '#4ade80');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, actualBarWidth, barHeight);
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyser, isActive]);

    return (
        <canvas
            ref={canvasRef}
            width={320}
            height={60}
            className="canvas-visualizer"
        />
    );
};

const VoiceRecorder = ({ onRecordingComplete, onClose }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef(null);
    const selectedMimeTypeRef = useRef(null);
    const hiddenPlaybackRef = useRef(null);
    const timerRef = useRef(null);
    const analyserRef = useRef(null);
    const audioContextRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const audioElementRef = useRef(null);

    // Cleanup function (defined early to avoid circular dependency)
    const cleanup = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
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
        // Clean up audio elements
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current.currentTime = 0;
            audioElementRef.current.src = '';
        }
        if (hiddenPlaybackRef.current) {
            hiddenPlaybackRef.current.pause();
            hiddenPlaybackRef.current.currentTime = 0;
            hiddenPlaybackRef.current.src = '';
        }
        analyserRef.current = null;
        audioElementRef.current = null;
        setAudioLevel(0);
        setIsPlaying(false);
    }, []);

    // Monitor audio levels continuously (defined early to avoid circular dependency)
    const monitorAudioLevel = useCallback(() => {
        if (!analyserRef.current) return;

        const analyser = analyserRef.current;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
            if (!analyserRef.current) return;

            analyser.getByteFrequencyData(dataArray);

            // Calculate RMS (Root Mean Square) for better audio level detection
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += (dataArray[i] / 255) ** 2;
            }
            const rms = Math.sqrt(sum / dataArray.length);

            // Apply smoothing and scaling
            const smoothedLevel = Math.min(1, rms * 3);
            setAudioLevel(prev => prev * 0.7 + smoothedLevel * 0.3);

            animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
    }, []);

    // Request microphone permission and setup
    const requestMicrophoneAccess = useCallback(async () => {
        try {
            setError(null);

            // Check if mediaDevices is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('MediaDevices API not supported');
            }

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
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('AudioContext not supported');
            }

            const audioContext = new AudioContextClass();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);

            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            microphone.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            // Start audio level monitoring
            monitorAudioLevel();

            console.log('Microphone access granted successfully');
            return { stream, analyser, audioContext };
        } catch (err) {
            console.error('Failed to access microphone:', err);
            let errorMessage = 'שגיאה בגישה למיקרופון';

            if (err.name === 'NotAllowedError') {
                errorMessage = 'נדרש אישור לגישה למיקרופון. אנא אשר גישה ונסה שנית.';
                setHasPermission(false);
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'לא נמצא מיקרופון במכשיר';
                setHasPermission(false);
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'המיקרופון בשימוש על ידי אפליקציה אחרת';
                setHasPermission(false);
            } else if (err.message === 'MediaDevices API not supported') {
                errorMessage = 'הדפדפן לא תומך בהקלטת קול. נסה דפדפן אחר או עדכן את הדפדפן הנוכחי.';
                setHasPermission(false);
            } else if (err.message === 'AudioContext not supported') {
                errorMessage = 'הדפדפן לא תומך בעיבוד אודיו. נסה דפדפן אחר או עדכן את הדפדפן הנוכחי.';
                setHasPermission(false);
            } else {
                errorMessage = `שגיאה בגישה למיקרופון: ${err.message}`;
                setHasPermission(false);
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [monitorAudioLevel]);

    // Handle permission button click
    const handlePermissionRequest = useCallback(async () => {
        try {
            console.log('Permission button clicked - starting request...');
            await requestMicrophoneAccess();
            console.log('Permission request completed successfully');
            // If successful, the permission state will update and the dialog will re-render
        } catch (error) {
            // Error is already handled in requestMicrophoneAccess
            console.error('Permission request failed:', error);
        }
    }, [requestMicrophoneAccess]);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            // Reset if there's an existing recording
            if (audioBlob) {
                setAudioBlob(null);
                setRecordingTime(0);
                setIsPlaying(false);

                // Properly clean up audio element
                if (audioElementRef.current) {
                    audioElementRef.current.pause();
                    audioElementRef.current.currentTime = 0;
                    audioElementRef.current.src = '';
                }
                if (hiddenPlaybackRef.current) {
                    hiddenPlaybackRef.current.pause();
                    hiddenPlaybackRef.current.currentTime = 0;
                    hiddenPlaybackRef.current.src = '';
                }
            }

            if (!mediaStreamRef.current) {
                await requestMicrophoneAccess();
            }

            if (!window.MediaRecorder) {
                throw new Error('MediaRecorder not supported');
            }

            // Safari detection
            const ua = navigator.userAgent;
            const isSafari = (/^((?!chrome|android).)*safari/i.test(ua) || /iP(ad|hone|od)/i.test(ua));

            // Determine best supported audio mime type (Safari compatibility)
            const preferredTypes = isSafari ? [
                'audio/mp4;codecs=mp4a.40.2',
                'audio/mp4',
                'audio/mpeg',
                'audio/wav',
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/ogg'
            ] : [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/ogg',
                'audio/mp4;codecs=mp4a.40.2',
                'audio/mp4',
                'audio/mpeg',
                'audio/wav'
            ];

            let chosenType = '';
            if (window.MediaRecorder && window.MediaRecorder.isTypeSupported) {
                for (const t of preferredTypes) {
                    if (MediaRecorder.isTypeSupported(t)) {
                        chosenType = t;
                        break;
                    }
                }
            }
            const options = chosenType ? { mimeType: chosenType } : {};
            selectedMimeTypeRef.current = chosenType || null;
            console.log('Selected recording mimeType:', chosenType || 'default');

            const mediaRecorder = new MediaRecorder(mediaStreamRef.current, options);
            const chunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                try {
                    const actualType = mediaRecorder.mimeType || selectedMimeTypeRef.current || (chunks[0] && chunks[0].type) || 'audio/mp4';
                    const blob = new Blob(chunks, { type: actualType });
                    setAudioBlob(blob);
                } catch (e) {
                    console.warn('Falling back to default blob type due to error:', e);
                    const blob = new Blob(chunks);
                    setAudioBlob(blob);
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Failed to start recording:', err);
            let errorMessage = 'שגיאה בהתחלת ההקלטה';
            if (err.message === 'MediaRecorder not supported') {
                errorMessage = 'הדפדפן לא תומך בהקלטת קול. נסה דפדפן אחר או עדכן את הדפדפן הנוכחי.';
            } else {
                errorMessage = `שגיאה בהתחלת ההקלטה: ${err.message}`;
            }
            setError(errorMessage);
        }
    }, [requestMicrophoneAccess, audioBlob]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    // Play/pause recorded audio
    const togglePlayback = useCallback(async () => {
        if (!audioElementRef.current) return;

        const audioEl = audioElementRef.current;

        if (isPlaying) {
            audioEl.pause();
        } else {
            try {
                // Ensure the audio is ready to play
                if (audioEl.readyState < 2) {
                    await new Promise((resolve, reject) => {
                        const onCanPlay = () => {
                            audioEl.removeEventListener('canplay', onCanPlay);
                            audioEl.removeEventListener('error', onError);
                            resolve();
                        };
                        const onError = () => {
                            audioEl.removeEventListener('canplay', onCanPlay);
                            audioEl.removeEventListener('error', onError);
                            reject(new Error('Audio failed to load'));
                        };
                        audioEl.addEventListener('canplay', onCanPlay);
                        audioEl.addEventListener('error', onError);
                    });
                }

                await audioEl.play();
            } catch (error) {
                console.error('Failed to play audio:', error);
                // Reset playing state on error
                setIsPlaying(false);
            }
        }
    }, [isPlaying]);

    // Discard recording and close
    const discardRecording = useCallback(() => {
        if (isRecording) {
            stopRecording();
        }

        setAudioBlob(null);
        setRecordingTime(0);
        cleanup();
        onClose();
    }, [isRecording, stopRecording, onClose, cleanup]);

    // Send recording
    const sendRecording = useCallback(() => {
        if (audioBlob) {
            onRecordingComplete(audioBlob);
            cleanup();
        }
    }, [audioBlob, onRecordingComplete, cleanup]);

    // Initialize microphone access on mount
    useEffect(() => {
        // Only auto-request if we haven't already determined permission status
        if (hasPermission === null) {
            console.log('Initializing microphone access check...');
            requestMicrophoneAccess().catch((error) => {
                console.log('Initial microphone check failed:', error.message);
                // Error already handled in requestMicrophoneAccess
            });
        }

        return cleanup;
    }, [requestMicrophoneAccess, cleanup, hasPermission]);

    // Handle audio element events
    useEffect(() => {
        if (audioBlob) {
            const objectUrl = URL.createObjectURL(audioBlob);
            const el = hiddenPlaybackRef.current;
            if (el) {
                // Clean up previous audio
                el.pause();
                el.currentTime = 0;

                // Set new source
                el.src = objectUrl;

                // Set up event listeners
                const onEnded = () => setIsPlaying(false);
                const onPause = () => setIsPlaying(false);
                const onPlay = () => setIsPlaying(true);
                const onError = (e) => {
                    console.error('Audio playback error:', e);
                    setIsPlaying(false);
                };

                // Remove any existing listeners
                el.removeEventListener('ended', onEnded);
                el.removeEventListener('pause', onPause);
                el.removeEventListener('play', onPlay);
                el.removeEventListener('error', onError);

                // Add new listeners
                el.addEventListener('ended', onEnded);
                el.addEventListener('pause', onPause);
                el.addEventListener('play', onPlay);
                el.addEventListener('error', onError);

                // Load the audio
                try {
                    el.load();
                } catch (error) {
                    console.warn('Audio load failed:', error);
                }

                audioElementRef.current = el;
            }
            return () => {
                URL.revokeObjectURL(objectUrl);
                if (el) {
                    el.pause();
                    el.currentTime = 0;
                    el.src = '';
                }
            };
        } else {
            // Clear audio element when no blob
            const el = hiddenPlaybackRef.current;
            if (el) {
                el.pause();
                el.currentTime = 0;
                el.src = '';
            }
            audioElementRef.current = null;
        }
    }, [audioBlob]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate microphone icon scale based on audio level
    const microphoneScale = 1 + (audioLevel * 0.4);

    // Check for browser compatibility
    const isBrowserSupported = () => {
        return !!(navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia &&
            window.MediaRecorder &&
            (window.AudioContext || window.webkitAudioContext));
    };

    // Show unsupported browser message
    if (!isBrowserSupported()) {
        return (
            <AnimatePresence>
                <motion.div
                    className="voice-recorder-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="voice-recorder-modal centered"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="permission-request">
                            <XMarkIcon className="permission-icon error" />
                            <h3>דפדפן לא נתמך</h3>
                            <p>הדפדפן הנוכחי לא תומך בהקלטת קול.</p>
                            <p>אנא נסה דפדפן אחר כמו Chrome, Firefox או Safari המעודכן.</p>
                            <div className="permission-buttons">
                                <button
                                    onClick={onClose}
                                    className="permission-deny-button"
                                >
                                    סגור
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Show permission request if needed
    if (hasPermission === false && error) {
        return (
            <AnimatePresence>
                <motion.div
                    className="voice-recorder-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="voice-recorder-modal centered"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="permission-request">
                            <MicrophoneIcon className="permission-icon" />
                            <h3>נדרשת גישה למיקרופון</h3>
                            <p>{error}</p>
                            <div className="permission-buttons">
                                <button
                                    onClick={handlePermissionRequest}
                                    className="permission-allow-button"
                                >
                                    אשר גישה
                                </button>
                                <button
                                    onClick={onClose}
                                    className="permission-deny-button"
                                >
                                    ביטול
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Show loading state while checking permission
    if (hasPermission === null) {
        return (
            <AnimatePresence>
                <motion.div
                    className="voice-recorder-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="voice-recorder-modal centered"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="permission-request">
                            <MicrophoneIcon className="permission-icon" />
                            <h3>בודק הרשאות מיקרופון...</h3>
                            <div className="loading-spinner"></div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                className="voice-recorder-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={discardRecording}
            >
                <motion.div
                    className="voice-recorder-modal centered"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="recording-header">
                        <h3>הקלטת הודעה קולית</h3>
                    </div>

                    <div className="recording-content">
                        {/* Single Microphone Icon with Audio Level Animation and Recording Control */}
                        <div className="microphone-section">
                            {/* Combined microphone icon that serves as both visualizer and control */}
                            <motion.button
                                onClick={!isRecording ? startRecording : stopRecording}
                                className="microphone-icon-container clickable"
                                animate={isRecording ? {
                                    scale: microphoneScale,
                                    boxShadow: `0 0 ${20 + audioLevel * 30}px rgba(0, 168, 132, ${0.3 + audioLevel * 0.4})`
                                } : {}}
                                whileHover={{ scale: isRecording ? microphoneScale * 1.05 : 1.05 }}
                                whileTap={{ scale: isRecording ? microphoneScale * 0.95 : 0.95 }}
                                transition={{ duration: 0.1 }}
                                title={!isRecording ? "התחל הקלטה" : "עצור הקלטה"}
                            >
                                {!isRecording ? (
                                    <MicrophoneIcon className="microphone-icon" />
                                ) : (
                                    <StopIcon className="microphone-icon recording" />
                                )}
                            </motion.button>

                            <div className="recording-time">
                                {formatTime(recordingTime)}
                            </div>
                        </div>

                        {/* Simplified Controls - Only Trash Button */}
                        {!audioBlob ? (
                            <div className="recording-controls single-control">
                                <motion.button
                                    onClick={discardRecording}
                                    className="control-button discard-button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="ביטול"
                                >
                                    <TrashIcon className="button-icon" />
                                </motion.button>
                            </div>
                        ) : (
                            /* Playback Controls */
                            <div className="playback-controls">
                                <motion.button
                                    onClick={discardRecording}
                                    className="control-button discard-button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="מחק הקלטה"
                                >
                                    <TrashIcon className="button-icon" />
                                </motion.button>

                                <motion.button
                                    onClick={togglePlayback}
                                    className="control-button play-button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title={isPlaying ? "השהה" : "נגן"}
                                >
                                    {isPlaying ? (
                                        <PauseIcon className="button-icon" />
                                    ) : (
                                        <PlayIcon className="button-icon" />
                                    )}
                                </motion.button>

                                <motion.button
                                    onClick={sendRecording}
                                    className="control-button send-button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="שלח הקלטה"
                                >
                                    <PaperAirplaneIcon className="button-icon" style={{ color: '#00a884' }} />
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {/* Real-time Audio Visualizer - Positioned at bottom */}
                    {isRecording && (
                        <div className="visualizer-container-bottom">
                            <RealtimeAudioVisualizer
                                analyser={analyserRef.current}
                                isActive={isRecording}
                            />
                            {/* Fallback to canvas if WaveSurfer fails */}
                            <CanvasAudioVisualizer
                                analyser={analyserRef.current}
                                isActive={isRecording}
                            />
                        </div>
                    )}

                    {/* Hidden audio element for playback */}
                    <audio
                        ref={hiddenPlaybackRef}
                        style={{ display: 'none' }}
                        preload="none"
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VoiceRecorder;
