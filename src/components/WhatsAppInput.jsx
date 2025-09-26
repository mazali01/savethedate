import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconButton } from '@mui/material';
import { PaperClipIcon, PaperAirplaneIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { validateMediaFile } from '../services/giftService';
import VoiceRecorder from './VoiceRecorder';
import './WhatsAppInput.css';

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
    const [isRecording, setIsRecording] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const textareaRef = useRef(null);

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
                    type: file.type.startsWith('image/') ? 'image' : 'video'
                };
                onMediaSelect?.(mediaData);
            } catch (error) {
                console.error('Invalid media file:', error);
                // You might want to show a notification here
            }
        }
    }, [onMediaSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
            'video/*': ['.mp4', '.webm', '.mov']
        },
        maxFiles: 1,
        noClick: true, // Prevent click on container from opening file dialog
    });

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
        if (message.trim() || mediaPreview) {
            onSubmit(e);
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    // Handle voice recording
    const handleVoiceRecordingComplete = (audioBlob) => {
        const audioUrl = URL.createObjectURL(audioBlob);
        const mediaData = {
            file: audioBlob,
            url: audioUrl,
            type: 'audio'
        };
        onMediaSelect?.(mediaData);
        setShowVoiceRecorder(false);
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            // Shift+Enter sends the message
            e.preventDefault();
            handleSubmit(e);
        }
        // Regular Enter creates new line (default behavior)
    };

    const hasContent = message.trim().length > 0 || mediaPreview;

    return (
        <div className="whatsapp-input-container">
            {/* Media Preview */}
            {mediaPreview && (
                <div className="media-preview-whatsapp">
                    {mediaPreview.type === 'image' && (
                        <img src={mediaPreview.url} alt="Preview" />
                    )}
                    {mediaPreview.type === 'video' && (
                        <video src={mediaPreview.url} controls preload="metadata" />
                    )}
                    {mediaPreview.type === 'audio' && (
                        <div className="audio-preview">
                            <audio src={mediaPreview.url} controls />
                            <span>הודעה קולית</span>
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
                        className="attach-button"
                        size="small"
                        disabled={disabled}
                        aria-label="Attach file"
                    >
                        <PaperClipIcon className="icon" />
                    </IconButton>

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
                                disabled={isSubmitting || disabled}
                                size="small"
                                aria-label="Send message"
                            >
                                <PaperAirplaneIcon className="icon" />
                            </IconButton>
                        ) : (
                            <IconButton
                                type="button"
                                className="voice-button"
                                disabled={disabled}
                                size="small"
                                onClick={() => setShowVoiceRecorder(true)}
                                aria-label="Record voice message"
                            >
                                <MicrophoneIcon className="icon" />
                            </IconButton>
                        )}
                    </div>
                </div>
            </form>

            {/* Voice Recorder Modal */}
            {showVoiceRecorder && (
                <VoiceRecorder
                    onRecordingComplete={handleVoiceRecordingComplete}
                    onClose={() => setShowVoiceRecorder(false)}
                />
            )}
        </div>
    );
};

export default WhatsAppInput;
