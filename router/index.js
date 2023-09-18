const router = require('express').Router()
const userController = require('./user')
const dispensaryController = require('./dispensary')
const categoryController = require('./categories')
const productController = require('./products')
const userLocationController = require('./userLocations')
const userPaymentController = require('./transactions')
const ordersController = require('./orders')
const chatController = require('./chat')
const cartController = require('./cart')

//All routes
router.use('/account', userController)
router.use('/dispensary', dispensaryController)
router.use('/category', categoryController)
router.use('/product', productController)
router.use('/location', userLocationController)
router.use('/transaction', userPaymentController)
router.use('/order', ordersController)
router.use('/chat', chatController)
router.use('/cart', cartController)

module.exports = router
