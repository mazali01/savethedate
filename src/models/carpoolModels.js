/**
 * Carpool Offer Model
 * Represents someone offering a ride to the wedding
 * 
 * Fields:
 * - id: string - Document ID
 * - userId: string - User identifier
 * - driverName: string - Driver's name
 * - phoneNumber: string - Driver's phone number
 * - fromCity: string - Departure city
 * - returnCity: string - Return destination if different from departure city
 * - availableSeats: number - Number of available seats
 * - totalSeats: number - Total seats offered
 * - rideDirection: string - 'to', 'from', or 'both' - direction of the ride
 * - departureTime: string - Departure time description
 * - returnTime: string - Return time description
 * - additionalInfo: string - Additional notes
 * - createdAt: Date - Creation timestamp
 * - updatedAt: Date - Last update timestamp
 * - isActive: boolean - If the offer is still available
 * - passengers: Array - List of accepted passengers
 */

/**
 * Carpool Request Model
 * Represents someone looking for a ride to the wedding
 * 
 * Fields:
 * - id: string - Document ID
 * - userId: string - User identifier
 * - passengerName: string - Passenger's name
 * - phoneNumber: string - Passenger's phone number
 * - fromCity: string - Departure city
 * - preferredDepartureTime: string - Preferred departure time
 * - preferredReturnTime: string - Preferred return time
 * - additionalInfo: string - Special requests or notes
 * - createdAt: Date - Creation timestamp
 * - updatedAt: Date - Last update timestamp
 * - isActive: boolean - If still looking for a ride
 * - matchedOfferId: string - ID of matched carpool offer
 * - status: string - 'looking', 'matched', or 'confirmed'
 */

/**
 * Create a new carpool offer object
 * @param {Object} data - Offer data
 * @returns {Object} Formatted carpool offer
 */
export const createCarpoolOffer = (data) => {
    const now = new Date();
    return {
        id: null, // Will be set by Firestore
        userId: data.userId,
        driverName: data.driverName,
        phoneNumber: data.phoneNumber,
        fromCity: data.fromCity,
        toCity: "החתונה", // Everyone is going to the wedding
        returnCity: data.returnCity || data.fromCity,
        availableSeats: parseInt(data.availableSeats),
        totalSeats: parseInt(data.availableSeats), // Initially same as available
        rideDirection: data.rideDirection || 'both', // 'to', 'from', or 'both'
        departureTime: data.departureTime || '',
        returnTime: data.returnTime || '',
        additionalInfo: data.additionalInfo || '',
        createdAt: now,
        updatedAt: now,
        isActive: true,
        passengers: []
    };
};

/**
 * Create a new carpool request object
 * @param {Object} data - Request data
 * @returns {Object} Formatted carpool request
 */
export const createCarpoolRequest = (data) => {
    const now = new Date();
    return {
        id: null, // Will be set by Firestore
        userId: data.userId,
        passengerName: data.passengerName,
        phoneNumber: data.phoneNumber,
        fromCity: data.fromCity,
        toCity: "החתונה", // Everyone is going to the wedding
        preferredDepartureTime: data.preferredDepartureTime || '',
        preferredReturnTime: data.preferredReturnTime || '',
        additionalInfo: data.additionalInfo || '',
        createdAt: now,
        updatedAt: now,
        isActive: true,
        matchedOfferId: null,
        status: 'looking'
    };
};

/**
 * Update available seats when passenger is accepted
 * @param {Object} offer - Carpool offer
 * @param {number} seatsToReserve - Number of seats to reserve (usually 1)
 * @returns {Object} Updated offer
 */
export const reserveSeats = (offer, seatsToReserve = 1) => {
    return {
        ...offer,
        availableSeats: Math.max(0, offer.availableSeats - seatsToReserve),
        updatedAt: new Date()
    };
};

/**
 * Add passenger to carpool offer
 * @param {Object} offer - Carpool offer
 * @param {Object} passenger - Passenger data
 * @returns {Object} Updated offer
 */
export const addPassengerToOffer = (offer, passenger) => {
    const newPassenger = {
        userId: passenger.userId,
        name: passenger.name,
        phoneNumber: passenger.phoneNumber,
        acceptedAt: new Date(),
        status: 'accepted'
    };

    return {
        ...offer,
        passengers: [...offer.passengers, newPassenger],
        availableSeats: Math.max(0, offer.availableSeats - 1),
        updatedAt: new Date()
    };
};
