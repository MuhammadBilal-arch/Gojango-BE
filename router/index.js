const router = require('express').Router()
const userController = require('./user')
const dispensaryController = require('./dispensary')
const categoryController = require('./categories')
const productController = require('./products')
const userLocationController = require('./userLocations')
// const userPaymentController = require('./userPayment')
const ordersController = require('./orders')

//All routes
router.use('/account', userController)
router.use('/dispensary', dispensaryController)
router.use('/category', categoryController)
router.use('/product', productController)
router.use('/location', userLocationController)
// router.use('/payment', userPaymentController)
router.use('/orders', ordersController)

module.exports = router
