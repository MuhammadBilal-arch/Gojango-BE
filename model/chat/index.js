const mongoose = require('mongoose')

const messageSchema = mongoose.Schema({
    message_by:{
        type: String,
        required: true,        
    },
    message: {
        type: String,
        required: true,
    },
    attachments: {
        video: String,
        image: String,
        voice: String,
        file: String
    },
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
    emails:[{
        email: String,
    }],
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
    }],
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
