const mongoose = require('mongoose')
const userLocation = require('../userLocations')
const product = require('../products')
const orderSchema = mongoose.Schema({
    dispensary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dispensary',
    },
    products: [product.schema],
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
    },
    customer_location: userLocation.schema,
    delivery_note: {
        type: String,
    },
    dispensary_approved: {
        type: Boolean,
        default: false,
    },
    driver_assigned: {
        type: Boolean,
        default: false,
    },
    order_awaiting_pickup: {
        type: Boolean,
        default: false,
    },
    order_in_transit: {
        type: Boolean,
        default: false,
    },
    order_status: {
        type: Boolean,
        default: true,
    },
    order_delivered: {
        type: Boolean,
        default: false,
    },
    order_delivered_date: {
        type: Date,
        default: null,
    },
    order_cancellation_date: {
        type: Date,
        default: null,
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
