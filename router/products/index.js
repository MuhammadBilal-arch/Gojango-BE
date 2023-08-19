const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const { upload } = require('../../utils/functions')
const Product = require('../../model/products')
const { default: mongoose } = require('mongoose')

router.post('/add', auth, upload.single('image'), async (req, res) => {
    try {
        const { name, description, amount, quantity, dispensary, category } =
            req.body
        if (
            !name ||
            !description ||
            !amount ||
            !quantity ||
            !dispensary ||
            !category ||
            !req?.file
        ) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Required: name | description | amount | quantity | image | category | dispensary | image',
                res
            )
        }
        const Exist = await Product.findOne({ name, dispensary, category })

        if (Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Product already exist',
                res
            )
        }

        let SaveObject = {
            ...req.body,
            image: req.file.path.replace(/\\/g, '/').split('public/')[1],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        const result = await Product.create(SaveObject)
        if (result) {
            sendSuccessMessage(
                statusCode.OK,
                result,
                'Product successfully created.',
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
        return sendErrorMessage(
            statusCode.SERVER_ERROR,
            error.message,
            res
        )
    }
})

router.delete('/delete', auth, async (req, res) => {
    try {
        const { id, dispensary, category } = req.body

        const Exist = await Product.findOne({ id, dispensary, category })
        if (!Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid dispensary/category/product id',
                res
            )
        }
        if (Exist) {
            const _details = await Product.findOneAndDelete({
                id,
                dispensary,
                category,
            })
            sendSuccessMessage(
                statusCode.OK,
                _details,
                'Product deleted successfully',
                res
            )
        }
    } catch (error) {
        return sendErrorMessage(
            statusCode.SERVER_ERROR,
            error.message,
            res
        )
    }
})

router.patch('/update', auth, upload.single('image'), async (req, res) => {
    try {
        const { id, dispensary, category } = req.body
        if (!id || !dispensary || !category) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Required: id | category | dispensary ',
                res
            )
        }

        const Exist = await Product.findOne({ id, dispensary, category })

        if (!Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid Dispensary/Product/Category id',
                res
            )
        }
        const clone = { ...req.body }
        delete clone.id
        delete clone.dispensary
        delete clone.category
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
        const result = await Product.findOneAndUpdate(
            { id, dispensary, category },
            SaveObject,
            {
                new: true,
            }
        )
        if (result) {
            sendSuccessMessage(
                statusCode.OK,
                result,
                'Product successfully updated.',
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
        return sendErrorMessage(
            statusCode.SERVER_ERROR,
            error.message,
            res
        )
    }
})

router.get('/', auth, upload.none(), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const dispensaryId = req.body.dispensary // Get the dispensary ID from the request body

        try {
            const startIndex = (page - 1) * limit
            let query = {}

            if (dispensaryId) {
                query = { dispensary: mongoose.Types.ObjectId(dispensaryId) }
            }

            const totalItems = await Product.countDocuments(query)
            const products = await Product.aggregate([
                { $match: query }, // Add the $match stage to filter based on the dispensary ID
                { $skip: startIndex },
                { $limit: limit },
            ])

            sendSuccessMessage(
                statusCode.OK,
                {
                    pagination: {
                        totalItems,
                        currentPage: page,
                        totalPages: Math.ceil(totalItems / limit),
                    },
                    data: products,
                },
                'Products successfully fetched.',
                res
            )
        } catch (error) {
            console.error(error)
            return sendErrorMessage(
                statusCode.SERVER_ERROR,
                'An error occurred while fetching products',
                res
            )
        }
    } catch (error) {
        return sendErrorMessage(
            statusCode.SERVER_ERROR,
            error.message,
            res
        )
    }
})

module.exports = router
