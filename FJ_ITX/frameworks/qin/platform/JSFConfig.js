/**
 * JSFConfig.js
 * @authors Casper 
 * @date    2015/10/20
 * @version 1.0.0
 */
// Total number of bookings. 0 is not limited.
jsf.BOOKING_MAX_COUNT = 0;

// Total number of types of bookings. 0 is not limited.
jsf.BOOKING_TYPES_MAX_COUNT = 0;

// The advance quantity for booking(jsf.Booking.TYPE_EPG). Unit is ms.
jsf.EPG_BOOKING_ADVANCE_QUANTITY = 60000;

// The longest time for booking. Unit is s.
jsf.BOOKING_MAX_DURATION = 86400;

// The longest time for booking. Unit is ms.
jsf.BOOKING_MAX_DURATION_MS = 86400000;

// Record number of simultaneous recording for pvr.
jsf.MAX_NUMBER_OF_SIMULTANEOUS_RECORDING = 1;

// Whether to save the shutdown channel.
jsf.SAVE_SHUTDOWN_CHANNEL = true;

// The default duration of recording.
jsf.PVR_DURATION = 7200;

// The default quality of recording.
jsf.PVR_QUALITY = 'normal';

// The default encryption of recording.
jsf.PVR_ENCRYPTION = 'noEncryption';

// The default rating of recording.
jsf.PVR_RATING = 0;