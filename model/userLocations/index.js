const mongoose = require('mongoose')

const userLocationSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'USER',
    },
    street: {
        type: String,
    },
    unit: {
        type: String,
    },
    zipCode: {
        type: String,
    },
    label: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    lat: {
        type: Number,
    },
    lng: {
        type: Number,
    },
    selected: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
})

const UserLocation = mongoose.model('UserLocation', userLocationSchema)

module.exports = UserLocation
