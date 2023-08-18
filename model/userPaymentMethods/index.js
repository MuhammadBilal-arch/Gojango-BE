const mongoose = require('mongoose')

const userPaymentSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
    },
    card_number: {
        type: String,
    },
    expiry_date: {
        type: String,
    },
    cvv: {
        type: String,
    },
    zipCode: {
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

const UserLocation = mongoose.model('UserPaymentMethod', userPaymentSchema)

module.exports = UserLocation
