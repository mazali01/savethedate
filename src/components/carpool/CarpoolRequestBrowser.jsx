import React, { useState, useEffect } from 'react';
import { subscribeToCarpoolOffers } from '../../services/carpoolService.js';
import { filterCities } from '../../data/cities.js';
import { getCurrentUser } from '../../utils/deviceId.js';
import './CarpoolBrowser.css';

const CarpoolBrowser = () => {
    const [offers, setOffers] = useState([]);
    const [filteredOffers, setFilteredOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchFilters, setSearchFilters] = useState({
        fromCity: '',
        toCity: '',
        minSeats: ''
    });
    const [fromCitySuggestions, setFromCitySuggestions] = useState([]);
    const [toCitySuggestions, setToCitySuggestions] = useState([]);

    const currentUser = getCurrentUser();

    useEffect(() => {
        const unsubscribe = subscribeToCarpoolOffers((offersData) => {
            setOffers(offersData);
            setFilteredOffers(offersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter offers based on search criteria
    useEffect(() => {
        let filtered = offers.filter(offer => {
            const matchesFromCity = !searchFilters.fromCity ||
                offer.fromCity.toLowerCase().includes(searchFilters.fromCity.toLowerCase());
            const matchesToCity = !searchFilters.toCity ||
                offer.toCity.toLowerCase().includes(searchFilters.toCity.toLowerCase());
            const matchesMinSeats = !searchFilters.minSeats ||
                offer.availableSeats >= parseInt(searchFilters.minSeats);

            return matchesFromCity && matchesToCity && matchesMinSeats;
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
        if (field === 'toCity') {
            setToCitySuggestions(filterCities(value));
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
        if (field === 'toCity') {
            setToCitySuggestions([]);
        }
    };

    const clearFilters = () => {
        setSearchFilters({
            fromCity: '',
            toCity: '',
            minSeats: ''
        });
        setFromCitySuggestions([]);
        setToCitySuggestions([]);
    };

    const handleContactDriver = (offer) => {
        const message = encodeURIComponent(`שלום ${offer.driverName}, אני מעוניין בטרמפ מ${offer.fromCity} ל${offer.toCity}. האם יש עוד מקום פנוי?`);
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

                        <div className="filter-group autocomplete-group">
                            <label>עיר יעד 🎯</label>
                            <input
                                type="text"
                                value={searchFilters.toCity}
                                onChange={(e) => handleSearchChange('toCity', e.target.value)}
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
                        {(searchFilters.fromCity || searchFilters.toCity || searchFilters.minSeats) && (
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

                    {(searchFilters.fromCity || searchFilters.toCity || searchFilters.minSeats) && (
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
                                {searchFilters.toCity && (
                                    <span
                                        className="filter-tag"
                                        onClick={() => handleSearchChange('toCity', '')}
                                    >
                                        אל: {searchFilters.toCity} ✕
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
                                        <h4>{offer.driverName}</h4>
                                        <span className="phone-number">📞 {offer.phoneNumber}</span>
                                    </div>
                                </div>
                                <div className="seats-info">
                                    <span className={`seats-count ${offer.availableSeats === 0 ? 'full' : ''}`}>
                                        {offer.availableSeats === 0 ? 'מלא' : `${offer.availableSeats} מקומות`}
                                    </span>
                                </div>
                            </div>

                            <div className="route-info">
                                <div className="route-item">
                                    <span className="route-label">מ:</span>
                                    <span className="route-value">{offer.fromCity}</span>
                                </div>
                                <span className="route-arrow">➜</span>
                                <div className="route-item">
                                    <span className="route-label">אל:</span>
                                    <span className="route-value">{offer.toCity}</span>
                                </div>
                                {offer.returnCity && offer.returnCity !== offer.toCity && (
                                    <>
                                        <span className="route-arrow">➜</span>
                                        <div className="route-item">
                                            <span className="route-label">חזרה:</span>
                                            <span className="route-value">{offer.returnCity}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {(offer.departureTime || offer.returnTime) && (
                                <div className="timing-info">
                                    {offer.departureTime && (
                                        <div className="time-item">
                                            <span className="time-label">יציאה:</span>
                                            <span className="time-value">{offer.departureTime}</span>
                                        </div>
                                    )}
                                    {offer.returnTime && (
                                        <div className="time-item">
                                            <span className="time-label">חזרה:</span>
                                            <span className="time-value">{offer.returnTime}</span>
                                        </div>
                                    )}
                                </div>
                            )}

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

                            {offer.deviceId !== currentUser.deviceId && (
                                <div className="offer-actions">
                                    <button
                                        onClick={() => handleContactDriver(offer)}
                                        className="contact-button"
                                    >
                                        📱 צור קשר בWhatsApp
                                    </button>
                                </div>
                            )}

                            <div className="offer-meta">
                                <span className="created-date">
                                    נוצר: {formatDate(offer.createdAt)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CarpoolBrowser;
