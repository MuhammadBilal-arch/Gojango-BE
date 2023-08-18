const moment = require('moment')
const bcrypt = require('bcryptjs')
const express = require('express')
const router = express.Router()
const User = require('../../model/user')
const generateToken = require('../../utils/generateToken')
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const { upload } = require('../../utils/functions')
const { sendEmail } = require('../../utils/email')

router.post('/register', async (req, res) => {
    const {
        fname,
        lname,
        email,
        phone,
        password,
        dob,
        facebookID,
        googleID,
        accountType,
        address
    } = req.body

    const userExist = await User.findOne({ email })
    if (accountType === 'CLIENT') {
        if (!fname || !lname || !email || !dob) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Required: fname | lname | email | password | dob',
                res
            )
        }
    } else {
        if (!fname || !lname || !email || !ssn) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Required: fname | lname | email | password | ssn',
                res
            )
        }
    }
    if (userExist) {
        return sendErrorMessage(
            statusCode.NOT_ACCEPTABLE,
            'Email already exist',
            res
        )
    }
    let SaveObject = {}
    if (accountType === 'CLIENT') {
        SaveObject = {
            fname,
            lname,
            email,
            dob,
            phone,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            accountType: accountType,
        }
    }
    else {
        SaveObject = {
            fname,
            lname,
            email,
            ssn,
            phone,
            address,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            accountType: accountType,
        }
    }
    if (facebookID) {
        SaveObject = {
            ...SaveObject,
            facebookID,
        }
    }
    if (googleID) {
        SaveObject = {
            ...SaveObject,
            googleID,
        }
    }
    if (password) {
        SaveObject = {
            ...SaveObject,
            password,

        }
    }

    const user = await User.create(SaveObject)

    if (user) {
        sendSuccessMessage(
            statusCode.OK,
            {
                _id: user._id,
                fname: user.fname,
                fname: user.fname,
                email: user.email,
                phone: user.phone,
                ssn: user.ssn,
                address: user.address,
                dob: user.dob,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                token: generateToken(user._id),
            },
            'Account successfully registered',
            res
        )
        // sendEmail({
        //     email: user?.email,
        //     subject: 'Gojango - Welcome',
        //     template: 'Welcome',
        //     text: ``,
        //     recipient: user?.fname + ' ' + user?.lname,
        //     otp: '',
        // })
    } else {
        return sendErrorMessage(
            statusCode.SERVER_ERROR,
            'Invalid user data',
            res
        )
    }
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body

    const user = await User.findOne({ email: email })
    if (!user) {
        return sendErrorMessage(
            statusCode.NOT_FOUND,
            "Account doesn't exist",
            res
        )
    }

    const matched = await user.matchPassword(password)

    if (matched) {
        const user = await User.findOne({ email: email }).select('-password')
        sendSuccessMessage(
            statusCode.OK,
            {
                ...user._doc,
                token: generateToken(user._id),
            },
            'Account successfully logged',
            res
        )
    } else {
        //401 unauthorized
        return sendErrorMessage(
            statusCode.SERVER_ERROR,
            'Invalid credentials',
            res
        )
    }
})

router.post('/login/google', async (req, res) => {
    const { googleId } = req.body

    // Check if the user with the given Google ID exists
    const user = await User.findOne({ googleId })
    if (!user) {
        return sendErrorMessage(statusCode.NOT_FOUND, 'User not found', res)
    }

    // Generate and send the login response
    sendSuccessMessage(
        statusCode.OK,
        {
            _id: user._id,
            fname: user.fname,
            lname: user.fname,
            email: user.email,
            dob: user.dob,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            token: generateToken(user._id),
        },
        'Logged in successfully',
        res
    )
})

router.post('/login/facebook', async (req, res) => {
    const { facebookId } = req.body

    // Check if the user with the given Facebook ID exists
    const user = await User.findOne({ facebookId })
    if (!user) {
        return sendErrorMessage(statusCode.NOT_FOUND, 'User not found', res)
    }

    // Generate and send the login response
    sendSuccessMessage(
        statusCode.OK,
        {
            _id: user._id,
            fname: user.fname,
            lname: user.fname,
            email: user.email,
            dob: user.dob,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            token: generateToken(user._id),
        },
        'Logged in successfully',
        res
    )
})

router.post(
    '/upload/license',
    upload.fields([
        { name: 'license_front' },
        { name: 'license_back' },
        { name: 'passport_image' },
    ]),
    async (req, res) => {
        const { files, body } = req
        const { email } = body
        console.log(req)
        const user = await User.findOne({ email: email })
        if (!user) {
            return sendErrorMessage(
                statusCode.NOT_FOUND,
                "Account doesn't exist",
                res
            )
        }

        let ImageObject = {}

        if (files['license_front'] && files['license_back']) {
            const licenseFrontPath = files['license_front'][0]?.path
            const licenseBackPath = files['license_back'][0]?.path

            ImageObject = {
                license_image: {
                    license_front_image: licenseFrontPath
                        .replace(/\\/g, '/')
                        .split('public/')[1],
                    license_back_image: licenseBackPath
                        .replace(/\\/g, '/')
                        .split('public/')[1],
                },
            }
        }

        if (files['passport_image']) {
            const passportPath = files['passport_image'][0]?.path

            ImageObject = {
                passport_image: passportPath
                    .replace(/\\/g, '/')
                    .split('public/')[1],
            }
        }

        if (Object.keys(ImageObject).length === 0) {
            return sendErrorMessage(
                statusCode.NOT_FOUND,
                'No valid images were uploaded',
                res
            )
        }

        const _details = await User.findOneAndUpdate(
            { email: email },
            ImageObject,
            { new: true }
        )

        sendSuccessMessage(
            statusCode.OK,
            _details,
            'Account Images updated successfully',
            res
        )
    }
)

router.patch('/update', auth, async (req, res) => {
    const { email } = req.body
    console.log(req.body)
    const UserExist = await User.findOne({ email: email })
    if (UserExist) {
        let clone = { ...req.body }
        delete clone.email
        const _details = await User.findOneAndUpdate(
            { email: email },
            {
                ...clone,
                updatedAt: Date.now(),
            },
            {
                new: true,
            }
        )
        sendSuccessMessage(
            statusCode.OK,
            _details,
            'Profile updated successfully',
            res
        )
    }
})

router.post('/forgot-password', async (req, res) => {
    const { email, password } = req.body
    if (!req.body || !email || !password) {
        return sendErrorMessage(
            statusCode.NOT_FOUND,
            'Required: Email | Password',
            res
        )
    }

    const user = await User.findOne({ email: email })
    if (!user) {
        return sendErrorMessage(
            statusCode.NOT_FOUND,
            "Account doesn't exist",
            res
        )
    }

    const matched = await bcrypt.compare(password, user.password)

    if (matched) {
        return sendErrorMessage(
            statusCode.NOT_ACCEPTABLE,
            'Password matched with the previous password.',
            res
        )
    }
    const hash = await bcrypt.hashSync(password, 10)

    const passwordUpdated = await User.findOneAndUpdate(
        { email: email },
        { password: hash }
    )

    if (passwordUpdated) {
        sendSuccessMessage(
            statusCode.OK,
            {
                ...user._doc,
                token: generateToken(user._id),
            },
            'Account Password successfully updated',
            res
        )
    } else {
        //401 unauthorized
        return sendErrorMessage(
            statusCode.NOT_MODIFIED,
            'Invalid Email or Password',
            res
        )
    }
})

module.exports = router