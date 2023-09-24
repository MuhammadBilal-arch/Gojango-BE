const mongoose = require('mongoose')

const cartSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'USER',
    },
    product_id:{
        type: mongoose.Schema.Types.Mixed,
        ref: 'Products',
    },
    dispensary_id:{
        type: mongoose.Schema.Types.Mixed,
        ref: 'Dispensary',
    },
    quantity: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
})

const Cart = mongoose.model('Cart', cartSchema)

module.exports = Cart
