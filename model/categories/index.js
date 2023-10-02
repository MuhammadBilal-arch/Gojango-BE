const mongoose = require('mongoose')

const categorySchema = mongoose.Schema({
    name: {
        type: String,
    },
    dispensary: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'Dispensary',
    },
    position: {
        type: Number,
        required: true,
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
