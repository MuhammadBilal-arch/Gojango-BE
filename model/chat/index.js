const mongoose = require('mongoose')

const senderSchema = mongoose.Schema({
    fname: {
        type: String,
        required: true,
    },
    lname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    sender_id: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'USER',
    },
})

const messageSchema = mongoose.Schema({
    message_by: senderSchema,
    message: {
        type: String,
        required: true,
    },
    attachments: {
        image: String,
        file: String,
    },
    image: String,
    DateAndTime: {
        type: Date,
    },
})

const chat = mongoose.Schema({
    chat_id: {
        type: String,
    },
    is_seen: {
        type: Boolean,
    },

    messages: [messageSchema],
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
})

const Chat = mongoose.model('chat', chat)

module.exports = Chat
