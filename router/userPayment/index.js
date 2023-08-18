const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const UserPayment = require('../../model/userPaymentMethods')

const { upload } = require('../../utils/functions')
const { default: mongoose } = require('mongoose')

router.post('/add', auth, upload.none(), async (req, res) => {
    const { card_number, expiry, cvv, zipCode } = req.body

    if (!card_number || !expiry || !cvv || !zipCode) {
        return sendErrorMessage(
            statusCode.NOT_ACCEPTABLE,
            'Required: card_number | expiry | cvv | zipCode',
            res
        )
    }

    const Exist = await UserPayment.findOne({
        user_id: req?.user?.id,
        card_number,
        expiry,
        cvv,
        zipCode,
    })

    if (Exist) {
        return sendErrorMessage(
            statusCode.NOT_ACCEPTABLE,
            'Payment method already exist',
            res
        )
    }

    let SaveObject = {
        user_id: req?.user?.id,
        card_number,
        expiry,
        cvv,
        zipCode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }

    const result = await UserPayment.create(SaveObject)
    if (result) {
        sendSuccessMessage(
            statusCode.OK,
            result,
            'Payment method successfully added.',
            res
        )
    } else {
        return sendErrorMessage(statusCode.SERVER_ERROR, 'Invalid data', res)
    }
})

router.delete('/delete', auth, upload.none(), async (req, res) => {
    const { id } = req.body

    const Exist = await UserPayment.findOne({
        id: id,
        user_id: req?.user?.id,
    })
    if (!Exist) {
        return sendErrorMessage(
            statusCode.NOT_ACCEPTABLE,
            'Invalid payment id',
            res
        )
    }
    if (Exist) {
        const _details = await UserPayment.findByIdAndDelete({
            id: id,
            user_id: req?.user?.id,
        })
        sendSuccessMessage(
            statusCode.OK,
            _details,
            'Payment deleted successfully',
            res
        )
    }
})

router.patch('/update', auth, upload.none(), async (req, res) => {
    const { id } = req.body
    if (!id) {
        return sendErrorMessage(statusCode.NOT_ACCEPTABLE, 'Required: id ', res)
    }

    const Exist = await UserPayment.findOne({ id, user_id: req.user.id })

    if (!Exist) {
        return sendErrorMessage(statusCode.NOT_ACCEPTABLE, 'Invalid id', res)
    }
    const clone = { ...req.body }
    delete clone.id
    let SaveObject = {
        ...clone,
        updatedAt: Date.now(),
    }

    const result = await UserPayment.findOneAndUpdate(
        { _id: id, user_id: req.user.id },
        SaveObject,
        { new: true }
    )

    if (result) {
        sendSuccessMessage(
            statusCode.OK,
            result,
            'Address successfully updated.',
            res
        )
    } else {
        return sendErrorMessage(statusCode.SERVER_ERROR, 'Invalid data', res)
    }
})

router.get('/', async (req, res) => {
    try {
        const result = await UserPayment.find({ id: req.user.id })

        if (result.length === 0) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'No user payment method found',
                res
            )
        }
        sendSuccessMessage(
            statusCode.OK,
            allUserLocations,
            'Payment methods successfully found',
            res
        )
    } catch (error) {
        console.error('Error while fetching all payment methods:', error)
        return sendErrorMessage(statusCode.SERVER_ERROR, 'Invalid data', res)
    }
})

module.exports = router
