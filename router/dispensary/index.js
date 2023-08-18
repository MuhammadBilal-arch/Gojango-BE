const express = require('express')
const geolib = require('geolib') // You may need to install this library using npm or yarn
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const { upload, calculateDistance } = require('../../utils/functions')
const Dispensary = require('../../model/dispensary')

router.post('/add', auth, upload.single('image'), async (req, res) => {
    const {
        name,
        description,
        location,
        phone,
        longitude,
        latitude,
        rating,
        delivery_time,
        delivery_days,
        pickup_days,
    } = req.body

    if (
        !name ||
        !description ||
        !location ||
        !phone ||
        !delivery_time ||
        !rating
    ) {
        return sendErrorMessage(
            statusCode.NOT_ACCEPTABLE,
            'Required: name | description | location | phone | longitude | latitude | rating | delivery_days | pickup_days',
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
        delivery_days,
        pickup_days,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }

    if (req?.file) {
        SaveObject = {
            ...SaveObject,
            image: req.file.path.replace(/\\/g, '/').split('public/')[1],
        }
    }

    const result = await Dispensary.create(SaveObject)
    if (result) {
        sendSuccessMessage(
            statusCode.OK,
            result,
            'Dispensary successfully created.',
            res
        )
    } else {
        return sendErrorMessage(statusCode.SERVER_ERROR, 'Invalid data', res)
    }
})

router.delete('/delete', auth, async (req, res) => {
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
})

router.patch('/update', auth, upload.single('image'), async (req, res) => {
    const { id } = req.body
    if (!id) {
        return sendErrorMessage(statusCode.NOT_ACCEPTABLE, 'Required: id ', res)
    }

    const Exist = await Dispensary.findOne({ id })

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
    const result = await Dispensary.findByIdAndUpdate(id, SaveObject, {
        new: true,
    })
    if (result) {
        sendSuccessMessage(
            statusCode.OK,
            result,
            'Dispensary successfully updated.',
            res
        )
    } else {
        return sendErrorMessage(statusCode.SERVER_ERROR, 'Invalid data', res)
    }
})

router.get('/', async (req, res) => {
    try {
        console.log(req.params)
        const userLat = parseFloat(req.query.lat) // Replace 'lat' with the key where you are sending user's latitude
        const userLon = parseFloat(req.query.long) // Replace 'long' with the key where you are sending user's longitude

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10

        const startIndex = (page - 1) * limit
        const totalItems = await Dispensary.countDocuments({})
        const dispensaries = await Dispensary.aggregate([
            { $skip: startIndex },
            { $limit: limit },
        ])

        // Calculate distance for each dispensary and add it to the result
        const dispensariesWithDistance = dispensaries.map((dispensary) => {
            const distance = calculateDistance(
                userLat,
                userLon,
                dispensary.latitude,
                dispensary.longitude
            )
            return { ...dispensary, distance } // Add 'distance' property to each dispensary object
        })

        sendSuccessMessage(
            statusCode.OK,
            {
                pagination: {
                    totalItems,
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                },
                data: dispensariesWithDistance, // Use the modified array with distance included
            },
            'Dispensaries successfully fetched.',
            res
        )
    } catch (error) {
        console.error(error)
        return sendErrorMessage(
            statusCode.SERVER_ERROR,
            'An error occurred while fetching dispensaries',
            res
        )
    }
})


router.get('/nearest', async (req, res) => {
    const userLatitude = parseFloat(req.query.lat); // User's latitude
    const userLongitude = parseFloat(req.query.long); // User's longitude
    const radiusInMiles = 5; // Specify the desired radius in miles

    if (isNaN(userLatitude) || isNaN(userLongitude)) {
        return sendErrorMessage(
            statusCode.BAD_REQUEST,
            'Latitude and longitude must be provided as valid numbers for geo-spatial query.',
            res
        );
    }

    try {
        // Fetch all dispensaries from the database
        const allDispensaries = await Dispensary.find({});

        // Calculate the distance for each dispensary and add it to the object
        const dispensariesWithDistance = allDispensaries.map((dispensary) => {
            const distanceInMiles = calculateDistance(
                userLatitude,
                userLongitude,
                parseFloat(dispensary.latitude),
                parseFloat(dispensary.longitude)
            );

            return {
                ...dispensary.toObject(),
                distance: distanceInMiles,
            };
        });

        // Filter the dispensaries within the specified radius from the user's location
        const nearestDispensaries = dispensariesWithDistance.filter((dispensary) => {
            return dispensary.distance <= radiusInMiles;
        });

        // Sort dispensaries by distance in ascending order
        nearestDispensaries.sort((a, b) => a.distance - b.distance);

        sendSuccessMessage(
            statusCode.OK,
            {
                data: nearestDispensaries,
            },
            'Nearest dispensaries successfully fetched.',
            res
        );
    } catch (error) {
        console.error(error);
        return sendErrorMessage(
            statusCode.SERVER_ERROR,
            'An error occurred while fetching dispensaries',
            res
        );
    }
});

module.exports = router
