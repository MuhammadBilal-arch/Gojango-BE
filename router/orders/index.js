const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const Order = require('../../model/orders')
const Transaction = require('../../model/transactions')
const moment = require('moment')

const {
    upload,
    calculateDistance,
    sendStatusToCustomer,
    sendStatusToDispensary,
} = require('../../utils/functions')
const Notification = require('../../model/notification')
const User = require('../../model/user')

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
            sub_total,
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
            sub_total,
            total_amount,
            total_items,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        if (delivery_note) {
            SaveObject.delivery_note = delivery_note
        }

        const result = await Order.create(SaveObject)
        const user = await User.findById(req?.user?.id)
        await Notification.create({
            status: 'Order Received',
            message: `Order (ID ${result?.order_id})${
                user?.fname + ' ' + user?.lname
            } (${user?._id})`,
        })
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

        sendStatusToCustomer(
            req,
            { _id: dispensary_id },
            result.order_id,
            `Order Received`
        )
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
        const Exist = await Order.findOne({ order_id: id })
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

        const Exist = await Order.findOne({ _id: id })
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
        if (req.body.lat && req.body.lng) {
            updatedFields.driver_location = {
                lat: parseFloat(req.body.lat),
                lng: parseFloat(req.body.lng),
            }
        }

        if ('order_status' in req.body) {
            const orderStatus =
                req.body.order_status === 'true' ||
                req.body.order_status === true
            if (!orderStatus) {
                await Notification.create({
                    status: 'Order Cancelled',
                    message: `Order (ID${Exist?.order_id}) status changed to 'Order Cancelled'`,
                })
                sendStatusToCustomer(
                    req,
                    Exist.customer,
                    Exist.order_id,
                    `Order Cancelled`
                )
                if (Exist.driver) {
                    sendStatusToCustomer(
                        req,
                        Exist.driver,
                        Exist.order_id,
                        `Order Cancelled`
                    )
                }

                sendStatusToDispensary(
                    req,
                    Exist.dispensary,
                    Exist.order_id,
                    `Order Cancelled`
                )
            }
        }

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

        if (driverAssigned) {
            updatedFields.order_awaiting_pickup = true
            updatedFields.order_driver_accept_date = new Date()
            await Transaction.findOneAndUpdate(
                { order_id: Exist.order_id },
                {
                    driver_id: parseInt(req?.body?.driver),
                }
            )
            updatedFields.order_pickup_date = new Date()
        }

        if (delivered) {
            updatedFields.order_delivered_date = new Date()
        }
        if (!req.body.order_status) {
            updatedFields.order_cancellation_date = new Date()
        }

        if (Exist?.order_status) {
            if (dispensaryApproved) {
                await Notification.create({
                    status: 'Dispensary Approved',
                    message: `Order (ID${Exist?.order_id}) status 'Dispensary Approved'`,
                })
                sendStatusToCustomer(
                    req,
                    Exist?.customer,
                    Exist.order_id,
                    `Order Placed`
                )
                sendStatusToDispensary(
                    req,
                    Exist.dispensary,
                    Exist.order_id,
                    `Driver Assigned`
                )
            } else if (driverAssigned) {
                await Notification.create({
                    status: 'Driver Assigned',
                    message: `Order (ID${Exist?.order_id}) status changed to 'Awaiting Pickup'`,
                })
                sendStatusToCustomer(
                    req,
                    Exist.customer,
                    Exist.order_id,
                    `Driver Assigned`
                )
                sendStatusToDispensary(
                    req,
                    Exist.dispensary,
                    Exist.order_id,
                    `Driver Assigned`
                )
            } else if (inTransit) {
                updatedFields.order_awaiting_pickup = false
                // send this message to customer for In Transit
                await Notification.create({
                    status: 'In Transit',
                    message: `Order (ID${Exist?.order_id}) status changed to 'In Transit'`,
                })
                sendStatusToCustomer(
                    req,
                    Exist.customer,
                    Exist.order_id,
                    `In Transit`
                )
                sendStatusToDispensary(
                    req,
                    Exist.dispensary,
                    Exist.order_id,
                    `In Transit`
                )
            }
        } else if (delivered) {
            await Notification.create({
                status: 'Order Delivered',
                message: `Order (ID${Exist?.order_id}) status changed to 'Order Delivered'`,
            })
            // send this message to customer for Delivered
            sendStatusToCustomer(
                req,
                Exist.customer,
                Exist.order_id,
                `Order Delivered`
            )
            sendStatusToDispensary(
                req,
                Exist.dispensary,
                Exist.order_id,
                `Order Delivered`
            )
        }

        const result = await Order.findByIdAndUpdate(id, updatedFields, {
            new: true,
        })
            .populate(
                'driver',
                '-password -dob -license_image -userLocations -createdAt -updatedAt'
            )
            .populate(
                'customer',
                '-password -dob -license_image -userLocations -createdAt -updatedAt'
            )
            .populate('dispensary')

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

