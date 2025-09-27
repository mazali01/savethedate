import React, { useState, useEffect } from 'react';
import { useCarpoolOffers } from '../../api';
import { filterCities } from '../../data/cities.js';
import './CarpoolBrowser.css';

const CarpoolBrowser = ({ userId }) => {
    const [filteredOffers, setFilteredOffers] = useState([]);
    const [searchFilters, setSearchFilters] = useState({
        fromCity: '',
        minSeats: ''
    });
    const [fromCitySuggestions, setFromCitySuggestions] = useState([]);

    // Use React Query hook to fetch offers
    const { data: offers = [], isLoading: loading } = useCarpoolOffers();

    useEffect(() => {
        setFilteredOffers(offers);
    }, [offers]);

    // Filter offers based on search criteria
    useEffect(() => {
        let filtered = offers.filter(offer => {
            const matchesFromCity = !searchFilters.fromCity ||
                offer.fromCity.toLowerCase().includes(searchFilters.fromCity.toLowerCase());
            const matchesMinSeats = !searchFilters.minSeats ||
                offer.availableSeats >= parseInt(searchFilters.minSeats);

            return matchesFromCity && matchesMinSeats;
        });

        setFilteredOffers(filtered);
    }, [offers, searchFilters]);

    const handleSearchChange = (field, value) => {
        setSearchFilters(prev => ({
            ...prev,
            [field]: value
        }));

        // Handle city autocomplete
        if (field === 'fromCity') {
            setFromCitySuggestions(filterCities(value));
        }
    };

    const handleCitySelect = (city, field) => {
        setSearchFilters(prev => ({
            ...prev,
            [field]: city
        }));

        if (field === 'fromCity') {
            setFromCitySuggestions([]);
        }
    };

    const clearFilters = () => {
        setSearchFilters({
            fromCity: '',
            minSeats: ''
        });
        setFromCitySuggestions([]);
    };

    const handleContactDriver = (offer) => {
        const message = encodeURIComponent(`שלום ${offer.driverName}, אני מעוניין בטרמפ מ${offer.fromCity} לחתונה. האם יש עוד מקום פנוי?`);
        const whatsappUrl = `https://wa.me/972${offer.phoneNumber.replace(/^0/, '').replace(/\D/g, '')}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('he-IL', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="carpool-browser loading">
                <div className="loading-spinner">🔄 טוען הצעות טרמפ...</div>
            </div>
        );
    }

    return (
        <div className="carpool-browser">
            <h3>הצעות טרמפ זמינות 🚙</h3>

            {/* Search Filters - Updated to match theme */}
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
                                value={searchFilters.fromCity}
                                onChange={(e) => handleSearchChange('fromCity', e.target.value)}
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

                        <div className="filter-group">
                            <label>מקומות פנויים 👥</label>
                            <select
                                value={searchFilters.minSeats}
                                onChange={(e) => handleSearchChange('minSeats', e.target.value)}
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
                        {(searchFilters.fromCity || searchFilters.minSeats) && (
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

                    {(searchFilters.fromCity || searchFilters.minSeats) && (
                        <div className="active-filters">
                            <span className="active-filters-label">מסננים פעילים:</span>
                            <div className="filter-tags">
                                {searchFilters.fromCity && (
                                    <span
                                        className="filter-tag"
                                        onClick={() => handleSearchChange('fromCity', '')}
                                    >
                                        מ: {searchFilters.fromCity} ✕
                                    </span>
                                )}
                                {searchFilters.minSeats && (
                                    <span
                                        className="filter-tag"
                                        onClick={() => handleSearchChange('minSeats', '')}
                                    >
                                        {searchFilters.minSeats}+ מקומות ✕
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {filteredOffers.length === 0 ? (
                <div className="empty-state">
                    {offers.length === 0 ? (
                        <>
                            <h3>אין הצעות טרמפ כרגע</h3>
                            <p>היה הראשון להציע טרמפ לאורחים אחרים! 🚗</p>
                        </>
                    ) : (
                        <>
                            <h3>לא נמצאו טרמפים מתאימים</h3>
                            <p>נסה לשנות את תנאי החיפוש או הצע טרמפ בעצמך</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="offers-grid">
                    {filteredOffers.map(offer => (
                        <div key={offer.id} className="offer-card">
                            <div className="offer-header">
                                <div className="driver-info">
                                    {offer.photoUrl && (
                                        <img
                                            src={offer.photoUrl}
                                            alt={`תמונת ${offer.driverName}`}
                                            className="driver-photo"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    )}
                                    <div className="driver-details">
                                        <div className="driver-name-row">
                                            <h4>{offer.driverName}</h4>
                                            <span className="created-date">
                                                {formatDate(offer.createdAt)}
                                            </span>
                                        </div>
                                        <div className="phone-row">
                                            <span className="phone-number">📞 {offer.phoneNumber}</span>
                                            {offer.userId !== userId && (
                                                <button
                                                    onClick={() => handleContactDriver(offer)}
                                                    className="whatsapp-icon-button"
                                                    title="צור קשר בWhatsApp"
                                                >
                                                    💬
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="seats-info">
                                    <span className={`seats-count ${offer.availableSeats === 0 ? 'full' : ''}`}>
                                        {offer.availableSeats === 0 ? 'מלא' : `${offer.availableSeats} מקומות`}
                                    </span>
                                </div>
                            </div>

                            <div className="route-trips">
                                {/* Trip to wedding - only show if going to wedding */}
                                {(offer.rideDirection === 'to' || offer.rideDirection === 'both') && offer.fromCity && (
                                    <div className="trip-info to-wedding">
                                        <div className="trip-route">
                                            <div className="location from-location">
                                                <span className="location-label">מ:</span>
                                                <span className="location-value">{offer.fromCity}</span>
                                            </div>
                                            <span className="route-arrow">➜</span>
                                            <div className="location to-location">
                                                <span className="location-label">אל:</span>
                                                <span className="location-value">החתונה</span>
                                            </div>
                                        </div>
                                        {offer.departureTime && (
                                            <div className="trip-time">
                                                <span className="time-icon">🕐</span>
                                                <span className="time-value">{offer.departureTime}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Trip from wedding - only show if coming back from wedding */}
                                {(offer.rideDirection === 'from' || offer.rideDirection === 'both') && (
                                    <div className="trip-info from-wedding">
                                        <div className="trip-route">
                                            <div className="location from-location">
                                                <span className="location-label">מ:</span>
                                                <span className="location-value">החתונה</span>
                                            </div>
                                            <span className="route-arrow">➜</span>
                                            <div className="location to-location">
                                                <span className="location-label">אל:</span>
                                                <span className="location-value">
                                                    {offer.rideDirection === 'from' ? offer.returnCity :
                                                        (offer.returnCity && offer.returnCity !== offer.fromCity) ?
                                                            offer.returnCity : offer.fromCity}
                                                </span>
                                            </div>
                                        </div>
                                        {offer.returnTime && (
                                            <div className="trip-time">
                                                <span className="time-icon">🕐</span>
                                                <span className="time-value">{offer.returnTime}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {offer.additionalInfo && (
                                <div className="additional-info">
                                    <p>{offer.additionalInfo}</p>
                                </div>
                            )}

                            {offer.passengers.length > 0 && (
                                <div className="passengers-info">
                                    <div className="current-passengers">
                                        <h5>נוסעים רשומים:</h5>
                                        <ul>
                                            {offer.passengers.map((passenger, index) => (
                                                <li key={index}>
                                                    {passenger.name} - {passenger.phoneNumber}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CarpoolBrowser;
