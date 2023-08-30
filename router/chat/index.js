const express = require('express')
const router = express.Router()
const UserChat = require('../../model/chat')
const User = require('../../model/user')
const { sendErrorMessage, sendSuccessMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const auth = require('../../middleware/auth')

router.post('/create', auth, async (req, res) => {
    try {
        const { senderEmail, receiverEmail, messages, attachments } = req.body 
        const senderUser = await User.findOne({ email: senderEmail })
        const receiverUser = await User.findOne({ email: receiverEmail }) 
        if (!senderUser || !receiverUser) {
            return sendErrorMessage(
                statusCode.NOT_FOUND,
                'One or both users not found',
                res
            )
        }

        const chat_id = `${senderEmail}${receiverEmail}`.split("").sort().join('')

        const chatExist = await UserChat.findOne({ chat_id })

        if (chatExist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Chat already exists',
                res
            )
        }

        const message = {
            message_by: senderEmail,
            message: messages[0].message,
            DateAndTime: Date.now(),
            attachments: messages[0]?.attachments,
        }

        const _details = await UserChat.create({
            chat_id,
            is_seen: false,
            emails: [{ email: senderEmail }, { email: receiverEmail }],
            users: [senderUser._id, receiverUser._id], // Populate the users field
            messages: [message],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })

        req.app.locals.io.emit('message', message)
        res.json({
            message: 'Chat added successfully',
            data: _details,
        })
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.patch('/update', auth, async (req, res) => {
    const { chat_id, senderEmail, messages } = req.body
    try {
        const _details = await UserChat.findOneAndUpdate(
            { chat_id: chat_id },
            {
                $push: {
                    messages: {
                        message_by: senderEmail,
                        message: messages[0].message,
                        attachments: messages[0]?.attachments,
                        DateAndTime: Date.now(),
                    },
                },
                updatedAt: Date.now(),
            }
        )
        try {
            req.app.locals.io.emit('message', {
                message_by: senderEmail,
                message: messages[0].message,
                attachments: messages[0]?.attachments,
                DateAndTime: Date.now(),
            })
        } catch (error) {
            console.error('Error emitting message:', error)
        }
        res.json({
            message: 'Message added successfully',
            data: _details,
        })
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.post('/id', auth, async (req, res) => {
    try {
        const { chat_id } = req.body

        console.log('Received chat_id:', chat_id)

        const chatDetails = await UserChat.findOne({ chat_id })
            .populate('users', 'fname lname email photo')
            .exec()

        console.log('Fetched chatDetails:', chatDetails)

        if (!chatDetails) {
            return sendErrorMessage(statusCode.NOT_FOUND, 'Chat not found', res)
        }

        sendSuccessMessage(
            statusCode.OK,
            chatDetails,
            'Personal Chat details successfully fetched',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.delete('/delete', auth, async (req, res) => {
    try {
        const { chat_id, email } = req.body
        if (chat_id === undefined || email === undefined) {
            return res.status(400).json({ error: 'Invalid data entered' })
        }

        const _result = await UserChat.findOneAndRemove({ chat_id: chat_id })

        res.json({
            message: 'Personal Chats successfully Removed',
            data: _result,
        })
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

module.exports = router
