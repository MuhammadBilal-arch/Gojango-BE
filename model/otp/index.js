const mongoose = require('mongoose')

const otpSchema = mongoose.Schema(
    {
        email: {
            type: String,
        },
        otp: {
            type: Number,
        },
        reason: {
            type: String,
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

const OTP = mongoose.model('OTP', otpSchema)

module.exports = OTP
