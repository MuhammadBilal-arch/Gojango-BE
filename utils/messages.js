const { statusCode } = require('./statusCode')

const errorMessage = (message, statusCode = 201) => {
    return {
        error: true,
        message,
        data: null,
        statusCode,
    }
}

const successMessage = (message, data = {}) => {
    return {
        error: false,
        message,
        data,
        statusCode: statusCode.OK,
    }
}

const sendErrorMessage = (statusCode, message, res) => {
    return res.status(statusCode).json({
        error: true,
        message,
        data: null,
    })
}

const sendSuccessMessage = (statusCode, data, message, res) => {
    return res.status(statusCode).json({
        data: data,
        message: message,
    })
}

module.exports = {
    errorMessage,
    successMessage,
    sendErrorMessage,
    sendSuccessMessage,
}
