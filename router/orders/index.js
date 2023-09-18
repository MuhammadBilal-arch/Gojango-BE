const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const Order = require('../../model/orders')
const Transaction = require('../../model/transactions')

const {
    upload,
    calculateDistance,
    sendStatusToCustomer,
} = require('../../utils/functions')

router.post('/create', auth, upload.none(), async (req, res) => {
    try {
        const {
            dispensary_id,
            products,
            location_id,
            delivery_note,
            delivery_charges,
            tax,
            total_amount,
            transaction_id,
            transaction_time,
            amount,
            signature,
            intent_id,
            tip_amount,
            total_items,
        } = req.body
        const missingFields = []
        if (!dispensary_id) missingFields.push('dispensary_id')
        if (!products) missingFields.push('products')
        if (!location_id) missingFields.push('location_id')
        if (!delivery_charges) missingFields.push('delivery_charges')
        if (!tax) missingFields.push('tax')
        if (!total_amount) missingFields.push('total_amount')

        if (missingFields.length > 0) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                `Missing fields: ${missingFields.join(' | ')}`,
                res
            )
        }
        const parsedProducts = products.map((productString) =>
            JSON.parse(productString)
        )
        let SaveObject = {
            dispensary: dispensary_id,
            products: parsedProducts,
            customer_location: JSON.parse(location_id),
            customer: req?.user?.id,
            delivery_charges,
            tax,
            total_amount,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        if (delivery_note) {
            SaveObject.delivery_note = delivery_note
        }

        const result = await Order.create(SaveObject)
        const transactionObject = {
            order_id: result?._id,
            dispensary_id,
            customer_id: req.user.id,
            transaction_id,
            transaction_time,
            amount,
            signature,
            intent_id,
            tip_amount,
            total_items,
        }

        await Transaction.create(transactionObject)

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
        const Exist = await Order.findById(id)
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
                'Required: id',
                res
            )
        }

        const Exist = await Order.findById(id)
            .populate(
                'driver',
                '-password -dob -license_image -userLocations -createdAt -updatedAt'
            )
            .populate(
                'customer',
                '-password -dob -license_image -userLocations -createdAt -updatedAt'
            )
            .populate('dispensary')

        if (!Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid Order id',
                res
            )
        }

        const clone = { ...req.body }
        delete clone.id

        const updatedFields = {
            ...clone,
            updatedAt: Date.now(),
        }

        const awaitingPickup =
            req.body.order_awaiting_pickup === 'true' ||
            req.body.order_awaiting_pickup === true
        const driverAssigned =
            req.body.driver_assigned === 'true' ||
            req.body.driver_assigned === true
        const dispensaryApproved =
            req.body.dispensary_approved === 'true' ||
            req.body.dispensary_approved === true
        const inTransit =
            req.body.order_in_transit === 'true' ||
            req.body.order_in_transit === true
        const delivered =
            req.body.order_delivered === 'true' ||
            req.body.order_delivered === true

        if (!Exist?.order_status) {
            // send this message to dispensary / driver
            req.app.locals.io
                .to(Exist?.driver?._id?.toString())
                .emit('orderStatusUpdated', {
                    orderId: id,
                    status: 'ORDER PLACED',
                })
        }

        if (Exist?.order_status && dispensaryApproved) {
            if (!driverAssigned) {
                // send this message to dispensary
                // req.app.locals.io
                //     .to(Exist?.customer?._id?.toString())
                //     .emit('orderStatusUpdated', { id, status: 'ORDER PLACED' });
            } else if (awaitingPickup) {
                // send this message to customer for Awaiting Pickup
                sendStatusToCustomer(
                    req,
                    Exist.customer,
                    id,
                    `Order #${id} driver assigned status Awaiting Pickup`
                )
            } else if (inTransit) {
                // send this message to customer for In Transit
                sendStatusToCustomer(
                    req,
                    Exist.customer,
                    id,
                    `Order #${id} status In Transit`
                )
            }
        } else if (delivered) {
            // send this message to customer for Delivered
            sendStatusToCustomer(
                req,
                Exist.customer,
                id,
                `Order #${id} status Delivered`
            )
        }

        const result = await Order.findByIdAndUpdate(id, updatedFields, {
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
        const orders = await Order.find({ customer: userId })
            .populate({
                path: 'driver',
                select: '-password -dob -license_image -userLocations -createdAt -updatedAt', // Exclude the password field
            })
            .populate({
                path: 'customer',
                select: '-password -dob -license_image -userLocations -createdAt -updatedAt', // Exclude the password field
            })
            .populate('dispensary')
            .sort({ createdAt: -1 })

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
        const orders = await Order.find({
            order_status: true,
            dispensary_approved: true,
        })

            .populate('dispensary')
            .populate({
                path: 'driver',
                select: '-password -dob -license_image -userLocations -createdAt -updatedAt', // Exclude the password field
            })
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

// GET DISPENSARY ORDERS
router.get('/getbyid', upload.none(), auth, async (req, res) => {
    const { id } = req.query
    try {
        const orders = await Order.find({ dispensary: id })
            .populate({
                path: 'driver',
                select: '-password -dob -license_image -userLocations -createdAt -updatedAt', // Exclude the password field
            })
            .populate({
                path: 'customer',
                select: '-password -dob -license_image -userLocations -createdAt -updatedAt', // Exclude the password field
            })
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

module.exports = router
