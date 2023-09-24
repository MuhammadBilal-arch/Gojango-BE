const mongoose = require('mongoose')

const userPaymentSchema = mongoose.Schema(
    {
        dispensary_id: {
            type: mongoose.Schema.Types.Mixed,
            ref: 'Dispensary',
        },
        order_id: {
            type: mongoose.Schema.Types.Mixed,
            ref: 'Orders',
        },
        customer_id: {
            type: mongoose.Schema.Types.Mixed,
            ref: 'USER',
        },
        driver_id: {
            type: mongoose.Schema.Types.Mixed,
            ref: 'USER',
        },
        transaction_id: {
            type: String,
        },
        transaction_time: {
            type: String,
        },
        amount: {
            type: Number,
        },
        total_items: {
            type: Number,
        },
        signature: {
            type: String,
        },
        intent_id: {
            type: String,
        },
        tip_amount: {
            type: Number,
        },
    },
    {
        timestamps: true, // Enable automatic createdAt and updatedAt fields
    }
)

const Transaction = mongoose.model('Transactions', userPaymentSchema)

module.exports = Transaction
