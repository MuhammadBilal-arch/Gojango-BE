const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const { upload, validateRequiredFields } = require('../../utils/functions')
const Notification = require('../../model/notification')

router.post('/add', auth, upload.none(), async (req, res) => {
    try {
        const requiredFields = ['message']

        validateRequiredFields(req, res, requiredFields)
        const { message } = req.body

        const result = await Notification.create({ message })
        if (result) {
            sendSuccessMessage(
                statusCode.OK,
                result,
                'Notification successfully created.',
                res
            )
        } else {
            return sendErrorMessage(
                statusCode.SERVER_ERROR,
                'Invalid data',
                res
            )
        }
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.delete('/delete', auth, upload.none(), async (req, res) => {
    try {
        const { id } = req.body
        const Exist = await Notification.findById(id)
        if (!Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid  id',
                res
            )
        }
        if (Exist) {
            const _details = await Notification.findByIdAndDelete(id)
            sendSuccessMessage(
                statusCode.OK,
                _details,
                'Notification deleted successfully',
                res
            )
        }
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.patch('/update', auth, upload.none(), async (req, res) => {
    try {
        const { id } = req.body

        const result = await Notification.findOneAndUpdate(
            { _id: id },
            req.body,
            {
                new: true,
            }
        )
        if (result) {
            sendSuccessMessage(
                statusCode.OK,
                result,
                'Notification successfully updated.',
                res
            )
        } else {
            return sendErrorMessage(
                statusCode.SERVER_ERROR,
                'Invalid data',
                res
            )
        }
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.get('/', auth, upload.none(), async (req, res) => {
    try {
        const result = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(5)
        if (!result) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'No Notification found.',
                res
            )
        }
        sendSuccessMessage(
            statusCode.OK,
            result,
            'Notification successfully fetched.',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

module.exports = router
