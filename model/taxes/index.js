const mongoose = require('mongoose')

const taxSchema = mongoose.Schema({
    tax: {
        type: Number,
    },
    delivery_charges: {
        type: Number,
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
})

const Tax = mongoose.model('Taxes', taxSchema)

module.exports = Tax
