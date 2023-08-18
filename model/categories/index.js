const mongoose = require('mongoose')

const categorySchema = mongoose.Schema({ 
    name: {
        type: String,
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

const Categories = mongoose.model('Categories', categorySchema)

module.exports = Categories
