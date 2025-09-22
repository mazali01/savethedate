import React, { useState, useEffect } from 'react';
import { subscribeToCarpoolOffers, addPassengerToOffer } from '../../services/carpoolService.js';
import { getCurrentUser } from '../../utils/deviceId.js';
import { filterCities } from '../../data/cities.js';
import './CarpoolBrowser.css';

const CarpoolBrowser = ({ onRequestRide }) => {
    const [offers, setOffers] = useState([]);
    const [filteredOffers, setFilteredOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contacting, setContacting] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    // Filter states
    const [filters, setFilters] = useState({
        fromCity: '',
        toCity: '',
        departureTime: '',
        availableSeats: ''
    });

    // City suggestions for autocomplete
    const [fromCitySuggestions, setFromCitySuggestions] = useState([]);
    const [toCitySuggestions, setToCitySuggestions] = useState([]);

    useEffect(() => {
        // Get current user
        setCurrentUser(getCurrentUser());

        // Subscribe to real-time offers
        const unsubscribe = subscribeToCarpoolOffers((offersData) => {
            setOffers(offersData);
            setFilteredOffers(offersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter offers based on current filters
    useEffect(() => {
        let filtered = offers;

        if (filters.fromCity) {
            filtered = filtered.filter(offer =>
                offer.fromCity?.toLowerCase().includes(filters.fromCity.toLowerCase())
            );
        }

        if (filters.toCity) {
            filtered = filtered.filter(offer =>
                offer.toCity?.toLowerCase().includes(filters.toCity.toLowerCase())
            );
        }

        if (filters.departureTime) {
            filtered = filtered.filter(offer =>
                offer.departureTime?.includes(filters.departureTime)
            );
        }

        if (filters.availableSeats) {
            const minSeats = parseInt(filters.availableSeats);
            filtered = filtered.filter(offer =>
                offer.availableSeats >= minSeats
            );
        }

        setFilteredOffers(filtered);
    }, [offers, filters]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));

        // Handle city autocomplete
        if (field === 'fromCity') {
            setFromCitySuggestions(value ? filterCities(value) : []);
        }
        if (field === 'toCity') {
            setToCitySuggestions(value ? filterCities(value) : []);
        }
    };

    const handleCitySelect = (city, field) => {
        setFilters(prev => ({
            ...prev,
            [field]: city
        }));

        if (field === 'fromCity') {
            setFromCitySuggestions([]);
        }
        if (field === 'toCity') {
            setToCitySuggestions([]);
        }
    };

    const clearFilters = () => {
        setFilters({
            fromCity: '',
            toCity: '',
            departureTime: '',
            availableSeats: ''
        });
        setFromCitySuggestions([]);
        setToCitySuggestions([]);
    };

    const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

    const handleContactDriver = (offer) => {
        if (!currentUser.name || !currentUser.phoneNumber) {
            // If user info is not complete, show form to get it
            const name = prompt('מה השם שלך?');
            const phone = prompt('מה מספר הטלפון שלך?');

            if (!name || !phone) {
                return;
            }

            const { setUserInfo } = require('../../utils/deviceId.js');
            setUserInfo({ name, phoneNumber: phone });
            setCurrentUser({ ...currentUser, name, phoneNumber: phone });
        }

        // Open WhatsApp or phone app
        const message = `שלום ${offer.driverName}! אני מעוניין/ת בטרמפ מ${offer.fromCity} ל${offer.toCity}. האם יש מקום פנוי?`;
        const whatsappUrl = `https://wa.me/972${offer.phoneNumber.replace(/^0/, '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    };

    const handleRequestRide = async (offer) => {
        if (!currentUser.name || !currentUser.phoneNumber) {
            alert('אנא מלא את פרטיך תחילה');
            return;
        }

        if (offer.availableSeats <= 0) {
            alert('אין מקומות פנויים בטרמפ זה');
            return;
        }

        const confirmed = window.confirm(`האם אתה בטוח שאתה רוצה לבקש מקום בטרמפ של ${offer.driverName}?`);
        if (!confirmed) return;

        setContacting(prev => ({ ...prev, [offer.id]: true }));

        try {
            await addPassengerToOffer(offer.id, {
                deviceId: currentUser.deviceId,
                name: currentUser.name,
                phoneNumber: currentUser.phoneNumber
            });

            alert(`בקשתך נשלחה ל${offer.driverName}. הנהג יוכל לראות את הפרטים שלך וליצור איתך קשר.`);

            // Also open WhatsApp
            handleContactDriver(offer);

        } catch (error) {
            console.error('Error requesting ride:', error);
            alert('שגיאה בשליחת הבקשה. אנא נסה שוב.');
        } finally {
            setContacting(prev => ({ ...prev, [offer.id]: false }));
        }
    };

    const formatTime = (timeString) => {
        return timeString || 'לא צוין';
    };

    const formatPhoneNumber = (phone) => {
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    };

    if (loading) {
        return (
            <div className="carpool-browser loading">
                <div className="loading-spinner">טוען טרמפים...</div>
            </div>
        );
    }

    if (offers.length === 0 && !loading) {
        return (
            <div className="carpool-browser empty">
                <div className="empty-state">
                    <h3>אין טרמפים זמינים כרגע</h3>
                    <p>היה הראשון להציע טרמפ! 🚗</p>
                </div>
            </div>
        );
    }

    const SearchFilters = () => (
        <div className="search-filters-container">
            <div className="search-filters-header">
                <h3>🔍 חיפוש טרמפים</h3>
            </div>

            <div className="search-filters">
                <div className="filter-row">
                    <div className="filter-group autocomplete-group">
                        <label>עיר יציאה 📍</label>
                        <input
                            type="text"
                            value={filters.fromCity}
                            onChange={(e) => handleFilterChange('fromCity', e.target.value)}
                            placeholder="הקלד שם עיר..."
                            className="filter-input"
                        />
                        {fromCitySuggestions.length > 0 && (
                            <div className="city-suggestions">
                                {fromCitySuggestions.map((city, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleCitySelect(city, 'fromCity')}
                                        className="city-suggestion"
                                    >
                                        {city}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="filter-group autocomplete-group">
                        <label>עיר יעד 🎯</label>
                        <input
                            type="text"
                            value={filters.toCity}
                            onChange={(e) => handleFilterChange('toCity', e.target.value)}
                            placeholder="הקלד שם עיר..."
                            className="filter-input"
                        />
                        {toCitySuggestions.length > 0 && (
                            <div className="city-suggestions">
                                {toCitySuggestions.map((city, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleCitySelect(city, 'toCity')}
                                        className="city-suggestion"
                                    >
                                        {city}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="filter-group">
                        <label>זמן יציאה 🕐</label>
                        <input
                            type="time"
                            value={filters.departureTime}
                            onChange={(e) => handleFilterChange('departureTime', e.target.value)}
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label>מקומות פנויים 👥</label>
                        <select
                            value={filters.availableSeats}
                            onChange={(e) => handleFilterChange('availableSeats', e.target.value)}
                            className="filter-select"
                        >
                            <option value="">כל המקומות</option>
                            <option value="1">1+ מקומות</option>
                            <option value="2">2+ מקומות</option>
                            <option value="3">3+ מקומות</option>
                            <option value="4">4+ מקומות</option>
                        </select>
                    </div>
                </div>

                <div className="filter-actions">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="clear-search-button"
                        >
                            🗑️ נקה חיפוש
                        </button>
                    )}
                    <div className="results-counter">
                        <span className="results-count">
                            {filteredOffers.length} תוצאות
                        </span>
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="active-filters">
                        <span className="active-filters-label">מסננים פעילים:</span>
                        <div className="filter-tags">
                            {filters.fromCity && (
                                <span
                                    className="filter-tag"
                                    onClick={() => handleFilterChange('fromCity', '')}
                                >
                                    מ: {filters.fromCity} ✕
                                </span>
                            )}
                            {filters.toCity && (
                                <span
                                    className="filter-tag"
                                    onClick={() => handleFilterChange('toCity', '')}
                                >
                                    אל: {filters.toCity} ✕
                                </span>
                            )}
                            {filters.departureTime && (
                                <span
                                    className="filter-tag"
                                    onClick={() => handleFilterChange('departureTime', '')}
                                >
                                    זמן: {filters.departureTime} ✕
                                </span>
                            )}
                            {filters.availableSeats && (
                                <span
                                    className="filter-tag"
                                    onClick={() => handleFilterChange('availableSeats', '')}
                                >
                                    {filters.availableSeats}+ מקומות ✕
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="carpool-browser">
            <h3>טרמפים זמינים 🚗</h3>

            <SearchFilters />

            <div className="offers-grid">
                {filteredOffers.map(offer => (
                    <div key={offer.id} className="offer-card">
                        <div className="offer-header">
                            <div className="driver-info">
                                {offer.photoUrl && (
                                    <img
                                        src={offer.photoUrl}
                                        alt={offer.driverName}
                                        className="driver-photo"
                                    />
                                )}
                                <div className="driver-details">
                                    <h4>{offer.driverName}</h4>
                                    <span className="phone-number" dir="ltr">
                                        📞 {formatPhoneNumber(offer.phoneNumber)}
                                    </span>
                                </div>
                            </div>
                            <div className="seats-info">
                                <span className={`seats-count ${offer.availableSeats === 0 ? 'full' : ''}`}>
                                    {offer.availableSeats} מקומות פנויים
                                </span>
                            </div>
                        </div>

                        <div className="route-info">
                            <div className="route-item">
                                <span className="route-label">מ:</span>
                                <span className="route-value">{offer.fromCity}</span>
                            </div>
                            <div className="route-arrow">→</div>
                            <div className="route-item">
                                <span className="route-label">אל:</span>
                                <span className="route-value">{offer.toCity}</span>
                            </div>
                            {offer.returnCity && offer.returnCity !== offer.toCity && (
                                <>
                                    <div className="route-arrow">→</div>
                                    <div className="route-item">
                                        <span className="route-label">חזרה:</span>
                                        <span className="route-value">{offer.returnCity}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="timing-info">
                            <div className="time-item">
                                <span className="time-label">יציאה:</span>
                                <span className="time-value">{formatTime(offer.departureTime)}</span>
                            </div>
                            <div className="time-item">
                                <span className="time-label">חזרה:</span>
                                <span className="time-value">{formatTime(offer.returnTime)}</span>
                            </div>
                        </div>

                        {offer.additionalInfo && (
                            <div className="additional-info">
                                <p>{offer.additionalInfo}</p>
                            </div>
                        )}

                        <div className="passengers-info">
                            {offer.passengers && offer.passengers.length > 0 && (
                                <div className="current-passengers">
                                    <h5>נוסעים כרגע:</h5>
                                    <ul>
                                        {offer.passengers.map((passenger, index) => (
                                            <li key={index}>
                                                {passenger.name}
                                                {passenger.status === 'pending' && ' (ממתין לאישור)'}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="offer-actions">
                            <button
                                onClick={() => handleContactDriver(offer)}
                                className="contact-button"
                            >
                                💬 פנה לנהג
                            </button>

                            {offer.availableSeats > 0 ? (
                                <button
                                    onClick={() => handleRequestRide(offer)}
                                    disabled={contacting[offer.id]}
                                    className="request-button"
                                >
                                    {contacting[offer.id] ? 'שולח...' : '🚗 בקש מקום'}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="request-button disabled"
                                >
                                    🚫 אין מקומות
                                </button>
                            )}
                        </div>

                        <div className="offer-meta">
                            <span className="created-date">
                                פורסם: {new Date(offer.createdAt).toLocaleDateString('he-IL')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CarpoolBrowser;
