const moment = require('moment')
const bcrypt = require('bcryptjs')
const express = require('express')
const router = express.Router()
const User = require('../../model/user')
const generateToken = require('../../utils/generateToken')
const auth = require('../../middleware/auth')
const { sendSuccessMessage, sendErrorMessage } = require('../../utils/messages')
const { statusCode } = require('../../utils/statusCode')
const { upload, generateOTP } = require('../../utils/functions')
const { sendEmail } = require('../../utils/email')
const OTP = require('../../model/otp')
const passport = require('passport')
const fetch = require('node-fetch'); 

router.post('/register', async (req, res) => {
    try {
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
            address,
            ssn,
            bank_routing,
            bank_account,
        } = req.body

        if (!accountType) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Required: accountType: CLIENT | DRIVER',
                res
            )
        }

        const userExist = await User.findOne({ email })

        const missingFields = []
        if (!fname) missingFields.push('fname')
        if (!lname) missingFields.push('lname')
        if (!email) missingFields.push('email')

        if (accountType === 'CLIENT') {
            if (!dob) missingFields.push('dob')
        } else if (accountType === 'DRIVER') {
            if (!ssn) missingFields.push('ssn')
            if (!address) missingFields.push('address')
            if (!bank_routing) missingFields.push('bank_routing')
            if (!bank_account) missingFields.push('bank_account')
        }

        if (missingFields.length > 0) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                `Missing fields: ${missingFields.join(' | ')}`,
                res
            )
        }

        if (userExist) {
            return sendErrorMessage(
                statusCode.NOT_ACCEPTABLE,
                'Email already exists',
                res
            )
        }

        const SaveObject = {
            fname,
            lname,
            email,
            phone,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            accountType,
        }

        if (accountType === 'CLIENT') {
            SaveObject.dob = dob
        } else if (accountType === 'DRIVER') {
            SaveObject.ssn = ssn
            SaveObject.address = address
            SaveObject.bank_routing = bank_routing
            SaveObject.bank_account = bank_account
        }

        if (facebookID) SaveObject.facebookID = facebookID
        if (googleID) SaveObject.googleID = googleID
        if (password) SaveObject.password = password

        const user = await User.create(SaveObject)

        if (user) {
            sendSuccessMessage(
                statusCode.OK,
                {
                    _id: user._id,
                    ...SaveObject,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    token: generateToken(user._id),
                },
                'Account successfully registered',
                res
            )
            sendEmail({
                email: user.email,
                subject: `Gojango - Welcome ${user.fname + ' ' + user.lname}`,
                template: 'Welcome',
                text: ``,
                recipient: user.fname + ' ' + user.lname,
                otp: '',
            })
        } else {
            return sendErrorMessage(
                statusCode.BAD_REQUEST,
                'Invalid user data',
                res
            )
        }
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        let userQuery = await User.findOne({ email: email })

        if (!userQuery) {
            return sendErrorMessage(
                statusCode.NOT_FOUND,
                "Account doesn't exist",
                res
            )
        }

        // Check if the user's accountType is DISPENSARY
        if (userQuery.accountType === 'DISPENSARY') {
            userQuery = userQuery.populate('dispensary')
        }

        // Execute the populated query
        const populatedUser = await userQuery
        const matched = await populatedUser.matchPassword(password)

        if (matched) {
            const userWithoutData = populatedUser.toObject()
            delete userWithoutData.password
            if (userWithoutData.accountType === 'DISPENSARY') {
                delete userWithoutData.userLocations
            }

            sendSuccessMessage(
                statusCode.OK,
                {
                    ...userWithoutData,
                    token: generateToken(populatedUser._id),
                },
                'Account successfully logged',
                res
            )
        } else {
            return sendErrorMessage(
                statusCode.SERVER_ERROR,
                'Invalid credentials',
                res
            )
        }
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.post('/google/userinfo', async (req, res) => {
    const { access_token, accountType } = req.body

    try {
        const response = await fetch(
            'https://www.googleapis.com/oauth2/v1/userinfo',
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        )

        if (response.ok) {
            const userInfo = await response.json()
            const userExist = await User.findOne({ email: userInfo?.email })
            if (userExist) {
                sendSuccessMessage(
                    statusCode.OK,
                    {
                        ...userExist._doc,
                        token: generateToken(userExist?._id),
                    },
                    'Account successfully logged',
                    res
                )
            } else {
                const SaveObject = {
                    fname: userInfo?.given_name,
                    lname: userInfo?.family_name,
                    email: userInfo?.email,
                    googleID: userInfo?.id,
                    photo: userInfo?.picture,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    accountType: accountType,
                }
                const user = await User.create(SaveObject)
                if (user) {
                    sendSuccessMessage(
                        statusCode.OK,
                        {
                            _id: user._id,
                            ...SaveObject,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            token: generateToken(user._id),
                        },
                        'Account successfully registered',
                        res
                    )
                    sendEmail({
                        email: user.email,
                        subject: `Gojango - Welcome ${
                            user.fname + ' ' + user.lname
                        }`,
                        template: 'Welcome',
                        text: ``,
                        recipient: user.fname + ' ' + user.lname,
                        otp: '',
                    })
                } else {
                    return sendErrorMessage(
                        statusCode.BAD_REQUEST,
                        'Invalid user data',
                        res
                    )
                }
            }
        } else {
            res.status(400).json({ error: 'Failed to fetch user information' })
        }
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
    })
)

