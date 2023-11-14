const express = require('express')
const router = express.Router()
const UserChat = require('../../model/chat')
const User = require('../../model/user')
const { sendErrorMessage, sendSuccessMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const auth = require('../../middleware/auth')
const { upload } = require('../../utils/functions')

router.post('/create', auth, async (req, res) => {
    try {
        const { chat_id } = req.body
         

        const chatExist = await UserChat.findOne({ chat_id })

        if (chatExist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Chat already exists',
                res
            )
        }

        const _details = await UserChat.create({
            chat_id,
            is_seen: false,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })

        // req.app.locals.io.emit('message', message)
        res.json({
            message: 'Chat added successfully',
            data: _details,
        })
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.patch('/update' ,upload.single('image'), auth, async (req, res) => {
    const { chat_id, messages, sender_info  } = req.body
 
    try {
        let Body = {
            message_by: sender_info,
            message: messages[0].message,
            attachments: messages[0]?.attachments,
            DateAndTime: Date.now(),
        }
        if(req.file)
        {
            Body.image = req.file.path.replace(/\\/g, '/').split('public/')[1]
        }
        const _details = await UserChat.findOneAndUpdate(
            { chat_id: chat_id },
            {
                $push: {
                    messages: Body,
                },
                updatedAt: Date.now(),
            }
        )
        try {
            req.app.locals.io.to(chat_id).emit('message', Body)
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

router.post('/update-msg' ,upload.single('image'), auth, async (req, res) => {
    const { chat_id, messages, sender_info  } = req.body
 
    try {
        let Body = {
            message_by: sender_info,
            message: messages[0].message,
            attachments: messages[0]?.attachments,
            DateAndTime: Date.now(),
        }
        if(req.file)
        {
            Body.image = req.file.path.replace(/\\/g, '/').split('public/')[1]
        }
        const _details = await UserChat.findOneAndUpdate(
            { chat_id: chat_id },
            {
                $push: {
                    messages: Body,
                },
                updatedAt: Date.now(),
            }
        )
        try {
            req.app.locals.io.to(chat_id).emit('message', Body)
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
        console.log(chat_id)
        const chatDetails = await UserChat.findOne({ chat_id })

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
        const { chat_id } = req.body
        if (chat_id === undefined) {
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
