const mongoose = require('mongoose')

const userLocationSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
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
        type: String,
    },
    lng: {
        type: String,
    },
    selected: {
        type: Boolean,
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
