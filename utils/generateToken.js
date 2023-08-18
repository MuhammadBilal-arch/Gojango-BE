const JWT = require('jsonwebtoken')

const generateToken = (id) => {
    return JWT.sign({ id }, '4306435a1', {
        expiresIn: '30d',
    })
}

module.exports = generateToken
