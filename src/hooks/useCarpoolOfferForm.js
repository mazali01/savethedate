import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { filterCities } from '../data/cities.js';
import { useInvitedUser, useCreateCarpoolOffer } from '../api';
import { createCarpoolOffer } from '../models/carpoolModels.js';

const initialFormData = {
    driverName: '',
    phoneNumber: '',
    fromCity: '',
    returnCity: '',
    availableSeats: 1,
    rideDirection: 'both',
    departureTime: '',
    returnTime: '',
    additionalInfo: '',
    differentReturnCity: false
};

export const useCarpoolOfferForm = (userId, onOfferCreated) => {
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});

    // Debounced city search
    const [debouncedFromCity] = useDebounce(formData.fromCity, 300);
    const [debouncedReturnCity] = useDebounce(formData.returnCity, 300);

    // Load user data
    const { data: userData, isLoading: userDataLoading } = useInvitedUser(userId);

    // City suggestions
    const fromCitySuggestions = debouncedFromCity.length >= 2 ? filterCities(debouncedFromCity) : [];
    const returnCitySuggestions = debouncedReturnCity.length >= 2 ? filterCities(debouncedReturnCity) : [];

    // Create offer mutation
    const createOfferMutation = useCreateCarpoolOffer();

    // Load user data into form
    useEffect(() => {
        if (userData) {
            setFormData(prev => ({
                ...prev,
                driverName: userData.name || '',
                phoneNumber: userData.phoneNumber || ''
            }));
        }
    }, [userData]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.driverName.trim()) {
            newErrors.driverName = 'שם הנהג נדרש';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'מספר טלפון נדרש';
        } else {
            const cleanPhone = formData.phoneNumber.replace(/[\s-]/g, '');
            const isValidIsraeliPhone = /^0(5[0-9]|7[23678]|2|3|4|8|9)\d{7}$/.test(cleanPhone);
            if (!isValidIsraeliPhone) {
                newErrors.phoneNumber = 'מספר טלפון לא תקין (לדוגמה: 050-1234567)';
            }
        }

        // Validate cities based on ride direction
        if (formData.rideDirection === 'to' || formData.rideDirection === 'both') {
            if (!formData.fromCity.trim()) {
                newErrors.fromCity = 'עיר יציאה נדרשת';
            }
        }

        if (formData.rideDirection === 'from') {
            if (!formData.returnCity.trim()) {
                newErrors.returnCity = 'עיר יעד לחזרה נדרשת';
            }
        }

        if (!formData.rideDirection) {
            newErrors.rideDirection = 'יש לבחור כיוון הנסיעה';
        }

        if (formData.availableSeats < 1 || formData.availableSeats > 8) {
            newErrors.availableSeats = 'מספר מקומות צריך להיות בין 1 ל-8';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const offer = createCarpoolOffer({
                ...formData,
                userId: userId,
                returnCity: formData.returnCity || formData.fromCity
            });

            createOfferMutation.mutate(offer, {
                onSuccess: (data) => {
                    onOfferCreated?.(data);
                    // Keep user data but reset form
                    setFormData({
                        ...initialFormData,
                        driverName: userData?.name || '',
                        phoneNumber: userData?.phoneNumber || ''
                    });
                    setErrors({});
                },
                onError: (error) => {
                    console.error('Error creating carpool offer:', error);
                }
            });
        }
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear return city when unchecking different return city
        if (field === 'differentReturnCity' && !value) {
            setFormData(prev => ({
                ...prev,
                [field]: value,
                returnCity: ''
            }));
        }

        // Clear cities when changing ride direction
        if (field === 'rideDirection') {
            setFormData(prev => ({
                ...prev,
                [field]: value,
                fromCity: '',
                returnCity: '',
                differentReturnCity: false
            }));
        }

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    return {
        formData,
        errors,
        userDataLoading,
        isSubmitting: createOfferMutation.isPending,
        fromCitySuggestions,
        returnCitySuggestions,
        updateFormData,
        handleSubmit,
        submitError: createOfferMutation.error
    };
};
