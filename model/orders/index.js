const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)
const userLocation = require('../userLocations')
const product = require('../products')
const orderSchema = mongoose.Schema({
    dispensary: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'Dispensary',
    },
    products: [product.schema],
    customer: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'USER',
    },
    driver: {
        type: mongoose.Schema.Types.Mixed,
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
    order_driver_accept_date: {
        type: Date,
        default: null,
    },
    order_pickup_date: {
        type: Date,
        default: null,
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
    sub_total: {
        type: Number,
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
    order_cancel_reason: {
        type: String,
    },
    order_id: {
        type: Number,
        unique: true,
    },
    driver_location: {
        lat: Number,
        lng: Number,
    },
    driving_time: Number,
    rejected_drivers: [
        {
            type: mongoose.Schema.Types.Mixed,
            ref: 'USER', // Assuming USER is the model for drivers
        },
    ],
})

orderSchema.pre('save', async function (next) {
    if (!this.order_id) {
        const Order = mongoose.model('Orders')
        const lastOrder = await Order.findOne(
            {},
            {},
            { sort: { order_id: -1 } }
        )
        if (lastOrder) {
            this.order_id = lastOrder.order_id + 1
        } else {
            this.order_id = 1
        }
    }
    next()
})
const Order = mongoose.model('Orders', orderSchema)

module.exports = Order
