const mongoose = require('mongoose')

const userPaymentSchema = mongoose.Schema(
    {
        dispensary_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dispensary',
        },
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
        },
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'USER',
        },
        driver_id: {
            type: mongoose.Schema.Types.ObjectId,
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
