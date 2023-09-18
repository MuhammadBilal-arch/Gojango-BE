const mongoose = require('mongoose')

const cartSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
    },
    product_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
    },
    dispensary_id:{
        type: mongoose.Schema.Types.ObjectId,
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
