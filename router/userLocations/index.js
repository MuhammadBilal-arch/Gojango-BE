const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const UserLocations = require('../../model/userLocations')

const { upload } = require('../../utils/functions')
const { exists } = require('fs')

router.post('/create', auth, upload.none(), async (req, res) => {
    try {
        const { street, zipCode, state, city, label, unit, lat, lng } = req.body
        const missingFields = []
        if (!street) missingFields.push('street')
        if (!unit) missingFields.push('unit')
        if (!zipCode) missingFields.push('zipCode')
        if (!city) missingFields.push('city')
        if (!state) missingFields.push('state')
        if (!label) missingFields.push('label')
        if (!lat) missingFields.push('lat')
        if (!lng) missingFields.push('lng')

        if (missingFields.length > 0) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                `Missing fields: ${missingFields.join(' | ')}`,
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
            lat,
            lng,
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
            return sendErrorMessage(statusCode.NOT_FOUND, 'Invalid data', res)
        }
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error?.message, res)
    }
})

router.delete('/delete', auth, upload.none(), async (req, res) => {
    try {
        const { id } = req.body
        console.log(id, req?.user?.id)
        const Exist = await UserLocations.findOne({
            _id: id,
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
                _id: id,
                user_id: req?.user?.id,
            })
            sendSuccessMessage(
                statusCode.OK,
                _details,
                'Address deleted successfully',
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
        if (!id) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Required: id ',
                res
            )
        }

        const Exist = await UserLocations.findOne({ id, user_id: req.user.id })

        if (!Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid id',
                res
            )
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

router.patch('/status', auth, upload.none(), async (req, res) => {
    try {
        const { id } = req.body
        if (!id) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Required: id',
                res
            )
        }

        await UserLocations.updateMany(
            {
                user_id: req.user.id,
            },
            {
                $set: { selected: false },
            }
        )

        const existingLocation = await UserLocations.findOneAndUpdate(
            { _id: id, user_id: req.user.id },
            { $set: { selected: true } },
            { new: true }
        )

        if (!existingLocation) {
            return sendErrorMessage(
                statusCode.NOT_FOUND,
                'Location not found',
                res
            )
        }

        sendSuccessMessage(
            statusCode.OK,
            existingLocation,
            'Location successfully selected',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.get('/', auth, async (req, res) => {
    try {
        const allUserLocations = await UserLocations.find({
            user_id: req.user.id,
        })

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
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

module.exports = router
