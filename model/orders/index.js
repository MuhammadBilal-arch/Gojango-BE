const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
    dispensary_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dispensary',
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            quantity: {
                type: Number,
                default: 1,
            },
            amount: {
                type: Number,
            },
        },
    ],
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    location_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserLocation',
    },
    delivery_note: {
        type: String,
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
})

const Order = mongoose.model('Orders', orderSchema)

module.exports = Order
