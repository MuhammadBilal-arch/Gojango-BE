const mongoose = require('mongoose')

const productsSchema = mongoose.Schema({
    name: String,
    description: String,
    amount: String,
    quantity: Number,
    image: String,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categories',
      },
    dispensary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dispensary',
      },

    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
})

const Products = mongoose.model('Products', productsSchema)

module.exports = Products