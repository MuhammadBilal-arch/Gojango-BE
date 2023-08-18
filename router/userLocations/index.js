const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const UserLocations = require('../../model/userLocations')

const { upload } = require('../../utils/functions')
const { default: mongoose } = require('mongoose')

router.post('/add', auth, upload.none(), async (req, res) => {
    const { street, zipCode, state, city, label, unit } = req.body

    if (!street || !zipCode || !state || !city || !label || !unit) {
        return sendErrorMessage(
            statusCode.NOT_ACCEPTABLE,
            'Required: name | zipCode | state | city | label | unit',
            res
        )
    }

    const Exist = await UserLocations.findOne({
        user_id: req?.user?.id,
        street,
        zipCode,
        state,
        city,
        label,
        unit,
    })

    if (Exist) {
        return sendErrorMessage(
            statusCode.NOT_ACCEPTABLE,
            'Location address already exist',
            res
        )
    }

    let SaveObject = {
        user_id: req?.user?.id,
        street,
        zipCode,
        state,
        city,
        label,
        unit,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }

    const result = await UserLocations.create(SaveObject)
    if (result) {
        sendSuccessMessage(
            statusCode.OK,
            result,
            'Address location successfully added.',
            res
        )
    } else {
        return sendErrorMessage(statusCode.SERVER_ERROR, 'Invalid data', res)
    }
})

router.delete('/delete', auth, upload.none(), async (req, res) => {
    const { id } = req.body

    const Exist = await UserLocations.findOne({
        id: id,
        user_id: req?.user?.id,
    })
    if (!Exist) {
        return sendErrorMessage(
            statusCode.NOT_ACCEPTABLE,
            'Invalid address id',
            res
        )
    }
    if (Exist) {
        const _details = await UserLocations.findByIdAndDelete({
            id: id,
            user_id: req?.user?.id,
        })
        sendSuccessMessage(
            statusCode.OK,
            _details,
            'Address deleted successfully',
            res
        )
    }
})

router.patch('/update', auth, upload.none(), async (req, res) => {
    const { id } = req.body
    if (!id) {
        return sendErrorMessage(statusCode.NOT_ACCEPTABLE, 'Required: id ', res)
    }

    const Exist = await UserLocations.findOne({ id, user_id: req.user.id })

    if (!Exist) {
        return sendErrorMessage(statusCode.NOT_ACCEPTABLE, 'Invalid id', res)
    }
    const clone = { ...req.body }
    delete clone.id
    let SaveObject = {
        ...clone,
        updatedAt: Date.now(),
    }

    const result = await UserLocations.findOneAndUpdate(
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
 
router.get('/',auth, async (req, res) => {
    try {
        const allUserLocations = await UserLocations.find({ id: req.user.id })

        if (allUserLocations.length === 0) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'No user locations found',
                res
            )
        }
        sendSuccessMessage(
            statusCode.OK,
            allUserLocations,
            'User locations successfully found',
            res
        )
    } catch (error) {
        console.error('Error while fetching all user locations:', error)
        return sendErrorMessage(statusCode.SERVER_ERROR, 'Invalid data', res)
    }
})

module.exports = router
