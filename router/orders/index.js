const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const Order = require('../../model/orders')

const { upload, calculateDistance } = require('../../utils/functions')
const { default: mongoose } = require('mongoose')

router.post('/create', auth, upload.none(), async (req, res) => {
    try {
        const {
            dispensary_id,
            products,
            location_id,
            delivery_note,
            delivery_charges,
            tax,
        } = req.body
        const missingFields = []
        if (!dispensary_id) missingFields.push('dispensary_id')
        if (!products) missingFields.push('products')
        if (!location_id) missingFields.push('location_id')
        if (!delivery_note) missingFields.push('delivery_note')
        if (!delivery_charges) missingFields.push('delivery_charges')
        if (!tax) missingFields.push('tax')

        if (missingFields.length > 0) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                `Missing fields: ${missingFields.join(' | ')}`,
                res
            )
        }

        let SaveObject = {
            dispensary: dispensary_id,
            products,
            customer_location: location_id,
            delivery_note,
            customer: req?.user?.id,
            delivery_charges,
            tax,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        const result = await Order.create(SaveObject)
        if (result) {
            sendSuccessMessage(
                statusCode.OK,
                result,
                'Order successfully created.',
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
        const Exist = await Order.findOne({ id: id })
        if (!Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid Order/dispensary id',
                res
            )
        }
        if (Exist) {
            const _details = await Order.findByIdAndDelete(id)
            sendSuccessMessage(
                statusCode.OK,
                _details,
                'Order deleted successfully',
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

        const Exist = await Order.findOne({ id })

        if (!Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid Order id',
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

        const result = await Order.findByIdAndUpdate(id, SaveObject, {
            new: true,
        })
        if (result) {
            sendSuccessMessage(
                statusCode.OK,
                result,
                'Order successfully updated.',
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

router.get('/', upload.none(), auth, async (req, res) => {
    try {
        const userId = req.user.id
        const orders = await Order.find({ user_id: userId })
            .populate({
                path: 'products.product',
                model: 'Products', // Replace with the actual model name of the "Product" collection
            })
            .populate('customer_location')
            .populate('dispensary')

        sendSuccessMessage(
            statusCode.OK,
            orders,
            'Orders history successfully fetched.',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

// DRIVER API's APPROVED

router.get('/approved', upload.none(), auth, async (req, res) => {
    try {
        const userLatitude = parseFloat(req?.query?.lat) // User's latitude
        const userLongitude = parseFloat(req?.query?.long) // User's longitude
        const orders = await Order.find({ order_status: false, approved: true })
            .populate({
                path: 'products.product',
                model: 'Products',
                select: '-amount -quantity -dispensary -createdAt -updatedAt', // Exclude the password field
            })
            .populate('customer_location')
            .populate('dispensary')
            .populate({
                path: 'customer',
                select: '-password -dob -license_image -userLocations -createdAt -updatedAt', // Exclude the password field
            })

        const ordersWithDistance = await Promise.all(
            orders.map(async (order) => {
                const distanceInMiles = calculateDistance(
                    userLatitude,
                    userLongitude,
                    parseFloat(order?.dispensary?.latitude),
                    parseFloat(order?.dispensary?.longitude)
                )
                return {
                    ...order.toObject(), // Convert Mongoose document to plain object
                    distance: distanceInMiles?.toFixed(2),
                }
            })
        )
        sendSuccessMessage(
            statusCode.OK,
            ordersWithDistance,
            'Orders history successfully fetched.',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

module.exports = router
