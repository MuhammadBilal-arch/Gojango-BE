const mongoose = require('mongoose') 
const dispensarySchema = mongoose.Schema({
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    image: {
        type: String,
    },
    street: {
        type: String,
    },
    state: {
        type: String,
    },
    city: {
        type: String,
    },
    zipCode: {
        type: String,
    },
    unit: {
        type: String,
    },
    location: {
        type: String,
    },
    longitude: {
        type: Number,
    },
    latitude: {
        type: Number,
    },
    phone: {
        type: String,
    },
    rating: {
        type: Number,
    },
    delivery_charges: {
        type: Number,
    },
    tax: {
        type: Number,
    },

    delivery_time: {
        type: String,
    },
    status: {
        type: Boolean,
    },
    delivery_days: [
        {
            name: String,
            from_time: String,
            to_time: String,
        },
    ],
    pickup_days: [
        {
            name: String,
            from_time: String,
            to_time: String,
        },
    ],
    reviews: [{ review: String }],

    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
})


const Dispensary = mongoose.model('Dispensary', dispensarySchema)

module.exports = Dispensary
