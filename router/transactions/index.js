const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const Transaction = require('../../model/transactions')
const moment = require('moment')
const { upload } = require('../../utils/functions')

router.post('/', upload.none(), auth, async (req, res) => {
    try {
        const { customer_id, driver_id, order_id, dispensary_id } = req.body
        const query = {}
        if (customer_id) query.customer_id = parseInt(customer_id)
        if (driver_id) query.driver_id = parseInt(driver_id)
        if (order_id) query.order_id = order_id
        if (dispensary_id) query.dispensary_id = dispensary_id
        console.log(query)
        const transactions = await Transaction.find(query).populate({
            path: 'driver_id',
            select: '-password -dob -license_image -userLocations -createdAt -updatedAt', // Exclude the password field
        })
        .populate({
            path: 'customer_id',
            select: '-password -dob -license_image -userLocations -createdAt -updatedAt', // Exclude the password field
        })
        .populate('dispensary_id')
        .populate('order_id') 
        sendSuccessMessage(
            statusCode.OK,
            transactions,
            'Transaction history successfully fetched.',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.post('/revenue', upload.none(), auth, async (req, res) => {
    try {
        const { dispensary_id } = req.body
        const matchStage = { $match: {} }

        if (dispensary_id) {
            matchStage.$match.dispensary_id = dispensary_id
        }

        const sevenDaysAgo = moment().subtract(7, 'days').toDate()
        const startOfMonth = moment().startOf('month').toDate()
        const startOfLastMonth = moment()
            .subtract(1, 'month')
            .startOf('month')
            .toDate()
        const revenueStats = await Transaction.aggregate([
            matchStage,
            {
                $match: {
                    createdAt: {
                        $gte: sevenDaysAgo,
                        $lte: new Date(),
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    last7DaysRevenue: { $sum: '$amount' },
                    totalItems: { $sum: '$total_items' },
                },
            },
            {
                $project: {
                    _id: 0,
                    last7DaysRevenue: 1,
                    totalItems: 1,
                },
            },
        ])
        const revenueStatsChart = await Transaction.aggregate([
            matchStage,
            {
                $match: {
                    createdAt: {
                        $gte: sevenDaysAgo,
                        $lte: new Date(),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d', // Group by day
                            date: '$createdAt',
                        },
                    },
                    dailyRevenue: { $sum: '$amount' },
                },
            },
            {
                $sort: {
                    _id: 1, // Sort by date ascending
                },
            },
        ])

        const currentMonthStats = await Transaction.aggregate([
            matchStage,
            {
                $match: {
                    createdAt: {
                        $gte: startOfMonth,
                        $lt: new Date(), // Current date
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    currentMonthRevenue: { $sum: '$amount' },
                    totalItems: { $sum: '$total_items' },
                },
            },
            {
                $project: {
                    _id: 0,
                    currentMonthRevenue: 1,
                    totalItems: 1,
                },
            },
        ])
        const currentMonthStatsChart = await Transaction.aggregate([
            matchStage,
            {
                $match: {
                    createdAt: {
                        $gte: startOfMonth,
                        $lte: new Date(),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d', // Group by day
                            date: '$createdAt',
                        },
                    },
                    dailyRevenue: { $sum: '$amount' },
                },
            },
            {
                $sort: {
                    _id: 1, // Sort by date ascending
                },
            },
        ])

        const lastMonthStats = await Transaction.aggregate([
            matchStage,
            {
                $match: {
                    createdAt: {
                        $gte: startOfLastMonth,
                        $lt: startOfMonth,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    lastMonthRevenue: { $sum: '$amount' },
                    totalItems: { $sum: '$total_items' },
                },
            },
            {
                $project: {
                    _id: 0,
                    lastMonthRevenue: 1,
                    totalItems: 1,
                },
            },
        ])

        const lastMonthStatsChart = await Transaction.aggregate([
            matchStage,
            {
                $match: {
                    createdAt: {
                        $gte: startOfLastMonth,
                        $lt: startOfMonth,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d', // Group by day
                            date: '$createdAt',
                        },
                    },
                    dailyRevenue: { $sum: '$amount' },
                },
            },
            {
                $sort: {
                    _id: 1, // Sort by date ascending
                },
            },
        ])
        const currentDate = new Date()
        const daysInMonth = moment(currentDate).daysInMonth()
        const revenueArray = Array.from({ length: daysInMonth }, () => 0)

        currentMonthStatsChart.forEach((day) => {
            const date = moment(day._id, 'YYYY-MM-DD').date() - 1
            revenueArray[date] = day.dailyRevenue
        })

        const daysInLastMonth = moment(currentDate)
            .startOf('month')
            .diff(startOfLastMonth, 'days')

        const lastMonthArray = Array.from({ length: daysInLastMonth }, () => 0)

        lastMonthStatsChart.forEach((day) => {
            const date = moment(day._id, 'YYYY-MM-DD').diff(
                startOfLastMonth,
                'days'
            )
            if (date >= 0 && date < daysInLastMonth) {
                lastMonthArray[date] = day.dailyRevenue
            }
        })

        const daysInLast7Days = 7
        const last7DaysArray = Array.from({ length: daysInLast7Days }, () => 0)
        revenueStatsChart.forEach((day) => {
            const date = moment(day._id, 'YYYY-MM-DD').diff(
                sevenDaysAgo,
                'days'
            )
            if (date >= 0 && date < daysInLast7Days) {
                last7DaysArray[date] = day.dailyRevenue
            }
        })

        sendSuccessMessage(
            statusCode.OK,
            {
                last7DaysSalesVolume: revenueStats[0]?.totalItems || 0,
                last7DaysRevenue: revenueStats[0]?.last7DaysRevenue || 0,

                currentMonthSalesVolume: revenueStats[0]?.totalItems || 0,

                currentMonthRevenue:
                    currentMonthStats[0]?.currentMonthRevenue || 0,

                lastMonthRevenue: lastMonthStats[0]?.lastMonthRevenue || 0,

                lastMonthSalesVolume: revenueStats[0]?.totalItems || 0,

                last7DaysChart: last7DaysArray,
                currentMonthChart: revenueArray,
                lastMonthChart: lastMonthArray,
            },
            'Revenue statistics successfully fetched.',
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

module.exports = router
