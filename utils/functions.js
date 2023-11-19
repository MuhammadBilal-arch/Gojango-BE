const multer = require('multer')
const multerS3 = require('multer-s3')

// Configure aws s3 SDK

const AWS = require('aws-sdk')
AWS.config.update({
    region: 'us-east-1',
    accessKeyId: 'AKIAQACXFQ7GOAHE7OO2',
    secretAccessKey: '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',
})

const s3 = new AWS.S3()
const myBucket = 'ganjago-aws-bucket'

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/files')
//     },
//     filename: (req, file, cb) => {
//         const fileExtension = file.originalname.split('.').pop()
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
//         const filename = `${uniqueSuffix}.${fileExtension}`
//         cb(null, filename)
//     },
// })

// const uploadToLocalDir = multer({ storage: storage }).array('file')
// const uploadSingleToLocalDir = multer({ storage: storage }).single('file')

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: myBucket,
        ACL: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const fileExtension = file.originalname.split('.').pop()
            const uniqueSuffix =
                Date.now() + '-' + Math.round(Math.random() * 1e9)
            const filename = `${uniqueSuffix}.${fileExtension}`
            cb(null, filename) // Set the object key to the original file name
        },
    }),
})

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8 // Earth's radius in miles

    const dLat = toRadians(lat2 - lat1)
    const dLon = toRadians(lon2 - lon1)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const distance = R * c
    return distance
}

function toRadians(degrees) {
    return (degrees * Math.PI) / 180
}

const generateOTP = () => {
    var digits = '0123456789'
    let OTP = ''
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)]
    }
    return OTP
}

const sendStatusToCustomer = (req, user, orderId, statusMessage , data) => {
    req.app.locals.io
        .to(user?._id)
        .emit('orderStatusUpdated', { orderId, status: statusMessage , data})
}
const sendStatusToDispensary = (req, user, orderId, statusMessage , data) => { 
    req.app.locals.io
        .to(user.id.toString())
        .emit('orderStatusUpdated', { orderId, status: statusMessage , data})
}
const sendDriverLiveLocation = (req, user, orderId,  data) => { 
    req.app.locals.io
        .to(user.id.toString())
        .emit('orderDriverLocationUpdated', { orderId , data})
}

const validateRequiredFields = (req, res, requiredFields) => {
    const missingFields = []
    for (const field of requiredFields) {
        if (!req.body[field]) {
            missingFields.push(field)
        }
    }

    if (missingFields.length > 0) {
        return sendErrorMessage(
            statusCode.NOT_ACCEPTABLE,
            `Missing fields: ${missingFields.join(' | ')}`,
            res
        )
    }
}

module.exports = {
    // uploadToLocalDir,
    // uploadSingleToLocalDir,
    upload,
    calculateDistance,
    generateOTP,
    sendStatusToCustomer,
    validateRequiredFields,
    sendStatusToDispensary,
    sendDriverLiveLocation
}
