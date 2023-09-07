const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
    dispensary: {
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
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
    },
    customer_location: {
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
    tax: {
        type: Number,
    },
    delivery_charges: {
        type: Number,
    },
    total_amount: {
        type: Number,
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
