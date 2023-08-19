const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const Order = require('../../model/orders')

const { upload } = require('../../utils/functions')
const { default: mongoose } = require('mongoose')

router.post('/add', auth, upload.none(), async (req, res) => {
    try {
        const { dispensary_id, products, location_id, delivery_note } = req.body

        if (!dispensary_id || !products || !location_id || !delivery_note) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Required: dispensary_id | products | location_id | delivery_note',
                res
            )
        }

        let SaveObject = {
            ...req.body,
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
        let query = {}

        query = { user_id: mongoose.Types.ObjectId(req.user.id) }

        const categoriesWithProducts = await Order.aggregate([
            {
                $match: query, // Match orders with the specified user_id (if provided)
            },
            {
                $lookup: {
                    from: 'products', // Replace 'products' with the actual name of the "Products" collection
                    let: { OrderId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$Order', '$$OrderId'] },
                            },
                        },
                        {
                            $project: {
                                name: 1,
                                description: 1,
                                amount: 1,
                                quantity: 1,
                                image: 1,
                                Order: 1,
                                dispensary: 1,
                                // Add other fields you want to include from the "Product" collection
                            },
                        },
                    ],
                    as: 'products',
                },
            },
            {
                $project: {
                    _id: 1,
                    dispensary: '$dispensary',
                    name: '$name', // Replace 'name' with the actual field name of the Order name in the "Order" collection
                    products: 1,
                },
            },
        ])

        sendSuccessMessage(
            statusCode.OK,
            {
                data: categoriesWithProducts,
            },
            'Categories and their products successfully fetched.',
            res
        )
    } catch (error) {
        console.error(error)
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

module.exports = router
