import React, { useState, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { createSinglesProfile, updateSinglesProfile, uploadProfilePhoto, deleteProfilePhoto, deleteSinglesProfile } from '../../services/singlesService';
import './SinglesProfileForm.css';

const SinglesProfileForm = ({ userId, userName, existingProfile, onSuccess, onCancel, onDelete }) => {
    const [formData, setFormData] = useState({
        name: existingProfile?.name || userName || '',
        age: existingProfile?.age || '',
        gender: existingProfile?.gender || '',
        interestedIn: existingProfile?.interestedIn || '',
        location: existingProfile?.location || '',
        howWeKnow: existingProfile?.howWeKnow || '',
        aboutMe: existingProfile?.aboutMe || existingProfile?.interests || '', // Support both old and new field
        photoUrl: existingProfile?.photoUrl || ''
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(existingProfile?.photoUrl || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('אנא בחר קובץ תמונה תקין');
                return;
            }

            // Validate file size (max 20MB)
            if (file.size > 20 * 1024 * 1024) {
                setError('גודל התמונה חייב להיות קטן מ-20MB');
                return;
            }

            setPhotoFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const removePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview('');
        setFormData(prev => ({ ...prev, photoUrl: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name.trim()) {
            setError('נא להזין שם מלא');
            return;
        }

        if (!formData.age || formData.age < 18 || formData.age > 100) {
            setError('נא להזין גיל תקין (18-100)');
            return;
        }

        if (!formData.gender) {
            setError('נא לבחור מגדר');
            return;
        }

        if (!formData.interestedIn) {
            setError('נא לבחור במי אתה מעוניין');
            return;
        }

        if (!formData.location.trim()) {
            setError('נא להזין מיקום');
            return;
        }

        if (!formData.howWeKnow.trim()) {
            setError('נא לכתב איך אתם מכירים אותנו');
            return;
        }

        if (!photoFile && !formData.photoUrl) {
            setError('נא להעלות תמונת פרופיל');
            return;
        }

        setIsLoading(true);

        try {
            let photoUrl = formData.photoUrl;

            // Upload new photo if selected
            if (photoFile) {
                // Delete old photo if updating
                if (existingProfile?.photoUrl) {
                    await deleteProfilePhoto(existingProfile.photoUrl);
                }
                photoUrl = await uploadProfilePhoto(photoFile, userId);
            }

            const profileData = {
                userId,
                name: formData.name.trim(),
                age: parseInt(formData.age),
                gender: formData.gender,
                interestedIn: formData.interestedIn,
                location: formData.location.trim(),
                howWeKnow: formData.howWeKnow.trim(),
                aboutMe: formData.aboutMe.trim(),
                photoUrl
            };

            if (existingProfile) {
                await updateSinglesProfile(userId, profileData);
            } else {
                await createSinglesProfile(profileData);
            }

            onSuccess();
        } catch (err) {
            console.error('Error saving profile:', err);
            setError('שגיאה בשמירת הפרופיל. נסה שוב.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProfile = async () => {
        setIsDeleting(true);
        setError('');

        try {
            // Delete the profile photo from Firebase Storage if it exists
            if (existingProfile?.photoUrl) {
                try {
                    await deleteProfilePhoto(existingProfile.photoUrl);
                } catch (photoError) {
                    console.warn('Photo deletion failed, but continuing with profile deletion:', photoError);
                    // Continue with profile deletion even if photo deletion fails
                }
            }

            // Delete the profile from Firestore
            await deleteSinglesProfile(userId);

            // Call onDelete callback if provided, otherwise onSuccess
            if (onDelete) {
                onDelete();
            } else {
                onSuccess();
            }
        } catch (err) {
            console.error('Error deleting profile:', err);
            setError('שגיאה במחיקת הפרופיל. נסה שוב.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    return (
        <div className="singles-profile-form">
            <div className="form-header">
                <h3>{existingProfile ? 'עדכון פרופיל' : 'יצירת פרופיל רווק/ה'}</h3>
                <p className="form-subtitle">
                    הפרופיל שלך יהיה גלוי לרווקים אחרים המוזמנים לחתונה
                </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Delete confirmation dialog */}
            {error && <div className="error-message">{error}</div>}

            {/* Delete confirmation dialog */}
            <Dialog
                open={showDeleteConfirm}
                onClose={handleCancelDelete}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title" sx={{ textAlign: 'right', color: '#e74c3c', fontFamily: 'Heebo, sans-serif' }}>
                    מחיקת פרופיל
                </DialogTitle>
                <DialogContent>
                    <DialogContentText
                        id="delete-dialog-description"
                        sx={{ textAlign: 'right', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}
                    >
                        האם אתה בטוח שברצונך למחוק את הפרופיל? פעולה זו לא ניתנת לביטול.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                    <Button
                        onClick={handleCancelDelete}
                        disabled={isDeleting}
                        sx={{ fontFamily: 'Heebo, sans-serif', color: '#666' }}
                    >
                        ביטול
                    </Button>
                    <Button
                        onClick={handleDeleteProfile}
                        disabled={isDeleting}
                        variant="contained"
                        sx={{
                            fontFamily: 'Heebo, sans-serif',
                            backgroundColor: '#e74c3c',
                            '&:hover': {
                                backgroundColor: '#c0392b'
                            }
                        }}
                    >
                        {isDeleting ? 'מוחק...' : 'מחק פרופיל'}
                    </Button>
                </DialogActions>
            </Dialog>

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="photo-section">
                    <label>תמונת פרופיל *</label>
                    <div className="photo-upload">
                        {photoPreview ? (
                            <div className="photo-preview">
                                <img src={photoPreview} alt="תמונת פרופיל" />
                                <button
                                    type="button"
                                    className="remove-photo-btn"
                                    onClick={removePhoto}
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div className="photo-placeholder">
                                <span>📷</span>
                                <p>הוסף תמונת פרופיל</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="photo-input"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="name">שם מלא *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="השם המלא שלך"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="age">גיל *</label>
                    <input
                        type="number"
                        id="age"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        min="18"
                        max="100"
                        placeholder="הגיל שלך"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="gender">מה אני *</label>
                    <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">בחר מגדר</option>
                        <option value="male">גבר</option>
                        <option value="female">אישה</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="interestedIn">במה אני מתעניינ/ת *</label>
                    <select
                        id="interestedIn"
                        name="interestedIn"
                        value={formData.interestedIn}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">מעוניינ/ת ב...</option>
                        <option value="male">גברים</option>
                        <option value="female">נשים</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="location">מיקום *</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="העיר בה אתה גר"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="aboutMe">קצת על עצמי (אופציונלי)</label>
                    <textarea
                        id="aboutMe"
                        name="aboutMe"
                        value={formData.aboutMe}
                        onChange={handleInputChange}
                        placeholder="ספר מעט על עצמך, מה אתה אוהב לעשות, איזה אדם אתה..."
                        rows="3"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="howWeKnow">איך אתה מכיר אותנו? *</label>
                    <textarea
                        id="howWeKnow"
                        name="howWeKnow"
                        value={formData.howWeKnow}
                        onChange={handleInputChange}
                        placeholder="ספר איך אתה מכיר את מזל ו/או ערן..."
                        rows="3"
                        required
                    />
                </div>

                <div className="form-actions">
                    <div className="main-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onCancel}
                            disabled={isLoading || isDeleting}
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isLoading || isDeleting}
                        >
                            {isLoading ? 'שומר...' : (existingProfile ? 'עדכן פרופיל' : 'צור פרופיל')}
                        </button>
                    </div>

                    {existingProfile && (
                        <div className="delete-section">
                            <button
                                type="button"
                                className="delete-profile-btn"
                                onClick={handleDeleteClick}
                                disabled={isLoading || isDeleting}
                            >
                                🗑️ מחק פרופיל
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default SinglesProfileForm;
