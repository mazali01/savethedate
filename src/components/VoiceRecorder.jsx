import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicrophoneIcon, StopIcon, XMarkIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/solid';
import './VoiceRecorder.css';

// Custom Audio Visualizer Component
const AudioVisualizer = ({ analyser, isActive }) => {
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

            const barWidth = canvas.width / 32;
            const barGap = 2;
            const actualBarWidth = barWidth - barGap;

            for (let i = 0; i < 32; i++) {
                // Use every 4th element from the frequency data for smoother visualization
                const dataIndex = Math.floor((i * bufferLength) / 32);
                const barHeight = (dataArray[dataIndex] / 255) * canvas.height * 0.8;

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
            width={300}
            height={60}
            style={{
                width: '100%',
                height: '60px',
                borderRadius: '8px',
                backgroundColor: 'transparent'
            }}
        />
    );
};

const VoiceRecorder = ({ onRecordingComplete, onClose }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [mediaStream, setMediaStream] = useState(null);
    const [visualizerData, setVisualizerData] = useState(new Array(32).fill(0));

    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const chunksRef = useRef([]);
    const analyserRef = useRef(null);
    const audioContextRef = useRef(null);
    const animationFrameRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        // Auto-start recording when component mounts
        startRecording();

        // Cleanup on unmount
        return () => {
            cleanup();
        };
    }, []);

    const cleanup = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
    };

    // Start microphone level monitoring
    const startMicrophoneMonitoring = (stream) => {
        try {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();

            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.3;
            source.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateAudioLevel = () => {
                if (isRecording && analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);

                    // Calculate RMS (root mean square) for better volume representation
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i] * dataArray[i];
                    }
                    const rms = Math.sqrt(sum / bufferLength);
                    const normalizedLevel = Math.min(rms / 128, 1); // Normalize and cap at 1

                    setAudioLevel(normalizedLevel);

                    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
                }
            };

            updateAudioLevel();
        } catch (err) {
            console.error('Error setting up audio analysis:', err);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                }
            });

            setMediaStream(stream);

            // Start microphone monitoring
            startMicrophoneMonitoring(stream);

            // Try different mime types based on browser support
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/mp4';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = ''; // Let browser choose
                    }
                }
            }

            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: mimeType || undefined
            });

            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
                blob.name = `voice-message.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
                setAudioBlob(blob);

                // Stop monitoring
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                setAudioLevel(0);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('לא ניתן לגשת למיקרופון. אנא בדקו את ההרשאות.');
        }
    };

    const stopRecordingAndSend = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const discardRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setAudioBlob(null);
        setRecordingTime(0);
        cleanup();
        onClose();
    };

    const sendRecording = () => {
        if (audioBlob) {
            onRecordingComplete(audioBlob);
            cleanup();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate microphone icon scale based on audio level
    const microphoneScale = 1 + (audioLevel * 0.5); // Scale between 1 and 1.5

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
                    {error ? (
                        <div className="error-section">
                            <XMarkIcon className="error-icon" />
                            <p className="error-text">{error}</p>
                            <button onClick={onClose} className="retry-button">
                                סגור
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="recording-header">
                                <h3>הקלטת הודעה קולית</h3>
                            </div>

                            <div className="recording-content">
                                {/* Microphone Icon with Audio Level Animation */}
                                <div className="microphone-section">
                                    <motion.div
                                        className="microphone-icon-container"
                                        animate={{
                                            scale: microphoneScale,
                                            boxShadow: `0 0 ${20 + audioLevel * 30}px rgba(0, 168, 132, ${0.3 + audioLevel * 0.4})`
                                        }}
                                        transition={{ duration: 0.1 }}
                                    >
                                        <MicrophoneIcon className="microphone-icon" />
                                    </motion.div>

                                    <div className="recording-time">
                                        {formatTime(recordingTime)}
                                    </div>
                                </div>

                                {/* Audio Visualizer */}
                                {isRecording && mediaStream && (
                                    <div className="visualizer-container">
                                        <AudioVisualizer
                                            analyser={analyserRef.current}
                                            isActive={isRecording}
                                        />
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="action-buttons">
                                    <motion.button
                                        onClick={discardRecording}
                                        className="discard-button"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="מחק הקלטה"
                                    >
                                        <TrashIcon className="button-icon" />
                                    </motion.button>

                                    <motion.button
                                        onClick={isRecording ? stopRecordingAndSend : sendRecording}
                                        className="send-button"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        disabled={!isRecording && !audioBlob}
                                        title={isRecording ? "עצור ושלח" : "שלח הקלטה"}
                                    >
                                        {isRecording ? (
                                            <StopIcon className="button-icon" />
                                        ) : (
                                            <PaperAirplaneIcon className="button-icon" />
                                        )}
                                    </motion.button>
                                </div>

                                {!isRecording && audioBlob && (
                                    <div className="playback-section">
                                        <audio
                                            src={URL.createObjectURL(audioBlob)}
                                            controls
                                            className="audio-player"
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VoiceRecorder;
