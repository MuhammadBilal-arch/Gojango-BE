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
        ref: 'USER',
    },
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
    },
    location_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserLocation',
    },
    delivery_note: {
        type: String,
    },
    approved: {
        type: Boolean,
        default: false,
    },
    driver_status: {
        type: String,
    },
    order_status: {
        type: Boolean,
        default: false,
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
