const mongoose = require('mongoose')

const notificationSchema = mongoose.Schema(
    {
        message: {
            type: String,
        },
        status: {
            type: String,
        },

        notification_id: {
            type: Number,
            unique: true,
        },
        createdAt: {
            type: Date,
        },
        updatedAt: {
            type: Date,
        },
    },
    {
        timestamps: true, // Enable automatic createdAt and updatedAt fields
    }
)
notificationSchema.pre('save', async function (next) {
    if (!this.notification_id) {
        const Notification = mongoose.model('Notification')
        const lastNotification = await Notification.findOne(
            {},
            {},
            { sort: { notification_id: -1 } }
        )
        if (lastNotification) {
            this.notification_id = lastNotification.notification_id + 1
        } else {
            this.notification_id = 1
        }
    }
    next()
})
const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification
