const express = require('express')
const geolib = require('geolib') // You may need to install this library using npm or yarn
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const { upload, calculateDistance } = require('../../utils/functions')
const Dispensary = require('../../model/dispensary')
const User = require('../../model/user')

router.post('/add', auth, upload.single('image'), async (req, res) => {
    try {
        const {
            name,
            description,
            location,
            phone,
            longitude,
            latitude,
            rating,
            delivery_time,
            status,
            // delivery_days,
            pickup_days,
            email,
            password,
            city,
            state,
            street,
            unit,
            zipCode,
        } = req.body

        const missingFields = []
        if (!name) missingFields.push('name')
        if (!description) missingFields.push('description')
        if (!location) missingFields.push('location')
        if (!phone) missingFields.push('phone')
        if (!delivery_time) missingFields.push('delivery_time')
        if (!rating) missingFields.push('rating')
        if (!password) missingFields.push('password')
        if (!req?.file) missingFields.push('image')
        if (!city) missingFields.push('city')
        if (!state) missingFields.push('state')
        if (!unit) missingFields.push('unit')
        if (!street) missingFields.push('street')
        if (!status) missingFields.push('status')

        if (missingFields.length > 0) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                `Missing fields: ${missingFields.join(' | ')}`,
                res
            )
        }
        const UserExist = await User.findOne({ email })
        if (UserExist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Email already exist',
                res
            )
        }

        const Exist = await Dispensary.findOne({ name })

        if (Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Dispensary already exist',
                res
            )
        }

        let SaveObject = {
            name: name,
            description: description,
            location,
            phone,
            longitude,
            latitude,
            rating,
            delivery_time,
            city,
            state,
            street,
            unit,
            zipCode,
            status,

            // delivery_days,
            pickup_days,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
        console.log(req.file)
        if (req?.file) {
            SaveObject = {
                ...SaveObject,
                image: req.file.path.replace(/\\/g, '/').split('public/')[1],
            }
        }

        const result = await Dispensary.create(SaveObject)
        const account = await User.create({
            email,
            password,
            accountType: 'DISPENSARY',
            dispensary: result?._id,
        })
        const user = await User.findOne({ email: email }).populate('dispensary')
        if (result) {
            sendSuccessMessage(
                statusCode.OK,
                user,
                'Dispensary successfully created.',
                res
            )
        } else {
            return sendErrorMessage(statusCode.NOT_FOUND, 'Invalid data', res)
        }
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.delete('/delete', auth, async (req, res) => {
    try {
        const { id } = req.body

        const Exist = await Dispensary.findOne({ id: id })
        if (!Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid dispensary id',
                res
            )
        }
        if (Exist) {
            const _details = await Dispensary.findByIdAndDelete(id)
            sendSuccessMessage(
                statusCode.OK,
                _details,
                'Dispensary deleted successfully',
                res
            )
        }
    } catch (error) {}
})

router.patch('/update', auth, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.body
        if (!id) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Required: id ',
                res
            )
        }

        const Exist = await Dispensary.findById(id)

        if (!Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid Dispensary id',
                res
            )
        }
        const clone = { ...req.body }
        delete clone.id
        let SaveObject = {
            ...clone,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
        if (req?.file) {
            SaveObject = {
                ...SaveObject,
                image: req.file.path.replace(/\\/g, '/').split('public/')[1],
            }
        }
        const result = await Dispensary.findByIdAndUpdate(
            { _id: id },
            SaveObject,
            {
                new: true,
            }
        ) 
        if (result) {
            sendSuccessMessage(
                statusCode.OK,
                result,
                'Dispensary successfully updated.',
                res
            )
        } else {
            return sendErrorMessage(statusCode.NOT_FOUND, 'Invalid data', res)
        }
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.get('/', async (req, res) => {
    try {
        const userLat = parseFloat(req.query.lat) // Replace 'lat' with the key where you are sending user's latitude
        const userLon = parseFloat(req.query.long) // Replace 'long' with the key where you are sending user's longitude

        const dispensaries = await Dispensary.find({}) // Retrieve all dispensaries

        // Calculate distance for each dispensary and add it to the result
        const dispensariesWithDistance = dispensaries.map((dispensary) => {
            const distance = calculateDistance(
                userLat,
                userLon,
                dispensary.latitude,
                dispensary.longitude
            )
            return { ...dispensary.toObject(), distance } // Add 'distance' property to each dispensary object
        })

        sendSuccessMessage(
            statusCode.OK,
            {
                data: dispensariesWithDistance, // Use the modified array with distance included
            },
            'All dispensaries successfully fetched.',
            res
        )
    } catch (error) {
        console.error(error)
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.get('/nearest', async (req, res) => {
    try {
        const userLatitude = parseFloat(req.query.lat) // User's latitude
        const userLongitude = parseFloat(req.query.long) // User's longitude
        const radiusInMiles = 5 // Specify the desired radius in miles

        if (isNaN(userLatitude) || isNaN(userLongitude)) {
            return sendErrorMessage(
                statusCode.BAD_REQUEST,
                'Latitude and longitude must be provided as valid numbers for geo-spatial query.',
                res
            )
        }

        // Fetch all dispensaries from the database
        const allDispensaries = await Dispensary.find({})

        // Calculate the distance for each dispensary and add it to the object
        const dispensariesWithDistance = allDispensaries.map((dispensary) => {
            const distanceInMiles = calculateDistance(
                userLatitude,
                userLongitude,
                parseFloat(dispensary.latitude),
                parseFloat(dispensary.longitude)
            )

            return {
                ...dispensary.toObject(),
                distance: distanceInMiles,
            }
        })

        // Filter the dispensaries within the specified radius from the user's location
        const nearestDispensaries = dispensariesWithDistance.filter(
            (dispensary) => {
                return dispensary.distance <= radiusInMiles
            }
        )

        // Sort dispensaries by distance in ascending order
        nearestDispensaries.sort((a, b) => a.distance - b.distance)

        sendSuccessMessage(
            statusCode.OK,
            {
                data: nearestDispensaries,
            },
            'Nearest dispensaries successfully fetched.',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.post('/search', async (req, res) => {
    try {
        const searchAddress = req.body.search // User's search address from the request body

        // Fetch all dispensaries from the database
        const allDispensaries = await Dispensary.find({})

        // Filter dispensaries based on the search address
        const matchingDispensaries = allDispensaries.filter((dispensary) => {
            // Check if any of the fields match the search address
            const addressFields = [
                dispensary.name,
                dispensary.street,
                dispensary.state,
                dispensary.city,
                dispensary.zipCode,
                dispensary.unit,
                dispensary.location,
            ]

            for (const field of addressFields) {
                if (
                    field &&
                    field.toLowerCase().includes(searchAddress.toLowerCase())
                ) {
                    return true
                }
            }

            return false
        })

        sendSuccessMessage(
            statusCode.OK,
            matchingDispensaries,
            'Search results successfully fetched.',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

module.exports = router
