const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const license = mongoose.Schema({
    license_front_image: String,
    license_back_image: String,
})

const userSchema = mongoose.Schema({
    fname: {
        type: String,
    },
    lname: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
    },
    ssn: {
        type: Number,
    },
    dob: {
        type: String,
    },
    phone: {
        type: String,
    },
    bank_routing: {
        type: String,
    },
    bank_account: {
        type: String,
    },
    photo: {
        type: String,
    },
    accountType: {
        type: String,
    },
    address: {
        type: String,
    },
    license_image: license,
    passport_image: String,
    facebookID: {
        type: String,
    },
    googleID: {
        type: String,
    },
    userLocations: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'UserLocation' },
    ],
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
})

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next()
    }

    // const salt = await bcrypt.getSalt(10);
    this.password = await bcrypt.hashSync(this.password, 10)
})

const User = mongoose.model('USER', userSchema)

module.exports = User
