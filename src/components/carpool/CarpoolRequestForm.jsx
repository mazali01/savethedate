import React, { useState, useEffect } from 'react';
import { filterCities } from '../../data/cities.js';
import { getCurrentUser, setUserInfo } from '../../utils/deviceId.js';
import { createCarpoolRequest as createRequestService } from '../../services/carpoolService.js';
import { createCarpoolRequest } from '../../models/carpoolModels.js';
import './CarpoolRequestForm.css';

const CarpoolRequestForm = ({ onRequestCreated, onCancel }) => {
    const [formData, setFormData] = useState({
        passengerName: '',
        phoneNumber: '',
        fromCity: '',
        toCity: 'מיקום החתונה', // Default wedding location
        preferredDepartureTime: '',
        preferredReturnTime: '',
        additionalInfo: ''
    });

    const [fromCitySuggestions, setFromCitySuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Load user info on component mount
    useEffect(() => {
        const user = getCurrentUser();
        if (user && user.name) {
            setFormData(prev => ({
                ...prev,
                passengerName: user.name,
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
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.passengerName.trim()) {
            newErrors.passengerName = 'השם נדרש';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'מספר טלפון נדרש';
        } else if (!/^0\d{1,2}-?\d{7}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
            newErrors.phoneNumber = 'מספר טלפון לא תקין';
        }

        if (!formData.fromCity.trim()) {
            newErrors.fromCity = 'עיר יציאה נדרשת';
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

            // Create request data
            const requestData = createCarpoolRequest({
                ...formData,
                deviceId: user.deviceId
            });

            // Save to Firebase
            const requestId = await createRequestService(requestData);

            // Save user info for future use
            setUserInfo({
                name: formData.passengerName,
                phoneNumber: formData.phoneNumber
            });

            onRequestCreated({ ...requestData, id: requestId });

            // Reset form
            setFormData({
                passengerName: formData.passengerName, // Keep name for convenience
                phoneNumber: formData.phoneNumber, // Keep phone for convenience
                fromCity: '',
                toCity: 'מיקום החתונה',
                preferredDepartureTime: '',
                preferredReturnTime: '',
                additionalInfo: ''
            });

        } catch (error) {
            console.error('Error creating carpool request:', error);
            alert('שגיאה ביצירת בקשת הטרמפ. אנא נסה שוב.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="carpool-request-form">
            <h3>מחפש טרמפ לחתונה? 🚙</h3>

            <form onSubmit={handleSubmit} className="request-form">
                <div className="form-group">
                    <label htmlFor="passengerName">השם שלך *</label>
                    <input
                        type="text"
                        id="passengerName"
                        name="passengerName"
                        value={formData.passengerName}
                        onChange={handleInputChange}
                        className={errors.passengerName ? 'error' : ''}
                        placeholder="איך קוראים לך?"
                    />
                    {errors.passengerName && <span className="error-message">{errors.passengerName}</span>}
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
                    <label htmlFor="fromCity">מאיזה עיר אתה מחפש טרמפ? *</label>
                    <input
                        type="text"
                        id="fromCity"
                        name="fromCity"
                        value={formData.fromCity}
                        onChange={handleInputChange}
                        className={errors.fromCity ? 'error' : ''}
                        placeholder="העיר שלך"
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
                    <label htmlFor="toCity">לאן אתה צריך להגיע?</label>
                    <input
                        type="text"
                        id="toCity"
                        name="toCity"
                        value={formData.toCity}
                        onChange={handleInputChange}
                        placeholder="היעד שלך"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="preferredDepartureTime">זמן יציאה מועדף</label>
                        <input
                            type="text"
                            id="preferredDepartureTime"
                            name="preferredDepartureTime"
                            value={formData.preferredDepartureTime}
                            onChange={handleInputChange}
                            placeholder="לדוגמה: 18:00"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="preferredReturnTime">זמן חזרה מועדף</label>
                        <input
                            type="text"
                            id="preferredReturnTime"
                            name="preferredReturnTime"
                            value={formData.preferredReturnTime}
                            onChange={handleInputChange}
                            placeholder="לדוגמה: 01:00"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="additionalInfo">מידע נוסף</label>
                    <textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        placeholder="בקשות מיוחדות, נקודת איסוף מועדפת, וכד'"
                        rows={3}
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={loading}
                        className="submit-button"
                    >
                        {loading ? 'שולח...' : 'פרסם בקשת טרמפ'}
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

export default CarpoolRequestForm;