router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login/failed',
        successRedirect: 'http://localhost:5173',
    })
)

router.get('/login/failed', async (req, res) => {
    return sendErrorMessage(statusCode.NOT_FOUND, "Account doesn't exist", res)
})

router.get('/login/success', async (req, res) => {
    if (req.user) {
        sendSuccessMessage(
            statusCode.OK,
            {},
            'Account successfully logged',
            res
        )
    } else {
        sendErrorMessage(statusCode.NOT_FOUND, "Account doesn't exist", res)
    }
})

router.get('/logout', async (req, res) => {
    req.logout()
    // res.redirect('http://localhost:5173')
})

router.post('/login/facebook', async (req, res) => {
    try {
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
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.post(
    '/upload/license',
    upload.fields([
        { name: 'license_front' },
        { name: 'license_back' },
        { name: 'passport_image' },
    ]),
    async (req, res) => {
        try {
            const { files, body } = req
            const { email } = body
            const user = await User.findOne({ email: email })
            if (!user) {
                return sendErrorMessage(
                    statusCode.NOT_FOUND,
                    "Account doesn't exist",
                    res
                )
            }
            if (Object.keys(files).length === 0) {
                return sendErrorMessage(
                    statusCode.NOT_FOUND,
                    'No valid images were uploaded',
                    res
                )
            }

            let ImageObject = {}

            if (files['license_front'] && files['license_back']) {
                const licenseFrontPath = files['license_front'][0]?.path || null
                const licenseBackPath = files['license_back'][0]?.path || null

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
                const passportPath = files['passport_image'][0]?.path || null
                ImageObject = {
                    passport_image: passportPath
                        .replace(/\\/g, '/')
                        .split('public/')[1],
                }
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
        } catch (error) {
            return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
        }
    }
)

router.patch('/update', auth, async (req, res) => {
    try {
        const { email } = req.body

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
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body

        if (!email || isNaN(otp)) {
            return sendErrorMessage(
                statusCode.NOT_FOUND,
                'Invalid data format: email or otp is missing or invalid',
                res
            )
        }

        const numericOtp = parseInt(otp) // Convert the otp to a numeric value
        if (isNaN(numericOtp)) {
            return sendErrorMessage(
                statusCode.BAD_REQUEST,
                'Invalid data format: otp should be a valid number',
                res
            )
        }

        var date = moment().subtract(1, 'minutes').utc().toDate()
        const exist = await OTP.findOne({
            email,
            otp,
            createdAt: {
                $gt: date,
            },
        })
        if (!exist) {
            return sendSuccessMessage(
                statusCode.NOT_ACCEPTABLE,
                { verified: false },
                'One Time Password expired',
                res
            )
        } else {
            return sendSuccessMessage(
                statusCode.OK,
                { verified: true },
                'OTP successfully updated',
                res
            )
        }
    } catch (error) {
        console.log(err.message)
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body
        if (!req.body || !email) {
            return sendErrorMessage(
                statusCode.NOT_FOUND,
                'Required: Email',
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
        const OTP_NUMBER = generateOTP()
        OTP.create({
            email,
            otp: OTP_NUMBER,
            reason: 'Forgot Password',
        })
        sendEmail({
            email: user?.email,
            subject: 'Gojango - Generated OTP',
            template: 'OTP',
            text: ``,
            recipient: user?.fname + ' ' + user?.lname,
            otp: OTP_NUMBER,
        })
        sendSuccessMessage(
            statusCode.OK,
            '',
            `We have successfully sent one time password on the ${user.email}`,
            res
        )
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.post('/forgot-password', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!req.body || !email || !password) {
            return sendErrorMessage(
                statusCode.NOT_FOUND,
                'Required: Email | Password .',
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
    } catch (error) {
        return sendErrorMessage(statusCode.SERVER_ERROR, error.message, res)
    }
})

router.post('/reset-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body
        const userId = req.user.id // Assuming you have user authentication middleware

        if (!currentPassword || !newPassword || !confirmPassword) {
            return sendErrorMessage(
                statusCode.BAD_REQUEST,
                'Required: Current Password, New Password, Confirm Password',
                res
            )
        }

        const user = await User.findById(userId)
        if (!user) {
            return sendErrorMessage(statusCode.NOT_FOUND, 'User not found', res)
        }

        const matched = await bcrypt.compare(currentPassword, user.password)
        if (!matched) {
            return sendErrorMessage(
                statusCode.UNAUTHORIZED,
                'Current password is incorrect',
                res
            )
        }

        if (newPassword !== confirmPassword) {
            return sendErrorMessage(
                statusCode.BAD_REQUEST,
                'New Password and Confirm Password do not match',
                res
            )
        }

        const hash = await bcrypt.hash(newPassword, 10)

        const passwordUpdated = await User.findByIdAndUpdate(userId, {
            password: hash,
        })

        if (passwordUpdated) {
            sendSuccessMessage(
                statusCode.OK,
                {
                    message: 'Password successfully updated',
                },
                'Password updated successfully',
                res
            )
        } else {
            return sendErrorMessage(
                statusCode.INTERNAL_SERVER_ERROR,
                'Failed to update password',
                res
            )
        }
    } catch (error) {
        return sendErrorMessage(
            statusCode.INTERNAL_SERVER_ERROR,
            error.message,
            res
        )
    }
})

module.exports = router
