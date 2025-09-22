import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { filterCities } from '../../data/cities.js';
import { getCurrentUser } from '../../utils/deviceId.js';
import { createCarpoolOffer as createOfferService, uploadDriverPhoto } from '../../services/carpoolService.js';
import { createCarpoolOffer } from '../../models/carpoolModels.js';
import './CarpoolOfferForm.css';

const CarpoolOfferForm = ({ onOfferCreated, onCancel }) => {
    const [formData, setFormData] = useState({
        driverName: '',
        phoneNumber: '',
        fromCity: '',
        toCity: 'מיקום החתונה', // Default wedding location
        returnCity: '',
        availableSeats: 1,
        departureTime: '',
        returnTime: '',
        additionalInfo: ''
    });

    const [fromCitySuggestions, setFromCitySuggestions] = useState([]);
    const [returnCitySuggestions, setReturnCitySuggestions] = useState([]);
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Load user info on component mount
    useEffect(() => {
        const user = getCurrentUser();
        if (user && user.name) {
            setFormData(prev => ({
                ...prev,
                driverName: user.name,
                phoneNumber: user.phoneNumber || ''
            }));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Handle city autocomplete
        if (name === 'fromCity') {
            setFromCitySuggestions(filterCities(value));
        }
        if (name === 'returnCity') {
            setReturnCitySuggestions(filterCities(value));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleCitySelect = (city, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: city
        }));

        if (field === 'fromCity') {
            setFromCitySuggestions([]);
        }
        if (field === 'returnCity') {
            setReturnCitySuggestions([]);
        }
    };

    const onDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onload = (e) => setPhotoPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif']
        },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024 // 5MB
    });

    const validateForm = () => {
        const newErrors = {};

        if (!formData.driverName.trim()) {
            newErrors.driverName = 'שם הנהג נדרש';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'מספר טלפון נדרש';
        } else if (!/^0\d{1,2}-?\d{7}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
            newErrors.phoneNumber = 'מספר טלפון לא תקין';
        }

        if (!formData.fromCity.trim()) {
            newErrors.fromCity = 'עיר יציאה נדרשת';
        }

        if (formData.availableSeats < 1 || formData.availableSeats > 8) {
            newErrors.availableSeats = 'מספר מקומות צריך להיות בין 1 ל-8';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const user = getCurrentUser();
            let photoUrl = '';

            // Upload photo if provided
            if (photo) {
                photoUrl = await uploadDriverPhoto(photo, user.deviceId);
            }

            // Create offer data
            const offerData = createCarpoolOffer({
                ...formData,
                deviceId: user.deviceId,
                photoUrl,
                returnCity: formData.returnCity || formData.toCity
            });

            // Save to Firebase
            const offerId = await createOfferService(offerData);

            // Save user info for future use
            const { setUserInfo } = await import('../../utils/deviceId.js');
            setUserInfo({
                name: formData.driverName,
                phoneNumber: formData.phoneNumber
            });

            onOfferCreated({ ...offerData, id: offerId });

            // Reset form
            setFormData({
                driverName: formData.driverName, // Keep name for convenience
                phoneNumber: formData.phoneNumber, // Keep phone for convenience
                fromCity: '',
                toCity: 'מיקום החתונה',
                returnCity: '',
                availableSeats: 1,
                departureTime: '',
                returnTime: '',
                additionalInfo: ''
            });
            setPhoto(null);
            setPhotoPreview(null);

        } catch (error) {
            console.error('Error creating carpool offer:', error);
            alert('שגיאה ביצירת הצעת הטרמפ. אנא נסה שוב.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="carpool-offer-form">
            <h3>הצע טרמפ לחתונה 🚗</h3>

            <form onSubmit={handleSubmit} className="offer-form">
                <div className="form-group">
                    <label htmlFor="driverName">שם הנהג *</label>
                    <input
                        type="text"
                        id="driverName"
                        name="driverName"
                        value={formData.driverName}
                        onChange={handleInputChange}
                        className={errors.driverName ? 'error' : ''}
                        placeholder="השם שלך"
                    />
                    {errors.driverName && <span className="error-message">{errors.driverName}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="phoneNumber">מספר טלפון *</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={errors.phoneNumber ? 'error' : ''}
                        placeholder="050-1234567"
                        dir="ltr"
                    />
                    {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                </div>

                <div className="form-group autocomplete-group">
                    <label htmlFor="fromCity">עיר יציאה *</label>
                    <input
                        type="text"
                        id="fromCity"
                        name="fromCity"
                        value={formData.fromCity}
                        onChange={handleInputChange}
                        className={errors.fromCity ? 'error' : ''}
                        placeholder="מאיזה עיר אתה יוצא?"
                    />
                    {errors.fromCity && <span className="error-message">{errors.fromCity}</span>}
                    {fromCitySuggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {fromCitySuggestions.map((city, index) => (
                                <li
                                    key={index}
                                    onClick={() => handleCitySelect(city, 'fromCity')}
                                    className="suggestion-item"
                                >
                                    {city}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="toCity">יעד</label>
                    <input
                        type="text"
                        id="toCity"
                        name="toCity"
                        value={formData.toCity}
                        onChange={handleInputChange}
                        placeholder="לאן אתה נוסע?"
                    />
                </div>

                <div className="form-group autocomplete-group">
                    <label htmlFor="returnCity">עיר חזרה (אם שונה מהיעד)</label>
                    <input
                        type="text"
                        id="returnCity"
                        name="returnCity"
                        value={formData.returnCity}
                        onChange={handleInputChange}
                        placeholder="לאן אתה חוזר? (אופציונלי)"
                    />
                    {returnCitySuggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {returnCitySuggestions.map((city, index) => (
                                <li
                                    key={index}
                                    onClick={() => handleCitySelect(city, 'returnCity')}
                                    className="suggestion-item"
                                >
                                    {city}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="availableSeats">מספר מקומות פנויים *</label>
                    <select
                        id="availableSeats"
                        name="availableSeats"
                        value={formData.availableSeats}
                        onChange={handleInputChange}
                        className={errors.availableSeats ? 'error' : ''}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <option key={num} value={num}>{num} מקומות</option>
                        ))}
                    </select>
                    {errors.availableSeats && <span className="error-message">{errors.availableSeats}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="departureTime">זמן יציאה</label>
                        <input
                            type="text"
                            id="departureTime"
                            name="departureTime"
                            value={formData.departureTime}
                            onChange={handleInputChange}
                            placeholder="לדוגמה: 18:00"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="returnTime">זמן חזרה</label>
                        <input
                            type="text"
                            id="returnTime"
                            name="returnTime"
                            value={formData.returnTime}
                            onChange={handleInputChange}
                            placeholder="לדוגמה: 01:00"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>תמונה (אופציונלי)</label>
                    <div {...getRootProps()} className={`photo-dropzone ${isDragActive ? 'active' : ''}`}>
                        <input {...getInputProps()} />
                        {photoPreview ? (
                            <div className="photo-preview">
                                <img src={photoPreview} alt="תמונת נהג" />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPhoto(null);
                                        setPhotoPreview(null);
                                    }}
                                    className="remove-photo"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className="upload-placeholder">
                                <p>📷 גרור תמונה או לחץ להעלאה</p>
                                <small>עד 5MB - JPG, PNG, GIF</small>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="additionalInfo">מידע נוסף</label>
                    <textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        placeholder="דרישות מיוחדות, נקודות איסוף, וכד'"
                        rows={3}
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={loading}
                        className="submit-button"
                    >
                        {loading ? 'שומר...' : 'פרסם הצעת טרמפ'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="cancel-button"
                    >
                        בטל
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CarpoolOfferForm;