// DRIVER SIDE MOBILE

router.get('/approved', upload.none(), auth, async (req, res) => {
    try {
        const userLatitude = parseFloat(req?.query?.lat) // User's latitude
        const userLongitude = parseFloat(req?.query?.long) // User's longitude
        const driverId = req.user.id

        const orders = await Order.find({
            order_status: true,
            dispensary_approved: true,
            order_delivered: false,
            driver_assigned: false,
            rejected_drivers: { $ne: driverId },
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

router.post('/update-order', auth, upload.none(), async (req, res) => {
    try {
        const { id } = req.body
        if (!id) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Required: id',
                res
            )
        }

        const Exist = await Order.findOne({ _id: id })
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
        if (req.body.lat && req.body.lng) {
            updatedFields.driver_location = {
                lat: parseFloat(req.body.lat),
                lng: parseFloat(req.body.lng),
            }
        }

        if ('order_status' in req.body) {
            const orderStatus =
                req.body.order_status === 'true' ||
                req.body.order_status === true
            if (!orderStatus) {
                await Notification.create({
                    status: 'Order Cancelled',
                    message: `Order (ID${Exist?.order_id}) status changed to 'Order Cancelled'`,
                })
                sendStatusToCustomer(
                    req,
                    Exist.customer,
                    Exist.order_id,
                    `Order Cancelled`
                )
                if (Exist.driver) {
                    sendStatusToCustomer(
                        req,
                        Exist.driver,
                        Exist.order_id,
                        `Order Cancelled`
                    )
                }

                sendStatusToDispensary(
                    req,
                    Exist.dispensary,
                    Exist.order_id,
                    `Order Cancelled`
                )
            }
        }

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

        if (driverAssigned) {
            updatedFields.order_awaiting_pickup = true
            updatedFields.order_driver_accept_date = new Date()
            await Transaction.findOneAndUpdate(
                { order_id: Exist.order_id },
                {
                    driver_id: parseInt(req?.body?.driver),
                }
            )
            updatedFields.order_pickup_date = new Date()
        }

        if (delivered) {
            updatedFields.order_delivered_date = new Date()
        }
        if (!req.body.order_status) {
            updatedFields.order_cancellation_date = new Date()
        }

        if (Exist?.order_status) {
            if (dispensaryApproved) {
                await Notification.create({
                    status: 'Dispensary Approved',
                    message: `Order (ID${Exist?.order_id}) status 'Dispensary Approved'`,
                })
                sendStatusToCustomer(
                    req,
                    Exist?.customer,
                    Exist.order_id,
                    `Order Placed`
                )
                sendStatusToDispensary(
                    req,
                    Exist.dispensary,
                    Exist.order_id,
                    `Driver Assigned`
                )
            } else if (driverAssigned) {
                await Notification.create({
                    status: 'Driver Assigned',
                    message: `Order (ID${Exist?.order_id}) status changed to 'Awaiting Pickup'`,
                })
                sendStatusToCustomer(
                    req,
                    Exist.customer,
                    Exist.order_id,
                    `Driver Assigned`
                )
                sendStatusToDispensary(
                    req,
                    Exist.dispensary,
                    Exist.order_id,
                    `Driver Assigned`
                )
            } else if (inTransit) {
                updatedFields.order_awaiting_pickup = false
                // send this message to customer for In Transit
                await Notification.create({
                    status: 'In Transit',
                    message: `Order (ID${Exist?.order_id}) status changed to 'In Transit'`,
                })
                sendStatusToCustomer(
                    req,
                    Exist.customer,
                    Exist.order_id,
                    `In Transit`
                )
                sendStatusToDispensary(
                    req,
                    Exist.dispensary,
                    Exist.order_id,
                    `In Transit`
                )
            }
        } else if (delivered) {
            updatedFields.order_in_transit = false
            updatedFields.order_delivered = true

            await Notification.create({
                status: 'Order Delivered',
                message: `Order (ID${Exist?.order_id}) status changed to 'Order Delivered'`,
            })
            // send this message to customer for Delivered
            sendStatusToCustomer(
                req,
                Exist.customer,
                Exist.order_id,
                `Order Delivered`
            )
            sendStatusToDispensary(
                req,
                Exist.dispensary,
                Exist.order_id,
                `Order Delivered`
            )
        }

        const result = await Order.findByIdAndUpdate(id, updatedFields, {
            new: true,
        })
            .populate(
                'driver',
                '-password -dob -license_image -userLocations -createdAt -updatedAt'
            )
            .populate(
                'customer',
                '-password -dob -license_image -userLocations -createdAt -updatedAt'
            )
            .populate('dispensary')

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

router.post('/driver-reject-order', auth, upload.none(), async (req, res) => {
    try {
        const { id, driverId, reason } = req.body

        if (!id || !driverId || !reason) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Required: id, driverId , reason',
                res
            )
        }

        const existingOrder = await Order.findOne({
            _id: id,
            rejected_drivers: { $ne: driverId },
        })

        if (!existingOrder) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid Order id or Order already rejected by the driver',
                res
            )
        }

        const updatedFields = {
            ...req.body,
            order_cancel_reason: reason,
            updatedAt: Date.now(),
            order_status: false, // Set order status to false indicating it's rejected
        }
        updatedFields.rejected_drivers = [
            ...existingOrder.rejected_drivers,
            driverId,
        ]

        const result = await Order.findByIdAndUpdate(id, updatedFields, {
            new: true,
        })
            .populate(
                'driver',
                '-password -dob -license_image -userLocations -createdAt -updatedAt'
            )
            .populate(
                'customer',
                '-password -dob -license_image -userLocations -createdAt -updatedAt'
            )
            .populate('dispensary')

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

router.get('/driver-current-order', upload.none(), auth, async (req, res) => {
    try {
        const driverId = req.user.id
        const order = await Order.findOne({
            driver_assigned: true,
            dispensary_approved: true,
            order_status: true,
            order_delivered: false,
            driver: driverId.toString(), // Filter by specific driver
        })
            .populate({
                path: 'driver',
                select: '-password -dob -license_image -userLocations -createdAt -updatedAt',
            })
            .populate({
                path: 'customer',
                select: '-password -dob -license_image -userLocations -createdAt -updatedAt',
            })
            .populate('dispensary')

        if (order) {
            sendSuccessMessage(
                statusCode.OK,
                order,
                'Order successfully fetched.',
                res
            )
        } else {
            sendSuccessMessage(
                statusCode.NOT_FOUND,
                null,
                'No order found for the specified driver.',
                res
            )
        }
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.get(
    '/driver-completed-orders',
    upload.none(),
    auth,
    async (req, res) => {
        try {
            const driverId = req.user.id
            const orders = await Order.find({
                driver_assigned: true,
                dispensary_approved: true,
                order_status: true,
                order_delivered: true,
            })
                .populate({
                    path: 'driver',
                    select: '-password -dob -license_image -userLocations -createdAt -updatedAt',
                })
                .populate({
                    path: 'customer',
                    select: '-password -dob -license_image -userLocations -createdAt -updatedAt',
                })
                .populate('dispensary')

            // Filter orders for the specific driver
            console.log(driverId)
            const filteredOrders = orders.filter(
                (order) =>
                    order.driver &&
                    order.driver._id.toString() === driverId.toString()
            )

            sendSuccessMessage(
                statusCode.OK,
                filteredOrders,
                'Orders history successfully fetched.',
                res
            )
        } catch (error) {
            return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
        }
    }
)

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

router.get('/earnings', auth, async (req, res) => {
    try {
        const driverId = req.user.id
        const currentDate = moment()
        const sevenDaysAgo = moment().subtract(7, 'days')
        // Find orders within the last 7 days for the specific driver
        const orders = await Order.find({
            driver: driverId.toString(),
            order_delivered: true,
            order_delivered_date: { $gte: sevenDaysAgo, $lte: currentDate },
        })

        // Calculate the total earnings for the past week
        const totalEarnings = orders.reduce(
            (total, order) => total + order.total_amount,
            0
        )
        sendSuccessMessage(
            statusCode.OK,
            { orders, totalEarnings },
            'Earnings data successfully fetched.',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

module.exports = router
