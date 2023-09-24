const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const { upload, validateRequiredFields } = require('../../utils/functions')
const Tax = require('../../model/taxes')

router.post('/add', auth, upload.none(), async (req, res) => {
    try {
        const requiredFields = ['tax', 'delivery_charges']

        validateRequiredFields(req, res, requiredFields)
        const { tax, delivery_charges } = req.body

        const result = await Tax.create({ tax, delivery_charges })
        if (result) {
            sendSuccessMessage(
                statusCode.OK,
                result,
                'Taxes successfully created.',
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
        const Exist = await Tax.findById(id)
        if (!Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid  id',
                res
            )
        }
        if (Exist) {
            const _details = await Tax.findByIdAndDelete(id)
            sendSuccessMessage(
                statusCode.OK,
                _details,
                'Tax deleted successfully',
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

        const result = await Tax.findOneAndUpdate({ _id: id }, req.body, {
            new: true,
        })
        if (result) {
            sendSuccessMessage(
                statusCode.OK,
                result,
                'Tax successfully updated.',
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
        const result = await Tax.find()
        if (!result) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'No Taxes found.',
                res
            )
        }
        sendSuccessMessage(
            statusCode.OK,
            result,
            'Taxes successfully fetched.',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

module.exports = router
