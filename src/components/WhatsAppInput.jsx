import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, IconButton } from '@mui/material';
import { CameraIcon, PaperAirplaneIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { validateMediaFile } from '../services/giftService';
import VoiceRecorder from './VoiceRecorder';
import { useMicrophoneLevel } from '../hooks/useMicrophoneLevel';
import { motion } from 'framer-motion';
import './WhatsAppInput.css';
import './VoiceRecorderEnhanced.css';

const WhatsAppInput = ({
    message,
    setMessage,
    onSubmit,
    isSubmitting = false,
    placeholder = "כתבו הודעה...",
    onMediaSelect,
    mediaPreview,
    onRemoveMedia,
    disabled = false
}) => {
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showCameraOptions, setShowCameraOptions] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraPhotoInputRef = useRef(null);
    const cameraVideoInputRef = useRef(null);

    // Use microphone hook for audio level monitoring
    const { audioLevel, startMonitoring, stopMonitoring } = useMicrophoneLevel();

    // Handle file drop
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            try {
                validateMediaFile(file);
                const previewUrl = URL.createObjectURL(file);
                const mediaData = {
                    file,
                    url: previewUrl,
                    type: file.type.startsWith('image/') ? 'image' : 'video',
                    id: Date.now() + Math.random() // Unique ID for the media
                };

                // Add to existing media instead of replacing
                if (Array.isArray(mediaPreview)) {
                    onMediaSelect?.([...mediaPreview, mediaData]);
                } else if (mediaPreview) {
                    onMediaSelect?.([mediaPreview, mediaData]);
                } else {
                    onMediaSelect?.(mediaData);
                }
            } catch (error) {
                console.error('Invalid media file:', error);
                // You might want to show a notification here
            }
        }
    }, [onMediaSelect, mediaPreview]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
            'video/*': ['.mp4', '.webm', '.mov']
        },
        maxFiles: 1,
        noClick: true, // Prevent click on container from opening file dialog
    });

    // Handle camera button click
    const handleCameraClick = useCallback(() => {
        setShowCameraOptions(true);
    }, []);

    // Handle gallery selection
    const handleGalleryClick = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
        setShowCameraOptions(false);
    }, []);

    // Handle camera photo capture
    const handleCameraPhotoCapture = useCallback(() => {
        if (cameraPhotoInputRef.current) {
            cameraPhotoInputRef.current.click();
        }
        setShowCameraOptions(false);
    }, []);

    // Handle camera video capture
    const handleCameraVideoCapture = useCallback(() => {
        if (cameraVideoInputRef.current) {
            cameraVideoInputRef.current.click();
        }
        setShowCameraOptions(false);
    }, []);

    // Handle file selection from camera/gallery
    const handleFileSelect = useCallback((e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onDrop(files);
        }
        // Reset file input so the same file can be selected again
        e.target.value = '';
    }, [onDrop]);

    // Handle text change and auto-resize
    const handleTextChange = (e) => {
        const value = e.target.value;
        setMessage(value);

        // Auto-resize textarea
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        // Allow submission if there's text content OR any media attachment (image/video/audio)
        const hasMediaContent = mediaPreview && (Array.isArray(mediaPreview) ? mediaPreview.length > 0 : true);
        if (message.trim() || hasMediaContent) {
            onSubmit(e);
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    // Handle voice message submission (allow without text)
    const handleVoiceSubmit = () => {
        if (mediaPreview) {
            const fakeEvent = { preventDefault: () => { } };
            onSubmit(fakeEvent);
        }
    };

    // Handle voice recording
    const handleVoiceRecordingComplete = (audioBlob) => {
        const audioUrl = URL.createObjectURL(audioBlob);
        const mediaData = {
            file: audioBlob,
            url: audioUrl,
            type: 'audio',
            id: Date.now() + Math.random() // Unique ID for the media
        };

        // Add to existing media instead of replacing
        if (Array.isArray(mediaPreview)) {
            onMediaSelect?.([...mediaPreview, mediaData]);
        } else if (mediaPreview) {
            onMediaSelect?.([mediaPreview, mediaData]);
        } else {
            onMediaSelect?.(mediaData);
        }

        setShowVoiceRecorder(false);
        stopMonitoring(); // Stop monitoring when recorder closes
    };

    // Handle microphone button click
    const handleMicrophoneClick = useCallback(() => {
        setShowVoiceRecorder(true);
        startMonitoring(); // Start monitoring audio levels
    }, [startMonitoring]);

    // Handle dialog close
    const handleDialogClose = useCallback(() => {
        setShowVoiceRecorder(false);
        stopMonitoring(); // Stop monitoring when dialog closes
    }, [stopMonitoring]);

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            // Shift+Enter sends the message
            e.preventDefault();
            handleSubmit(e);
        }
        // Regular Enter creates new line (default behavior)
    };

    const hasContent = (message.trim().length > 0) || mediaPreview;

    return (
        <div className="whatsapp-input-container">
            {/* Media Preview */}
            {mediaPreview && (
                <div className="media-preview-whatsapp">
                    {Array.isArray(mediaPreview) ? (
                        // Multiple media items
                        <div className="multiple-media-preview">
                            {mediaPreview.map((media, index) => (
                                <div key={media.id || index} className="media-item-preview">
                                    {media.type === 'image' && (
                                        <img src={media.url} alt="Preview" />
                                    )}
                                    {media.type === 'video' && (
                                        <video src={media.url} controls preload="metadata" />
                                    )}
                                    {media.type === 'audio' && (
                                        <div className="audio-preview">
                                            <audio src={media.url} controls />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updatedMedia = mediaPreview.filter((_, i) => i !== index);
                                            onMediaSelect?.(updatedMedia.length > 0 ? updatedMedia : null);
                                        }}
                                        className="remove-media-whatsapp"
                                        aria-label="Remove media"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Single media item
                        <>
                            {mediaPreview.type === 'image' && (
                                <img src={mediaPreview.url} alt="Preview" />
                            )}
                            {mediaPreview.type === 'video' && (
                                <video src={mediaPreview.url} controls preload="metadata" />
                            )}
                            {mediaPreview.type === 'audio' && (
                                <div className="audio-preview">
                                    <audio src={mediaPreview.url} controls />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={onRemoveMedia}
                                className="remove-media-whatsapp"
                                aria-label="Remove media"
                            >
                                ×
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Input Container */}
            <form onSubmit={handleSubmit} className="whatsapp-input-form">
                <div
                    {...getRootProps()}
                    className={`input-wrapper ${isDragActive ? 'drag-active' : ''}`}
                >
                    <input {...getInputProps()} />

                    {/* Attachment Button */}
                    <IconButton
                        type="button"
                        onClick={handleCameraClick}
                        className="attach-button"
                        size="small"
                        disabled={disabled}
                        aria-label="Take photo or select from gallery"
                    >
                        <CameraIcon className="icon" />
                    </IconButton>

                    {/* Hidden file inputs */}
                    {/* Gallery file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        multiple={false}
                    />

                    {/* Camera photo input */}
                    <input
                        ref={cameraPhotoInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        multiple={false}
                    />

                    {/* Camera video input */}
                    <input
                        ref={cameraVideoInputRef}
                        type="file"
                        accept="video/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        multiple={false}
                    />

                    {/* Text Input */}
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleTextChange}
                        onKeyPress={handleKeyPress}
                        placeholder={placeholder}
                        className="message-input"
                        disabled={disabled}
                        rows={3}
                    />

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        {hasContent ? (
                            <IconButton
                                type="submit"
                                className="send-button"
                                disabled={isSubmitting || disabled || !hasContent}
                                size="small"
                                aria-label="Send message"
                            >
                                <PaperAirplaneIcon className="icon" />
                            </IconButton>
                        ) : (
                            <motion.div
                                animate={{
                                    scale: 1 + (audioLevel * 0.3), // Scale based on audio level
                                }}
                                transition={{ duration: 0.1 }}
                            >
                                <IconButton
                                    type="button"
                                    className="voice-button"
                                    disabled={disabled}
                                    size="small"
                                    onClick={handleMicrophoneClick}
                                    aria-label="Record voice message"
                                >
                                    <MicrophoneIcon className="icon" />
                                </IconButton>
                            </motion.div>
                        )}
                    </div>
                </div>
            </form>

            <Dialog open={showVoiceRecorder} onClose={handleDialogClose}>
                <VoiceRecorder
                    onRecordingComplete={handleVoiceRecordingComplete}
                    onClose={handleDialogClose}
                />
            </Dialog>

            {/* Camera Options Dialog */}
            <Dialog
                open={showCameraOptions}
                onClose={() => setShowCameraOptions(false)}
                PaperProps={{
                    style: {
                        backgroundColor: 'white',
                        borderRadius: '15px',
                        padding: '20px',
                        minWidth: '280px',
                        textAlign: 'center'
                    }
                }}
            >
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>בחר מקור</h3>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>איך תרצה להוסיף תמונה או וידאו?</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        onClick={handleCameraPhotoCapture}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#00a884',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#00c496'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#00a884'}
                    >
                        📸 צלם תמונה
                    </button>

                    <button
                        onClick={handleCameraVideoCapture}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#e11d48',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#e11d48'}
                    >
                        🎥 הקלט וידאו
                    </button>

                    <button
                        onClick={handleGalleryClick}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                        🖼️ בחר מהגלריה
                    </button>

                    <button
                        onClick={() => setShowCameraOptions(false)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        ביטול
                    </button>
                </div>
            </Dialog>
        </div>
    );
};

export default WhatsAppInput;
