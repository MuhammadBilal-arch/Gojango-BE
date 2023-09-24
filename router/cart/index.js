const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const Cart = require('../../model/cart')

const { upload, validateRequiredFields } = require('../../utils/functions')

router.post('/create', auth, upload.none(), async (req, res) => {
    try {
        const requiredFields = ['product_id', 'quantity', 'dispensary_id']

        validateRequiredFields(req, res, requiredFields)
        const { quantity, product_id, dispensary_id } = req.body

        const existingCartItem = await Cart.findOne({
            user_id: req.user.id,
            product_id,
        })

        if (existingCartItem) {
            // If the cart item already exists, update the quantity
            existingCartItem.quantity += parseInt(quantity) // Assuming quantity is a number
            existingCartItem.updatedAt = Date.now()
            await existingCartItem.save()
            const cartItems = await Cart.findById(
                existingCartItem._id
            ).populate('product_id')
            const updateCartItemObject = {
                ...cartItems.product_id.toObject(), // Convert the product_id to an object
                quantity: cartItems.quantity,
                _id: cartItems._id,
            }
            sendSuccessMessage(
                statusCode.OK,
                updateCartItemObject,
                'Cart item quantity updated.',
                res
            )
        } else {
            // Create a new cart item
            const SaveObject = {
                user_id: req.user.id,
                quantity,
                product_id,
                dispensary_id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }

            const result = await Cart.create(SaveObject)

            const cartItems = await Cart.findById(result._id).populate(
                'product_id'
            )
            const updateCartItemObject = {
                ...cartItems.product_id.toObject(), // Convert the product_id to an object
                quantity: cartItems.quantity,
                _id: cartItems._id,
            }

            sendSuccessMessage(
                statusCode.OK,
                updateCartItemObject,
                'Cart item successfully created.',
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
        const Exist = await Cart.findById(id)
        if (!Exist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Invalid Cart Item id',
                res
            )
        }
        if (Exist) {
            const _details = await Cart.findByIdAndDelete(id)
            sendSuccessMessage(
                statusCode.OK,
                _details,
                'Cart item deleted successfully',
                res
            )
        }
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.delete('/delete-all', auth, upload.none(), async (req, res) => {
    try {
        const { dispensary_id } = req.body
        const deletedItems = await Cart.deleteMany({
            user_id: req.user.id,
            dispensary_id: dispensary_id,
        })
        sendSuccessMessage(
            statusCode.OK,
            deletedItems,
            'All items from the cart deleted successfully',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.get('/', upload.none(), auth, async (req, res) => {
    try {
        const userId = req.user.id
        const cartItems = await Cart.find({ user_id: userId }).populate(
            'product_id'
        )

        // Process and merge the 'product_id' into each cart item
        const transformedCartItems = cartItems.map((item) => ({
            ...item.product_id.toObject(), // Convert the product_id to an object
            quantity: item.quantity,
            _id: item._id,
        }))

        sendSuccessMessage(
            statusCode.OK,
            transformedCartItems,
            'Orders history successfully fetched.',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

module.exports = router
