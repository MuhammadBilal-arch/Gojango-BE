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
    location: {
        type: String,
    },
    longitude: {
        type: String,
    },
    latitude: {
        type: String,
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

    delivery_time: {
        type: String,
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
